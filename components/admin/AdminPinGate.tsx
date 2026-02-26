"use client";

import { useState, useEffect, useRef } from "react";
import { Lock } from "lucide-react";

const ADMIN_PIN = "5689";
const STORAGE_KEY = "mobirio_admin_unlocked";

export function AdminPinGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    setUnlocked(stored === "true");
  }, []);

  // 初回レンダリング中（SSR/hydration）は何も表示しない
  if (unlocked === null) {
    return null;
  }

  if (unlocked) {
    return <>{children}</>;
  }

  function handleChange(index: number, value: string) {
    // 数字のみ許可
    if (value && !/^\d$/.test(value)) return;

    const next = [...pin];
    next[index] = value;
    setPin(next);
    setError(false);

    // 次のフィールドへ自動フォーカス
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // 4桁揃ったら検証
    if (value && index === 3) {
      const entered = next.join("");
      if (entered === ADMIN_PIN) {
        sessionStorage.setItem(STORAGE_KEY, "true");
        setUnlocked(true);
      } else {
        setError(true);
        setPin(["", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted.length === 4) {
      const digits = pasted.split("") as [string, string, string, string];
      setPin(digits);
      if (pasted === ADMIN_PIN) {
        sessionStorage.setItem(STORAGE_KEY, "true");
        setUnlocked(true);
      } else {
        setError(true);
        setPin(["", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80">
      <div className="bg-white p-[40px] shadow-lg w-[360px] text-center">
        <div className="flex justify-center mb-[20px]">
          <div className="w-[56px] h-[56px] bg-gray-100 flex items-center justify-center">
            <Lock className="w-[28px] h-[28px] text-gray-600" />
          </div>
        </div>
        <h2 className="text-[18px] font-bold text-gray-900 mb-[8px]">管理画面</h2>
        <p className="text-[14px] text-gray-500 mb-[24px]">4桁のパスワードを入力してください</p>

        <div className="flex justify-center gap-[12px] mb-[20px]" onPaste={handlePaste}>
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              autoFocus={i === 0}
              className={`w-[48px] h-[56px] text-center text-[24px] font-bold border-[2px] outline-none transition-colors ${
                error
                  ? "border-red-400 bg-red-50"
                  : "border-gray-300 focus:border-blue-500"
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-[13px] text-red-500">パスワードが正しくありません</p>
        )}
      </div>
    </div>
  );
}
