'use client';

import { ProductImage } from '@/types/product.type';
import { useEffect, useMemo, useState } from 'react';
import ProtectedImage from '@/components/protection/ProtectedImage';

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/300?text=No+Image';

interface ProductImageGalleryProps {
  images: ProductImage[];
  previewImageUrl?: string | null;
  previewAlt?: string;
}

interface GalleryEntry {
  key: string;
  url: string;
  description: string;
  isPreview?: boolean;
}

export default function ProductImageGallery({
  images,
  previewImageUrl,
  previewAlt,
}: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const safeImages = useMemo<GalleryEntry[]>(() => {
    const normalizedImages: GalleryEntry[] = Array.isArray(images)
      ? images.map((image, index) => ({
          key: image?.id || `image-${index}`,
          url:
            typeof image?.url === 'string' && image.url.trim().length > 0
              ? image.url
              : PLACEHOLDER_IMAGE,
          description:
            typeof image?.description === 'string' && image.description.trim().length > 0
              ? image.description
              : `Image ${index + 1}`,
        }))
      : [];

    const galleryImages = normalizedImages.length
      ? normalizedImages
      : [
          {
            key: 'placeholder-image',
            url: PLACEHOLDER_IMAGE,
            description: 'No image available',
          },
        ];

    if (typeof previewImageUrl === 'string' && previewImageUrl.trim().length > 0) {
      return [
        {
          key: 'preview-image',
          url: previewImageUrl,
          description: previewAlt || 'Live product preview',
          isPreview: true,
        },
        ...galleryImages,
      ];
    }

    return galleryImages;
  }, [images, previewAlt, previewImageUrl]);

  useEffect(() => {
    setSelectedImage(0);
  }, [previewImageUrl, images]);

  const currentImage = safeImages[selectedImage]?.url || PLACEHOLDER_IMAGE;
  const currentAlt = safeImages[selectedImage]?.description || `Image ${selectedImage + 1}`;

  return (
    <div className="space-y-4">
      <div
        className="aspect-square bg-stone-100 overflow-hidden cursor-zoom-in relative rounded-3xl"
        onClick={() => setIsZoomed(true)}
        data-protect-content="true"
      >
        <ProtectedImage
          src={currentImage}
          alt={currentAlt}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />

        {safeImages[selectedImage]?.isPreview && (
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-stone-700">
            Live Preview
          </span>
        )}
      </div>

      {safeImages.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {safeImages.map((image, index) => (
            <button
              key={image.key}
              type="button"
              onClick={() => setSelectedImage(index)}
              className={`relative aspect-square overflow-hidden rounded-2xl border-2 bg-stone-100 transition-colors ${
                selectedImage === index
                  ? 'border-stone-800'
                  : 'border-transparent hover:border-stone-300'
              }`}
              data-protect-content="true"
            >
              <ProtectedImage
                src={image.url}
                alt={image.description || `Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {image.isPreview && (
                <span className="absolute inset-x-1 bottom-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-stone-700">
                  Preview
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {isZoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <button
            type="button"
            onClick={() => setIsZoomed(false)}
            className="absolute top-6 right-6 text-white hover:text-stone-300 transition-colors"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {safeImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage((prev) =>
                  prev === 0 ? safeImages.length - 1 : prev - 1
                );
              }}
              className="absolute left-6 text-white hover:text-stone-300 transition-colors"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <div
            className="max-w-full max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
            data-protect-content="true"
          >
            <ProtectedImage
              src={safeImages[selectedImage]?.url || currentImage}
              alt={safeImages[selectedImage]?.description || currentAlt}
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>

          {safeImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage((prev) =>
                  prev === safeImages.length - 1 ? 0 : prev + 1
                );
              }}
              className="absolute right-6 text-white hover:text-stone-300 transition-colors"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm">
            {selectedImage + 1} / {safeImages.length}
          </div>
        </div>
      )}
    </div>
  );
}
