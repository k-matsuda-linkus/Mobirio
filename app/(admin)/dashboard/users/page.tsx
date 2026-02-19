"use client";
import { useState } from "react";
import Link from "next/link";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { mockUsers } from "@/lib/mock/users";
import { mockReservations } from "@/lib/mock/reservations";

const users = mockUsers.map((u) => {
  const userRes = mockReservations.filter((r) => r.user_id === u.id);
  return {
    id: u.id,
    name: u.full_name || u.email,
    email: u.email,
    role: u.role,
    registered: u.created_at,
    reservations: userRes.length,
    status: u.is_banned ? "banned" : "active",
  };
});

const rl = (r: string) => {
  if (r === "admin") return { label: "管理者", variant: "info" as const };
  if (r === "vendor") return { label: "ベンダー", variant: "warning" as const };
  return { label: "ユーザー", variant: "default" as const };
};

export default function UsersPage() {
  const [rf, setRf] = useState("");
  const [search, setSearch] = useState("");
  let filtered = rf ? users.filter((u) => u.role === rf) : users;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-light mb-[24px]">ユーザー管理</h1>
      <AdminFilterBar
        searchPlaceholder="名前・メールで検索..."
        onSearch={setSearch}
        filters={[
          {
            label: "ロール",
            options: [
              { value: "customer", label: "ユーザー" },
              { value: "vendor", label: "ベンダー" },
              { value: "admin", label: "管理者" },
            ],
            value: rf,
            onChange: setRf,
          },
        ]}
      />
      <AdminTable
        columns={[
          {
            key: "name",
            label: "名前",
            render: (u) => (
              <Link
                href={"/dashboard/users/" + u.id}
                className="text-accent hover:underline"
              >
                {String(u.name)}
              </Link>
            ),
          },
          { key: "email", label: "メール" },
          {
            key: "role",
            label: "ロール",
            render: (u) => {
              const r = rl(String(u.role));
              return <StatusBadge status={r.label} variant={r.variant} />;
            },
          },
          { key: "registered", label: "登録日" },
          { key: "reservations", label: "予約数" },
          {
            key: "status",
            label: "ステータス",
            render: (u) => (
              <StatusBadge
                status={u.status === "active" ? "有効" : "BAN"}
                variant={u.status === "active" ? "success" : "danger"}
              />
            ),
          },
        ]}
        data={filtered}
      />
    </div>
  );
}
