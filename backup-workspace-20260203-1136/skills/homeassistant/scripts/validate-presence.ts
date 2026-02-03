/**
 * Valide la proposition de présence pour application lundi 1h
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const STATE_FILE = join(process.cwd(), 'skills', 'homeassistant', 'scripts', 'presence-state.json');
const OUTPUT_FILE = join(process.cwd(), 'ha-output.txt');

function main() {
  try {
    const state = JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
    
    if (state.validated) {
      writeFileSync(OUTPUT_FILE, '✅ Configuration déjà validée.');
      return;
    }
    
    state.validated = true;
    state.validatedAt = new Date().toISOString();
    
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    writeFileSync(OUTPUT_FILE, '✅ Configuration validée. Elle sera appliquée lundi 1h du matin.');
  } catch (err) {
    writeFileSync(OUTPUT_FILE, `❌ Erreur: ${String(err)}`);
  }
}

main();
