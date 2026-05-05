'use client';

import type {
  DragEvent,
  ImgHTMLAttributes,
  MouseEvent,
  ReactNode,
} from 'react';

interface ProtectedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
  overlay?: ReactNode;
  shield?: boolean;
}

export default function ProtectedImage({
  wrapperClassName = '',
  className = '',
  overlay,
  shield = true,
  onContextMenu,
  onDragStart,
  ...props
}: ProtectedImageProps) {
  const handleContextMenu = (event: MouseEvent<HTMLImageElement>) => {
    event.preventDefault();
    onContextMenu?.(event);
  };

  const handleDragStart = (event: DragEvent<HTMLImageElement>) => {
    event.preventDefault();
    onDragStart?.(event);
  };

  return (
    <div
      data-protect-content="true"
      className={`protected-wrapper relative h-full w-full overflow-hidden ${wrapperClassName}`}
      onContextMenu={(event) => event.preventDefault()}
    >
      <img
        {...props}
        draggable={false}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        className={`protected-media ${className}`}
      />

      {shield && (
        <div
          className="absolute inset-0 z-10"
          aria-hidden="true"
          onContextMenu={(event) => event.preventDefault()}
          onDragStart={(event) => event.preventDefault()}
        />
      )}

      {overlay ? (
        <div className="pointer-events-none absolute inset-0 z-20">
          {overlay}
        </div>
      ) : null}
    </div>
  );
}
