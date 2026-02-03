const fs = require('fs');
const http = require('http');
const { execSync } = require('child_process');

const start = Date.now();
console.log('⏱️ START');

// Config
const DASHBOARD_DIR = __dirname;
const SCREENSHOT_PATH = `${DASHBOARD_DIR}\\dashboard.png`;
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

// Find latest screenshot in browser folder
const browserDir = 'C:\\Users\\jules\\.clawdbot\\media\\browser';
const files = fs.readdirSync(browserDir)
  .filter(f => f.endsWith('.png'))
  .map(f => ({ name: f, time: fs.statSync(`${browserDir}\\${f}`).mtime }))
  .sort((a, b) => b.time - a.time);

if (files.length > 0) {
  const latest = `${browserDir}\\${files[0].name}`;
  fs.copyFileSync(latest, SCREENSHOT_PATH);
  console.log(`📸 Copied: ${files[0].name}`);
}

// Cast to Chromecast
fetch(`${HA_URL}/api/services/media_player/play_media`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${HA_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    entity_id: CHROMECAST,
    media_content_id: IMAGE_URL + '?t=' + Date.now(), // Cache bust
    media_content_type: 'image/png'
  })
})
.then(r => {
  const elapsed = Date.now() - start;
  console.log(`✅ Cast sent in ${elapsed}ms`);
})
.catch(err => console.error('Error:', err.message));
