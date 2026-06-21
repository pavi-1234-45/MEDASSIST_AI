import fs from 'fs';
import https from 'https';
import { translations, languages } from './src/data/translations.js';

const API_KEY = "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";

async function translateChunk(targetLangName, chunk) {
  const prompt = `Translate the values of this JSON object into ${targetLangName}. Preserve the exact JSON keys. Return ONLY a valid JSON object starting with { and ending with }.
JSON:
${JSON.stringify(chunk)}`;

  const data = JSON.stringify({
    model: "meta/llama-3.1-70b-instruct",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    max_tokens: 4000
  });

  const options = {
    hostname: 'integrate.api.nvidia.com',
    port: 443,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let resData = '';
      res.on('data', c => { resData += c; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(resData);
          if (parsed.choices && parsed.choices.length > 0) {
             let content = parsed.choices[0].message.content;
             content = content.replace(/```json/g, '').replace(/```/g, '').trim();
             const start = content.indexOf('{');
             const end = content.lastIndexOf('}');
             if (start !== -1 && end !== -1) {
               content = content.slice(start, end + 1);
             }
             resolve(JSON.parse(content));
          } else {
             reject(new Error("No choices, raw response: " + resData));
          }
        } catch (e) {
          reject(new Error("JSON Parse failed. Raw response: " + resData));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  const enDict = JSON.parse(fs.readFileSync('./src/locales/en.json', 'utf-8'));
  const entries = Object.entries(enDict);
  const chunkSize = 40; // larger chunk so less API calls
  
  for (const lang of languages) {
    if (lang.code === 'en') continue;
    console.log(`Translating to ${lang.name}...`);
    
    let translatedDict = {};
    if (fs.existsSync(`./src/locales/${lang.code}.json`)) {
      try {
        translatedDict = JSON.parse(fs.readFileSync(`./src/locales/${lang.code}.json`, 'utf-8'));
      } catch (e) {}
    }

    const missingEntries = entries.filter(([k]) => !translatedDict[k] || translatedDict[k].includes(""));
    if (missingEntries.length === 0) {
      console.log(`All translated for ${lang.name}`);
      continue;
    }

    try {
      for (let i = 0; i < missingEntries.length; i += chunkSize) {
        const chunk = Object.fromEntries(missingEntries.slice(i, i + chunkSize));
        let success = false;
        let retries = 3;
        while (!success && retries > 0) {
          try {
            const translatedChunk = await translateChunk(lang.name, chunk);
            translatedDict = { ...translatedDict, ...translatedChunk };
            success = true;
          } catch(err) {
            retries--;
            console.error('Error translating chunk:', err.message);
            if (retries === 0) throw err;
            console.log('Retrying chunk in 3s...');
            await new Promise(r => setTimeout(r, 3000));
          }
        }
      }
      fs.writeFileSync(`./src/locales/${lang.code}.json`, JSON.stringify(translatedDict, null, 2), 'utf-8');
      console.log(`Success for ${lang.name}`);
    } catch (e) {
      console.error(`Failed ${lang.name}:`, e.message);
    }
  }

  console.log('Done!');
}
run();
