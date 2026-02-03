/**
 * Dashboard Cast Server
 * Endpoints:
 *   GET /cast   → Turn on TV + Cast dashboard
 *   GET /stop   → Stop cast + Turn off TV
 *   GET /status → Check server status
 */

const http = require('http');
const fs = require('fs');
const { exec } = require('child_process');

const PORT = 8766;
const DASHBOARD_DIR = __dirname;

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

const TV_ENTITY = 'media_player.samsung_6_series_49';
const CHROMECAST_ENTITY = 'media_player.chromecastultra0413';
const SCREENSHOT_PATH = `${DASHBOARD_DIR}\\dashboard.png`;
const IMAGE_URL = 'http://192.168.1.78:8765/dashboard.png';
const CDP_URL = 'http://127.0.0.1:18800';

// HA API helper
async function haService(domain, service, data) {
  const res = await fetch(`${HA_URL}/api/services/${domain}/${service}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HA_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return res.ok;
}

// Take screenshot via CDP
async function takeScreenshot() {
  const pagesRes = await fetch(`${CDP_URL}/json`);
  const pages = await pagesRes.json();
  let page = pages.find(p => p.url.includes('dashboard')) || pages[0];
  if (!page) throw new Error('No browser page');
  
  const ws = new (require('ws'))(page.webSocketDebuggerUrl);
  
  return new Promise((resolve, reject) => {
    ws.on('open', async () => {
      let id = 1;
      const send = (method, params = {}) => {
        return new Promise((res) => {
          const msgId = id++;
          const handler = (data) => {
            const msg = JSON.parse(data.toString());
            if (msg.id === msgId) {
              ws.off('message', handler);
              res(msg.result);
            }
          };
          ws.on('message', handler);
          ws.send(JSON.stringify({ id: msgId, method, params }));
        });
      };
      
      await send('Page.navigate', { url: `file:///${DASHBOARD_DIR.replace(/\\/g, '/')}/index.html` });
      await new Promise(r => setTimeout(r, 1000));
      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(SCREENSHOT_PATH, Buffer.from(data, 'base64'));
      ws.close();
      resolve();
    });
    ws.on('error', reject);
  });
}

// Cast dashboard
async function castDashboard() {
  const start = Date.now();
  console.log('🚀 CAST: Starting...');
  
  // 1. Turn on TV
  await haService('media_player', 'turn_on', { entity_id: TV_ENTITY });
  console.log('📺 TV: ON');
  
  // 2. Wait for TV to boot
  await new Promise(r => setTimeout(r, 2000));
  
  // 3. Take screenshot
  await takeScreenshot();
  console.log('📸 Screenshot: OK');
  
  // 4. Cast to Chromecast
  await haService('media_player', 'play_media', {
    entity_id: CHROMECAST_ENTITY,
    media_content_id: IMAGE_URL + '?t=' + Date.now(),
    media_content_type: 'image/png'
  });
  console.log('📡 Cast: OK');
  
  console.log(`✅ Done in ${Date.now() - start}ms`);
  return { success: true, time: Date.now() - start };
}

// Stop cast and turn off TV
async function stopCast() {
  console.log('🛑 STOP: Stopping...');
  
  // 1. Stop Chromecast
  await haService('media_player', 'media_stop', { entity_id: CHROMECAST_ENTITY });
  console.log('📡 Cast: STOPPED');
  
  // 2. Turn off TV
  await haService('media_player', 'turn_off', { entity_id: TV_ENTITY });
  console.log('📺 TV: OFF');
  
  console.log('✅ Done');
  return { success: true };
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  res.setHeader('Content-Type', 'application/json');
  
  try {
    if (url.pathname === '/cast') {
      const result = await castDashboard();
      res.end(JSON.stringify(result));
    } else if (url.pathname === '/stop') {
      const result = await stopCast();
      res.end(JSON.stringify(result));
    } else if (url.pathname === '/status') {
      res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  } catch (err) {
    console.error('Error:', err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🖥️  Dashboard Control Server running on http://0.0.0.0:${PORT}`);
  console.log('   GET /cast   → Turn on TV + Cast dashboard');
  console.log('   GET /stop   → Stop cast + Turn off TV');
  console.log('   GET /status → Server status');
});
