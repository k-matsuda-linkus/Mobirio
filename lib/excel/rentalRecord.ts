import * as XLSX from "xlsx";

/* ---------- 型定義 ---------- */

export interface RentalRecordForm1Data {
  fiscalYear: string;
  bureau: string;
  bizInfo: {
    name: string;
    address: string;
    representative: string;
    phone: string;
    staff: string;
  };
  officeCount: string;
  records: Record<
    string,
    { vehicles: string; rentals: string; dayVehicles: string; km: string; revenue: string }
  >;
  carShare: { depots: string; oneway: string; other: string };
}

export interface OfficeRowData {
  bureau: string;
  name: string;
  address: string;
  passenger: string;
  bus: string;
  cargo: string;
  special: string;
  motorcycle: string;
}

export interface RentalRecordForm2Data {
  fiscalYear: string;
  offices: OfficeRowData[];
}

/* ---------- ヘルパー ---------- */

/** セルに数値をセット（0 や空の場合はスキップ） */
function setNum(ws: XLSX.WorkSheet, addr: string, raw: string | number) {
  const v = Number(raw) || 0;
  if (v !== 0) ws[addr] = { t: "n", v };
}

/** セルに文字列をセット（空の場合もセット） */
function setStr(ws: XLSX.WorkSheet, addr: string, v: string) {
  ws[addr] = { t: "s", v };
}

/* ---------- メイン ---------- */

/**
 * 国交省テンプレートをベースに貸渡実績報告書 Excel を生成しダウンロード
 */
export async function exportRentalRecordExcel(
  form1: RentalRecordForm1Data,
  form2: RentalRecordForm2Data,
): Promise<void> {
  /* テンプレート読み込み */
  const res = await fetch("/templates/rental-record-template.xlsx");
  const buf = await res.arrayBuffer();
  const wb = XLSX.read(new Uint8Array(buf), { type: "array" });

  fillForm1(wb, form1);
  fillForm2(wb, form2);

  /* ダウンロード */
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `貸渡実績報告書_令和${form1.fiscalYear}年度.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---------- 様式1 ---------- */

function fillForm1(wb: XLSX.WorkBook, d: RentalRecordForm1Data) {
  const ws = wb.Sheets[wb.SheetNames[0]]; // 【様式1】貸渡実績報告書
  if (!ws) return;

  /* 列幅設定 — 国交省テンプレートのグリッドに合わせた狭幅列 */
  const cols1: XLSX.ColInfo[] = [];
  for (let i = 0; i < 135; i++) cols1.push({ wch: 2 });
  ws["!cols"] = cols1;

  const y = Number(d.fiscalYear);

  /* ヘッダー */
  ws["AH1"] = { t: "n", v: y };
  setStr(ws, "B2", `令和${y}年4月1日から令和${y + 1}年3月31日まで`);
  setStr(ws, "C3", d.bureau);

  /* 事業者情報 */
  setStr(ws, "AL4", d.bizInfo.name);
  setStr(ws, "AL5", d.bizInfo.address);
  setStr(ws, "AL6", d.bizInfo.representative);
  setStr(ws, "AL7", d.bizInfo.phone);

  /* 担当者 */
  setStr(ws, "EC7", d.bizInfo.staff);
  setStr(ws, "EC8", d.bizInfo.staff);

  /* ①貸渡実績 — 運輸支局名 & 事務所数 */
  setStr(ws, "B11", `${d.bureau}運輸支局`);
  setNum(ws, "G11", d.officeCount);

  /* カテゴリ別データ（行11〜15） */
  const catKeys = ["passenger", "microbus", "cargo", "special", "motorcycle"] as const;
  const dataRows = [11, 12, 13, 14, 15];
  const fieldCols: Record<string, string> = {
    vehicles: "R",
    rentals: "Y",
    dayVehicles: "AG",
    km: "AO",
    revenue: "AX",
  };

  catKeys.forEach((key, i) => {
    const row = dataRows[i];
    const rec = d.records[key];
    if (!rec) return;
    Object.entries(fieldCols).forEach(([field, col]) => {
      setNum(ws, `${col}${row}`, rec[field as keyof typeof rec]);
    });
  });

  /* 合計行（行16） */
  Object.entries(fieldCols).forEach(([field, col]) => {
    let sum = 0;
    catKeys.forEach((key) => {
      const rec = d.records[key];
      if (rec) sum += Number(rec[field as keyof typeof rec]) || 0;
    });
    setNum(ws, `${col}16`, sum);
  });

  /* ②カーシェアリング */
  setStr(ws, "B25", `${d.bureau}運輸支局`);
  setNum(ws, "G25", d.carShare.depots);
  setNum(ws, "M25", d.carShare.oneway);
  setNum(ws, "S25", d.carShare.other);
  const csTotal = (Number(d.carShare.oneway) || 0) + (Number(d.carShare.other) || 0);
  if (csTotal > 0) ws["Y25"] = { t: "n", v: csTotal };
}

/* ---------- 様式2 ---------- */

function fillForm2(wb: XLSX.WorkBook, d: RentalRecordForm2Data) {
  const ws = wb.Sheets[wb.SheetNames[1]]; // 【様式2】事務所別車種別配車両数一覧
  if (!ws) return;

  /* 列幅設定 — 事務所一覧フォームのグリッドに合わせた狭幅列 */
  const cols2: XLSX.ColInfo[] = [];
  for (let i = 0; i < 45; i++) cols2.push({ wch: 3 });
  ws["!cols"] = cols2;

  /* 年度 */
  ws["AA3"] = { t: "n", v: Number(d.fiscalYear) };

  /* 事務所データ（行7〜16 = 最大10行） */
  const typeCols: Record<string, string> = {
    passenger: "AB",
    bus: "AE",
    cargo: "AH",
    special: "AK",
    motorcycle: "AN",
  };

  d.offices.forEach((office, i) => {
    const row = 7 + i;
    if (row > 16) return;

    setStr(ws, `B${row}`, office.bureau);
    setStr(ws, `E${row}`, office.name);
    setStr(ws, `M${row}`, office.address);

    let rowTotal = 0;
    Object.entries(typeCols).forEach(([field, col]) => {
      const val = Number(office[field as keyof OfficeRowData]) || 0;
      if (val > 0) ws[`${col}${row}`] = { t: "n", v: val };
      rowTotal += val;
    });
    if (rowTotal > 0) ws[`AQ${row}`] = { t: "n", v: rowTotal };
  });

  /* 合計行（行17） */
  const filledCount = d.offices.filter((o) => o.name.trim() !== "").length;
  if (filledCount > 0) ws["K17"] = { t: "n", v: filledCount };

  let grandTotal = 0;
  Object.entries(typeCols).forEach(([field, col]) => {
    const sum = d.offices.reduce(
      (s, o) => s + (Number(o[field as keyof OfficeRowData]) || 0),
      0,
    );
    if (sum > 0) ws[`${col}17`] = { t: "n", v: sum };
    grandTotal += sum;
  });
  if (grandTotal > 0) ws["AQ17"] = { t: "n", v: grandTotal };
}
