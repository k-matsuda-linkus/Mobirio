'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
}

const typeClasses = {
  success: 'bg-emerald-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-black text-white',
};

export function Toast({ message, type = 'info', isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-[20px] right-[20px] z-50 flex items-center gap-[12px] px-[20px] py-[14px] text-sm shadow-lg ${typeClasses[type]}`}>
      <span>{message}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );
}
