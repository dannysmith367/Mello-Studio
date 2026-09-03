"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type GalleryImage = { url: string; altText: string | null };

const ZOOM_SCALE = 2.2;

/**
 * Main image with a thumbnail strip, hover-to-magnify on mouse, and a
 * full-screen lightbox on touch (there's no hover to magnify with there).
 *
 * The active thumbnail resets to the first image whenever the image set
 * itself changes — e.g. a colour pick swapped in a different set of shots —
 * so picking a colour always lands on that colour's default shot rather
 * than whatever index was open.
 */
export function MockupGallery({ images, alt }: { images: GalleryImage[]; alt: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zooming, setZooming] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const lastPointerType = useRef<string>("mouse");
  const setKey = images.map((i) => i.url).join("|");

  useEffect(() => {
    setActiveIndex(0);
  }, [setKey]);

  // A touch device can't hover, so an open lightbox never needs the zoom
  // pane behind it — but closing shouldn't leave a phantom zoomed frame.
  useEffect(() => {
    if (lightboxOpen) setZooming(false);
  }, [lightboxOpen]);

  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") setActiveIndex((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setActiveIndex((i) => (i - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, images.length]);

  const active = images[activeIndex] ?? images[0] ?? null;

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomOrigin({ x, y });
    setZooming(true);
  }

  function handlePointerLeave(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    setZooming(false);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    lastPointerType.current = e.pointerType;
  }

  function handleClick() {
    if (lastPointerType.current === "touch") setLightboxOpen(true);
  }

  return (
    <div>
      <div
        className="relative aspect-[4/5] cursor-zoom-in overflow-hidden bg-surface"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
      >
        {active?.url && (
          <Image
            src={active.url}
            alt={active.altText ?? alt}
            fill
            sizes="(max-width: 768px) 100vw, 45vw"
            className="object-cover"
            style={
              zooming
                ? {
                    transform: `scale(${ZOOM_SCALE})`,
                    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                  }
                : undefined
            }
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
              <Image src={image.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && active?.url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/95 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
            className="absolute right-4 top-4 font-data text-2xl text-bone"
          >
            ×
          </button>

          <div className="relative h-full w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <Image
              src={active.url}
              alt={active.altText ?? alt}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((i) => (i - 1 + images.length) % images.length);
                }}
                aria-label="Previous image"
                className="absolute left-2 top-1/2 -translate-y-1/2 px-3 py-4 font-data text-2xl text-bone"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((i) => (i + 1) % images.length);
                }}
                aria-label="Next image"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-4 font-data text-2xl text-bone"
              >
                ›
              </button>
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 font-data text-[0.625rem] text-muted">
                {activeIndex + 1} / {images.length}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
