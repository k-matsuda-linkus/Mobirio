'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs text-gray-500 mb-[6px]">{label}</label>
        )}
        <select
          ref={ref}
          className={`w-full border border-gray-200 py-[12px] px-[16px] text-sm focus:border-black focus:outline-none transition-colors bg-white ${error ? 'border-red-500' : ''} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-500 mt-[4px]">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
