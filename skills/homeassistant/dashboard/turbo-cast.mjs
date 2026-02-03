import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const start = Date.now();
console.log('🚀 TURBO CAST START');

// Config
const DASHBOARD_URL = `file://${path.join(__dirname, 'index.html').replace(/\\/g, '/')}`;
const SCREENSHOT_PATH = path.join(__dirname, 'dashboard.png');
const CHROMECAST = 'media_player.chromecastultra0413';
const IMAGE_URL = 'http://192.168.1.78:8765/dashboard.png';

// Load HA credentials
const env = fs.readFileSync('C:/Users/jules/repo/claude-home/.env', 'utf-8');
const vars = {};
for (const line of env.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx > 0) vars[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
}
const HA_URL = vars.HA_API_URL || 'http://192.168.1.98:8123';
const HA_TOKEN = vars.HA_API_TOKEN;

async function main() {
  // Launch browser, screenshot, close
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle' });
  await page.screenshot({ path: SCREENSHOT_PATH, type: 'png' });
  await browser.close();
  
  const screenshotTime = Date.now() - start;
  console.log(`📸 Screenshot: ${screenshotTime}ms`);

  // Cast to Chromecast
  const castStart = Date.now();
  await fetch(`${HA_URL}/api/services/media_player/play_media`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HA_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      entity_id: CHROMECAST,
      media_content_id: IMAGE_URL + '?t=' + Date.now(),
      media_content_type: 'image/png'
    })
  });
  
  const castTime = Date.now() - castStart;
  const totalTime = Date.now() - start;
  
  console.log(`📺 Cast: ${castTime}ms`);
  console.log(`✅ TOTAL: ${totalTime}ms`);
}

main().catch(console.error);
