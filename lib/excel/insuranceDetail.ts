import ExcelJS from "exceljs";

interface InsuranceRow {
  corporateCode: string;
  branchNumber: string;
  storeName: string;
  registrationNumber: string;
  manufacturer: string;
  vehicleName: string;
  frameNumber: string;
  enrollDate: string;
  cancelDate: string;
  category: string;
  vehicleType: string;
  monthlyPremium: number;
}

interface InsuranceDetailParams {
  year: number;
  month: number;
  totalAmount: number;
  premium125: number;
  premium126: number;
  rows: InsuranceRow[];
}

export async function generateInsuranceDetailExcel(params: InsuranceDetailParams): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("任意保険明細書");

  // Title
  ws.mergeCells("A1:L1");
  const titleCell = ws.getCell("A1");
  titleCell.value = "Mobirioレンタルバイク任意保険明細書";
  titleCell.font = { size: 14, bold: true };
  titleCell.alignment = { horizontal: "center" };

  // Header info
  ws.getCell("A3").value = "対象年月:";
  ws.getCell("B3").value = `${params.year}年${params.month}月`;
  ws.getCell("A4").value = "ご請求金額:";
  ws.getCell("B4").value = params.totalAmount;
  ws.getCell("B4").numFmt = "¥#,##0";
  ws.getCell("B4").font = { bold: true, size: 12 };

  // Monthly premiums
  ws.getCell("A6").value = "月額保険料";
  ws.getCell("A6").font = { bold: true };
  ws.getCell("A7").value = "125ccまで:";
  ws.getCell("B7").value = params.premium125;
  ws.getCell("B7").numFmt = "¥#,##0";
  ws.getCell("A8").value = "126cc以上:";
  ws.getCell("B8").value = params.premium126;
  ws.getCell("B8").numFmt = "¥#,##0";

  // Detail table header
  const headers = [
    "法人コード", "拠点番号", "店舗名称", "登録番号", "メーカー",
    "車種", "車台番号", "加入日", "解約日", "区分", "二輪/原付", "月額保険料",
  ];
  const headerRow = ws.getRow(10);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } };
    cell.border = {
      top: { style: "thin" }, bottom: { style: "thin" },
      left: { style: "thin" }, right: { style: "thin" },
    };
  });

  // Data rows
  params.rows.forEach((row, i) => {
    const r = ws.getRow(11 + i);
    const vals = [
      row.corporateCode, row.branchNumber, row.storeName, row.registrationNumber,
      row.manufacturer, row.vehicleName, row.frameNumber, row.enrollDate,
      row.cancelDate, row.category, row.vehicleType, row.monthlyPremium,
    ];
    vals.forEach((v, j) => {
      const cell = r.getCell(j + 1);
      cell.value = v;
      cell.border = {
        top: { style: "thin" }, bottom: { style: "thin" },
        left: { style: "thin" }, right: { style: "thin" },
      };
      if (j === 11) cell.numFmt = "¥#,##0";
    });
  });

  // Column widths
  ws.columns = [
    { width: 12 }, { width: 10 }, { width: 20 }, { width: 15 },
    { width: 12 }, { width: 15 }, { width: 18 }, { width: 12 },
    { width: 12 }, { width: 8 }, { width: 10 }, { width: 14 },
  ];

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
