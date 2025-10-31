import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [leftEyeImages, setLeftEyeImages] = useState<string[]>(['/left.jpeg'])
  const [rightEyeImages, setRightEyeImages] = useState<string[]>(['right.jpeg'])
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
  }, [leftEyeImages.length, rightEyeImages.length])


  const handleLeftEyeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file))
      setLeftEyeImages(prev => [...prev, ...newImages])
    }
  }

  const handleRightEyeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file))
      setRightEyeImages(prev => [...prev, ...newImages])
    }
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const nextImage = () => {
    const maxLength = Math.max(leftEyeImages.length, rightEyeImages.length)
    if (maxLength > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % maxLength)
      setImageLoaded(false)
    }
  }

  const prevImage = () => {
    const maxLength = Math.max(leftEyeImages.length, rightEyeImages.length)
    if (maxLength > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + maxLength) % maxLength)
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
  }, [leftEyeImages.length, rightEyeImages.length])

  useEffect(() => {
    setImageLoaded(true)
  }, [currentImageIndex, leftEyeImages, rightEyeImages])

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
        {(leftEyeImages.length > 0 || rightEyeImages.length > 0) && (
          <div style={{ marginTop: 10 }}>
            <button onClick={prevImage} style={{ marginRight: 5 }}>Previous</button>
            <button onClick={nextImage} style={{ marginRight: 10 }}>Next</button>
            <span style={{ fontSize: 12 }}>
              {currentImageIndex + 1} of {Math.max(leftEyeImages.length, rightEyeImages.length)}
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
          {leftEyeImages[currentImageIndex] && <img id="leftEyeImg" src={leftEyeImages[currentImageIndex]} onLoad={handleImageLoad} />}
          {rightEyeImages[currentImageIndex] && <img id="rightEyeImg" src={rightEyeImages[currentImageIndex]} />}
          {leftEyeImages[currentImageIndex] && <img id="leftEyeImg2" src={leftEyeImages[currentImageIndex]} />}
          {rightEyeImages[currentImageIndex] && <img id="rightEyeImg2" src={rightEyeImages[currentImageIndex]} />}
          {leftEyeImages[currentImageIndex] && <img id="leftEyeImg3" src={leftEyeImages[currentImageIndex]} />}
          {rightEyeImages[currentImageIndex] && <img id="rightEyeImg3" src={rightEyeImages[currentImageIndex]} />}
          {leftEyeImages[currentImageIndex] && <img id="leftEyeImg4" src={leftEyeImages[currentImageIndex]} />}
          {rightEyeImages[currentImageIndex] && <img id="rightEyeImg4" src={rightEyeImages[currentImageIndex]} />}
        </a-assets>
        
        <a-camera position="0 1.6 0">
        </a-camera>

        <a-entity id="leftHand" hand-controls="hand: left; handModelStyle: lowPoly; color: #ffcccc"></a-entity>
        <a-entity id="rightHand" hand-controls="hand: right; handModelStyle: lowPoly; color: #ccffcc"></a-entity>
        
        {(leftEyeImages.length > 0 || rightEyeImages.length > 0) && imageLoaded && (
          <>
            {/* Front Wall */}
            <a-plane 
              geometry="width: 8; height: 4.5"
              material="src: #leftEyeImg; transparent: true"
              position="0 1.6 -8"
              eye-filter="eye: left"
            ></a-plane>
            <a-plane 
              geometry="width: 8; height: 4.5"
              material="src: #rightEyeImg; transparent: true"
              position="0 1.6 -8"
              eye-filter="eye: right"
            ></a-plane>
            
            {/* Back Wall */}
            <a-plane 
              geometry="width: 8; height: 4.5"
              material="src: #leftEyeImg2; transparent: true"
              position="0 1.6 8"
              rotation="0 180 0"
              eye-filter="eye: left"
            ></a-plane>
            <a-plane 
              geometry="width: 8; height: 4.5"
              material="src: #rightEyeImg2; transparent: true"
              position="0 1.6 8"
              rotation="0 180 0"
              eye-filter="eye: right"
            ></a-plane>
            
            {/* Left Wall */}
            <a-plane 
              geometry="width: 8; height: 4.5"
              material="src: #leftEyeImg3; transparent: true"
              position="-8 1.6 0"
              rotation="0 90 0"
              eye-filter="eye: left"
            ></a-plane>
            <a-plane 
              geometry="width: 8; height: 4.5"
              material="src: #rightEyeImg3; transparent: true"
              position="-8 1.6 0"
              rotation="0 90 0"
              eye-filter="eye: right"
            ></a-plane>
            
            {/* Right Wall */}
            <a-plane 
              geometry="width: 8; height: 4.5"
              material="src: #leftEyeImg4; transparent: true"
              position="8 1.6 0"
              rotation="0 -90 0"
              eye-filter="eye: left"
            ></a-plane>
            <a-plane 
              geometry="width: 8; height: 4.5"
              material="src: #rightEyeImg4; transparent: true"
              position="8 1.6 0"
              rotation="0 -90 0"
              eye-filter="eye: right"
            ></a-plane>
            
            {/* Environment: Floor, Ceiling, and Walls */}
            <a-plane 
              position="0 0 0" 
              rotation="-90 0 0" 
              width="20" 
              height="20" 
              color="#404040"
              material="roughness: 0.8"
            ></a-plane>
            
            <a-plane 
              position="0 6 0" 
              rotation="90 0 0" 
              width="20" 
              height="20" 
              color="#202020"
              material="roughness: 0.9"
            ></a-plane>
            
            <a-plane 
              position="0 3 -10" 
              width="20" 
              height="6" 
              color="#303030"
              material="roughness: 0.7"
            ></a-plane>
            
            <a-plane 
              position="0 3 10" 
              rotation="0 180 0"
              width="20" 
              height="6" 
              color="#303030"
              material="roughness: 0.7"
            ></a-plane>
            
            <a-plane 
              position="-10 3 0" 
              rotation="0 90 0"
              width="20" 
              height="6" 
              color="#303030"
              material="roughness: 0.7"
            ></a-plane>
            
            <a-plane 
              position="10 3 0" 
              rotation="0 -90 0"
              width="20" 
              height="6" 
              color="#303030"
              material="roughness: 0.7"
            ></a-plane>
         
          </>
        )}
        
        {leftEyeImages.length === 0 && rightEyeImages.length === 0 && (
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
