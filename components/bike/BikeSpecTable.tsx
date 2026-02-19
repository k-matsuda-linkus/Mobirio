import { BikeSpecs } from "@/types/booking";
import { ENGINE_TYPES, LICENSE_TYPES } from "@/lib/constants";

interface BikeSpecTableProps {
  specs: BikeSpecs;
}

export default function BikeSpecTable({ specs }: BikeSpecTableProps) {
  const rows: { label: string; value: string | number | undefined }[] = [
    { label: "メーカー", value: specs.manufacturer },
    { label: "モデル", value: specs.model },
    { label: "年式", value: specs.year ? `${specs.year}年` : undefined },
    { label: "排気量", value: `${specs.displacement}cc` },
    { label: "エンジン形式", value: ENGINE_TYPES.find((e) => e.value === specs.engine_type)?.label || specs.engine_type },
    { label: "シート高", value: specs.seat_height ? `${specs.seat_height}mm` : undefined },
    { label: "車両重量", value: specs.weight ? `${specs.weight}kg` : undefined },
    { label: "必要免許", value: LICENSE_TYPES.find((e) => e.value === specs.license_type)?.label || specs.license_type },
  ];

  return (
    <div>
      <h2 className="font-serif text-lg text-black">スペック</h2>
      <div className="mt-[16px]">
        {rows.map(
          (row) =>
            row.value !== undefined && (
              <div
                key={row.label}
                className="flex items-center justify-between border-b border-gray-50 py-[12px]"
              >
                <span className="text-sm text-gray-500">{row.label}</span>
                <span className="text-sm font-medium text-black">{row.value}</span>
              </div>
            )
        )}
      </div>
    </div>
  );
}
