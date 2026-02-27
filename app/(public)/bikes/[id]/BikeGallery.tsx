"use client";
import { useState } from "react";
import Image from "next/image";

interface BikeGalleryProps {
  images: string[];
  name: string;
}

export function BikeGallery({ images, name }: BikeGalleryProps) {
  const [selected, setSelected] = useState(0);

  return (
    <div>
      {/* メイン画像 */}
      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
        <Image
          src={images[selected]}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {/* サムネイル */}
      {images.length > 1 && (
        <div className="flex gap-[8px] mt-[12px] overflow-x-auto">
          {images.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              className={
                "relative w-[72px] h-[54px] flex-shrink-0 overflow-hidden border-2 transition-colors" +
                (i === selected
                  ? " border-accent"
                  : " border-transparent hover:border-gray-300")
              }
            >
              <Image
                src={url}
                alt={`${name} ${i + 1}`}
                fill
                className="object-cover"
                sizes="72px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
