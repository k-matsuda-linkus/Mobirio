import type { BookingFormData } from "@/types/booking";

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateBooking(data: BookingFormData): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.bikeId) errors.bikeId = "バイクを選択してください";
  if (!data.vendorId) errors.vendorId = "ベンダー情報がありません";
  if (!data.startDatetime) errors.startDatetime = "開始日時を選択してください";
  if (!data.endDatetime) errors.endDatetime = "終了日時を選択してください";

  if (data.startDatetime && data.endDatetime) {
    const start = new Date(data.startDatetime);
    const end = new Date(data.endDatetime);
    const now = new Date();

    // 過去日時の予約を拒否
    if (start < now) {
      errors.startDatetime = "過去の日時は指定できません";
    }

    // 終了日時は開始日時より後
    if (start >= end) {
      errors.endDatetime = "終了日時は開始日時より後にしてください";
    }

    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    // 最小レンタル期間: 2時間以上
    if (hours > 0 && hours < 2) {
      errors.endDatetime = "最小レンタル期間は2時間です";
    }

    // 最大レンタル期間: 30日（720時間）以下
    if (hours > 720) {
      errors.endDatetime = "最大レンタル期間は30日間です";
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
