import type * as React from "react";

type ModelViewerElementProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  src?: string;
  alt?: string;
  poster?: string;
  preload?: string;
  loading?: "eager" | "lazy" | "auto";
  reveal?: "auto" | "interaction" | "manual" | string;

  ar?: boolean | string;
  "ar-modes"?: string;
  "ar-scale"?: string;
  "ar-placement"?: string;

  autoplay?: boolean | string;
  bounds?: string;
  exposure?: string | number;
  seamlessPoster?: boolean;
  "seamless-poster"?: boolean | string;
  rotation?: string;
  orientation?: string;
  "auto-rotate"?: boolean | string;
  "camera-controls"?: boolean | string;
  "camera-orbit"?: string;
  "field-of-view"?: string;
  "min-camera-orbit"?: string;
  "max-camera-orbit"?: string;
  "min-field-of-view"?: string;
  "max-field-of-view"?: string;
  "interpolation-decay"?: string;

  "interaction-prompt"?: string;
  "interaction-prompt-style"?: string;
  "interaction-prompt-threshold"?: string;
  "shadow-intensity"?: string | number;
  "shadow-softness"?: string | number;
  "environment-image"?: string;
  "skybox-image"?: string;
  "tone-mapping"?: string;
  "touch-action"?: string;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerElementProps;
    }
  }
}

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerElementProps;
    }
  }
}

declare module "react/jsx-dev-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerElementProps;
    }
  }
}

export {};
