import type { ParsedVehicleRecord, InsuranceCertificateRecord } from "@/types/insurance";
import type { Bike } from "@/types/booking";
import { normalizeFrameNumber, normalizeRegistrationNumber } from "./parseInsuranceCertificate";

interface MatchResult {
  records: InsuranceCertificateRecord[];
  matchedCount: number;
  unmatchedCount: number;
}

export function matchVehicles(
  parsedRecords: ParsedVehicleRecord[],
  activeBikes: Bike[],
  archivedBikes: Bike[]
): MatchResult {
  // 照合用マップ（正規化キー → { bike, isArchived }）
  const frameMap = new Map<string, { bike: Bike; isArchived: boolean }>();
  const regMap = new Map<string, { bike: Bike; isArchived: boolean }>();

  // アクティブ車両を登録
  for (const bike of activeBikes) {
    if (bike.frame_number) {
      frameMap.set(normalizeFrameNumber(bike.frame_number), { bike, isArchived: false });
    }
    if (bike.registration_number) {
      regMap.set(normalizeRegistrationNumber(bike.registration_number), { bike, isArchived: false });
    }
  }

  // アーカイブ車両を登録
  for (const bike of archivedBikes) {
    if (bike.frame_number) {
      frameMap.set(normalizeFrameNumber(bike.frame_number), { bike, isArchived: true });
    }
    if (bike.registration_number) {
      regMap.set(normalizeRegistrationNumber(bike.registration_number), { bike, isArchived: true });
    }
  }

  let matchedCount = 0;
  let unmatchedCount = 0;

  const records: InsuranceCertificateRecord[] = parsedRecords.map((parsed, idx) => {
    // 優先度1: 車台番号で照合
    const normalizedFrame = parsed.frameNumber ? normalizeFrameNumber(parsed.frameNumber) : '';
    const frameMatch = normalizedFrame ? frameMap.get(normalizedFrame) : undefined;

    if (frameMatch) {
      matchedCount++;
      return {
        ...parsed,
        id: `rec-${Date.now()}-${idx}`,
        bikeId: frameMatch.bike.id,
        bikeName: frameMatch.bike.name,
        matchStatus: 'auto_matched' as const,
        isArchived: frameMatch.isArchived,
      };
    }

    // 優先度2: 登録番号で照合
    const normalizedReg = parsed.registrationNumber ? normalizeRegistrationNumber(parsed.registrationNumber) : '';
    const regMatch = normalizedReg ? regMap.get(normalizedReg) : undefined;

    if (regMatch) {
      matchedCount++;
      return {
        ...parsed,
        id: `rec-${Date.now()}-${idx}`,
        bikeId: regMatch.bike.id,
        bikeName: regMatch.bike.name,
        matchStatus: 'auto_matched' as const,
        isArchived: regMatch.isArchived,
      };
    }

    // マッチなし
    unmatchedCount++;
    return {
      ...parsed,
      id: `rec-${Date.now()}-${idx}`,
      bikeId: null,
      bikeName: null,
      matchStatus: 'unmatched' as const,
      isArchived: false,
    };
  });

  return { records, matchedCount, unmatchedCount };
}
