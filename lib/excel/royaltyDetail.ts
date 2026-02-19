import ExcelJS from "exceljs";

interface RoyaltyRow {
  no: number;
  memberName: string;
  reservationNumber: string;
  dateFrom: string;
  dateTo: string;
  userName: string;
  vehicleName: string;
  baseAmount: number;
  royaltyRate: number;
  royaltyAmount: number;
  creditPayment: boolean;
  creditAmount: number;
}

interface RoyaltyDetailParams {
  year: number;
  month: number;
  calculationDate: string;
  issueDate: string;
  totalRoyaltyExTax: number;
  totalRoyaltyIncTax: number;
  totalCreditExTax: number;
  totalCreditIncTax: number;
  rows: RoyaltyRow[];
}

export async function generateRoyaltyDetailExcel(params: RoyaltyDetailParams): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("ロイヤリティ明細書");

  // Title
  ws.mergeCells("A1:L1");
  const titleCell = ws.getCell("A1");
  titleCell.value = "Mobirioレンタル ロイヤリティ明細書";
  titleCell.font = { size: 14, bold: true };
  titleCell.alignment = { horizontal: "center" };

  // Header info
  ws.getCell("A3").value = "対象月:";
  ws.getCell("B3").value = `${params.year}年${params.month}月`;
  ws.getCell("D3").value = "計算書計上日:";
  ws.getCell("E3").value = params.calculationDate;
  ws.getCell("G3").value = "発行日:";
  ws.getCell("H3").value = params.issueDate;

  // Summary
  ws.getCell("A5").value = "ロイヤリティ請求額(税別):";
  ws.getCell("C5").value = params.totalRoyaltyExTax;
  ws.getCell("C5").numFmt = "¥#,##0";
  ws.getCell("A6").value = "ロイヤリティ請求額(税込):";
  ws.getCell("C6").value = params.totalRoyaltyIncTax;
  ws.getCell("C6").numFmt = "¥#,##0";
  ws.getCell("C6").font = { bold: true, size: 12 };
  ws.getCell("E5").value = "WEBクレジットお支払い額(税別):";
  ws.getCell("G5").value = params.totalCreditExTax;
  ws.getCell("G5").numFmt = "¥#,##0";
  ws.getCell("E6").value = "WEBクレジットお支払い額(税込):";
  ws.getCell("G6").value = params.totalCreditIncTax;
  ws.getCell("G6").numFmt = "¥#,##0";
  ws.getCell("G6").font = { bold: true, size: 12 };

  // Table header
  const headers = [
    "NO", "会員名", "予約番号", "予約日(から)", "予約日(まで)",
    "利用者", "車名", "基本料金(税込)", "ロイヤリティ設定(%)",
    "ロイヤリティ(税別)", "WEBクレジット決済", "WEBクレジット決済額(税込)",
  ];
  const headerRow = ws.getRow(8);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 9 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } };
    cell.border = {
      top: { style: "thin" }, bottom: { style: "thin" },
      left: { style: "thin" }, right: { style: "thin" },
    };
    cell.alignment = { horizontal: "center", wrapText: true };
  });

  // Data rows
  params.rows.forEach((row, i) => {
    const r = ws.getRow(9 + i);
    const vals: (string | number | boolean)[] = [
      row.no, row.memberName, row.reservationNumber, row.dateFrom, row.dateTo,
      row.userName, row.vehicleName, row.baseAmount, row.royaltyRate,
      row.royaltyAmount, row.creditPayment ? "有" : "無", row.creditAmount,
    ];
    vals.forEach((v, j) => {
      const cell = r.getCell(j + 1);
      cell.value = v;
      cell.border = {
        top: { style: "thin" }, bottom: { style: "thin" },
        left: { style: "thin" }, right: { style: "thin" },
      };
      if ([7, 9, 11].includes(j) && typeof v === "number") {
        cell.numFmt = "¥#,##0";
      }
      if (j === 8 && typeof v === "number") {
        cell.numFmt = "0%";
        cell.value = v / 100;
      }
    });
  });

  // Column widths
  ws.columns = [
    { width: 5 }, { width: 14 }, { width: 14 }, { width: 12 }, { width: 12 },
    { width: 14 }, { width: 16 }, { width: 14 }, { width: 12 },
    { width: 14 }, { width: 12 }, { width: 16 },
  ];

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
