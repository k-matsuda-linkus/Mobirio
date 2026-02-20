"use client";

export interface VehicleStatus {
  status: "available" | "rented" | "maintenance" | "reserved";
  count: number;
  vehicles: { id: string; name: string }[];
}

interface VehicleStatusBoardProps {
  statuses: VehicleStatus[];
}

const STATUS_CONFIG: Record<
  VehicleStatus["status"],
  { color: string; label: string }
> = {
  available: { color: "#10B981", label: "利用可能" },
  rented: { color: "#3B82F6", label: "貸出中" },
  maintenance: { color: "#F59E0B", label: "メンテナンス" },
  reserved: { color: "#8B5CF6", label: "予約済" },
};

export function VehicleStatusBoard({ statuses }: VehicleStatusBoardProps) {
  return (
    <div className="bg-white border border-gray-200 p-[20px]">
      <h3 className="text-[16px] font-medium mb-[16px]">車両ステータス</h3>
      <div className="space-y-[12px]">
        {statuses.map((s) => {
          const config = STATUS_CONFIG[s.status];
          const displayVehicles = s.vehicles.slice(0, 3);
          const overflow = s.vehicles.length - 3;
          return (
            <div
              key={s.status}
              className="border border-gray-100 p-[12px]"
              style={{ borderLeftWidth: "4px", borderLeftColor: config.color }}
            >
              <div className="flex items-center justify-between mb-[6px]">
                <span
                  className="text-[13px] font-medium"
                  style={{ color: config.color }}
                >
                  {config.label}
                </span>
                <span className="text-[20px] font-medium">{s.count}台</span>
              </div>
              <div className="text-[12px] text-gray-500">
                {displayVehicles.map((v) => v.name).join("、")}
                {overflow > 0 && (
                  <span className="text-gray-400 ml-[4px]">
                    +{overflow}台
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
