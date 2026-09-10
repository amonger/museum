import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

interface StereoPair {
  left: string
  right: string
  /** width / height of a single eye's half, used to keep the plane undistorted */
  aspect: number
}

const MUSEUM_IMAGE_COUNT = 37

/** Scene layout, in metres. The track runs down -Z; cards line both sides of it. */
const CARD_SPACING = 12      // gap between consecutive cards along the track
const CARD_OFFSET = 7        // how far off to the side of the track a card sits
const CARD_HEIGHT = 5        // rendered height of a card; width follows its aspect
const CARD_CENTRE_Y = 2.6    // roughly eye level from the cart floor
const FIRST_CARD_Z = -14     // where the first card appears ahead of the start
const RIDE_SPEED = 1.5       // world units per second
const START_Z = 6            // where the cart begins, just behind the first card
const RUN_OUT = 28           // keep rolling a while past the final card
const TRACK_MARGIN = 12      // rail/sleeper overhang beyond each end of the ride
const RAIL_GAUGE = 1.435     // standard gauge, centre to centre
const SLEEPER_SPACING = 3
const SWAY_DISTANCE = 11     // metres per half-cycle of the cart's side-to-side roll

/** Cart is stacked upward from the railhead so the wheels actually ride on the rails. */
const RAIL_TOP_Y = 0.3
const WHEEL_RADIUS = 0.35
const DECK_Y = RAIL_TOP_Y + WHEEL_RADIUS * 2 + 0.09  // deck underside clears the wheel tops
const BOARD_Y = DECK_Y + 0.09 + 0.325                // side/end boards stand on the deck
const DECK_TOP_Y = DECK_Y + 0.09                      // surface the rider stands on
// In VR the headset pose overwrites the camera's local position every frame, so any
// height authored on the camera is discarded. The standing surface therefore lives on
// the camera's PARENT, which VR leaves alone; the camera's own y is only the desktop
// stand-in for the height a headset would otherwise report. Head height then lands the
// eye well above the cart's sides (top edge y=1.83) either way.
const RIDER_STANCE_Y = DECK_TOP_Y                    // rider stands on the deck
const DESKTOP_EYE_HEIGHT = 1.6

const museumImageSources = Array.from(
  { length: MUSEUM_IMAGE_COUNT },
  (_, index) => `/museum-images/${index + 1}.jpg`
)

const canvasToObjectUrl = (canvas: HTMLCanvasElement): Promise<string> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob))
        } else {
          reject(new Error('Failed to encode split stereo half'))
        }
      },
      'image/jpeg',
      0.92
    )
  })

/**
 * Loads a side-by-side stereo card and cuts it down the centre in memory:
 * the left half becomes the left eye, the right half the right eye.
 */
const splitStereoImage = (src: string): Promise<StereoPair> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = async () => {
      const halfWidth = Math.floor(img.naturalWidth / 2)
      const height = img.naturalHeight

      if (halfWidth < 1 || height < 1) {
        reject(new Error(`Image too small to split: ${src}`))
        return
      }

      const cut = (offsetX: number) => {
        const canvas = document.createElement('canvas')
        canvas.width = halfWidth
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          throw new Error('Canvas 2D context unavailable')
        }
        ctx.drawImage(img, offsetX, 0, halfWidth, height, 0, 0, halfWidth, height)
        return canvasToObjectUrl(canvas)
      }

      try {
        const [left, right] = await Promise.all([cut(0), cut(halfWidth)])
        resolve({ left, right, aspect: halfWidth / height })
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => reject(new Error(`Failed to load ${src}`))
    img.src = src
  })

function App() {
  const [stereoPairs, setStereoPairs] = useState<StereoPair[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [loadedAssets, setLoadedAssets] = useState<Set<string>>(new Set())
  const createdUrlsRef = useRef<string[]>([])

  const trackPairs = (pairs: StereoPair[]) => {
    pairs.forEach((pair) => createdUrlsRef.current.push(pair.left, pair.right))
    return pairs
  }

  useEffect(() => {
    import('aframe-stereo-component').then(() => {
      if (typeof window !== 'undefined' && window.AFRAME) {
        window.AFRAME.registerComponent('eye-filter', {
          schema: {
            eye: { type: 'string', default: 'both' }
          },
          init: function () {
            const eye = this.data.eye;
            const sceneEl = this.el.sceneEl;
            
            const updateVisibility = () => {
              const mesh = this.el.getObject3D('mesh');
              if (mesh) {
                if (sceneEl?.is('vr-mode')) {
                  if (eye === 'left') {
                    mesh.layers.set(1);
                  } else if (eye === 'right') {
                    mesh.layers.set(2);
                  }
                } else {
                  mesh.layers.set(0);
                }
              }
            };
            
            this.el.addEventListener('object3dset', updateVisibility);
            sceneEl?.addEventListener('enter-vr', updateVisibility);
            sceneEl?.addEventListener('exit-vr', updateVisibility);
          }
        });
      }
    });
  }, []);

  // Split every museum card down the centre once, up front.
  useEffect(() => {
    let cancelled = false

    Promise.all(
      museumImageSources.map((src) =>
        splitStereoImage(src).catch((error) => {
          console.error(error)
          return null
        })
      )
    ).then((results) => {
      if (cancelled) {
        results.forEach((pair) => {
          if (pair) {
            URL.revokeObjectURL(pair.left)
            URL.revokeObjectURL(pair.right)
          }
        })
        return
      }

      const pairs = results.filter((pair): pair is StereoPair => pair !== null)
      trackPairs(pairs)
      setStereoPairs(pairs)
    })

    return () => {
      cancelled = true
    }
  }, [])

  // Release every blob URL we minted when the app goes away.
  useEffect(
    () => () => {
      createdUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      createdUrlsRef.current = []
    },
    []
  )

  useEffect(() => {
    const handleVRClick = (event: any) => {
      const target = event.target
      if (target.id === 'prevButton') {
        prevImage()
      } else if (target.id === 'nextButton') {
        nextImage()
      }
    }

    document.addEventListener('click', handleVRClick)
    return () => document.removeEventListener('click', handleVRClick)
  }, [stereoPairs.length])


  const handleStereoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const sources = Array.from(files).map((file) => URL.createObjectURL(file))

    const results = await Promise.all(
      sources.map((src) =>
        splitStereoImage(src)
          .catch((error) => {
            console.error(error)
            return null
          })
          .finally(() => URL.revokeObjectURL(src))
      )
    )

    const pairs = results.filter((pair): pair is StereoPair => pair !== null)
    if (pairs.length === 0) return

    trackPairs(pairs)
    setStereoPairs((prev) => [...prev, ...pairs])
  }

  // A-Frame reads an <img> asset straight into a texture the moment a plane
  // referencing it is created, with no retry once the image decodes. So the
  // planes must not exist until their own <img> has fired load.
  const markAssetLoaded = (url: string) => {
    setLoadedAssets((prev) => (prev.has(url) ? prev : new Set(prev).add(url)))
  }

  // An image already decoded by the time React attaches it never fires onLoad.
  const checkAssetComplete = (url: string) => (el: HTMLImageElement | null) => {
    if (el?.complete && el.naturalWidth > 0) {
      markAssetLoaded(url)
    }
  }

  const nextImage = () => {
    if (stereoPairs.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % stereoPairs.length)
    }
  }

  const prevImage = () => {
    if (stereoPairs.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + stereoPairs.length) % stereoPairs.length)
    }
  }

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        prevImage()
      } else if (event.key === 'ArrowRight') {
        nextImage()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [stereoPairs.length])

  // Every half of every card must be decoded before we build a single plane.
  const assetsReady =
    stereoPairs.length > 0 &&
    stereoPairs.every((pair) => loadedAssets.has(pair.left) && loadedAssets.has(pair.right))

  // Everything about the ride derives from how many cards are on the track.
  const track = useMemo(() => {
    const count = stereoPairs.length
    const lastCardZ = FIRST_CARD_Z - Math.max(count - 1, 0) * CARD_SPACING
    const endZ = lastCardZ - RUN_OUT
    const distance = START_Z - endZ
    const near = START_Z + TRACK_MARGIN
    const far = endZ - TRACK_MARGIN
    const length = near - far
    const sleeperCount = Math.floor(length / SLEEPER_SPACING)

    return {
      endZ,
      duration: (distance / RIDE_SPEED) * 1000,
      centreZ: (near + far) / 2,
      length,
      sleeperZs: Array.from(
        { length: sleeperCount },
        (_, index) => near - index * SLEEPER_SPACING
      )
    }
  }, [stereoPairs.length])

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, background: 'rgba(255,255,255,0.9)', padding: 10, borderRadius: 5 }}>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 5 }}>Stereo Cards (side-by-side):</label>
          <input type="file" accept="image/*" multiple onChange={handleStereoUpload} />
        </div>
        {stereoPairs.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <button onClick={prevImage} style={{ marginRight: 5 }}>Previous</button>
            <button onClick={nextImage} style={{ marginRight: 10 }}>Next</button>
            <span style={{ fontSize: 12 }}>
              {currentImageIndex + 1} of {stereoPairs.length}
            </span>
          </div>
        )}
      </div>
      
      <a-scene
        background="color: #232d31"
        fog="type: linear; color: #232d31; near: 30; far: 190"
        vr-mode-ui="enabled: true"
        embedded style={{ width: '100%', height: '100%' }}
      >
        <a-assets>
          {stereoPairs.map((pair, index) => (
            <Fragment key={index}>
              <img
                id={`leftEyeImg${index}`}
                src={pair.left}
                ref={checkAssetComplete(pair.left)}
                onLoad={() => markAssetLoaded(pair.left)}
                onError={() => markAssetLoaded(pair.left)}
              />
              <img
                id={`rightEyeImg${index}`}
                src={pair.right}
                ref={checkAssetComplete(pair.right)}
                onLoad={() => markAssetLoaded(pair.right)}
                onError={() => markAssetLoaded(pair.right)}
              />
            </Fragment>
          ))}
        </a-assets>
        
        <a-entity
          id="cameraRig"
          position={`0 0 ${START_Z}`}
          animation={`property: position; from: 0 0 ${START_Z}; to: 0 0 ${track.endZ}; dur: ${track.duration}; easing: linear; loop: true; autoplay: true`}
        >
          {/* Wheels stay planted on the rails while the body rocks above them. */}
          {[-1, 1].map((side) =>
            [-1, 1].map((end) => (
              <a-cylinder
                key={`wheel-${side}-${end}`}
                radius={WHEEL_RADIUS}
                height="0.12"
                rotation="0 0 90"
                position={`${(side * RAIL_GAUGE) / 2} ${WHEEL_RADIUS + RAIL_TOP_Y} ${end * 1.1}`}
                color="#2b2622"
                metalness="0.6"
                roughness="0.5"
              ></a-cylinder>
            ))
          )}

          <a-entity
            id="cart"
            animation__bob={`property: position; from: 0 0 0; to: 0 0.04 0; dur: ${(SLEEPER_SPACING / RIDE_SPEED) * 1000}; dir: alternate; loop: true; easing: easeInOutSine`}
            animation__sway={`property: rotation; from: 0 0 -0.65; to: 0 0 0.65; dur: ${(SWAY_DISTANCE / RIDE_SPEED) * 1000}; dir: alternate; loop: true; easing: easeInOutSine`}
          >
            {/* Deck */}
            <a-box
              width="2"
              height="0.18"
              depth="3"
              position={`0 ${DECK_Y} 0`}
              color="#6b4a2f"
              roughness="0.9"
            ></a-box>

            {/* Side boards */}
            {[-1, 1].map((side) => (
              <a-box
                key={`side-${side}`}
                width="0.09"
                height="0.65"
                depth="3"
                position={`${side * 0.955} ${BOARD_Y} 0`}
                color="#7d5636"
                roughness="0.9"
              ></a-box>
            ))}

            {/* End boards */}
            {[-1, 1].map((end) => (
              <a-box
                key={`end-${end}`}
                width="2"
                height="0.65"
                depth="0.09"
                position={`0 ${BOARD_Y} ${end * 1.455}`}
                color="#7d5636"
                roughness="0.9"
              ></a-box>
            ))}

            <a-entity id="rider" position={`0 ${RIDER_STANCE_Y} 0`}>
              <a-camera position={`0 ${DESKTOP_EYE_HEIGHT} 0`}></a-camera>
            </a-entity>
          </a-entity>
        </a-entity>

    
        
        {assetsReady && (
          <>
            {stereoPairs.map((pair, index) => {
              // Cards alternate left and right of the track, angled to face the rider.
              const side = index % 2 === 0 ? -1 : 1
              const xPos = side * CARD_OFFSET
              const zPos = FIRST_CARD_Z - index * CARD_SPACING
              const rotation = side === -1 ? 75 : -75
              const geometry = `width: ${(CARD_HEIGHT * pair.aspect).toFixed(3)}; height: ${CARD_HEIGHT}`
              const position = `${xPos} ${CARD_CENTRE_Y} ${zPos}`
              const rotationAttr = `0 ${rotation} 0`

              return (
                <Fragment key={index}>
                  <a-plane
                    geometry={geometry}
                    material={`src: #leftEyeImg${index}; transparent: true`}
                    position={position}
                    rotation={rotationAttr}
                    eye-filter="eye: left"
                  ></a-plane>
                  <a-plane
                    geometry={geometry}
                    material={`src: #rightEyeImg${index}; transparent: true`}
                    position={position}
                    rotation={rotationAttr}
                    eye-filter="eye: right"
                  ></a-plane>
                </Fragment>
              )
            })}

            {/* Ground and ballast bed */}
            <a-plane
              width="240"
              height={track.length + 60}
              rotation="-90 0 0"
              position={`0 -0.02 ${track.centreZ}`}
              color="#2c2a26"
              roughness="1"
            ></a-plane>
            <a-box
              width="4.4"
              height="0.12"
              depth={track.length}
              position={`0 0.04 ${track.centreZ}`}
              color="#4a453e"
              roughness="1"
            ></a-box>

            {/* Sleepers */}
            {track.sleeperZs.map((z) => (
              <a-box
                key={`sleeper-${z}`}
                width="2.4"
                height="0.1"
                depth="0.28"
                position={`0 0.15 ${z}`}
                color="#3d2f22"
                roughness="1"
              ></a-box>
            ))}

            {/* Rails */}
            {[-1, 1].map((side) => (
              <a-box
                key={`rail-${side}`}
                width="0.1"
                height="0.12"
                depth={track.length}
                position={`${(side * RAIL_GAUGE) / 2} ${RAIL_TOP_Y - 0.06} ${track.centreZ}`}
                color="#8a8378"
                metalness="0.75"
                roughness="0.35"
              ></a-box>
            ))}

            {/* Sky/Background */}
            <a-sky color="#232d31ff"></a-sky>
            
        
          </>
        )}
        
        {!assetsReady && (
          <>
            <a-text 
              value="Loading museum stereo cards..."
              position="0 2 -3"
              align="center"
              color="#FFF"
            ></a-text>
          </>
        )}
      </a-scene>
    </div>
  )
}

export default App
