import type { DetailedHTMLProps, HTMLAttributes } from 'react';

/**
 * A-Frame custom elements accept arbitrary component attributes as strings, so
 * they are typed as standard HTML elements plus an open-ended attribute bag.
 */
type AFrameElementProps = DetailedHTMLProps<
  HTMLAttributes<HTMLElement>,
  HTMLElement
> &
  Record<string, unknown>;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'a-scene': AFrameElementProps;
      'a-assets': AFrameElementProps;
      'a-entity': AFrameElementProps;
      'a-camera': AFrameElementProps;
      'a-plane': AFrameElementProps;
      'a-box': AFrameElementProps;
      'a-sphere': AFrameElementProps;
      'a-cylinder': AFrameElementProps;
      'a-sky': AFrameElementProps;
      'a-text': AFrameElementProps;
    }
  }
}
