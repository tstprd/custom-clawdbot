const fs = require('fs');

// Load HA credentials
const env = fs.readFileSync('C:/Users/jules/repo/claude-home/.env', 'utf-8');
const vars = {};
for (const line of env.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx > 0) {
    vars[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
}

const url = vars.HA_API_URL || 'http://192.168.1.98:8123';
const token = vars.HA_API_TOKEN;

const imageUrl = process.argv[2] || 'http://192.168.1.78:8765/dashboard.png';
const entityId = process.argv[3] || 'media_player.chromecastultra0413';

console.log(`Casting ${imageUrl} to ${entityId}...`);

fetch(`${url}/api/services/media_player/play_media`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    entity_id: entityId,
    media_content_id: imageUrl,
    media_content_type: 'image/png'
  })
})
.then(r => {
  console.log(`Response status: ${r.status}`);
  return r.text();
})
.then(text => {
  console.log('Response:', text);
  if (text.includes('error')) {
    console.log('Cast may have failed. Check if Chromecast is on.');
  } else {
    console.log('✅ Cast sent successfully!');
  }
})
.catch(err => {
  console.error('Error:', err.message);
});
