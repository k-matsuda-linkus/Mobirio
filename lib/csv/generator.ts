export function generateCsv(data: any[], columns: any[]): string {
  const header = columns.map((c: any) => c.label).join(",");
  const rows = data.map((row: any) => columns.map((c: any) => String(row[c.key])).join(","));
  return [header, ...rows].join("\n");
}

export function downloadCsv(csv: string, filename: string) {
  if (typeof window === "undefined") return;
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename + ".csv";
  a.click();
  URL.revokeObjectURL(url);
}

