'use client';

import { useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Upload, Loader2, AlertTriangle, Check } from 'lucide-react';
import type { InsuranceCertificate } from '@/types/insurance';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUploaded: (cert: InsuranceCertificate) => void;
  existingMonths: { year: number; month: number }[];
}

export function InsurancePdfUploadModal({ isOpen, onClose, onUploaded, existingMonths }: Props) {
  const now = new Date();
  const [targetYear, setTargetYear] = useState(now.getFullYear());
  const [targetMonth, setTargetMonth] = useState(now.getMonth() + 1);
  const [password, setPassword] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ matched: number; unmatched: number; total: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isExisting = existingMonths.some(
    (m) => m.year === targetYear && m.month === targetMonth
  );

  const reset = () => {
    setPassword('');
    setFile(null);
    setError('');
    setResult(null);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleUpload = async () => {
    if (!file || !password) return;
    setUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('password', password);
      formData.append('target_year', String(targetYear));
      formData.append('target_month', String(targetMonth));

      const res = await fetch('/api/admin/insurance-certificates/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'アップロードに失敗しました');
        return;
      }

      setResult({
        matched: json.matchedCount,
        unmatched: json.unmatchedCount,
        total: json.certificate.totalVehicles,
      });

      onUploaded(json.certificate);
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setUploading(false);
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="保険契約証明書アップロード" size="lg">
      <div className="space-y-[20px]">
        {/* 年月選択 */}
        <div>
          <label className="block text-sm font-sans text-gray-700 mb-[6px]">対象年月</label>
          <div className="flex items-center gap-[8px]">
            <select
              value={targetYear}
              onChange={(e) => setTargetYear(Number(e.target.value))}
              className="border border-gray-300 px-[12px] py-[8px] text-sm font-sans focus:outline-none focus:border-accent"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
            <select
              value={targetMonth}
              onChange={(e) => setTargetMonth(Number(e.target.value))}
              className="border border-gray-300 px-[12px] py-[8px] text-sm font-sans focus:outline-none focus:border-accent"
            >
              {months.map((m) => (
                <option key={m} value={m}>{m}月</option>
              ))}
            </select>
          </div>
        </div>

        {/* 上書き警告 */}
        {isExisting && (
          <div className="bg-yellow-50 border border-yellow-200 p-[12px] flex items-start gap-[8px]">
            <AlertTriangle className="w-[16px] h-[16px] text-yellow-600 flex-shrink-0 mt-[2px]" />
            <p className="text-sm font-sans text-yellow-800">
              既存の{targetYear}年{targetMonth}月のデータを上書きします
            </p>
          </div>
        )}

        {/* PDFファイル選択 */}
        <div>
          <label className="block text-sm font-sans text-gray-700 mb-[6px]">PDFファイル</label>
          {file ? (
            <div className="flex items-center justify-between border border-gray-300 px-[12px] py-[8px]">
              <span className="text-sm font-sans text-gray-700 truncate">{file.name}</span>
              <button
                onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                className="text-sm font-sans text-red-500 hover:underline ml-[8px]"
              >
                削除
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-[8px] border border-dashed border-gray-300 px-[20px] py-[16px] text-sm font-sans text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors w-full justify-center"
            >
              <Upload size={16} /> PDFファイルを選択
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }}
            className="hidden"
          />
          <p className="text-xs font-sans text-gray-400 mt-[4px]">PDF形式、10MB以下</p>
        </div>

        {/* パスワード入力 */}
        <div>
          <label className="block text-sm font-sans text-gray-700 mb-[6px]">PDFパスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワードを入力"
            className="w-full border border-gray-300 px-[12px] py-[8px] text-sm font-sans focus:outline-none focus:border-accent"
          />
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-[12px] flex items-start gap-[8px]">
            <AlertTriangle className="w-[16px] h-[16px] text-red-600 flex-shrink-0 mt-[2px]" />
            <p className="text-sm font-sans text-red-800">{error}</p>
          </div>
        )}

        {/* 結果表示 */}
        {result && (
          <div className="bg-green-50 border border-green-200 p-[12px] flex items-start gap-[8px]">
            <Check className="w-[16px] h-[16px] text-green-600 flex-shrink-0 mt-[2px]" />
            <div className="text-sm font-sans text-green-800">
              <p>{result.total}台読み込み完了</p>
              <p className="text-xs text-green-600 mt-[2px]">
                紐付け済: {result.matched}台
                {result.unmatched > 0 && <span className="text-red-600 ml-[8px]">未紐付け: {result.unmatched}台</span>}
              </p>
            </div>
          </div>
        )}

        {/* ボタン */}
        <div className="flex items-center gap-[12px] pt-[8px]">
          <button
            onClick={result ? handleClose : handleUpload}
            disabled={(!file || !password || uploading) && !result}
            className="bg-black text-white px-[24px] py-[10px] text-sm font-sans hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-[8px]"
          >
            {uploading && <Loader2 size={14} className="animate-spin" />}
            {result ? '閉じる' : uploading ? 'アップロード中...' : 'アップロード'}
          </button>
          {!result && (
            <button
              onClick={handleClose}
              className="border border-gray-300 px-[24px] py-[10px] text-sm font-sans hover:bg-gray-50"
            >
              キャンセル
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
