const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8765;
const DIR = __dirname;

const mimeTypes = {
    '.html': 'text/html',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.css': 'text/css',
    '.js': 'application/javascript'
};

const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? 'index.html' : req.url.slice(1);
    filePath = path.join(DIR, filePath);
    
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Dashboard server running on http://0.0.0.0:${PORT}`);
});
