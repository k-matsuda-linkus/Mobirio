"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [passwords, setPasswords] = useState({ current: "", new_pw: "", confirm: "" });
  const [notifSettings, setNotifSettings] = useState({
    email_reservation: true,
    email_review: true,
    email_campaign: false,
    push_reservation: true,
    push_message: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (data.data) {
          setProfile({
            name: data.data.full_name || "",
            email: data.data.email || "",
            phone: data.data.phone || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: profile.name, phone: profile.phone }),
      });
      if (!res.ok && res.status >= 500) throw new Error("Server error");
      const data = await res.json();
      if (data.success) {
        setSaveMessage("プロフィールを保存しました");
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        alert(data.message || "保存に失敗しました");
      }
    } catch {
      alert("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new_pw !== passwords.confirm) {
      alert("新しいパスワードが一致しません");
      return;
    }
    if (passwords.new_pw.length < 8) {
      alert("パスワードは8文字以上で入力してください");
      return;
    }
    setIsChangingPw(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwords.new_pw }),
      });
      if (!res.ok && res.status >= 500) throw new Error("Server error");
      const data = await res.json();
      if (data.success) {
        alert("パスワードを変更しました");
        setPasswords({ current: "", new_pw: "", confirm: "" });
      } else {
        alert(data.message || "パスワードの変更に失敗しました");
      }
    } catch {
      alert("パスワードの変更に失敗しました");
    } finally {
      setIsChangingPw(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("本当にアカウントを削除しますか？この操作は取り消せません。")) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/user/account", { method: "DELETE" });
      if (!res.ok && res.status >= 500) throw new Error("Server error");
      const data = await res.json();
      if (data.success) {
        router.push("/login");
      } else {
        alert(data.message || "退会処理に失敗しました");
      }
    } catch {
      alert("退会処理に失敗しました");
    } finally {
      setIsDeleting(false);
    }
  };

  const inputClass = "w-full px-[14px] py-[12px] border border-gray-200 text-sm font-sans text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors";

  if (loading) {
    return (
      <div className="max-w-[640px]">
        <h1 className="font-serif text-2xl font-light text-black mb-[32px]">設定</h1>
        <div className="space-y-[20px]">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[48px] bg-gray-50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[640px]">
      <h1 className="font-serif text-2xl font-light text-black mb-[32px]">設定</h1>

      {/* Profile Section */}
      <section className="mb-[40px]">
        <h2 className="font-serif text-lg font-light text-black mb-[20px] pb-[12px] border-b border-gray-100">
          プロフィール
        </h2>
        <form onSubmit={handleProfileSave} className="space-y-[16px]">
          <div>
            <label className="block text-sm font-sans text-gray-600 mb-[6px]">お名前</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-sans text-gray-600 mb-[6px]">メールアドレス</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className={`${inputClass} bg-gray-50 text-gray-400`}
            />
          </div>
          <div>
            <label className="block text-sm font-sans text-gray-600 mb-[6px]">電話番号</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-[12px]">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-black text-white px-[24px] py-[12px] text-sm font-sans font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
              {isSaving ? "保存中..." : "プロフィールを保存"}
            </button>
            {saveMessage && (
              <span className="text-sm font-sans text-status-confirmed">{saveMessage}</span>
            )}
          </div>
        </form>
      </section>

      {/* Password Section */}
      <section className="mb-[40px]">
        <h2 className="font-serif text-lg font-light text-black mb-[20px] pb-[12px] border-b border-gray-100">
          パスワード変更
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-[16px]">
          <div>
            <label className="block text-sm font-sans text-gray-600 mb-[6px]">現在のパスワード</label>
            <input
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-sans text-gray-600 mb-[6px]">新しいパスワード</label>
            <input
              type="password"
              value={passwords.new_pw}
              onChange={(e) => setPasswords({ ...passwords, new_pw: e.target.value })}
              minLength={8}
              placeholder="8文字以上"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-sans text-gray-600 mb-[6px]">新しいパスワード（確認）</label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={isChangingPw}
            className="bg-black text-white px-[24px] py-[12px] text-sm font-sans font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
          >
            {isChangingPw ? "変更中..." : "パスワードを変更"}
          </button>
        </form>
      </section>

      {/* Notification Settings */}
      <section className="mb-[40px]">
        <h2 className="font-serif text-lg font-light text-black mb-[20px] pb-[12px] border-b border-gray-100">
          通知設定
        </h2>
        <div className="space-y-[16px]">
          <h3 className="text-sm font-sans font-medium text-black">メール通知</h3>
          {[
            { key: "email_reservation", label: "予約に関する通知" },
            { key: "email_review", label: "レビュー依頼" },
            { key: "email_campaign", label: "キャンペーン・お知らせ" },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between cursor-pointer py-[8px]">
              <span className="text-sm font-sans text-gray-600">{item.label}</span>
              <button
                type="button"
                onClick={() =>
                  setNotifSettings((prev) => ({
                    ...prev,
                    [item.key]: !prev[item.key as keyof typeof prev],
                  }))
                }
                className={`relative w-[44px] h-[24px] transition-colors ${
                  notifSettings[item.key as keyof typeof notifSettings]
                    ? "bg-accent"
                    : "bg-gray-200"
                }`}
              >
                <div
                  className={`absolute top-[2px] w-[20px] h-[20px] bg-white transition-transform ${
                    notifSettings[item.key as keyof typeof notifSettings]
                      ? "left-[22px]"
                      : "left-[2px]"
                  }`}
                />
              </button>
            </label>
          ))}
          <h3 className="text-sm font-sans font-medium text-black pt-[8px]">プッシュ通知</h3>
          {[
            { key: "push_reservation", label: "予約ステータスの変更" },
            { key: "push_message", label: "新着メッセージ" },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between cursor-pointer py-[8px]">
              <span className="text-sm font-sans text-gray-600">{item.label}</span>
              <button
                type="button"
                onClick={() =>
                  setNotifSettings((prev) => ({
                    ...prev,
                    [item.key]: !prev[item.key as keyof typeof prev],
                  }))
                }
                className={`relative w-[44px] h-[24px] transition-colors ${
                  notifSettings[item.key as keyof typeof notifSettings]
                    ? "bg-accent"
                    : "bg-gray-200"
                }`}
              >
                <div
                  className={`absolute top-[2px] w-[20px] h-[20px] bg-white transition-transform ${
                    notifSettings[item.key as keyof typeof notifSettings]
                      ? "left-[22px]"
                      : "left-[2px]"
                  }`}
                />
              </button>
            </label>
          ))}
        </div>
      </section>

      {/* Danger Zone */}
      <section className="mb-[40px]">
        <h2 className="font-serif text-lg font-light text-status-cancelled mb-[20px] pb-[12px] border-b border-gray-100">
          アカウント削除
        </h2>
        <p className="text-sm font-sans text-gray-600 mb-[16px] leading-relaxed">
          アカウントを削除すると、すべてのデータが完全に削除されます。この操作は取り消せません。
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={isDeleting}
          className="border border-status-cancelled text-status-cancelled px-[24px] py-[12px] text-sm font-sans font-medium hover:bg-status-cancelled/5 transition-colors disabled:opacity-50"
        >
          {isDeleting ? "処理中..." : "アカウントを削除する"}
        </button>
      </section>
    </div>
  );
}
