const fs = require('fs');
let text = fs.readFileSync('src/data/translations.js', 'utf8');
text = text.replace(/\{name\s+emergencyHelp:/g, '{name}\",\n    emergencyHelp:');
fs.writeFileSync('src/data/translations.js', text, 'utf8');
