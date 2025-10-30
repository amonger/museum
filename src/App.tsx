import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [images, setImages] = useState<string[]>([
    '/Illustration06-Palais-Royal-Shadows.jpg',
    '/blog-robbett-mary-kate-2018-04-05-stereograph-as-an-educator-loc-banner-edit.jpg'
  ])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    import('aframe-stereo-component')
  }, [])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file))
      setImages(prev => [...prev, ...newImages])
      setImageLoaded(false)
    }
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const nextImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
      setImageLoaded(false)
    }
  }

  const prevImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
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
  }, [images.length])

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, background: 'rgba(255,255,255,0.9)', padding: 10, borderRadius: 5 }}>
        <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
        <div style={{ marginTop: 5, fontSize: 12 }}>
          Upload side-by-side stereoscopic images
        </div>
        {images.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <button onClick={prevImage} style={{ marginRight: 5 }}>Previous</button>
            <button onClick={nextImage} style={{ marginRight: 10 }}>Next</button>
            <span style={{ fontSize: 12 }}>
              {currentImageIndex + 1} of {images.length}
            </span>
          </div>
        )}
      </div>
      
      <a-scene background="color: #000" vr-mode-ui="enabled: true">
        <a-assets>
          {images.length > 0 && <img id="stereoImage" src={images[currentImageIndex]} onLoad={handleImageLoad} />}
        </a-assets>
        
        <a-camera stereocam="eye: left" position="0 1.6 3">
          <a-cursor animation__click="property: scale; startEvents: click; from: 0.1 0.1 0.1; to: 1 1 1; dur: 150"></a-cursor>
        </a-camera>
        
        {images.length > 0 && imageLoaded && (
          <a-plane 
            stereo="src: #stereoImage"
            geometry="width: 8; height: 4.5"
            material="src: #stereoImage"
            position="0 1.6 -3"
          ></a-plane>
        )}
        
        {images.length === 0 && (
          <>
            <a-text 
              value="Upload stereoscopic images to view in 3D"
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
