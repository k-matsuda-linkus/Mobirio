'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs text-gray-500 mb-[6px]">{label}</label>
        )}
        <input
          ref={ref}
          className={`w-full border border-gray-200 py-[12px] px-[16px] text-sm focus:border-black focus:outline-none transition-colors ${error ? 'border-red-500' : ''} ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-500 mt-[4px]">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
