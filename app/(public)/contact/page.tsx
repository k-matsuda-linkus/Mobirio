"use client";

import { useState } from "react";

const CATEGORIES = [
  { value: "", label: "選択してください" },
  { value: "一般的なお問い合わせ", label: "一般的なお問い合わせ" },
  { value: "予約について", label: "予約について" },
  { value: "ベンダー出店について", label: "ベンダー出店について" },
  { value: "トラブル・苦情", label: "トラブル・苦情" },
  { value: "その他", label: "その他" },
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !subject || !message.trim()) {
      setError("すべての項目を入力してください");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), subject, message: message.trim() }),
      });
      if (!res.ok && res.status >= 500) throw new Error("Server error");
      const data = await res.json();
      if (data.success) {
        setSent(true);
      } else {
        const errorMsg = data.errors?.join("、") || data.message || "送信に失敗しました";
        setError(errorMsg);
      }
    } catch {
      setError("送信に失敗しました。しばらくしてからお試しください。");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="py-[50px] md:py-[100px]">
        <div className="max-w-[600px] mx-auto px-[30px] md:px-[50px] text-center">
          <h1 className="font-serif font-light text-3xl md:text-4xl mb-[24px]">送信完了</h1>
          <p className="text-sm font-sans text-gray-600 leading-relaxed mb-[32px]">
            お問い合わせいただきありがとうございます。<br />
            内容を確認の上、ご連絡いたします。
          </p>
          <a
            href="/"
            className="inline-block bg-black text-white px-[32px] py-[14px] text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            トップページへ戻る
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="py-[50px] md:py-[100px]">
      <div className="max-w-[600px] mx-auto px-[30px] md:px-[50px]">
        <h1 className="font-serif font-light text-3xl md:text-4xl mb-[30px]">お問い合わせ</h1>

        {error && (
          <div className="mb-[20px] p-[14px] bg-red-50 border border-red-200 text-sm font-sans text-red-600">
            {error}
          </div>
        )}

        <form className="space-y-[20px]" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-[6px]">お名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 px-[14px] py-[12px] text-sm focus:border-black focus:outline-none"
              placeholder="田中太郎"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-[6px]">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 px-[14px] py-[12px] text-sm focus:border-black focus:outline-none"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-[6px]">カテゴリ</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-gray-200 px-[14px] py-[12px] text-sm focus:border-black focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-[6px]">お問い合わせ内容</label>
            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-gray-200 px-[14px] py-[12px] text-sm focus:border-black focus:outline-none resize-none"
              placeholder="お問い合わせ内容をご記入ください"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="w-full bg-black text-white py-[14px] text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {sending ? "送信中..." : "送信する"}
          </button>
        </form>
      </div>
    </div>
  );
}
