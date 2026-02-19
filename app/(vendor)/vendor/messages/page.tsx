"use client";
import { useState } from "react";
import { MessageSquare } from "lucide-react";

const mockMessages = [
  { id: "m-001", from: "田中太郎", subject: "PCX 125の予約について", date: "2025-02-01", read: true, preview: "予約日を変更したいのですが..." },
  { id: "m-002", from: "佐藤花子", subject: "ヘルメットのサイズ", date: "2025-01-30", read: true, preview: "Mサイズのヘルメットはありますか？" },
  { id: "m-003", from: "鈴木一郎", subject: "Ninja400の返却時間", date: "2025-01-28", read: false, preview: "返却時間を1時間遅らせたいです。" },
  { id: "m-004", from: "高橋美咲", subject: "レビューのお礼", date: "2025-01-25", read: true, preview: "素敵な体験をありがとうございました！" },
  { id: "m-005", from: "渡辺健太", subject: "保険オプションについて", date: "2025-01-22", read: false, preview: "CDWの補償内容を教えてください。" },
];

export default function VendorMessagesPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const unread = mockMessages.filter((m) => !m.read).length;

  return (
    <div>
      <div className="mb-[24px] flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-light">メッセージ</h1>
          {unread > 0 && <p className="text-sm text-gray-500 mt-[4px]">未読 {unread} 件</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border border-gray-100 bg-white">
        <div className="lg:col-span-1 border-r border-gray-100">
          {mockMessages.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className={"w-full text-left px-[16px] py-[14px] border-b border-gray-50 hover:bg-gray-50 transition-colors " + (selected === m.id ? "bg-gray-50" : "") + (!m.read ? " font-medium" : "")}
            >
              <div className="flex items-center justify-between mb-[2px]">
                <span className={"text-sm " + (!m.read ? "text-black" : "text-gray-700")}>{m.from}</span>
                <span className="text-[10px] text-gray-400">{m.date}</span>
              </div>
              <p className={"text-xs truncate " + (!m.read ? "text-gray-700" : "text-gray-400")}>{m.subject}</p>
              <p className="text-xs text-gray-300 truncate mt-[2px]">{m.preview}</p>
            </button>
          ))}
        </div>
        <div className="lg:col-span-2 p-[24px]">
          {selected ? (
            (() => {
              const msg = mockMessages.find((m) => m.id === selected);
              if (!msg) return null;
              return (
                <div>
                  <h2 className="font-serif text-lg mb-[4px]">{msg.subject}</h2>
                  <p className="text-xs text-gray-400 mb-[20px]">{msg.from} — {msg.date}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{msg.preview}</p>
                  <div className="mt-[24px]">
                    <textarea
                      placeholder="返信を入力..."
                      className="w-full border border-gray-200 px-[12px] py-[10px] text-sm min-h-[100px] focus:border-[#2D7D6F] focus:outline-none"
                    />
                    <button className="mt-[8px] bg-black px-[24px] py-[10px] text-sm text-white hover:bg-gray-800">送信</button>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-300">
              <MessageSquare className="w-[40px] h-[40px] mb-[12px]" />
              <p className="text-sm">メッセージを選択してください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
