import type { ParsedVehicleRecord } from "@/types/insurance";

// 全角→半角変換
function toHalfWidth(str: string): string {
  return str
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
    )
    .replace(/　/g, ' ')
    .replace(/−/g, '-')
    .replace(/：/g, ':')
    .replace(/．/g, '.');
}

// 正規化: ハイフン除去、大文字統一、スペース除去
export function normalizeFrameNumber(raw: string): string {
  return toHalfWidth(raw).replace(/[-\s]/g, '').toUpperCase();
}

// 正規化: 全角スペース→半角、中黒除去、全角数字→半角
export function normalizeRegistrationNumber(raw: string): string {
  return toHalfWidth(raw).replace(/[・]/g, '').replace(/\s+/g, ' ').trim();
}

// テキストアイテム（位置情報付き）
interface TextItem {
  str: string;
  x: number;
  y: number;
}

// ページからテキストアイテムを抽出
async function extractTextItems(page: { getTextContent: () => Promise<{ items: unknown[] }> }): Promise<TextItem[]> {
  const content = await page.getTextContent();
  const items: TextItem[] = [];
  for (const raw of content.items) {
    const item = raw as { str?: string; transform?: number[] };
    if (item.str && item.str.trim() && item.transform) {
      items.push({
        str: item.str.trim(),
        x: Math.round(item.transform[4]),
        y: Math.round(item.transform[5]),
      });
    }
  }
  return items;
}

// 指定ラベルの右側にあるテキストを取得
// xMax: 値の取得範囲の上限x座標（他のラベルの侵入を防止）
function findValueByLabel(
  items: TextItem[],
  labelText: string,
  tolerance: number = 5,
  xMax: number = 310
): string {
  const label = items.find((i) => i.str === labelText || i.str.includes(labelText));
  if (!label) return '';

  // ラベルと同じy座標（±tolerance）で、ラベルより右 かつ xMax未満のテキストを取得
  const candidates = items.filter(
    (i) =>
      Math.abs(i.y - label.y) <= tolerance &&
      i.x > label.x + 10 &&
      i.x < xMax &&
      i.str !== labelText &&
      !i.str.includes(labelText)
  );
  candidates.sort((a, b) => a.x - b.x);
  return candidates.map((v) => v.str).join(' ').trim();
}

interface ParseResult {
  records: ParsedVehicleRecord[];
  warnings: string[];
}

export async function parseInsuranceCertificate(
  pdfData: ArrayBuffer,
  password: string
): Promise<ParseResult> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const path = await import('path');
  const workerPath = path.join(
    process.cwd(),
    'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'
  );
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;

  let pdf;
  try {
    pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(pdfData),
      password,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise;
  } catch (err: unknown) {
    const error = err as Error;
    if (error.name === 'PasswordException' || error.message?.includes('password')) {
      throw new Error('PDFパスワードが正しくありません');
    }
    throw new Error(`PDF読み込みエラー: ${error.message}`);
  }

  const records: ParsedVehicleRecord[] = [];
  const warnings: string[] = [];

  // 2ページ = 1台。奇数ページ = 車両データ、偶数ページ = 補償詳細 + 作成日
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 2) {
    try {
      const oddPage = await pdf.getPage(pageNum);
      const oddItems = await extractTextItems(oddPage);

      // 明細番号（右端エリア x>480）
      const detailNumber = findValueByLabel(oddItems, '明細番号', 3, 600);

      // --- 車両所有者 ---
      // PDF構造: "車両所有者" ラベル(x≈36,y≈455) → その下の "氏名"(x≈91,y≈463) → 値(x≈123,y≈463)
      // 「車両所有者」と「ご契約の自動車」の間にある氏名テキストを取得
      const ownerLabel = oddItems.find((i) => i.str === '車両所有者');
      const vehicleSectionLabel = oddItems.find((i) => i.str === 'ご契約の自動車');
      let vehicleOwner = '';
      if (ownerLabel) {
        // 車両所有者ラベル(y≈455)付近で、氏名ラベルの右の値を探す
        // 氏名はx≈91で、車両所有者と同じy帯（±15）にある
        const nameLabel = oddItems.find(
          (i) =>
            i.str === '氏名' &&
            i.y < (ownerLabel.y + 5) &&
            i.y > (vehicleSectionLabel ? vehicleSectionLabel.y : ownerLabel.y - 30)
        );
        if (nameLabel) {
          const nameVals = oddItems.filter(
            (i) =>
              Math.abs(i.y - nameLabel.y) <= 5 &&
              i.x > nameLabel.x + 10 &&
              i.x < 300 &&
              i.str !== '氏名'
          );
          nameVals.sort((a, b) => a.x - b.x);
          vehicleOwner = nameVals.map((v) => v.str).join('').trim();
        }
      }

      // --- 車両データ ---
      // ラベル群は x≈31, 値は x≈98, 右側のラベル（用途車種等）は x≈320以降
      // xMax=300 で右側ラベルの値が混入しないようにする
      const vehicleName = findValueByLabel(oddItems, '車名', 3, 300);
      const registrationNumber = findValueByLabel(oddItems, '登録番号(車両番号)', 5, 300);

      // 車台番号: x<300 に制限して電気自動車等の混入を防ぐ
      const frameNumber = findValueByLabel(oddItems, '車台番号', 3, 300);
      const modelSpec = findValueByLabel(oddItems, '型式・仕様', 3, 300);
      const firstRegistration = findValueByLabel(oddItems, '初度登録年月', 3, 300);
      const inspectionExpiry = findValueByLabel(oddItems, '車検満了日', 3, 300);

      // 用途車種: 右側エリア（x≈320以降）
      const usageLabel = oddItems.find((i) => i.str === '用途車種');
      let usageVehicleType = '';
      if (usageLabel) {
        const usageVals = oddItems.filter(
          (i) =>
            Math.abs(i.y - usageLabel.y) <= 3 &&
            i.x > usageLabel.x + 10 &&
            i.str !== '用途車種'
        );
        usageVals.sort((a, b) => a.x - b.x);
        usageVehicleType = usageVals[0]?.str || '';
      }

      // 電気自動車・ハイブリッド・AEB
      const evLabel = oddItems.find((i) => i.str === '電気自動車');
      let isElectricVehicle = false;
      let isHybrid = false;
      let isAeb = false;
      if (evLabel) {
        // 電気自動車の直後の値（x > evLabel.x かつ同じy行）
        const evVal = oddItems.find(
          (i) =>
            Math.abs(i.y - evLabel.y) <= 3 &&
            i.x > evLabel.x + 5 &&
            i.x < evLabel.x + 50 &&
            (i.str === 'なし' || i.str === 'あり')
        );
        isElectricVehicle = evVal?.str === 'あり';

        // ハイブリッド
        const hvLabel = oddItems.find(
          (i) =>
            Math.abs(i.y - evLabel.y) <= 3 &&
            (i.str.includes('ﾊｲﾌﾞﾘｯﾄﾞ') || i.str.includes('ハイブリッド'))
        );
        if (hvLabel) {
          const hvVal = oddItems.find(
            (i) =>
              Math.abs(i.y - hvLabel.y) <= 3 &&
              i.x > hvLabel.x + 5 &&
              i.x < hvLabel.x + 50 &&
              (i.str === 'なし' || i.str === 'あり')
          );
          isHybrid = hvVal?.str === 'あり';
        }

        // AEB
        const aebLabel = oddItems.find(
          (i) =>
            Math.abs(i.y - evLabel.y) <= 3 &&
            (i.str === 'ＡＥＢ' || i.str === 'AEB')
        );
        if (aebLabel) {
          const aebVal = oddItems.find(
            (i) =>
              Math.abs(i.y - aebLabel.y) <= 3 &&
              i.x > aebLabel.x + 5 &&
              i.x < aebLabel.x + 50 &&
              (i.str === 'なし' || i.str === 'あり')
          );
          isAeb = aebVal?.str === 'あり';
        }
      }

      // 偶数ページから作成日を取得
      let documentDate = '';
      if (pageNum + 1 <= pdf.numPages) {
        const evenPage = await pdf.getPage(pageNum + 1);
        const evenItems = await extractTextItems(evenPage);
        const dateLabel = evenItems.find((i) => i.str.includes('作成日'));
        if (dateLabel) {
          const dateVals = evenItems.filter(
            (i) => Math.abs(i.y - dateLabel.y) <= 3 && i.x > dateLabel.x + 10
          );
          dateVals.sort((a, b) => a.x - b.x);
          documentDate = dateVals.map((v) => v.str).join('').trim();
        }
      }

      // 必須フィールドチェック
      if (!frameNumber && !registrationNumber) {
        warnings.push(`明細${detailNumber || '不明'}: 車台番号・登録番号の両方が欠落`);
      }

      records.push({
        detailNumber: detailNumber || String(records.length + 1).padStart(3, '0'),
        vehicleOwner,
        vehicleName,
        registrationNumber,
        frameNumber,
        modelSpec,
        firstRegistration,
        inspectionExpiry,
        usageVehicleType,
        isElectricVehicle,
        isHybrid,
        isAeb,
        documentDate,
        pageStart: pageNum,
        pageEnd: pageNum + 1,
      });
    } catch (e) {
      warnings.push(`ページ${pageNum}-${pageNum + 1}: 解析エラー (${(e as Error).message})`);
    }
  }

  if (records.length === 0) {
    warnings.push('PDFから車両データを抽出できませんでした。フォーマットを確認してください。');
  }

  return { records, warnings };
}
