const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');

const PORT = 8766;
const DIR = __dirname;

// Load HA credentials
let HA_URL = 'http://192.168.1.98:8123';
let HA_TOKEN = '';
try {
  const env = fs.readFileSync('C:/Users/jules/repo/claude-home/.env', 'utf-8');
  for (const line of env.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i > 0) {
      const k = t.slice(0, i);
      const v = t.slice(i + 1);
      if (k === 'HA_API_URL') HA_URL = v;
      if (k === 'HA_API_TOKEN') HA_TOKEN = v;
    }
  }
} catch (e) {
  console.error('Failed to load .env:', e.message);
}

async function haCall(domain, service, data) {
  try {
    return await fetch(`${HA_URL}/api/services/${domain}/${service}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${HA_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (e) {
    console.error('HA call failed:', e.message);
    return null;
  }
}

async function doCast() {
  const start = Date.now();
  return new Promise((resolve) => {
    const proc = spawn('node', ['turbo-cast.cjs'], { cwd: DIR, shell: true });
    let output = '';
    proc.stdout.on('data', d => output += d);
    proc.stderr.on('data', d => output += d);
    proc.on('error', e => {
      console.error('Spawn error:', e.message);
      resolve({ success: false, error: e.message });
    });
    proc.on('close', (code) => {
      const time = Date.now() - start;
      console.log(`⚡ CAST done in ${time}ms (code ${code})`);
      resolve({ success: code === 0, time, output: output.trim() });
    });
  });
}

async function doStop() {
  console.log('🛑 STOP');
  await Promise.all([
    haCall('media_player', 'media_stop', { entity_id: 'media_player.chromecastultra0413' }),
    haCall('media_player', 'turn_off', { entity_id: 'media_player.samsung_6_series_49' })
  ]);
  return { success: true };
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const path = req.url.split('?')[0];
  console.log(`[${new Date().toISOString()}] ${req.method} ${path}`);
  
  try {
    if (path === '/cast') {
      const result = await doCast();
      res.end(JSON.stringify(result));
    } else if (path === '/stop') {
      const result = await doStop();
      res.end(JSON.stringify(result));
    } else {
      res.end(JSON.stringify({ status: 'ok', endpoints: ['/cast', '/stop'] }));
    }
  } catch (e) {
    console.error('Request error:', e.message);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: e.message }));
  }
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} already in use!`);
    process.exit(1);
  }
  console.error('Server error:', e.message);
});

process.on('uncaughtException', (e) => {
  console.error('Uncaught exception:', e.message);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🖥️ Dashboard Server: http://0.0.0.0:${PORT}`);
  console.log('   /cast → Cast dashboard');
  console.log('   /stop → Stop + TV off');
  console.log('   Ready!');
});
