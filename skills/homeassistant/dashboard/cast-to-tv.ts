/**
 * Cast Home Dashboard to Samsung TV
 * 
 * This script serves the dashboard on a local port and opens it on the Samsung TV
 */

import { exec } from 'child_process';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join } from 'path';

const DASHBOARD_PORT = 8765;
const DASHBOARD_PATH = join(__dirname, 'index.html');

// Start a simple HTTP server
function startServer(): Promise<string> {
    return new Promise((resolve, reject) => {
        const html = readFileSync(DASHBOARD_PATH, 'utf-8');
        
        const server = createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
        });

        server.listen(DASHBOARD_PORT, '0.0.0.0', () => {
            console.log(`📺 Dashboard server running on http://localhost:${DASHBOARD_PORT}`);
            resolve(`http://localhost:${DASHBOARD_PORT}`);
        });

        server.on('error', (err) => {
            if ((err as any).code === 'EADDRINUSE') {
                console.log(`⚠️ Port ${DASHBOARD_PORT} already in use, dashboard probably already running`);
                resolve(`http://localhost:${DASHBOARD_PORT}`);
            } else {
                reject(err);
            }
        });

        // Keep server alive for 10 minutes then auto-close
        setTimeout(() => {
            server.close();
            console.log('🛑 Dashboard server stopped after 10 minutes');
        }, 10 * 60 * 1000);
    });
}

// Get local IP address
function getLocalIP(): string {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

async function main() {
    const action = process.argv[2] || 'serve';
    
    if (action === 'serve') {
        const localIP = getLocalIP();
        await startServer();
        console.log(`\n🌐 Access from TV: http://${localIP}:${DASHBOARD_PORT}`);
        console.log('\n📺 Pour caster sur la TV Samsung:');
        console.log('   1. Ouvre le navigateur de la TV');
        console.log(`   2. Va sur: http://${localIP}:${DASHBOARD_PORT}`);
        console.log('\n   Ou demande à Dwight de le faire via Home Assistant!\n');
    }
}

main().catch(console.error);
