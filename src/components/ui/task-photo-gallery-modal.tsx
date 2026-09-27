"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Full-screen gallery for a task's photos, rendered via a React Portal into
 * document.body. Portals bypass all ancestor overflow/stacking-context
 * constraints (overflow-hidden, overflow-y-auto, transform, will-change)
 * that can trap fixed-position elements inside scroll containers like
 * RoleLayout — which was why the modal appeared to be "not opening".
 */
export function TaskPhotoGalleryModal({
  photos,
  initialIndex = 0,
  onClose,
}: {
  photos: string[];
  initialIndex?: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(Math.min(initialIndex, photos.length - 1));

  // Close on Escape key, navigate with arrow keys
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex(i => (i - 1 + photos.length) % photos.length);
      if (e.key === "ArrowRight") setIndex(i => (i + 1) % photos.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, photos.length]);

  function prev() { setIndex(i => (i - 1 + photos.length) % photos.length); }
  function next() { setIndex(i => (i + 1) % photos.length); }

  if (typeof document === "undefined") return null;

  const modal = (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999 }}
      className="flex flex-col bg-black/95"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Task photos"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between px-4 py-3 text-white">
        <span className="text-sm font-medium">{index + 1} / {photos.length}</span>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Close gallery"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main image — fills remaining space, fully contained, never cropped */}
      <div
        className="relative min-h-0 flex-1 flex items-center justify-center px-12"
        onClick={e => e.stopPropagation()}
      >
        {photos.length > 1 && (
          <button
            onClick={prev}
            className="absolute left-1 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 transition-colors"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[index]}
          alt={`Photo ${index + 1} of ${photos.length}`}
          style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
          className="select-none rounded-lg"
          draggable={false}
        />
        {photos.length > 1 && (
          <button
            onClick={next}
            className="absolute right-1 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 transition-colors"
            aria-label="Next photo"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div
          className="shrink-0 flex justify-center gap-2 overflow-x-auto px-4 py-3"
          onClick={e => e.stopPropagation()}
        >
          {photos.map((p, i) => (
            <button
              key={p + i}
              onClick={() => setIndex(i)}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                i === index ? "border-white scale-105" : "border-transparent opacity-50 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt={`Thumbnail ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return createPortal(modal, document.body);
}
