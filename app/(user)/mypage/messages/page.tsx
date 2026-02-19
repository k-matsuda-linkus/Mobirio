"use client";

import { useState } from "react";
import { Send } from "lucide-react";

const CONVERSATIONS = [
  {
    id: "conv-001",
    vendor: "サンシャインモータース宮崎",
    lastMessage: "ご予約ありがとうございます。当日お待ちしております。",
    time: "2時間前",
    unread: true,
    messages: [
      { id: 1, sender: "user", text: "2月15日の予約について確認させてください。受取場所は店舗でよろしいでしょうか？", time: "3時間前" },
      { id: 2, sender: "vendor", text: "はい、店舗での受取となります。宮崎市橘通西3-1-1までお越しください。駐車場もございます。", time: "2時間半前" },
      { id: 3, sender: "user", text: "ありがとうございます。当日よろしくお願いいたします。", time: "2時間前" },
      { id: 4, sender: "vendor", text: "ご予約ありがとうございます。当日お待ちしております。", time: "2時間前" },
    ],
  },
  {
    id: "conv-002",
    vendor: "青島バイクレンタル",
    lastMessage: "承知いたしました。ヘルメットは無料でお貸しいたします。",
    time: "1日前",
    unread: false,
    messages: [
      { id: 1, sender: "user", text: "ヘルメットのレンタルは可能でしょうか？", time: "1日前" },
      { id: 2, sender: "vendor", text: "承知いたしました。ヘルメットは無料でお貸しいたします。", time: "1日前" },
    ],
  },
  {
    id: "conv-003",
    vendor: "ライドパーク日南",
    lastMessage: "レビューの投稿ありがとうございます！またのご利用をお待ちしております。",
    time: "1週間前",
    unread: false,
    messages: [
      { id: 1, sender: "vendor", text: "レビューの投稿ありがとうございます！またのご利用をお待ちしております。", time: "1週間前" },
    ],
  },
];

export default function MessagesPage() {
  const [activeConv, setActiveConv] = useState(CONVERSATIONS[0].id);
  const [inputValue, setInputValue] = useState("");

  const conversation = CONVERSATIONS.find((c) => c.id === activeConv);

  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-black mb-[24px]">メッセージ</h1>

      <div className="flex border border-gray-100 h-[600px]">
        {/* Left: Conversation list */}
        <div className="w-[280px] shrink-0 border-r border-gray-100 overflow-y-auto hidden md:block">
          {CONVERSATIONS.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveConv(conv.id)}
              className={`w-full text-left p-[16px] border-b border-gray-50 transition-colors ${
                activeConv === conv.id ? "bg-gray-50" : "hover:bg-gray-50/50"
              }`}
            >
              <div className="flex items-start justify-between gap-[8px]">
                <p className={`text-sm font-sans truncate ${conv.unread ? "text-black font-medium" : "text-gray-700"}`}>
                  {conv.vendor}
                </p>
                {conv.unread && <div className="w-[8px] h-[8px] bg-accent shrink-0 mt-[6px]" />}
              </div>
              <p className="text-xs font-sans text-gray-500 mt-[4px] truncate">{conv.lastMessage}</p>
              <p className="text-xs font-sans text-gray-400 mt-[2px]">{conv.time}</p>
            </button>
          ))}
        </div>

        {/* Right: Message view */}
        <div className="flex-1 flex flex-col">
          {conversation ? (
            <>
              {/* Header */}
              <div className="px-[20px] py-[14px] border-b border-gray-100 bg-gray-50/50">
                <p className="text-sm font-sans font-medium text-black">{conversation.vendor}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-[20px] space-y-[16px]">
                {conversation.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] p-[12px] ${
                      msg.sender === "user"
                        ? "bg-black text-white"
                        : "bg-gray-100 text-black"
                    }`}>
                      <p className="text-sm font-sans leading-relaxed">{msg.text}</p>
                      <p className={`text-xs font-sans mt-[6px] ${
                        msg.sender === "user" ? "text-gray-400" : "text-gray-500"
                      }`}>{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="p-[16px] border-t border-gray-100">
                <div className="flex gap-[12px]">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="メッセージを入力..."
                    className="flex-1 px-[14px] py-[10px] border border-gray-200 text-sm font-sans text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
                  />
                  <button className="px-[16px] py-[10px] bg-accent text-white hover:opacity-90 transition-opacity">
                    <Send className="w-[18px] h-[18px]" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm font-sans text-gray-400">会話を選択してください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
