const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');

const PORT = 8766;
const DIR = 'C:\\Users\\jules\\repo\\clawdbot\\skills\\homeassistant\\dashboard';

// Load HA credentials
let HA_URL = 'http://192.168.1.98:8123';
let HA_TOKEN = '';
try {
  const env = fs.readFileSync('C:/Users/jules/repo/claude-home/.env', 'utf-8');
  for (const line of env.split('\n')) {
    if (line.includes('HA_API_URL=')) HA_URL = line.split('=')[1].trim();
    if (line.includes('HA_API_TOKEN=')) HA_TOKEN = line.split('=')[1].trim();
  }
} catch (e) {}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  console.log(`${new Date().toISOString()} ${url}`);
  
  res.setHeader('Content-Type', 'application/json');
  
  if (url === '/cast') {
    exec(`node "${DIR}\\turbo-cast.cjs"`, (err, stdout, stderr) => {
      if (err) {
        res.end(JSON.stringify({ ok: false, error: err.message }));
      } else {
        res.end(JSON.stringify({ ok: true, output: stdout }));
      }
    });
  } else if (url === '/stop') {
    // Stop chromecast + turn off TV
    Promise.all([
      fetch(`${HA_URL}/api/services/media_player/media_stop`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${HA_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_id: 'media_player.chromecastultra0413' })
      }),
      fetch(`${HA_URL}/api/services/media_player/turn_off`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${HA_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_id: 'media_player.samsung_6_series_49' })
      })
    ]).then(() => {
      res.end(JSON.stringify({ ok: true }));
    }).catch(e => {
      res.end(JSON.stringify({ ok: false, error: e.message }));
    });
  } else {
    res.end(JSON.stringify({ status: 'ready' }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Dashboard server on http://0.0.0.0:${PORT}`);
});
