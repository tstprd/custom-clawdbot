import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const scpiDir = join(__dirname, 'scpi-pdfs');

const scpis = [
  'Bulletin T3 2025 - EPARGNE PIERRE EUROPE.pdf',
  'Bulletin 3T 2025 - EDR EUROPA.pdf',
  'BULLETIN T3 2025 - TRANSITION EUROPE.pdf'
];

async function analyzeSCPI(filename) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 ${filename.replace('Bulletin T3 2025 - ', '').replace('Bulletin 3T 2025 - ', '').replace('.pdf', '')}`);
  console.log('='.repeat(60));
  
  const dataBuffer = readFileSync(join(scpiDir, filename));
  const data = await pdfParse(dataBuffer);
  
  const text = data.text;
  
  console.log('\n--- TEXTE COMPLET ---\n');
  console.log(text);
  console.log('\n' + '='.repeat(60) + '\n');
}

async function main() {
  for (const scpi of scpis) {
    try {
      await analyzeSCPI(scpi);
    } catch (err) {
      console.error(`❌ Erreur pour ${scpi}:`, err);
    }
  }
}

main().catch(console.error);
