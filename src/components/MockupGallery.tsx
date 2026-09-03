"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type GalleryImage = { url: string; altText: string | null };

/**
 * Main image with a thumbnail strip. The active thumbnail resets to the
 * first image whenever the image set itself changes — e.g. a colour pick
 * swapped in a different set of shots — so picking a colour always lands
 * on that colour's default shot rather than whatever index was open.
 */
export function MockupGallery({ images, alt }: { images: GalleryImage[]; alt: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const setKey = images.map((i) => i.url).join("|");

  useEffect(() => {
    setActiveIndex(0);
  }, [setKey]);

  const active = images[activeIndex] ?? images[0] ?? null;

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden bg-surface">
        {active?.url && (
          <Image
            src={active.url}
            alt={active.altText ?? alt}
            fill
            sizes="(max-width: 768px) 100vw, 45vw"
            className="object-cover"
            priority
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1} of ${images.length}`}
              aria-current={index === activeIndex}
              className={`relative h-16 w-16 shrink-0 overflow-hidden border bg-surface transition-colors ${
                index === activeIndex ? "border-bone" : "border-rule hover:border-muted"
              }`}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
