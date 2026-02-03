/**
 * FAST Dashboard Server - Pre-renders screenshot every 30s
 * Cast = instant (just serves pre-rendered image)
 */

const http = require('http');
const fs = require('fs');

const PORT = 8766;
const DASHBOARD_DIR = __dirname;
const SCREENSHOT_PATH = `${DASHBOARD_DIR}\\dashboard.png`;
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

const TV_ENTITY = 'media_player.samsung_6_series_49';
const CHROMECAST_ENTITY = 'media_player.chromecastultra0413';
const IMAGE_URL = 'http://192.168.1.78:8765/dashboard.png';

// HA API helper
async function haService(domain, service, data) {
  try {
    await fetch(`${HA_URL}/api/services/${domain}/${service}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${HA_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return true;
  } catch { return false; }
}

// Take screenshot via CDP
async function updateScreenshot() {
  try {
    const pagesRes = await fetch(`${CDP_URL}/json`);
    const pages = await pagesRes.json();
    let page = pages.find(p => p.url.includes('dashboard')) || pages[0];
    if (!page) return false;
    
    const ws = new (require('ws'))(page.webSocketDebuggerUrl);
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { ws.close(); reject(new Error('timeout')); }, 5000);
      ws.on('open', async () => {
        let id = 1;
        const send = (method, params = {}) => new Promise((res) => {
          const msgId = id++;
          const handler = (data) => {
            const msg = JSON.parse(data.toString());
            if (msg.id === msgId) { ws.off('message', handler); res(msg.result); }
          };
          ws.on('message', handler);
          ws.send(JSON.stringify({ id: msgId, method, params }));
        });
        
        await send('Page.navigate', { url: `file:///${DASHBOARD_DIR.replace(/\\/g, '/')}/index.html` });
        await new Promise(r => setTimeout(r, 800));
        const { data } = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(SCREENSHOT_PATH, Buffer.from(data, 'base64'));
        clearTimeout(timeout);
        ws.close();
        resolve();
      });
      ws.on('error', () => { clearTimeout(timeout); reject(); });
    });
    return true;
  } catch (e) {
    console.error('Screenshot error:', e.message);
    return false;
  }
}

// Pre-render loop (every 30s)
let lastUpdate = 0;
async function preRenderLoop() {
  const ok = await updateScreenshot();
  lastUpdate = Date.now();
  if (ok) console.log(`🔄 Screenshot updated`);
  setTimeout(preRenderLoop, 30000);
}

// FAST Cast - just sends pre-rendered image
async function fastCast() {
  const start = Date.now();
  console.log('⚡ FAST CAST');
  
  // Parallel: Turn on TV + Cast (don't wait for TV)
  haService('media_player', 'turn_on', { entity_id: TV_ENTITY });
  
  // Cast immediately
  await haService('media_player', 'play_media', {
    entity_id: CHROMECAST_ENTITY,
    media_content_id: IMAGE_URL + '?t=' + Date.now(),
    media_content_type: 'image/png'
  });
  
  const time = Date.now() - start;
  console.log(`✅ Cast sent in ${time}ms`);
  return { success: true, time };
}

// Stop cast and turn off TV
async function stopCast() {
  console.log('🛑 STOP');
  await Promise.all([
    haService('media_player', 'media_stop', { entity_id: CHROMECAST_ENTITY }),
    haService('media_player', 'turn_off', { entity_id: TV_ENTITY })
  ]);
  return { success: true };
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    if (url.pathname === '/cast') {
      const result = await fastCast();
      res.end(JSON.stringify(result));
    } else if (url.pathname === '/stop') {
      const result = await stopCast();
      res.end(JSON.stringify(result));
    } else if (url.pathname === '/refresh') {
      await updateScreenshot();
      res.end(JSON.stringify({ success: true, time: Date.now() }));
    } else if (url.pathname === '/status') {
      res.end(JSON.stringify({ 
        status: 'ok', 
        uptime: process.uptime(),
        lastScreenshot: lastUpdate ? new Date(lastUpdate).toISOString() : null
      }));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`⚡ FAST Dashboard Server on http://0.0.0.0:${PORT}`);
  console.log('   GET /cast    → Instant cast (pre-rendered)');
  console.log('   GET /stop    → Stop + TV off');
  console.log('   GET /refresh → Force screenshot update');
  console.log('');
  console.log('🔄 Starting pre-render loop (every 30s)...');
  preRenderLoop();
});
