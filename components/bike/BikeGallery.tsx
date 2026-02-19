"use client";

import { useState } from "react";
import Image from "next/image";

interface BikeGalleryProps {
  images: string[];
  alt: string;
}

export default function BikeGallery({ images, alt }: BikeGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[16/9] bg-gray-100 flex items-center justify-center">
        <span className="text-sm text-gray-300">No Image</span>
      </div>
    );
  }

  return (
    <div>
      {/* Main image */}
      <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
        <Image
          src={images[activeIndex]}
          alt={`${alt} - ${activeIndex + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 720px"
          priority
        />
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="mt-[8px] flex gap-[8px] overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative w-[80px] h-[60px] flex-shrink-0 overflow-hidden border-2 transition-colors ${
                i === activeIndex
                  ? "border-[#2D7D6F]"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              <Image
                src={src}
                alt={`${alt} thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
