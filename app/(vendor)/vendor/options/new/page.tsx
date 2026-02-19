"use client";
import VendorOptionForm from '@/components/vendor/VendorOptionForm';

export default function NewOptionPage() {
  return (
    <div>
      <div className="mb-[30px]">
        <p className="text-xs text-gray-400 mb-[4px]">オプション管理 &gt; 新規追加</p>
        <h1 className="font-serif font-light text-2xl">オプション新規追加</h1>
      </div>
      <div className="bg-white border border-gray-100 p-[24px]">
        <VendorOptionForm onSubmit={(data) => console.log('submit', data)} />
      </div>
    </div>
  );
}
