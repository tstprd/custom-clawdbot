/**
 * Path helper to fix "Le chemin d'accès spécifié est introuvable" errors
 * Always returns correct paths even when called from cron jobs
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get repo root: skills/google/scripts -> ../../../
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const REPO_ROOT = join(__dirname, '../../..');

// Common paths
export const TOKENS_ALEJMUROT = join(REPO_ROOT, '.clawdbot-google-tokens.json');
export const TOKENS_JMUDES = join(REPO_ROOT, '.clawdbot-google-tokens-jmudes.json');
export const OUTPUT_FILE = join(REPO_ROOT, 'ha-output.txt');
