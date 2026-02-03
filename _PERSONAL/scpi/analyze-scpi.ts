import { readFileSync } from 'fs';
import { join } from 'path';
import { PDFParse } from 'pdf-parse';

const scpiDir = join(process.cwd(), 'scpi-pdfs');

const scpis = [
  'Bulletin T3 2025 - EPARGNE PIERRE EUROPE.pdf',
  'Bulletin 3T 2025 - EDR EUROPA.pdf',
  'BULLETIN T3 2025 - TRANSITION EUROPE.pdf'
];

async function analyzeSCPI(filename: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 ${filename.replace('Bulletin T3 2025 - ', '').replace('Bulletin 3T 2025 - ', '').replace('.pdf', '')}`);
  console.log('='.repeat(60));

  const dataBuffer = readFileSync(join(scpiDir, filename));
  const parser = new PDFParse({ data: dataBuffer });
  const data = await parser.getText();
  await parser.destroy();

  const text = data.text;
  
  // Extract key metrics using regex patterns
  const metrics: any = {
    nom: filename.replace(/Bulletin.*2025 - /, '').replace('.pdf', ''),
    text: text.substring(0, 3000) // First 3000 chars for manual review
  };
  
  // Try to find common patterns
  const patterns = {
    capitalisation: /capitalisation.*?([0-9,. ]+)\s*(M€|millions?)/i,
    prixPart: /prix.*?souscription.*?([0-9,.]+)\s*€/i,
    prixReconstitution: /prix.*?reconstitution.*?([0-9,.]+)\s*€/i,
    tdvm: /TDVM.*?([0-9,.]+)\s*%/i,
    tof: /TOF.*?([0-9,.]+)\s*%/i,
    distribution: /distribution.*?([0-9,.]+)\s*€/i
  };
  
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match) {
      metrics[key] = match[1];
    }
  }
  
  console.log(JSON.stringify(metrics, null, 2));
  console.log('\n--- EXTRAIT DU TEXTE ---');
  console.log(text.substring(0, 2000));
  
  return metrics;
}

async function main() {
  const results = [];
  
  for (const scpi of scpis) {
    try {
      const result = await analyzeSCPI(scpi);
      results.push(result);
    } catch (err) {
      console.error(`❌ Erreur pour ${scpi}:`, err);
    }
  }
  
  console.log('\n\n' + '='.repeat(60));
  console.log('📋 RÉSUMÉ COMPARATIF');
  console.log('='.repeat(60));
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
