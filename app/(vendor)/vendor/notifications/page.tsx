"use client";

import { useState, useEffect } from "react";

interface Notification {
  id: string;
  title: string;
  body: string;
  created_at: string;
  timestamp?: string;
  is_read: boolean;
}

export default function VendorNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : Promise.reject("API error")))
      .then((json) => setNotifications(json.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = (id: string) => {
    fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
      .then((res) => {
        if (res.ok) {
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
          );
        }
      })
      .catch((err) => console.error(err));
  };

  if (loading) return <div className="p-[24px]">読み込み中...</div>;

  return (
    <div>
      <h1 className="font-serif text-2xl font-light mb-[24px]">通知</h1>
      <div className="space-y-[1px]">
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => { if (!n.is_read) handleMarkRead(n.id); }}
            className={"bg-white border border-gray-100 p-[16px] cursor-pointer hover:bg-gray-50" + (!n.is_read ? " border-l-[3px] border-l-accent" : "")}
          >
            <p className={"text-sm" + (!n.is_read ? " font-medium" : "")}>{n.title}</p>
            <p className="text-sm text-gray-500 mt-[2px]">{n.body}</p>
            <p className="text-xs text-gray-300 mt-[4px]">{n.created_at || n.timestamp}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
