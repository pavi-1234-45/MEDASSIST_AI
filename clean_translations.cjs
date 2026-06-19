const fs = require('fs');
const filePath = 'src/data/translations.js';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

const cleanedLines = lines.filter(line => line.trim() !== '}",');

fs.writeFileSync(filePath, cleanedLines.join('\n'), 'utf8');
console.log('Cleaned stray }", lines');
