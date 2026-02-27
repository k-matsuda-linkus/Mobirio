"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Loader2 } from "lucide-react";

interface UserRow {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  role: string;
  is_banned: boolean;
  created_at: string;
}

const rl = (r: string) => {
  if (r === "admin") return { label: "管理者", variant: "info" as const };
  if (r === "vendor") return { label: "ベンダー", variant: "warning" as const };
  return { label: "ユーザー", variant: "default" as const };
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [rf, setRf] = useState("");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (rf) params.set("role", rf);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        setError("ユーザーデータの取得に失敗しました");
        setLoading(false);
        return;
      }
      if (json.data) setUsers(json.data);
    } catch (error) {
      console.error("Users fetch error:", error);
      setError("ユーザーデータの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [rf, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAction = async (userId: string, action: "ban" | "unban") => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchUsers();
      }
    } catch (error) {
      console.error("User action error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-[80px]">
        <Loader2 className="w-[24px] h-[24px] animate-spin text-gray-400" />
        <span className="ml-[8px] text-sm text-gray-500">読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-[80px]">
        <span className="text-sm text-red-500">{error}</span>
      </div>
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
            render: (u) => {
              const raw = u as unknown as UserRow;
              return (
                <Link href={"/dashboard/users/" + raw.id} className="text-accent hover:underline">
                  {raw.full_name || raw.email}
                </Link>
              );
            },
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
          {
            key: "created_at",
            label: "登録日",
            render: (u) => <span>{String(u.created_at).slice(0, 10)}</span>,
          },
          {
            key: "status",
            label: "ステータス",
            render: (u) => {
              const raw = u as unknown as UserRow;
              return (
                <StatusBadge
                  status={raw.is_banned ? "BAN" : "有効"}
                  variant={raw.is_banned ? "danger" : "success"}
                />
              );
            },
          },
          {
            key: "action",
            label: "操作",
            render: (u) => {
              const raw = u as unknown as UserRow;
              const isLoading = actionLoading === raw.id;
              return (
                <div className="flex gap-[4px]">
                  {raw.is_banned ? (
                    <button
                      onClick={() => handleAction(raw.id, "unban")}
                      disabled={isLoading}
                      className="border border-accent text-accent px-[10px] py-[4px] text-xs hover:bg-accent/5 disabled:opacity-50"
                    >
                      BAN解除
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction(raw.id, "ban")}
                      disabled={isLoading}
                      className="border border-red-400 text-red-500 px-[10px] py-[4px] text-xs hover:bg-red-50 disabled:opacity-50"
                    >
                      BAN
                    </button>
                  )}
                </div>
              );
            },
          },
        ]}
        data={users as unknown as Record<string, unknown>[]}
      />
    </div>
  );
}
