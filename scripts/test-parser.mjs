import { readFileSync } from 'fs';
import { join } from 'path';

async function main() {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const workerPath = join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;

  const pdfPath = '/Users/K-M/Downloads/R8.2.25 ご契約内容-1.pdf';
  const password = 'Ade0000/';
  const data = readFileSync(pdfPath);

  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(data.buffer),
    password,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;

  console.log(`Total pages: ${pdf.numPages}, Expected: ${pdf.numPages / 2} vehicles\n`);

  async function extractTextItems(page) {
    const content = await page.getTextContent();
    return content.items
      .filter((i) => i.str && i.str.trim() && i.transform)
      .map((i) => ({ str: i.str.trim(), x: Math.round(i.transform[4]), y: Math.round(i.transform[5]) }));
  }

  function findValueByLabel(items, labelText, tolerance = 5, xMax = 310) {
    const label = items.find((i) => i.str === labelText || i.str.includes(labelText));
    if (!label) return '';
    const candidates = items.filter(
      (i) => Math.abs(i.y - label.y) <= tolerance && i.x > label.x + 10 && i.x < xMax && i.str !== labelText && !i.str.includes(labelText)
    );
    candidates.sort((a, b) => a.x - b.x);
    return candidates.map((v) => v.str).join(' ').trim();
  }

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 2) {
    const oddPage = await pdf.getPage(pageNum);
    const oddItems = await extractTextItems(oddPage);

    const detailNumber = findValueByLabel(oddItems, '明細番号', 3, 600);
    const vehicleName = findValueByLabel(oddItems, '車名', 3, 300);
    const registrationNumber = findValueByLabel(oddItems, '登録番号(車両番号)', 5, 300);
    const frameNumber = findValueByLabel(oddItems, '車台番号', 3, 300);
    const modelSpec = findValueByLabel(oddItems, '型式・仕様', 3, 300);
    const firstRegistration = findValueByLabel(oddItems, '初度登録年月', 3, 300);
    const inspectionExpiry = findValueByLabel(oddItems, '車検満了日', 3, 300);

    // 用途車種
    const usageLabel = oddItems.find((i) => i.str === '用途車種');
    const usageVehicleType = usageLabel
      ? (oddItems.filter((i) => Math.abs(i.y - usageLabel.y) <= 3 && i.x > usageLabel.x + 10 && i.str !== '用途車種').sort((a, b) => a.x - b.x)[0]?.str || '')
      : '';

    // 車両所有者
    const ownerLabel = oddItems.find((i) => i.str === '車両所有者');
    const vehicleSectionLabel = oddItems.find((i) => i.str === 'ご契約の自動車');
    let vehicleOwner = '';
    if (ownerLabel) {
      const nameLabel = oddItems.find(
        (i) => i.str === '氏名' && i.y < (ownerLabel.y + 5) && i.y > (vehicleSectionLabel ? vehicleSectionLabel.y : ownerLabel.y - 30)
      );
      if (nameLabel) {
        const nameVals = oddItems.filter((i) => Math.abs(i.y - nameLabel.y) <= 5 && i.x > nameLabel.x + 10 && i.x < 300 && i.str !== '氏名');
        nameVals.sort((a, b) => a.x - b.x);
        vehicleOwner = nameVals.map((v) => v.str).join('').trim();
      }
    }

    // EV/HV/AEB
    const evLabel = oddItems.find((i) => i.str === '電気自動車');
    let ev = false, hv = false, aeb = false;
    if (evLabel) {
      const evVal = oddItems.find((i) => Math.abs(i.y - evLabel.y) <= 3 && i.x > evLabel.x + 5 && i.x < evLabel.x + 50 && (i.str === 'なし' || i.str === 'あり'));
      ev = evVal?.str === 'あり';
      const hvLabel = oddItems.find((i) => Math.abs(i.y - evLabel.y) <= 3 && (i.str.includes('ﾊｲﾌﾞﾘｯﾄﾞ') || i.str.includes('ハイブリッド')));
      if (hvLabel) { const hvVal = oddItems.find((i) => Math.abs(i.y - hvLabel.y) <= 3 && i.x > hvLabel.x + 5 && i.x < hvLabel.x + 50 && (i.str === 'なし' || i.str === 'あり')); hv = hvVal?.str === 'あり'; }
      const aebLabel = oddItems.find((i) => Math.abs(i.y - evLabel.y) <= 3 && (i.str === 'ＡＥＢ' || i.str === 'AEB'));
      if (aebLabel) { const aebVal = oddItems.find((i) => Math.abs(i.y - aebLabel.y) <= 3 && i.x > aebLabel.x + 5 && i.x < aebLabel.x + 50 && (i.str === 'なし' || i.str === 'あり')); aeb = aebVal?.str === 'あり'; }
    }

    // 作成日
    let documentDate = '';
    if (pageNum + 1 <= pdf.numPages) {
      const evenPage = await pdf.getPage(pageNum + 1);
      const evenItems = await extractTextItems(evenPage);
      const dateLabel = evenItems.find((i) => i.str.includes('作成日'));
      if (dateLabel) {
        const dateVals = evenItems.filter((i) => Math.abs(i.y - dateLabel.y) <= 3 && i.x > dateLabel.x + 10);
        dateVals.sort((a, b) => a.x - b.x);
        documentDate = dateVals.map((v) => v.str).join('').trim();
      }
    }

    const idx = Math.floor(pageNum / 2) + 1;
    console.log(`--- 車両 ${idx} (明細${detailNumber}) ---`);
    console.log(`  所有者: ${vehicleOwner || '(空)'}`);
    console.log(`  車名: ${vehicleName}`);
    console.log(`  登録番号: ${registrationNumber}`);
    console.log(`  車台番号: ${frameNumber}`);
    console.log(`  型式: ${modelSpec}  |  初度登録: ${firstRegistration}  |  車検: ${inspectionExpiry || 'なし'}`);
    console.log(`  用途: ${usageVehicleType}  |  EV:${ev} HV:${hv} AEB:${aeb}  |  作成日: ${documentDate}`);
    console.log('');
  }
}

main().catch(console.error);
