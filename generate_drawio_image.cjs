const fs = require('fs');
const zlib = require('zlib');
const https = require('https');

// Read the drawio file
const drawioContent = fs.readFileSync('Patient_Database_Design.drawio', 'utf8');

// Encode for Kroki: deflate + base64 + url safe
const buffer = zlib.deflateSync(Buffer.from(drawioContent, 'utf8'));
let encoded = buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const url = `https://kroki.io/drawio/png/${encoded}`;

console.log('Downloading PNG from Kroki API...');

https.get(url, (res) => {
    if (res.statusCode !== 200) {
        console.error(`Failed to generate image. Status: ${res.statusCode}`);
        return;
    }
    
    const file = fs.createWriteStream('Patient_Database_Drawio.png');
    res.pipe(file);
    file.on('finish', () => {
        file.close();
        console.log('Successfully saved Patient_Database_Drawio.png');
    });
}).on('error', (err) => {
    console.error('Error downloading image: ', err.message);
});
