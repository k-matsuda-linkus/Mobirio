type Column = {
  key: string;
  label: string;
  align?: "left" | "right";
};

type Props = {
  columns: Column[];
  data: Record<string, any>[];
  emptyMessage?: string;
};

export default function ReportTable({ columns, data, emptyMessage = "データがありません" }: Props) {
  if (data.length === 0) {
    return <p className="py-[40px] text-center text-sm text-gray-400">{emptyMessage}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map((col) => (
              <th key={col.key} className={"py-[10px] text-xs font-medium uppercase text-gray-400 " + (col.align === "right" ? "text-right" : "text-left")}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-gray-50">
              {columns.map((col) => (
                <td key={col.key} className={"py-[10px] text-gray-700 " + (col.align === "right" ? "text-right font-mono" : "text-left")}>
                  {row[col.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
