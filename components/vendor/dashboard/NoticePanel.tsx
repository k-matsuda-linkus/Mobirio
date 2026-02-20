"use client";

import Link from "next/link";

export interface Notice {
  id: string;
  date: string;
  title: string;
  isNew?: boolean;
}

interface NoticePanelProps {
  notices: Notice[];
}

export function NoticePanel({ notices }: NoticePanelProps) {
  return (
    <div className="bg-white border border-gray-200 p-[20px]">
      <h3 className="text-[16px] font-medium mb-[16px]">お知らせ</h3>
      <div className="space-y-[10px]">
        {notices.map((notice) => (
          <div
            key={notice.id}
            className="border-b border-gray-100 pb-[8px] last:border-b-0"
          >
            <div className="flex items-center gap-[8px]">
              <span className="text-[12px] text-gray-400">{notice.date}</span>
              {notice.isNew && (
                <span className="bg-red-500 text-white text-[10px] px-[6px] leading-[18px] font-medium">
                  NEW
                </span>
              )}
            </div>
            <p className="text-[13px] text-gray-700 mt-[2px]">
              {notice.title}
            </p>
          </div>
        ))}
      </div>
      <Link
        href="/vendor/announcements"
        className="inline-block mt-[12px] text-[12px] text-accent hover:underline"
      >
        すべて表示 →
      </Link>
    </div>
  );
}
