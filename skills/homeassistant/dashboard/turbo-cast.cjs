const fs = require('fs');
const http = require('http');

const start = Date.now();
console.log('🚀 TURBO CAST');

// Config
const DASHBOARD_DIR = __dirname;
const SCREENSHOT_PATH = `${DASHBOARD_DIR}\\dashboard.png`;
const CHROMECAST = 'media_player.chromecastultra0413';
const IMAGE_URL = 'http://192.168.1.78:8765/dashboard.png';
const CDP_URL = 'http://127.0.0.1:18800';

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
  // Get pages from CDP
  const pagesRes = await fetch(`${CDP_URL}/json`);
  const pages = await pagesRes.json();
  
  // Find dashboard page or use first
  let page = pages.find(p => p.url.includes('dashboard')) || pages[0];
  if (!page) throw new Error('No browser page found');
  
  console.log(`📄 Using page: ${page.title || page.url}`);
  
  // Connect via WebSocket and take screenshot
  const ws = new (require('ws'))(page.webSocketDebuggerUrl);
  
  await new Promise((resolve, reject) => {
    ws.on('open', async () => {
      let id = 1;
      const send = (method, params = {}) => {
        return new Promise((res) => {
          const msgId = id++;
          ws.once('message', (data) => {
            const msg = JSON.parse(data.toString());
            if (msg.id === msgId) res(msg.result);
          });
          ws.send(JSON.stringify({ id: msgId, method, params }));
        });
      };
      
      // Navigate to refresh
      await send('Page.navigate', { url: `file:///${DASHBOARD_DIR.replace(/\\/g, '/')}/index.html` });
      await new Promise(r => setTimeout(r, 1000)); // Wait for load
      
      // Screenshot
      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(SCREENSHOT_PATH, Buffer.from(data, 'base64'));
      
      console.log(`📸 Screenshot: ${Date.now() - start}ms`);
      ws.close();
      resolve();
    });
    ws.on('error', reject);
  });

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
  
  console.log(`📺 Cast: ${Date.now() - castStart}ms`);
  console.log(`✅ TOTAL: ${Date.now() - start}ms`);
}

main().catch(console.error);
