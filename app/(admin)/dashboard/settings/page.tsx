"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, X, Loader2, Check } from "lucide-react";
import Image from "next/image";

/* ------------------------------------------------------------------ */
/*  共通: ¥入力フィールド                                               */
/* ------------------------------------------------------------------ */
function YenField({
  label,
  value,
  onChange,
  suffix = "/ 月",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-sans text-gray-700 mb-[6px]">{label}</label>
      <div className="flex items-center gap-[8px]">
        <span className="text-sm font-sans text-gray-500">&yen;</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min="0"
          className="w-[140px] border border-gray-300 px-[12px] py-[8px] text-sm font-sans focus:outline-none focus:border-accent"
        />
        <span className="text-sm font-sans text-gray-500">{suffix}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  共通: %入力フィールド                                               */
/* ------------------------------------------------------------------ */
function PercentField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-sans text-gray-700 mb-[6px]">{label}</label>
      <div className="flex items-center gap-[8px]">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min="0"
          max="100"
          step="0.1"
          className="w-[100px] border border-gray-300 px-[12px] py-[8px] text-sm font-sans focus:outline-none focus:border-accent"
        />
        <span className="text-sm font-sans text-gray-500">%</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  共通: 保存ボタン + メッセージ                                        */
/* ------------------------------------------------------------------ */
function SaveButton({
  saving,
  msg,
  onClick,
  label = "保存",
}: {
  saving: boolean;
  msg: string;
  onClick: () => void;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-[12px] pt-[4px]">
      <button
        onClick={onClick}
        disabled={saving}
        className="bg-black text-white px-[24px] py-[8px] text-sm font-sans hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {saving ? "保存中..." : label}
      </button>
      {msg && (
        <span
          className={`text-sm font-sans flex items-center gap-[4px] ${
            msg === "保存しました" ? "text-green-600" : "text-red-600"
          }`}
        >
          {msg === "保存しました" && <Check size={14} />}
          {msg}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  共通: 二輪/原付ペアの小見出し                                       */
/* ------------------------------------------------------------------ */
function PairHeading({ label, total }: { label: string; total?: number }) {
  return (
    <div className="flex items-center justify-between pt-[8px] pb-[4px] border-t border-gray-100 mt-[8px]">
      <p className="text-xs font-sans font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </p>
      {total !== undefined && (
        <span className="text-xs font-sans font-medium text-gray-700">
          合計 &yen;{total.toLocaleString()}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */
export default function SettingsPage() {
  const [siteName, setSiteName] = useState("Mobirio");
  const [siteUrl, setSiteUrl] = useState("https://mobirio.jp");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [emailFrom, setEmailFrom] = useState("noreply@mobirio.jp");
  const [emailName, setEmailName] = useState("Mobirio");
  const [maint, setMaint] = useState(false);

  // ---------- 任意保険 ----------
  const [ins, setIns] = useState({
    cost_motorcycle: "", cost_moped: "",
    linkus_fee_motorcycle: "", linkus_fee_moped: "",
    additional_one_fee_motorcycle: "", additional_one_fee_moped: "",
  });
  const [insLoading, setInsLoading] = useState(true);
  const [insSaving, setInsSaving] = useState(false);
  const [insMsg, setInsMsg] = useState("");

  const setInsField = (key: keyof typeof ins, val: string) =>
    setIns((prev) => ({ ...prev, [key]: val }));

  const fetchIns = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/insurance-rates");
      if (res.ok) {
        const json = await res.json();
        const d = json.data;
        setIns({
          cost_motorcycle: String(d.cost_motorcycle),
          cost_moped: String(d.cost_moped),
          linkus_fee_motorcycle: String(d.linkus_fee_motorcycle),
          linkus_fee_moped: String(d.linkus_fee_moped),
          additional_one_fee_motorcycle: String(d.additional_one_fee_motorcycle),
          additional_one_fee_moped: String(d.additional_one_fee_moped),
        });
      }
    } catch { /* フォールバック: 0で表示 */ }
    finally { setInsLoading(false); }
  }, []);

  useEffect(() => { fetchIns(); }, [fetchIns]);

  const saveIns = async () => {
    setInsSaving(true);
    setInsMsg("");
    try {
      const body: Record<string, number> = {};
      for (const [k, v] of Object.entries(ins)) body[k] = Number(v);
      // 保険請求額 = 保険仕入 + リンクス手数料 + アディショナルワン手数料
      body.rate_motorcycle = body.cost_motorcycle + body.linkus_fee_motorcycle + body.additional_one_fee_motorcycle;
      body.rate_moped = body.cost_moped + body.linkus_fee_moped + body.additional_one_fee_moped;
      const res = await fetch("/api/admin/insurance-rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      setInsMsg(res.ok ? "保存しました" : (json.error || "保存に失敗しました"));
      if (res.ok) setTimeout(() => setInsMsg(""), 3000);
    } catch {
      setInsMsg("通信エラーが発生しました");
    } finally { setInsSaving(false); }
  };

  // ---------- ロイヤリティ・EC決済手数料・分配率 ----------
  const [fees, setFees] = useState({
    royalty_bike_percent: "12",
    royalty_moped_percent: "11",
    ec_payment_fee_percent: "3.6",
    royalty_split_linkus: "50",
    royalty_split_system_dev: "35",
    royalty_split_additional_one: "15",
  });
  const [feesLoading, setFeesLoading] = useState(true);
  const [feesSaving, setFeesSaving] = useState(false);
  const [feesMsg, setFeesMsg] = useState("");

  const setFeeField = (key: keyof typeof fees, val: string) =>
    setFees((prev) => ({ ...prev, [key]: val }));

  const splitTotal =
    (Number(fees.royalty_split_linkus) || 0) +
    (Number(fees.royalty_split_system_dev) || 0) +
    (Number(fees.royalty_split_additional_one) || 0);

  const fetchFees = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/fees");
      if (res.ok) {
        const d = (await res.json()).data;
        setFees({
          royalty_bike_percent: d.royalty_bike_percent,
          royalty_moped_percent: d.royalty_moped_percent,
          ec_payment_fee_percent: d.ec_payment_fee_percent,
          royalty_split_linkus: d.royalty_split_linkus,
          royalty_split_system_dev: d.royalty_split_system_dev,
          royalty_split_additional_one: d.royalty_split_additional_one,
        });
      }
    } catch { /* フォールバック */ }
    finally { setFeesLoading(false); }
  }, []);

  useEffect(() => { fetchFees(); }, [fetchFees]);

  const saveFees = async () => {
    setFeesSaving(true);
    setFeesMsg("");
    try {
      const res = await fetch("/api/admin/fees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fees),
      });
      const json = await res.json();
      setFeesMsg(res.ok ? "保存しました" : (json.error || "保存に失敗しました"));
      if (res.ok) setTimeout(() => setFeesMsg(""), 3000);
    } catch {
      setFeesMsg("通信エラーが発生しました");
    } finally { setFeesSaving(false); }
  };

  // ---------- ロゴ ----------
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => { setLogoPreview(ev.target?.result as string); };
    reader.readAsDataURL(file);
  };
  const removeLogo = () => {
    setLogoPreview(null);
    setLogoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ================================================================
  return (
    <div>
      <h1 className="font-serif text-2xl font-light mb-[30px]">システム設定</h1>
      <div className="space-y-[32px] max-w-[600px]">

        {/* ============================================================ */}
        {/* 基本設定 */}
        {/* ============================================================ */}
        <section className="bg-white border border-gray-200 p-[24px]">
          <h2 className="font-serif text-lg font-light mb-[20px]">基本設定</h2>
          <div className="space-y-[16px]">
            <div>
              <label className="block text-sm font-sans text-gray-700 mb-[6px]">サイト名</label>
              <input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)}
                className="w-full border border-gray-300 px-[12px] py-[8px] text-sm font-sans focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-sm font-sans text-gray-700 mb-[6px]">サイトURL</label>
              <input type="url" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)}
                className="w-full border border-gray-300 px-[12px] py-[8px] text-sm font-sans focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-sm font-sans text-gray-700 mb-[6px]">サイトロゴ</label>
              {logoPreview ? (
                <div className="flex items-start gap-[16px]">
                  <div className="relative w-[160px] h-[60px] border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                    <Image src={logoPreview} alt="サイトロゴプレビュー" fill className="object-contain" />
                  </div>
                  <div className="flex flex-col gap-[8px]">
                    <button onClick={() => fileInputRef.current?.click()} className="text-sm font-sans text-accent hover:underline">変更</button>
                    <button onClick={removeLogo} className="flex items-center gap-[4px] text-sm font-sans text-red-500 hover:underline">
                      <X size={14} /> 削除
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-[8px] border border-dashed border-gray-300 px-[20px] py-[16px] text-sm font-sans text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors w-full justify-center">
                  <Upload size={16} /> ロゴ画像をアップロード
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
              <p className="text-xs font-sans text-gray-400 mt-[6px]">推奨: PNG / SVG、横幅 200px 以上</p>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 任意保険 */}
        {/* ============================================================ */}
        <section className="bg-white border border-gray-200 p-[24px]">
          <h2 className="font-serif text-lg font-light mb-[4px]">任意保険</h2>
          <p className="text-xs font-sans text-gray-400 mb-[4px]">
            各ベンダーへの月額請求。稼働バイク台数 &times; 区分単価で算出
          </p>
          <p className="text-xs font-sans text-gray-400 mb-[4px]">
            対象期間: 月の1日〜月末。月中の解約は日割りなし（1ヶ月分請求）
          </p>
          <p className="text-xs font-sans text-orange-500 mb-[20px]">
            ※ アディショナルワン登録車両は全計算から除外
          </p>
          {insLoading ? (
            <div className="flex items-center gap-[8px] text-sm text-gray-400">
              <Loader2 size={16} className="animate-spin" /> 読み込み中...
            </div>
          ) : (
            <div className="space-y-[12px]">
              {/* 保険仕入［クロダ保険支払額］ */}
              <PairHeading label="保険仕入［クロダ保険支払額］" total={(Number(ins.cost_motorcycle) || 0) + (Number(ins.cost_moped) || 0)} />
              <div className="grid grid-cols-2 gap-[16px]">
                <YenField label="二輪" value={ins.cost_motorcycle} onChange={(v) => setInsField("cost_motorcycle", v)} />
                <YenField label="原付" value={ins.cost_moped} onChange={(v) => setInsField("cost_moped", v)} />
              </div>

              {/* リンクス手数料 */}
              <PairHeading label="リンクス手数料" total={(Number(ins.linkus_fee_motorcycle) || 0) + (Number(ins.linkus_fee_moped) || 0)} />
              <div className="grid grid-cols-2 gap-[16px]">
                <YenField label="二輪" value={ins.linkus_fee_motorcycle} onChange={(v) => setInsField("linkus_fee_motorcycle", v)} />
                <YenField label="原付" value={ins.linkus_fee_moped} onChange={(v) => setInsField("linkus_fee_moped", v)} />
              </div>

              {/* アディショナルワン手数料 */}
              <PairHeading label="アディショナルワン手数料" total={(Number(ins.additional_one_fee_motorcycle) || 0) + (Number(ins.additional_one_fee_moped) || 0)} />
              <div className="grid grid-cols-2 gap-[16px]">
                <YenField label="二輪" value={ins.additional_one_fee_motorcycle} onChange={(v) => setInsField("additional_one_fee_motorcycle", v)} />
                <YenField label="原付" value={ins.additional_one_fee_moped} onChange={(v) => setInsField("additional_one_fee_moped", v)} />
              </div>

              {/* 保険請求額（自動計算: 保険仕入 + リンクス手数料 + アディショナルワン手数料） */}
              <div className="flex items-center justify-between pt-[12px] pb-[4px] border-t-2 border-gray-300 mt-[12px]">
                <p className="text-xs font-sans font-bold text-gray-700">
                  保険請求額（ベンダー請求単価）
                </p>
              </div>
              <div className="grid grid-cols-2 gap-[16px]">
                <div>
                  <p className="text-xs font-sans text-gray-500 mb-[4px]">二輪（126cc以上）</p>
                  <p className="text-sm font-sans font-medium text-gray-800">
                    &yen;{(
                      (Number(ins.cost_motorcycle) || 0) +
                      (Number(ins.linkus_fee_motorcycle) || 0) +
                      (Number(ins.additional_one_fee_motorcycle) || 0)
                    ).toLocaleString()}
                    <span className="text-xs text-gray-400 ml-[4px]">/ 月</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-sans text-gray-500 mb-[4px]">原付（125cc以下・EV）</p>
                  <p className="text-sm font-sans font-medium text-gray-800">
                    &yen;{(
                      (Number(ins.cost_moped) || 0) +
                      (Number(ins.linkus_fee_moped) || 0) +
                      (Number(ins.additional_one_fee_moped) || 0)
                    ).toLocaleString()}
                    <span className="text-xs text-gray-400 ml-[4px]">/ 月</span>
                  </p>
                </div>
              </div>
              <p className="text-xs font-sans text-gray-400">
                保険仕入 + リンクス手数料 + アディショナルワン手数料
              </p>

              {/* アディショナルワンへの支払い（自動計算: 保険仕入 + アディショナルワン手数料） */}
              <div className="flex items-center justify-between pt-[12px] pb-[4px] border-t-2 border-gray-300 mt-[12px]">
                <p className="text-xs font-sans font-bold text-gray-700">
                  アディショナルワンへの支払い
                </p>
                <span className="text-sm font-sans font-bold text-gray-700">
                  &yen;{(
                    (Number(ins.cost_motorcycle) || 0) + (Number(ins.cost_moped) || 0) +
                    (Number(ins.additional_one_fee_motorcycle) || 0) + (Number(ins.additional_one_fee_moped) || 0)
                  ).toLocaleString()}
                </span>
              </div>
              <p className="text-xs font-sans text-gray-400">
                保険仕入［クロダ保険支払額］+ アディショナルワン手数料
              </p>

              <SaveButton saving={insSaving} msg={insMsg} onClick={saveIns} label="保険設定を保存" />
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* ロイヤリティ */}
        {/* ============================================================ */}
        <section className="bg-white border border-gray-200 p-[24px]">
          <h2 className="font-serif text-lg font-light mb-[4px]">ロイヤリティ</h2>
          <p className="text-xs font-sans text-gray-400 mb-[20px]">
            バイク本体のレンタル料金に対してのみ適用（オプション・免責補償は対象外）
          </p>
          {feesLoading ? (
            <div className="flex items-center gap-[8px] text-sm text-gray-400">
              <Loader2 size={16} className="animate-spin" /> 読み込み中...
            </div>
          ) : (
            <div className="space-y-[12px]">
              {/* ロイヤリティ率 */}
              <PairHeading label="ロイヤリティ率" />
              <div className="grid grid-cols-2 gap-[16px]">
                <PercentField label="レンタルバイクプラン" value={fees.royalty_bike_percent} onChange={(v) => setFeeField("royalty_bike_percent", v)} />
                <PercentField label="特定小型原付プラン" value={fees.royalty_moped_percent} onChange={(v) => setFeeField("royalty_moped_percent", v)} />
              </div>

              {/* EC決済手数料 */}
              <PairHeading label="EC決済手数料" />
              <PercentField label="EC決済手数料率" value={fees.ec_payment_fee_percent} onChange={(v) => setFeeField("ec_payment_fee_percent", v)} />
              <div className="bg-gray-50 border border-gray-200 p-[12px] space-y-[4px]">
                <p className="text-xs font-sans font-medium text-gray-500">EC決済時の実効ロイヤリティ率</p>
                <p className="text-sm font-sans text-gray-700">
                  バイク: {(Number(fees.royalty_bike_percent) - Number(fees.ec_payment_fee_percent)).toFixed(1)}%
                  <span className="text-gray-400 ml-[4px]">({fees.royalty_bike_percent}% &minus; {fees.ec_payment_fee_percent}%)</span>
                </p>
                <p className="text-sm font-sans text-gray-700">
                  原付: {(Number(fees.royalty_moped_percent) - Number(fees.ec_payment_fee_percent)).toFixed(1)}%
                  <span className="text-gray-400 ml-[4px]">({fees.royalty_moped_percent}% &minus; {fees.ec_payment_fee_percent}%)</span>
                </p>
              </div>

              {/* 運営3社 分配率 */}
              <PairHeading label="運営3社 ロイヤリティ分配率" />
              <div className="space-y-[12px]">
                <PercentField label="リンクス" value={fees.royalty_split_linkus} onChange={(v) => setFeeField("royalty_split_linkus", v)} />
                <PercentField label="システム開発" value={fees.royalty_split_system_dev} onChange={(v) => setFeeField("royalty_split_system_dev", v)} />
                <PercentField label="アディショナルワン" value={fees.royalty_split_additional_one} onChange={(v) => setFeeField("royalty_split_additional_one", v)} />
              </div>
              <div className={`flex items-center gap-[8px] text-sm font-sans ${splitTotal === 100 ? "text-green-600" : "text-red-600"}`}>
                {splitTotal === 100 ? <Check size={14} /> : null}
                合計: {splitTotal}%{splitTotal !== 100 && "（100%にしてください）"}
              </div>

              <SaveButton saving={feesSaving} msg={feesMsg} onClick={saveFees} label="ロイヤリティを保存" />
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* 計算ロジック */}
        {/* ============================================================ */}
        <section className="bg-white border border-gray-200 p-[24px]">
          <h2 className="font-serif text-lg font-light mb-[4px]">計算ロジック</h2>
          <p className="text-xs font-sans text-gray-400 mb-[20px]">
            上記の設定値をもとに自動反映されます（予約1件あたり）
          </p>

          <div className="space-y-[20px] text-sm font-sans">

            {/* ── 概要: 決済フロー ── */}
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-[8px]">決済フロー</h3>
              <div className="bg-blue-50 border border-blue-200 p-[12px] space-y-[8px]">
                <div>
                  <p className="font-medium text-gray-800">EC決済（Square経由）</p>
                  <p className="text-gray-600 mt-[2px]">
                    顧客 → Square（リンクス契約） → ロイヤリティ + EC手数料を差引 → ベンダーへ支払い
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-800">現地決済</p>
                  <p className="text-gray-600 mt-[2px]">
                    顧客 → ベンダー（直接集金） → ロイヤリティをリンクスへ支払い
                  </p>
                </div>
              </div>
            </div>

            {/* ── 1. ロイヤリティ額 ── */}
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-[8px]">1. ロイヤリティ額</h3>
              <div className="bg-gray-50 border border-gray-200 p-[12px] space-y-[6px]">
                <p className="text-xs text-orange-600 mb-[4px]">
                  ※ 対象: バイク本体レンタル料金のみ（オプション・免責補償は対象外）
                </p>
                <p className="text-gray-600">
                  <span className="font-medium text-gray-800">EC決済:</span>{" "}
                  バイク本体 &times; ({fees.royalty_bike_percent}% &minus; {fees.ec_payment_fee_percent}%) ={" "}
                  バイク本体 &times; {(Number(fees.royalty_bike_percent) - Number(fees.ec_payment_fee_percent)).toFixed(1)}%
                  <span className="text-gray-400 ml-[4px]">（バイク）</span>
                </p>
                <p className="text-gray-600 pl-[68px]">
                  バイク本体 &times; ({fees.royalty_moped_percent}% &minus; {fees.ec_payment_fee_percent}%) ={" "}
                  バイク本体 &times; {(Number(fees.royalty_moped_percent) - Number(fees.ec_payment_fee_percent)).toFixed(1)}%
                  <span className="text-gray-400 ml-[4px]">（原付）</span>
                </p>
                <p className="text-xs text-gray-400 pl-[68px]">
                  設定率({fees.royalty_bike_percent}%/{fees.royalty_moped_percent}%)にはEC手数料を含むため差し引く
                </p>
                <p className="text-gray-600 mt-[4px]">
                  <span className="font-medium text-gray-800">現地決済:</span>{" "}
                  バイク本体 &times; {fees.royalty_bike_percent}%
                  <span className="text-gray-400 ml-[4px]">（バイク）</span>{" / "}
                  バイク本体 &times; {fees.royalty_moped_percent}%
                  <span className="text-gray-400 ml-[4px]">（原付）</span>
                </p>
              </div>
            </div>

            {/* ── 2. EC手数料 ── */}
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-[8px]">2. EC決済手数料</h3>
              <div className="bg-gray-50 border border-gray-200 p-[12px] space-y-[6px]">
                <p className="text-xs text-orange-600 mb-[4px]">
                  ※ 対象: 予約総額（バイク本体 + オプション + 免責補償すべて）
                </p>
                <p className="text-gray-600">
                  <span className="font-medium text-gray-800">EC決済:</span>{" "}
                  予約総額 &times; {fees.ec_payment_fee_percent}%
                </p>
                <p className="text-gray-600">
                  <span className="font-medium text-gray-800">現地決済:</span>{" "}
                  <span className="text-gray-400">0（発生しない）</span>
                </p>
              </div>
            </div>

            {/* ── 3. 手数料合計 ── */}
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-[8px]">3. 手数料合計</h3>
              <div className="bg-gray-50 border border-gray-200 p-[12px]">
                <p className="text-gray-600">
                  ROUND( ロイヤリティ額 + EC手数料 )
                </p>
              </div>
            </div>

            {/* ── 4. 返金 ── */}
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-[8px]">4. 返金処理（乗数）</h3>
              <div className="bg-gray-50 border border-gray-200 p-[12px]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs text-gray-500">
                      <th className="pb-[4px] font-medium">種別</th>
                      <th className="pb-[4px] font-medium">返金額</th>
                      <th className="pb-[4px] font-medium">乗数</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr><td className="py-[2px]">なし</td><td>0</td><td>&times;1</td></tr>
                    <tr><td className="py-[2px]">全額返金</td><td>予約総額</td><td>&times;0（全額0）</td></tr>
                    <tr><td className="py-[2px]">当日50%</td><td>予約総額 &times; 50%</td><td>&times;0.5</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── 5. ベンダー支払額（1予約あたり） ── */}
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-[8px]">5. ベンダー支払額（1予約あたり）</h3>
              <div className="bg-gray-50 border border-gray-200 p-[12px] space-y-[6px]">
                <p className="text-gray-600">
                  <span className="font-medium text-gray-800">EC決済:</span>{" "}
                  Square入金額 &minus; 手数料合計
                </p>
                <p className="text-xs text-gray-400 pl-[68px]">
                  = 予約総額 &times; 返金乗数 &minus; ROUND(ロイヤリティ + EC手数料)
                </p>
                <p className="text-gray-600 mt-[4px]">
                  <span className="font-medium text-gray-800">現地決済:</span>{" "}
                  &minus; 手数料合計
                </p>
                <p className="text-xs text-gray-400 pl-[68px]">
                  = &minus; ロイヤリティ額（ベンダーがリンクスへ支払い）
                </p>
              </div>
            </div>

            {/* ── 6. 月次精算 ── */}
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-[8px]">6. 月次精算</h3>
              <div className="bg-amber-50 border border-amber-200 p-[12px] space-y-[6px]">
                <p className="text-gray-600">
                  月内全予約のベンダー支払額を合算
                </p>
                <p className="text-gray-600">
                  <span className="font-medium text-green-700">プラス →</span>{" "}
                  リンクスからベンダーへ支払い
                </p>
                <p className="text-gray-600">
                  <span className="font-medium text-red-700">マイナス →</span>{" "}
                  ベンダーへ請求
                </p>
              </div>
            </div>

            {/* ── 7. 分配 ── */}
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-[8px]">7. 運営3社 分配</h3>
              <div className="bg-gray-50 border border-gray-200 p-[12px] space-y-[6px]">
                <p className="text-gray-600">
                  <span className="font-medium text-gray-800">リンクス:</span>{" "}
                  ロイヤリティ額 &times; {fees.royalty_split_linkus}%
                </p>
                <p className="text-gray-600">
                  <span className="font-medium text-gray-800">システム開発:</span>{" "}
                  ロイヤリティ額 &times; {fees.royalty_split_system_dev}%
                </p>
                <p className="text-gray-600">
                  <span className="font-medium text-gray-800">アディショナルワン:</span>{" "}
                  ロイヤリティ額 &times; {fees.royalty_split_additional_one}%
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ============================================================ */}
        {/* メール設定 */}
        {/* ============================================================ */}
        <section className="bg-white border border-gray-200 p-[24px]">
          <h2 className="font-serif text-lg font-light mb-[20px]">メール設定</h2>
          <div className="space-y-[16px]">
            <div>
              <label className="block text-sm font-sans text-gray-700 mb-[6px]">送信元メールアドレス</label>
              <input type="email" value={emailFrom} onChange={(e) => setEmailFrom(e.target.value)}
                className="w-full border border-gray-300 px-[12px] py-[8px] text-sm font-sans focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-sm font-sans text-gray-700 mb-[6px]">送信者名</label>
              <input type="text" value={emailName} onChange={(e) => setEmailName(e.target.value)}
                className="w-full border border-gray-300 px-[12px] py-[8px] text-sm font-sans focus:outline-none focus:border-accent" />
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* メンテナンスモード */}
        {/* ============================================================ */}
        <section className="bg-white border border-gray-200 p-[24px]">
          <h2 className="font-serif text-lg font-light mb-[20px]">メンテナンスモード</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-sans text-gray-700">メンテナンスモード</p>
              <p className="text-xs font-sans text-gray-400 mt-[2px]">有効にするとユーザーにメンテナンス画面が表示されます</p>
            </div>
            <button
              onClick={() => setMaint(!maint)}
              className={"relative w-[48px] h-[24px] transition-colors " + (maint ? "bg-accent" : "bg-gray-300")}
            >
              <span className={"absolute top-[2px] w-[20px] h-[20px] bg-white transition-transform " + (maint ? "left-[26px]" : "left-[2px]")} />
            </button>
          </div>
          {maint && (
            <div className="mt-[12px] bg-red-50 border border-red-200 p-[12px]">
              <p className="text-sm font-sans text-red-600">メンテナンスモードが有効です。</p>
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* 全体保存 */}
        {/* ============================================================ */}
        <div className="flex gap-[12px]">
          <button
            onClick={() => console.log("saved", { siteName, siteUrl, logoFile, emailFrom, emailName, maint })}
            className="bg-black text-white px-[32px] py-[12px] text-sm font-sans hover:bg-gray-800 transition-colors"
          >
            基本設定を保存
          </button>
          <button className="border border-gray-300 px-[32px] py-[12px] text-sm font-sans hover:bg-gray-50">
            リセット
          </button>
        </div>
      </div>
    </div>
  );
}
