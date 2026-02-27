// PDF生テキストダンプ用デバッグスクリプト
import { readFileSync, writeFileSync } from 'fs';
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

  console.log(`Total pages: ${pdf.numPages}`);

  let output = '';
  for (let i = 1; i <= Math.min(pdf.numPages, 4); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    output += `\n========== PAGE ${i} ==========\n`;

    // 各テキストアイテムの詳細（位置情報付き）
    for (const item of content.items) {
      if ('str' in item && item.str) {
        const t = item.transform;
        output += `[x:${Math.round(t[4])} y:${Math.round(t[5])}] "${item.str}"\n`;
      }
    }

    output += `\n--- JOINED TEXT ---\n`;
    const joined = content.items
      .map(item => ('str' in item ? item.str : ''))
      .join(' ');
    output += joined + '\n';
  }

  writeFileSync('/tmp/pdf-debug-output.txt', output, 'utf-8');
  console.log('Output written to /tmp/pdf-debug-output.txt');
}

main().catch(console.error);
