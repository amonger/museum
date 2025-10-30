import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [selectedImage, setSelectedImage] = useState('')
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    import('aframe-stereo-component')
  }, [])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setSelectedImage(url)
      setImageLoaded(false)
    }
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, background: 'rgba(255,255,255,0.9)', padding: 10, borderRadius: 5 }}>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        <div style={{ marginTop: 5, fontSize: 12 }}>
          Upload a side-by-side stereoscopic image
        </div>
      </div>
      
      <a-scene background="color: #000" vr-mode-ui="enabled: true">
        <a-assets>
          {selectedImage && <img id="stereoImage" src={selectedImage} onLoad={handleImageLoad} />}
        </a-assets>
        
        <a-camera stereocam="eye: left" position="0 1.6 3">
          <a-cursor animation__click="property: scale; startEvents: click; from: 0.1 0.1 0.1; to: 1 1 1; dur: 150"></a-cursor>
        </a-camera>
        
        {selectedImage && imageLoaded && (
          <a-plane 
            stereo="src: #stereoImage"
            geometry="width: 8; height: 4.5"
            material="src: #stereoImage"
            position="0 1.6 -3"
          ></a-plane>
        )}
        
        {!selectedImage && (
          <>
            <a-text 
              value="Upload a stereoscopic image to view in 3D"
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
