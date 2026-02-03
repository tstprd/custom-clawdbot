/**
 * Path helper for Home Assistant scripts
 * Fix "Le chemin d'accès spécifié est introuvable" errors
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get repo root: skills/homeassistant/scripts -> ../../../
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const REPO_ROOT = join(__dirname, '../../..');

// Common paths
export const OUTPUT_FILE = join(REPO_ROOT, 'ha-output.txt');
export const PRESENCE_STATE_FILE = join(__dirname, 'presence-state.json');
