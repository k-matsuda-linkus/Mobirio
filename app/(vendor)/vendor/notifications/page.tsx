const notifications = [
  { id: "1", title: "新規予約", message: "田中太郎さんがMT-09 SPを予約しました。", date: "2026-02-01", read: false },
  { id: "2", title: "レビュー投稿", message: "鈴木花子さんがレビューを投稿しました。", date: "2026-01-30", read: true },
];

export default function VendorNotificationsPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-light mb-[24px]">通知</h1>
      <div className="space-y-[1px]">
        {notifications.map((n) => (
          <div key={n.id} className={"bg-white border border-gray-100 p-[16px]" + (!n.read ? " border-l-[3px] border-l-[#2D7D6F]" : "")}>
            <p className={"text-sm" + (!n.read ? " font-medium" : "")}>{n.title}</p>
            <p className="text-sm text-gray-500 mt-[2px]">{n.message}</p>
            <p className="text-xs text-gray-300 mt-[4px]">{n.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
