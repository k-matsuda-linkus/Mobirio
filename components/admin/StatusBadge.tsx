type Variant = "success" | "danger" | "warning" | "info" | "neutral" | "default";

const variantStyles: Record<Variant, string> = {
  success: "bg-[#2D7D6F]/10 text-[#2D7D6F]",
  danger: "bg-red-50 text-red-600",
  warning: "bg-amber-50 text-amber-600",
  info: "bg-blue-50 text-blue-600",
  neutral: "bg-gray-100 text-gray-500",
  default: "bg-gray-100 text-gray-500",
};

/* --- preset status maps --- */

type VendorStatus = "pending_approval" | "active" | "suspended" | "banned";
type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
type InquiryStatus = "new" | "in_progress" | "resolved" | "closed";
type ReservationStatus = "pending" | "confirmed" | "in_use" | "returned" | "cancelled";

const vendorStatusMap: Record<VendorStatus, { label: string; variant: Variant }> = {
  pending_approval: { label: "承認待ち", variant: "warning" },
  active: { label: "有効", variant: "success" },
  suspended: { label: "停止中", variant: "danger" },
  banned: { label: "BAN", variant: "danger" },
};

const paymentStatusMap: Record<PaymentStatus, { label: string; variant: Variant }> = {
  pending: { label: "未処理", variant: "warning" },
  completed: { label: "完了", variant: "success" },
  failed: { label: "失敗", variant: "danger" },
  refunded: { label: "返金済", variant: "info" },
};

const inquiryStatusMap: Record<InquiryStatus, { label: string; variant: Variant }> = {
  new: { label: "新規", variant: "info" },
  in_progress: { label: "対応中", variant: "warning" },
  resolved: { label: "解決済", variant: "success" },
  closed: { label: "クローズ", variant: "neutral" },
};

const reservationStatusMap: Record<ReservationStatus, { label: string; variant: Variant }> = {
  pending: { label: "予約待ち", variant: "warning" },
  confirmed: { label: "確定", variant: "info" },
  in_use: { label: "利用中", variant: "success" },
  returned: { label: "返却済", variant: "neutral" },
  cancelled: { label: "キャンセル", variant: "danger" },
};

/* --- component --- */

interface StatusBadgeProps {
  status: string;
  variant?: Variant;
  category?: "vendor" | "payment" | "inquiry" | "reservation";
}

export function StatusBadge({ status, variant, category }: StatusBadgeProps) {
  let resolvedLabel = status;
  let resolvedVariant: Variant = variant ?? "neutral";

  if (category === "vendor" && status in vendorStatusMap) {
    const mapped = vendorStatusMap[status as VendorStatus];
    resolvedLabel = mapped.label;
    resolvedVariant = variant ?? mapped.variant;
  } else if (category === "payment" && status in paymentStatusMap) {
    const mapped = paymentStatusMap[status as PaymentStatus];
    resolvedLabel = mapped.label;
    resolvedVariant = variant ?? mapped.variant;
  } else if (category === "inquiry" && status in inquiryStatusMap) {
    const mapped = inquiryStatusMap[status as InquiryStatus];
    resolvedLabel = mapped.label;
    resolvedVariant = variant ?? mapped.variant;
  } else if (category === "reservation" && status in reservationStatusMap) {
    const mapped = reservationStatusMap[status as ReservationStatus];
    resolvedLabel = mapped.label;
    resolvedVariant = variant ?? mapped.variant;
  }

  return (
    <span
      className={`inline-block px-[10px] py-[3px] text-xs font-medium ${variantStyles[resolvedVariant]}`}
    >
      {resolvedLabel}
    </span>
  );
}
