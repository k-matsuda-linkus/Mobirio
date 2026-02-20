import { RichTooltip } from "./RichTooltip";

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-accent/10 text-accent",
  unconfirmed: "bg-orange-100 text-orange-700",
  pending: "bg-gray-200 text-gray-700",
  responding: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  published: "bg-accent/10 text-accent",
  unpublished: "bg-gray-100 text-gray-400",
  active: "bg-accent/10 text-accent",
  inactive: "bg-gray-100 text-gray-400",
  in_use: "bg-black text-white",
  completed: "bg-gray-100 text-gray-500",
  cancelled: "bg-gray-100 text-gray-400",
  no_show: "bg-gray-300 text-gray-600",
  development: "bg-orange-100 text-orange-600",
  insurance_none: "bg-gray-100 text-gray-400",
  insurance_applying: "bg-amber-100 text-amber-700",
  insurance_active: "bg-accent/10 text-accent",
  insurance_cancelling: "bg-red-100 text-red-600",
  insurance_cancelled: "bg-gray-200 text-gray-500",
  archived: "bg-gray-200 text-gray-500",
  // 決済ステータス (PaymentStatus)
  pay_pending: "bg-orange-100 text-orange-700",
  pay_completed: "bg-accent/10 text-accent",
  pay_failed: "bg-red-100 text-red-600",
  pay_refunded: "bg-gray-200 text-gray-500",
  pay_partially_refunded: "bg-amber-100 text-amber-700",
  // 決済状況 (PaymentSettlement)
  unpaid: "bg-orange-100 text-orange-700",
  partial: "bg-blue-100 text-blue-700",
  paid: "bg-accent/10 text-accent",
  refunded: "bg-gray-200 text-gray-500",
  // 車検・法定点検ステータス
  inspection_expired: "bg-red-100 text-red-600",
  inspection_expiring: "bg-orange-100 text-orange-700",
  inspection_ok: "bg-accent/10 text-accent",
  // クーポンステータス
  coupon_active: "bg-accent/10 text-accent",
  coupon_scheduled: "bg-blue-100 text-blue-700",
  coupon_expired: "bg-gray-200 text-gray-500",
  coupon_disabled: "bg-gray-100 text-gray-400",
  coupon_exhausted: "bg-orange-100 text-orange-700",
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "確定済",
  unconfirmed: "未確定",
  pending: "未対応",
  responding: "対応中",
  resolved: "完了",
  published: "公開中",
  unpublished: "非公開",
  active: "加入中",
  inactive: "停止中",
  in_use: "利用中",
  completed: "完了",
  cancelled: "キャンセル",
  no_show: "ノーショー",
  development: "開発中",
  insurance_none: "未加入",
  insurance_applying: "申込中",
  insurance_active: "加入中",
  insurance_cancelling: "解約申請中",
  insurance_cancelled: "解約済",
  archived: "アーカイブ",
  // 決済ステータス (PaymentStatus)
  pay_pending: "未決済",
  pay_completed: "決済完了",
  pay_failed: "決済失敗",
  pay_refunded: "返金済",
  pay_partially_refunded: "一部返金",
  // 決済状況 (PaymentSettlement)
  unpaid: "未決済",
  partial: "一部決済",
  paid: "決済済",
  refunded: "返金済",
  // 車検・法定点検ステータス
  inspection_expired: "期限切れ",
  inspection_expiring: "期限間近",
  inspection_ok: "有効",
  // クーポンステータス
  coupon_active: "配布中",
  coupon_scheduled: "配布予定",
  coupon_expired: "期限切れ",
  coupon_disabled: "停止中",
  coupon_exhausted: "枚数到達",
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  confirmed: "ベンダーが予約を承認済み。利用日を待つ状態",
  unconfirmed: "ユーザーが予約申請したが、ベンダーがまだ承認していない状態",
  pending: "未対応の問い合わせ",
  responding: "対応中の問い合わせ",
  resolved: "対応が完了した問い合わせ",
  published: "予約サイトに公開中",
  unpublished: "予約サイトに表示されていない状態",
  active: "有効",
  inactive: "停止中",
  in_use: "出発済みで、現在バイクを利用中",
  completed: "バイクが返却され、レンタル完了",
  cancelled: "ユーザーまたはベンダーにより予約がキャンセルされた",
  no_show: "予約日にユーザーが来店しなかった",
  development: "現在開発中の機能",
  insurance_none: "任意保険に未加入の状態",
  insurance_applying: "保険会社に加入申込中。手続き完了待ち",
  insurance_active: "任意保険に加入済み。車両を公開可能",
  insurance_cancelling: "保険会社に解約を申請中",
  insurance_cancelled: "任意保険を解約済み。車両は非公開",
  archived: "保険解約等によりアーカイブされた車両",
  // 決済ステータス (PaymentStatus)
  pay_pending: "決済処理がまだ行われていない",
  pay_completed: "決済が正常に完了した",
  pay_failed: "決済処理に失敗した",
  pay_refunded: "全額が返金された",
  pay_partially_refunded: "一部金額が返金された",
  // 決済状況 (PaymentSettlement)
  unpaid: "この予約の決済はまだ行われていない",
  partial: "一部の金額のみ決済済み",
  paid: "全額が決済完了",
  refunded: "決済金額が返金された",
  // 車検・法定点検ステータス
  inspection_expired: "車検の有効期限が切れています。速やかに車検を受けてください",
  inspection_expiring: "車検の有効期限が30日以内に迫っています",
  inspection_ok: "車検の有効期限内です",
  // クーポンステータス
  coupon_active: "有効期間内で配布中のクーポン",
  coupon_scheduled: "有効期間の開始前のクーポン",
  coupon_expired: "有効期限が切れたクーポン",
  coupon_disabled: "手動で停止されたクーポン",
  coupon_exhausted: "利用上限に達したクーポン",
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600";
  const text = label ?? STATUS_LABELS[status] ?? status;
  const description = STATUS_DESCRIPTIONS[status];

  const badge = (
    <span
      className={"inline-block text-xs px-[8px] py-[2px] whitespace-nowrap cursor-default " + style}
    >
      {text}
    </span>
  );

  if (description) {
    return <RichTooltip text={description}>{badge}</RichTooltip>;
  }

  return badge;
}
