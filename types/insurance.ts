// PDFパース結果
export interface ParsedVehicleRecord {
  detailNumber: string;          // 明細番号
  vehicleOwner: string;          // 車両所有者
  vehicleName: string;           // 車名
  registrationNumber: string;    // 登録番号(車両番号)
  frameNumber: string;           // 車台番号
  modelSpec: string;             // 型式・仕様
  firstRegistration: string;     // 初度登録年月
  inspectionExpiry: string;      // 車検満了日（250cc以下はなし=正常）
  usageVehicleType: string;      // 用途車種
  isElectricVehicle: boolean;    // 電気自動車
  isHybrid: boolean;             // ハイブリッド
  isAeb: boolean;                // AEB
  documentDate: string;          // 作成日
  pageStart: number;
  pageEnd: number;
}

// 保存用レコード（bikes紐付け情報含む）
export interface InsuranceCertificateRecord extends ParsedVehicleRecord {
  id: string;
  bikeId: string | null;
  bikeName: string | null;       // 紐付いたバイクの表示名
  matchStatus: 'auto_matched' | 'manual_matched' | 'unmatched';
  isArchived: boolean;           // アーカイブ済みバイクかどうか
}

// 証明書アップロード管理
export interface InsuranceCertificate {
  id: string;
  targetYear: number;
  targetMonth: number;
  fileName: string;
  totalVehicles: number;
  matchedCount: number;
  unmatchedCount: number;
  documentDate: string;
  uploadedAt: string;
  records: InsuranceCertificateRecord[];
}
