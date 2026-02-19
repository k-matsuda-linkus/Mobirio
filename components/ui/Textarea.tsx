'use client';

import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, rows = 4, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs text-gray-500 mb-[6px]">{label}</label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={`w-full border border-gray-200 py-[12px] px-[16px] text-sm focus:border-black focus:outline-none transition-colors resize-vertical ${error ? 'border-red-500' : ''} ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-500 mt-[4px]">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
