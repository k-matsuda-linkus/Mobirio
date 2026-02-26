'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, Upload, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { AdminTable } from '@/components/admin/AdminTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { InsurancePdfUploadModal } from '@/components/admin/InsurancePdfUploadModal';
import { mockBikes } from '@/lib/mock/bikes';
import { mockArchivedBikes } from '@/lib/mock/insuranceCertificates';
import type { InsuranceCertificate, InsuranceCertificateRecord } from '@/types/insurance';

export default function InsuranceCertificatesPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [certificate, setCertificate] = useState<InsuranceCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [allCerts, setAllCerts] = useState<{ year: number; month: number }[]>([]);

  const fetchCertificate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/insurance-certificates?year=${year}&month=${month}`);
      const json = await res.json();
      setCertificate(json.data?.[0] || null);
    } catch {
      setCertificate(null);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  const fetchAllCerts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/insurance-certificates');
      const json = await res.json();
      setAllCerts(
        (json.data || []).map((c: InsuranceCertificate) => ({
          year: c.targetYear,
          month: c.targetMonth,
        }))
      );
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { fetchCertificate(); }, [fetchCertificate]);
  useEffect(() => { fetchAllCerts(); }, [fetchAllCerts]);

  const handleMonthChange = (delta: number) => {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 1) { newMonth = 12; newYear--; }
    if (newMonth > 12) { newMonth = 1; newYear++; }
    setMonth(newMonth);
    setYear(newYear);
  };

  const handleUploaded = (cert: InsuranceCertificate) => {
    setCertificate(cert);
    setYear(cert.targetYear);
    setMonth(cert.targetMonth);
    fetchAllCerts();
  };

  const handleManualMatch = async (recordId: string, bikeId: string) => {
    if (!certificate) return;
    try {
      const res = await fetch(
        `/api/admin/insurance-certificates/${certificate.id}/records/${recordId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bikeId }),
        }
      );
      if (res.ok) {
        fetchCertificate();
      }
    } catch {
      // ignore
    }
  };

  // テーブル用データ
  const allBikes = [...mockBikes, ...mockArchivedBikes];
  const tableData = certificate
    ? certificate.records
        .sort((a, b) => a.vehicleOwner.localeCompare(b.vehicleOwner, 'ja'))
        .map((r) => ({
          id: r.id,
          vehicleOwner: r.vehicleOwner,
          vehicleName: r.vehicleName,
          registrationNumber: r.registrationNumber,
          frameNumber: r.frameNumber,
          modelSpec: r.modelSpec,
          firstRegistration: r.firstRegistration,
          inspectionExpiry: r.inspectionExpiry || '-',
          usageVehicleType: r.usageVehicleType,
          ev: r.isElectricVehicle ? '○' : '',
          hv: r.isHybrid ? '○' : '',
          aeb: r.isAeb ? '○' : '',
          matchStatus: r.matchStatus,
          bikeId: r.bikeId,
          bikeName: r.bikeName,
          isArchived: r.isArchived,
          _record: r,
        }))
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-[30px]">
        <div className="flex items-center gap-[12px]">
          <Shield className="w-[24px] h-[24px] text-gray-600" />
          <h1 className="font-serif text-2xl font-light">保険契約証明書管理</h1>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-black text-white px-[20px] py-[10px] text-sm font-sans hover:bg-gray-800 transition-colors flex items-center gap-[8px]"
        >
          <Upload size={14} /> PDFアップロード
        </button>
      </div>

      {/* 年月セレクター */}
      <div className="flex items-center gap-[16px] mb-[24px]">
        <button
          onClick={() => handleMonthChange(-1)}
          className="p-[6px] border border-gray-300 hover:bg-gray-50"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-lg font-sans font-medium min-w-[140px] text-center">
          {year}年{month}月
        </span>
        <button
          onClick={() => handleMonthChange(1)}
          className="p-[6px] border border-gray-300 hover:bg-gray-50"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-[8px] text-sm text-gray-400 py-[40px] justify-center">
          <Loader2 size={16} className="animate-spin" /> 読み込み中...
        </div>
      ) : certificate ? (
        <>
          {/* サマリー */}
          <div className="bg-white border border-gray-200 p-[20px] mb-[24px]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-[16px] text-sm font-sans">
              <div>
                <p className="text-xs text-gray-500">ファイル名</p>
                <p className="text-gray-800 font-medium mt-[2px]">{certificate.fileName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">作成日</p>
                <p className="text-gray-800 font-medium mt-[2px]">{certificate.documentDate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">対象車両数</p>
                <p className="text-gray-800 font-medium mt-[2px]">{certificate.totalVehicles}台</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">紐付け状態</p>
                <p className="text-gray-800 font-medium mt-[2px]">
                  <span className="text-green-600">{certificate.matchedCount}台 紐付済</span>
                  {certificate.unmatchedCount > 0 && (
                    <span className="text-red-600 ml-[8px]">{certificate.unmatchedCount}台 未紐付</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* 車両テーブル */}
          <AdminTable
            columns={[
              { key: 'vehicleOwner', label: '車両所有者' },
              { key: 'vehicleName', label: '車名' },
              { key: 'registrationNumber', label: '登録番号' },
              { key: 'frameNumber', label: '車台番号' },
              { key: 'modelSpec', label: '型式' },
              { key: 'firstRegistration', label: '初度登録' },
              { key: 'inspectionExpiry', label: '車検満了日' },
              { key: 'usageVehicleType', label: '用途車種' },
              { key: 'ev', label: 'EV' },
              { key: 'hv', label: 'HV' },
              { key: 'aeb', label: 'AEB' },
              {
                key: 'matchStatus',
                label: '紐付け状態',
                render: (row) => {
                  const r = row._record as InsuranceCertificateRecord;
                  if (r.matchStatus === 'unmatched') {
                    return (
                      <div className="flex flex-col gap-[4px]">
                        <StatusBadge status="未紐付け" variant="danger" />
                        <select
                          onChange={(e) => handleManualMatch(r.id, e.target.value)}
                          defaultValue=""
                          className="text-xs border border-gray-300 px-[4px] py-[2px] focus:outline-none focus:border-accent"
                        >
                          <option value="" disabled>バイクを選択</option>
                          {allBikes.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.registration_number})
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }
                  return (
                    <div className="flex flex-col gap-[2px]">
                      <StatusBadge
                        status={r.matchStatus === 'auto_matched' ? '紐付け済' : '手動紐付け'}
                        variant="success"
                      />
                      {r.isArchived && (
                        <span className="text-xs text-orange-600">（解約済）</span>
                      )}
                    </div>
                  );
                },
              },
            ]}
            data={tableData}
            pageSize={20}
          />
        </>
      ) : (
        <div className="text-center py-[60px] text-gray-400">
          <Shield className="w-[48px] h-[48px] mx-auto mb-[12px] opacity-30" />
          <p className="text-sm font-sans">{year}年{month}月の保険契約証明書はまだアップロードされていません</p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-[16px] text-sm text-accent hover:underline"
          >
            アップロードする →
          </button>
        </div>
      )}

      {/* アップロードモーダル */}
      <InsurancePdfUploadModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onUploaded={handleUploaded}
        existingMonths={allCerts}
      />
    </div>
  );
}
