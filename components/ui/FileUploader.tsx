"use client";
import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, Loader2, GripVertical } from "lucide-react";

interface FileUploaderProps {
  accept?: string;
  multiple?: boolean;
  value?: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  maxFiles?: number;
  /** 1ファイルあたりの最大サイズ（MB） */
  maxSizeMB?: number;
  /** Supabase Storage バケット名 — 指定時は実アップロード */
  bucket?: string;
  /** Storage パスのプレフィックス（例: "{vendorId}/{bikeId}"） */
  pathPrefix?: string;
  /** アップロード完了コールバック */
  onUpload?: (urls: string[]) => void;
}

/** accept 文字列を表示用ラベルに変換 */
function formatAcceptLabel(accept: string): string {
  if (accept === "image/*") return "JPG, PNG, WebP, GIF";
  if (accept.includes("image") && accept.includes("pdf"))
    return "JPG, PNG, WebP, PDF";
  if (accept.includes("pdf")) return "PDF";
  return accept;
}

/** ファイル名からユニークなストレージパスを生成 */
function buildStoragePath(prefix: string, fileName: string): string {
  const ts = Date.now();
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${prefix}/${ts}_${safe}`;
}

export function FileUploader({
  accept = "image/*",
  multiple = false,
  value = [],
  onChange,
  label = "ファイルをアップロード",
  maxFiles = 10,
  maxSizeMB = 10,
  bucket,
  pathPrefix = "",
  onUpload,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  /** ファイルを API 経由でアップロードし URL を返す */
  const uploadToStorage = async (file: File): Promise<string | null> => {
    if (!bucket) return null;

    const path = buildStoragePath(pathPrefix, file.name);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("bucket", bucket);
    fd.append("path", path);

    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) return null;
    const json = await res.json();
    return json.url ?? null;
  };

  /** ファイル処理（選択 or ドロップ共通） */
  const processFiles = useCallback(
    async (files: FileList) => {
      setError("");
      setUploading(true);

      const newUrls: string[] = [];
      const maxBytes = maxSizeMB * 1024 * 1024;

      for (
        let i = 0;
        i < files.length && value.length + newUrls.length < maxFiles;
        i++
      ) {
        const file = files[i];

        if (file.size > maxBytes) {
          setError(`${file.name} は${maxSizeMB}MBを超えています`);
          continue;
        }

        if (bucket) {
          // 実アップロード
          const url = await uploadToStorage(file);
          if (url) {
            newUrls.push(url);
          } else {
            setError(`${file.name} のアップロードに失敗しました`);
          }
        } else {
          // ローカルプレビュー（bucket 未指定時）
          const url = URL.createObjectURL(file);
          newUrls.push(url);
        }
      }

      if (newUrls.length > 0) {
        const updated = [...value, ...newUrls];
        onChange(updated);
        onUpload?.(newUrls);
      }

      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value, maxFiles, maxSizeMB, bucket, pathPrefix]
  );

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processFiles(files);
  };

  /** 削除：Storage 上のファイルも削除 */
  const removeFile = async (index: number) => {
    setError("");
    const url = value[index];

    // Storage URL の場合は API で削除
    if (bucket && url && !url.startsWith("blob:")) {
      // URL から path を抽出
      const marker = `/storage/v1/object/public/${bucket}/`;
      const pathStart = url.indexOf(marker);
      if (pathStart !== -1) {
        const storagePath = url.substring(pathStart + marker.length);
        await fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bucket, path: storagePath }),
        });
      }
    }

    onChange(value.filter((_, i) => i !== index));
  };

  /* ── ドラッグ＆ドロップ（ファイル追加） ── */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFiles(files);
    }
  };

  /* ── ドラッグ並び替え ── */
  const handleSortDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleSortDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const reordered = [...value];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    onChange(reordered);
    setDragIndex(index);
  };

  const handleSortDragEnd = () => {
    setDragIndex(null);
  };

  return (
    <div>
      <div className="space-y-[8px]">
        {/* プレビュー一覧 */}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-[8px]">
            {value.map((url, i) => (
              <div
                key={`${url}-${i}`}
                draggable={multiple}
                onDragStart={() => handleSortDragStart(i)}
                onDragOver={(e) => handleSortDragOver(e, i)}
                onDragEnd={handleSortDragEnd}
                className={
                  "relative group border border-gray-200 p-[4px]" +
                  (dragIndex === i ? " opacity-50" : "")
                }
              >
                {multiple && (
                  <div className="absolute top-[2px] left-[2px] opacity-0 group-hover:opacity-60 cursor-grab">
                    <GripVertical className="w-[12px] h-[12px] text-gray-400" />
                  </div>
                )}
                {accept.includes("image") ? (
                  <img
                    src={url}
                    alt=""
                    className="w-[80px] h-[80px] object-cover"
                  />
                ) : (
                  <div className="w-[80px] h-[80px] flex items-center justify-center bg-gray-50">
                    <FileText className="w-[24px] h-[24px] text-gray-400" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute -top-[6px] -right-[6px] bg-red-500 text-white p-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-[12px] h-[12px]" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* アップロードボタン / ドロップゾーン */}
        {value.length < maxFiles && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={
              "flex flex-col items-center gap-[8px] border border-dashed px-[16px] py-[20px] text-sm text-gray-500 transition-colors cursor-pointer" +
              (isDragging
                ? " border-accent bg-accent/5 text-accent"
                : " border-gray-300 hover:border-gray-400 hover:text-gray-600")
            }
            onClick={() => !uploading && inputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="w-[20px] h-[20px] animate-spin" />
                <span>アップロード中...</span>
              </>
            ) : (
              <>
                <Upload className="w-[20px] h-[20px]" />
                <span>{label}</span>
                <span className="text-xs text-gray-400">
                  またはドラッグ＆ドロップ
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-[4px]">{error}</p>}
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
