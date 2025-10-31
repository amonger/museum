import React, { useEffect, useState } from 'react'
import './App.css'

interface StereoPair {
  left: string
  right: string
}

function App() {
  const [stereoPairs, setStereoPairs] = useState<StereoPair[]>([
    { left: '/woman/left.jpeg', right: '/woman/right.jpeg' },
    { left: '/harbour/left.jpeg', right: '/harbour/right.jpeg' },
    { left: '/harbour2/left.jpeg', right: '/harbour2/right.jpeg' },
    { left: '/harbour3/left.jpeg', right: '/harbour3/right.jpeg' },
    { left: '/park/left.jpeg', right: '/park/right.jpeg' },
  ])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)

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
                if (sceneEl.is('vr-mode')) {
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
            sceneEl.addEventListener('enter-vr', updateVisibility);
            sceneEl.addEventListener('exit-vr', updateVisibility);
          }
        });
      }
    });
  }, []);

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


  const handleLeftEyeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file))
      newImages.forEach((imageUrl, index) => {
        setStereoPairs(prev => {
          const newPairs = [...prev]
          const targetIndex = prev.length + index
          if (newPairs[targetIndex]) {
            newPairs[targetIndex] = { ...newPairs[targetIndex], left: imageUrl }
          } else {
            newPairs[targetIndex] = { left: imageUrl, right: '' }
          }
          return newPairs
        })
      })
    }
  }

  const handleRightEyeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file))
      newImages.forEach((imageUrl, index) => {
        setStereoPairs(prev => {
          const newPairs = [...prev]
          const targetIndex = prev.length + index
          if (newPairs[targetIndex]) {
            newPairs[targetIndex] = { ...newPairs[targetIndex], right: imageUrl }
          } else {
            newPairs[targetIndex] = { left: '', right: imageUrl }
          }
          return newPairs
        })
      })
    }
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const nextImage = () => {
    if (stereoPairs.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % stereoPairs.length)
      setImageLoaded(false)
    }
  }

  const prevImage = () => {
    if (stereoPairs.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + stereoPairs.length) % stereoPairs.length)
      setImageLoaded(false)
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

  useEffect(() => {
    setImageLoaded(true)
  }, [currentImageIndex, stereoPairs])

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, background: 'rgba(255,255,255,0.9)', padding: 10, borderRadius: 5 }}>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 5 }}>Left Eye Images:</label>
          <input type="file" accept="image/*" multiple onChange={handleLeftEyeUpload} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 5 }}>Right Eye Images:</label>
          <input type="file" accept="image/*" multiple onChange={handleRightEyeUpload} />
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
        background="color: #000" 
        vr-mode-ui="enabled: true"
        embedded style={{ width: '100%', height: '100%' }}
      >
        <a-assets>
          {stereoPairs.map((pair, index) => (
            <React.Fragment key={index}>
              {pair.left && <img id={`leftEyeImg${index}`} src={pair.left} onLoad={index === 0 ? handleImageLoad : undefined} />}
              {pair.right && <img id={`rightEyeImg${index}`} src={pair.right} />}
            </React.Fragment>
          ))}
        </a-assets>
        
        <a-entity 
          id="cameraRig"
          position={`0 0 ${stereoPairs.length > 0 ? 5 + (stereoPairs.length * 10) + 10 : 40}`}
          animation={`property: position; to: 0 1 -10; dur: ${Math.max(30000, stereoPairs.length * 7500)}; easing: linear; loop: true; autoplay: true`}
        >
          <a-camera position="0 2.5 0"></a-camera>
        </a-entity>

    
        
        {stereoPairs.length > 0 && imageLoaded && (
          <>
            {stereoPairs.map((pair, index) => {
              const zPos = 5 + (index * 10)
              const isEven = index % 2 === 0
              const xPos = isEven ? 10 + (index * 2) : -(10 + (index * 2))
              const rotation = isEven ? -45 - (index * 5) : 45 + (index * 5)
              
              return (
                <React.Fragment key={index}>
                  {pair.left && (
                    <a-plane 
                      geometry="width: 12; height: 8"
                      material={`src: #leftEyeImg${index}; transparent: true`}
                      position={`${xPos} 2.5 ${zPos}`}
                      rotation={`0 ${rotation} 0`}
                      eye-filter="eye: left"
                    ></a-plane>
                  )}
                  {pair.right && (
                    <a-plane 
                      geometry="width: 12; height: 8"
                      material={`src: #rightEyeImg${index}; transparent: true`}
                      position={`${xPos} 2.5 ${zPos}`}
                      rotation={`0 ${rotation} 0`}
                      eye-filter="eye: right"
                    ></a-plane>
                  )}
                </React.Fragment>
              )
            })}
            
    
            {/* Sky/Background */}
            <a-sky color="#232d31ff"></a-sky>
            
        
          </>
        )}
        
        {stereoPairs.length === 0 && (
          <>
            <a-text 
              value="Upload separate left and right eye images to view in 3D"
              position="0 2 -3"
              align="center"
              color="#FFF"
            ></a-text>
            <a-box position="-1 0.5 -3" rotation="0 45 0" color="#4CC3D9"></a-box>
            <a-sphere position="0 1.25 -5" radius="1.25" color="#EF2D5E"></a-sphere>
            <a-cylinder position="1 0.75 -3" radius="0.5" height="1.5" color="#FFC65D"></a-cylinder>
            <a-plane position="0 0 -4" rotation="-90 0 0" width="4" height="4" color="#7BC8A4"></a-plane>
          </>
        )}
      </a-scene>
    </div>
  )
}

export default App
