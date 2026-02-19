"use client";
import { useState, useRef } from "react";
import { Upload, X, FileText } from "lucide-react";

interface FileUploaderProps {
  accept?: string;
  multiple?: boolean;
  value?: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  maxFiles?: number;
}

export function FileUploader({
  accept = "image/*",
  multiple = false,
  value = [],
  onChange,
  label = "ファイルをアップロード",
  maxFiles = 10,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    for (let i = 0; i < files.length && value.length + newUrls.length < maxFiles; i++) {
      // Create local preview URL (in production, upload to Supabase storage)
      const url = URL.createObjectURL(files[i]);
      newUrls.push(url);
    }

    onChange([...value, ...newUrls]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="space-y-[8px]">
        {value.length > 0 && (
          <div className="flex flex-wrap gap-[8px]">
            {value.map((url, i) => (
              <div key={i} className="relative group border border-gray-200 p-[4px]">
                {accept.includes("image") ? (
                  <img src={url} alt="" className="w-[80px] h-[80px] object-cover" />
                ) : (
                  <div className="w-[80px] h-[80px] flex items-center justify-center bg-gray-50">
                    <FileText className="w-[24px] h-[24px] text-gray-400" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute -top-[6px] -right-[6px] bg-red-500 text-white rounded-full p-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-[12px] h-[12px]" />
                </button>
              </div>
            ))}
          </div>
        )}
        {value.length < maxFiles && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-[8px] border border-dashed border-gray-300 px-[16px] py-[10px] text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600"
          >
            <Upload className="w-[16px] h-[16px]" />
            {uploading ? "アップロード中..." : label}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
