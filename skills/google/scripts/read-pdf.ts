/**
 * Read PDF content using pdf-parse
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');

async function main() {
  try {
    const pdfParse = await import('pdf-parse');
    
    const args = process.argv.slice(2);
    if (args.length < 1) {
      writeFileSync(OUTPUT_FILE, 'Usage: pnpm tsx read-pdf.ts <pdf_file_path>');
      return;
    }
    
    const pdfPath = args[0];
    const dataBuffer = readFileSync(pdfPath);
    
    const data = await pdfParse.default(dataBuffer);
    
    let report = `📄 CONTENU PDF: ${pdfPath}\n`;
    report += '='.repeat(60) + '\n\n';
    report += `Pages: ${data.numpages}\n\n`;
    report += 'TEXTE EXTRAIT:\n';
    report += '='.repeat(60) + '\n\n';
    report += data.text;
    report += '\n\n' + '='.repeat(60) + '\n';
    
    writeFileSync(OUTPUT_FILE, report);
    
  } catch (err: any) {
    writeFileSync(OUTPUT_FILE, `❌ Erreur: ${err.message}\n\nInstaller pdf-parse avec: pnpm add pdf-parse`);
  }
}

main();
