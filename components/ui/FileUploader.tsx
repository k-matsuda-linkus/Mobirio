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
  /** 1ファイルあたりの最大サイズ（MB） */
  maxSizeMB?: number;
}

/** accept文字列を表示用ラベルに変換 */
function formatAcceptLabel(accept: string): string {
  if (accept === "image/*") return "JPG, PNG, WebP, GIF";
  if (accept.includes("image") && accept.includes("pdf")) return "JPG, PNG, WebP, PDF";
  if (accept.includes("pdf")) return "PDF";
  return accept;
}

export function FileUploader({
  accept = "image/*",
  multiple = false,
  value = [],
  onChange,
  label = "ファイルをアップロード",
  maxFiles = 10,
  maxSizeMB = 5,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError("");
    setUploading(true);
    const newUrls: string[] = [];
    const maxBytes = maxSizeMB * 1024 * 1024;

    for (let i = 0; i < files.length && value.length + newUrls.length < maxFiles; i++) {
      if (files[i].size > maxBytes) {
        setError(`${files[i].name} は${maxSizeMB}MBを超えています`);
        continue;
      }
      // Create local preview URL (in production, upload to Supabase storage)
      const url = URL.createObjectURL(files[i]);
      newUrls.push(url);
    }

    if (newUrls.length > 0) {
      onChange([...value, ...newUrls]);
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setError("");
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
      {error && (
        <p className="text-xs text-red-500 mt-[4px]">{error}</p>
      )}
      <p className="text-xs text-gray-400 mt-[4px]">
        {formatAcceptLabel(accept)} / 最大{maxSizeMB}MB
        {maxFiles > 1 && ` / ${maxFiles}枚まで`}
      </p>
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
