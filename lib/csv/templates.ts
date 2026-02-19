export const salesCsvColumns = [
  { key: "date" as const, label: "日付" },
  { key: "revenue" as const, label: "売上" },
  { key: "count" as const, label: "件数" },
];

export const reservationCsvColumns = [
  { key: "id" as const, label: "予約ID" },
  { key: "customerName" as const, label: "顧客名" },
  { key: "bikeName" as const, label: "車両名" },
  { key: "startDate" as const, label: "開始日時" },
  { key: "endDate" as const, label: "終了日時" },
  { key: "status" as const, label: "ステータス" },
  { key: "amount" as const, label: "金額" },
];

export const bikeCsvColumns = [
  { key: "id" as const, label: "車両ID" },
  { key: "name" as const, label: "車両名" },
  { key: "displacement" as const, label: "排気量" },
  { key: "totalRentals" as const, label: "貸出回数" },
  { key: "revenue" as const, label: "売上" },
  { key: "utilizationRate" as const, label: "稼働率" },
];

export const customerCsvColumns = [
  { key: "id" as const, label: "顧客ID" },
  { key: "name" as const, label: "名前" },
  { key: "email" as const, label: "メール" },
  { key: "totalBookings" as const, label: "予約回数" },
  { key: "totalSpent" as const, label: "累計利用額" },
  { key: "lastBookingDate" as const, label: "最終利用日" },
];
