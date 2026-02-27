"use client";
import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";

interface Message {
  id: string;
  from: string;
  subject: string;
  date: string;
  read: boolean;
  preview: string;
}

export default function VendorMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    fetch("/api/vendor/inquiries")
      .then((res) => (res.ok ? res.json() : Promise.reject("API error")))
      .then((json) => {
        setMessages(
          (json.data || []).map((i: Record<string, unknown>) => ({
            id: i.id as string,
            from: (i.customer_name as string) || "ゲスト",
            subject: ((i.content as string) || "").slice(0, 30) || "お問い合わせ",
            date: typeof i.created_at === "string" ? (i.created_at as string).slice(0, 10) : "",
            read: (i.status as string) !== "pending",
            preview: (i.content as string) || "",
          }))
        );
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const unread = messages.filter((m) => !m.read).length;

  if (loading) return <div className="p-[24px]">読み込み中...</div>;

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
          {messages.map((m) => (
            <button
              key={m.id}
              onClick={() => { setSelected(m.id); setReplyText(""); }}
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
              const msg = messages.find((m) => m.id === selected);
              if (!msg) return null;
              return (
                <div>
                  <h2 className="font-serif text-lg mb-[4px]">{msg.subject}</h2>
                  <p className="text-xs text-gray-400 mb-[20px]">{msg.from} — {msg.date}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{msg.preview}</p>
                  <div className="mt-[24px]">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="返信を入力..."
                      className="w-full border border-gray-200 px-[12px] py-[10px] text-sm min-h-[100px] focus:border-accent focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        if (!replyText.trim()) return;
                        fetch(`/api/vendor/inquiries/${msg.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ reply: replyText, status: "responding" }),
                        })
                          .then((res) => (res.ok ? res.json() : Promise.reject("API error")))
                          .then(() => { alert("送信しました"); setReplyText(""); })
                          .catch(() => alert("送信に失敗しました"));
                      }}
                      className="mt-[8px] bg-black px-[24px] py-[10px] text-sm text-white hover:bg-gray-800"
                    >送信</button>
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
