const https = require('https');

const data = JSON.stringify({
  model: "meta/llama-3.1-70b-instruct",
  messages: [{ role: "user", content: "Translate 'hello' to Tamil. Return only the translated text." }]
});

const options = {
  hostname: 'integrate.api.nvidia.com',
  port: 443,
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer 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',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  let resData = '';
  res.on('data', chunk => { resData += chunk; });
  res.on('end', () => { console.log(resData); });
});

req.on('error', error => { console.error(error); });
req.write(data);
req.end();
