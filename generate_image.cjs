const fs = require('fs');
const zlib = require('zlib');
const https = require('https');

// Read the mermaid file
const mmdContent = fs.readFileSync('medassist_comprehensive_architecture.mmd', 'utf8');

// Encode for Kroki: deflate + base64 + url safe
const buffer = zlib.deflateSync(Buffer.from(mmdContent, 'utf8'));
let encoded = buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const urlPng = `https://kroki.io/mermaid/png/${encoded}`;
const urlSvg = `https://kroki.io/mermaid/svg/${encoded}`;

console.log('Downloading PNG and SVG from Kroki API...');

https.get(urlPng, (res) => {
    const file = fs.createWriteStream('medassist_architecture.png');
    res.pipe(file);
    file.on('finish', () => {
        file.close();
        console.log('Successfully saved medassist_architecture.png');
    });
});

https.get(urlSvg, (res) => {
    const file = fs.createWriteStream('medassist_architecture.svg');
    res.pipe(file);
    file.on('finish', () => {
        file.close();
        console.log('Successfully saved medassist_architecture.svg (Editable Vector)');
    });
});
