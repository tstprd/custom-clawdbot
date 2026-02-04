/**
 * Phone Dashboard Server
 * - Sert le HTML
 * - WebSocket pour push en temps réel
 * - Surveille content.json pour updates
 * - Proxy Home Assistant
 * - Webhook pour OpenClaw
 */

import { WebSocketServer } from 'ws';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Config
const PORT = process.env.PORT || 3333;
const HA_URL = process.env.HA_URL || 'http://192.168.1.89:8123';
const HA_TOKEN = process.env.HA_TOKEN || '';
const CONTENT_FILE = path.join(__dirname, 'content.json');

// State
let clients = new Set();
let currentState = loadContent();

// Load content.json
function loadContent() {
  try {
    return JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
  } catch {
    return {
      temps: {
        salon: { value: 21, trend: '+0.5°/h', trendDir: 'up' },
        chambre: { value: 19, trend: 'stable', trendDir: '' },
        bureau: { value: 22, trend: '-0.3°/h', trendDir: 'down' }
      },
      message: {
        text: 'Dashboard connecté. Prêt à recevoir des commandes.',
        time: new Date().toLocaleTimeString('fr-FR')
      },
      buttons: {
        lights: false,
        heating: true,
        presence: true,
        tasks: false
      },
      stats: {
        tasks: 3,
        unread: 12
      },
      battery: 80
    };
  }
}

// Save content.json
function saveContent() {
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(currentState, null, 2));
}

// Watch content.json for external changes
fs.watch(CONTENT_FILE, (eventType) => {
  if (eventType === 'change') {
    try {
      const newState = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
      currentState = newState;
      broadcast(currentState);
      console.log('Content updated, broadcasting to clients');
    } catch (e) {
      console.error('Error reading content.json:', e);
    }
  }
});

// Broadcast to all clients
function broadcast(data) {
  const msg = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(msg);
    }
  });
}

// Fetch Home Assistant data
async function fetchHAData() {
  if (!HA_TOKEN) return;
  
  try {
    const sensors = [
      'sensor.temperature_salon',
      'sensor.temperature_chambre', 
      'sensor.temperature_bureau'
    ];
    
    for (const sensor of sensors) {
      const res = await fetch(`${HA_URL}/api/states/${sensor}`, {
        headers: { 'Authorization': `Bearer ${HA_TOKEN}` }
      });
      if (res.ok) {
        const data = await res.json();
        const room = sensor.split('_')[1];
        if (currentState.temps[room]) {
          currentState.temps[room].value = parseFloat(data.state) || currentState.temps[room].value;
        }
      }
    }
    
    saveContent();
    broadcast(currentState);
  } catch (e) {
    console.error('HA fetch error:', e.message);
  }
}

// HTTP Server
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // API: Push message
  if (url.pathname === '/api/message' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { text } = JSON.parse(body);
        currentState.message = {
          text,
          time: new Date().toLocaleTimeString('fr-FR')
        };
        saveContent();
        broadcast(currentState);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400);
        res.end('Invalid JSON');
      }
    });
    return;
  }
  
  // API: Update state
  if (url.pathname === '/api/state' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const update = JSON.parse(body);
        currentState = { ...currentState, ...update };
        saveContent();
        broadcast(currentState);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400);
        res.end('Invalid JSON');
      }
    });
    return;
  }
  
  // API: Get state
  if (url.pathname === '/api/state' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(currentState));
    return;
  }
  
  // Webhook for OpenClaw
  if (url.pathname === '/webhook/openclaw' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('OpenClaw webhook:', data);
        
        // Handle different webhook types
        if (data.message) {
          currentState.message = {
            text: data.message,
            time: new Date().toLocaleTimeString('fr-FR')
          };
        }
        if (data.stats) {
          currentState.stats = { ...currentState.stats, ...data.stats };
        }
        
        saveContent();
        broadcast(currentState);
        res.writeHead(200);
        res.end('OK');
      } catch (e) {
        res.writeHead(400);
        res.end('Invalid JSON');
      }
    });
    return;
  }
  
  // Serve static files
  let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
  filePath = path.join(__dirname, filePath);
  
  const ext = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json'
  };
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
    } else {
      res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
      res.end(content);
    }
  });
});

// WebSocket Server
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`Client connected (${clients.size} total)`);
  
  // Send current state
  ws.send(JSON.stringify(currentState));
  
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      console.log('Received:', data);
      
      // Handle voice commands
      if (data.type === 'voice') {
        console.log('Voice command:', data.text);
        // TODO: Forward to OpenClaw
        currentState.message = {
          text: `Commande reçue: "${data.text}"`,
          time: new Date().toLocaleTimeString('fr-FR')
        };
        saveContent();
        broadcast(currentState);
      }
      
      // Handle button actions
      if (data.type === 'action') {
        console.log('Action:', data.action);
        // Toggle button state
        if (currentState.buttons[data.action] !== undefined) {
          currentState.buttons[data.action] = !currentState.buttons[data.action];
          saveContent();
          broadcast(currentState);
        }
        // TODO: Forward to Home Assistant
      }
      
    } catch (e) {
      console.error('Message error:', e);
    }
  });
  
  ws.on('close', () => {
    clients.delete(ws);
    console.log(`Client disconnected (${clients.size} total)`);
  });
});

// Start
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Dashboard server running on http://0.0.0.0:${PORT}`);
  console.log(`WebSocket on ws://0.0.0.0:${PORT}/ws`);
  console.log(`Push messages via POST /api/message`);
  
  // Init content file
  saveContent();
  
  // Fetch HA data periodically
  if (HA_TOKEN) {
    fetchHAData();
    setInterval(fetchHAData, 30000);
  }
});
