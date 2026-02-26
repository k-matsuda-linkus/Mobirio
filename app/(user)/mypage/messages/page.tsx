"use client";

import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";

interface MessageItem {
  id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  partnerId: string;
  lastMessage: string;
  lastTime: string;
  unread: boolean;
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}日前`;
  if (days < 30) return `${Math.floor(days / 7)}週間前`;
  return `${Math.floor(days / 30)}ヶ月前`;
}

export default function MessagesPage() {
  const [currentUserId, setCurrentUserId] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartner, setActivePartner] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, convRes] = await Promise.all([
          fetch("/api/user/profile"),
          fetch("/api/user/messages"),
        ]);
        const profileData = profileRes.ok ? await profileRes.json() : { data: null };
        const convData = convRes.ok ? await convRes.json() : { data: [] };

        const userId = profileData.data?.id || "";
        setCurrentUserId(userId);

        const rawMessages: MessageItem[] = convData.data || [];
        const convList: Conversation[] = rawMessages.map((msg) => {
          const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
          return {
            partnerId,
            lastMessage: msg.body,
            lastTime: msg.created_at,
            unread: !msg.is_read && msg.receiver_id === userId,
          };
        });

        setConversations(convList);
        if (convList.length > 0) {
          setActivePartner(convList[0].partnerId);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!activePartner) return;
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/user/messages?conversation_with=${activePartner}`);
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setMessages(data.data || []);
      } catch (error) {
        console.error("Failed to fetch conversation:", error);
      }
    };
    fetchMessages();
  }, [activePartner]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !activePartner || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/user/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiver_id: activePartner, body: inputValue.trim() }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      if (data.success && data.data) {
        setMessages((prev) => [...prev, data.data]);
        setInputValue("");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="font-serif text-2xl font-light text-black mb-[24px]">メッセージ</h1>
        <div className="h-[600px] bg-gray-50 animate-pulse border border-gray-100" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-light text-black mb-[24px]">メッセージ</h1>

      <div className="flex border border-gray-100 h-[600px]">
        {/* Left: Conversation list */}
        <div className="w-[280px] shrink-0 border-r border-gray-100 overflow-y-auto hidden md:block">
          {conversations.length === 0 ? (
            <div className="p-[16px] text-sm font-sans text-gray-400">メッセージはありません</div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.partnerId}
                onClick={() => setActivePartner(conv.partnerId)}
                className={`w-full text-left p-[16px] border-b border-gray-50 transition-colors ${
                  activePartner === conv.partnerId ? "bg-gray-50" : "hover:bg-gray-50/50"
                }`}
              >
                <div className="flex items-start justify-between gap-[8px]">
                  <p className={`text-sm font-sans truncate ${conv.unread ? "text-black font-medium" : "text-gray-700"}`}>
                    {conv.partnerId}
                  </p>
                  {conv.unread && <div className="w-[8px] h-[8px] bg-accent shrink-0 mt-[6px]" />}
                </div>
                <p className="text-xs font-sans text-gray-500 mt-[4px] truncate">{conv.lastMessage}</p>
                <p className="text-xs font-sans text-gray-400 mt-[2px]">{timeAgo(conv.lastTime)}</p>
              </button>
            ))
          )}
        </div>

        {/* Right: Message view */}
        <div className="flex-1 flex flex-col">
          {activePartner ? (
            <>
              {/* Header */}
              <div className="px-[20px] py-[14px] border-b border-gray-100 bg-gray-50/50">
                <p className="text-sm font-sans font-medium text-black">{activePartner}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-[20px] space-y-[16px]">
                {messages.map((msg) => {
                  const isUser = msg.sender_id === currentUserId;
                  return (
                    <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] p-[12px] ${
                        isUser
                          ? "bg-black text-white"
                          : "bg-gray-100 text-black"
                      }`}>
                        <p className="text-sm font-sans leading-relaxed">{msg.body}</p>
                        <p className={`text-xs font-sans mt-[6px] ${
                          isUser ? "text-gray-400" : "text-gray-500"
                        }`}>{timeAgo(msg.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-[16px] border-t border-gray-100">
                <div className="flex gap-[12px]">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder="メッセージを入力..."
                    className="flex-1 px-[14px] py-[10px] border border-gray-200 text-sm font-sans text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending}
                    className="px-[16px] py-[10px] bg-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
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
