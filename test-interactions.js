const http = require('http');

const data = JSON.stringify({
  type: 2,
  token: "mocktoken",
  member: { user: { id: "123" } },
  data: { name: "setup", options: [] }
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/discord/interactions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Signature-Ed25519': 'mock',
    'X-Signature-Timestamp': 'mock',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => { console.log(`BODY: ${body}`); });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
