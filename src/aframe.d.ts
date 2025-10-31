declare module 'aframe-stereo-component';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'a-scene': any;
      'a-assets': any;
      'a-entity': any;
      'a-camera': any;
      'a-plane': any;
      'a-box': any;
      'a-sphere': any;
      'a-cylinder': any;
      'a-text': any;
      img: any;
    }
  }
}

export {};