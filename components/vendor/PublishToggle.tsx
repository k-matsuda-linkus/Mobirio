"use client";

import React from "react";

interface PublishToggleProps {
  isPublished: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function PublishToggle({ isPublished, onChange, disabled = false }: PublishToggleProps) {
  return (
    <div className="flex items-center gap-[8px]">
      <button
        type="button"
        role="switch"
        aria-checked={isPublished}
        disabled={disabled}
        onClick={() => onChange(!isPublished)}
        className={`relative inline-flex items-center w-[44px] h-[22px] transition-colors ${
          isPublished ? "bg-accent" : "bg-gray-300"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`absolute w-[18px] h-[18px] bg-white transition-transform ${
            isPublished ? "translate-x-[24px]" : "translate-x-[2px]"
          }`}
        />
      </button>
      <span className={`text-xs ${isPublished ? "text-accent" : "text-gray-500"}`}>
        {isPublished ? "公開" : "非公開"}
      </span>
    </div>
  );
}
