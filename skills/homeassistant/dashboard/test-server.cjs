const http = require('http');
http.createServer((req, res) => {
  console.log('Request:', req.url);
  res.end('OK');
}).listen(8766, () => console.log('Listening on 8766'));
