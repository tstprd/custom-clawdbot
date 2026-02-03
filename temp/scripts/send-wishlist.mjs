#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join } from 'path';

const message = readFileSync(join(process.cwd(), 'wishlist-message.txt'), 'utf-8');
const groupJid = '120363328986424275@g.us';

console.log('Sending to:', groupJid);
console.log('Message length:', message.length);

// Use the gateway API
const gatewayUrl = 'http://localhost:3142';

try {
  const response = await fetch(`${gatewayUrl}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'whatsapp',
      to: groupJid,
      message: message
    })
  });
  
  const result = await response.json();
  console.log('Result:', result);
} catch (err) {
  console.error('Error:', err.message);
  console.log('\nTrying CLI fallback...');
  
  // Fallback to CLI
  const { execSync } = await import('child_process');
  execSync(`pnpm clawdbot send --to "${groupJid}" --message "${message.replace(/"/g, '\\"')}"`, {
    cwd: process.cwd(),
    stdio: 'inherit'
  });
}
