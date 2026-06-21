const fs = require('fs');
let content = fs.readFileSync('src/data/translations.js', 'utf8');
content = content.replace(/ai_chat:\s*"AI Health Chat",/g, 'ai_chat: "AI Health Chat",\n    ai_health_assistant: "AI Health Assistant",');
fs.writeFileSync('src/data/translations.js', content);
console.log('Fixed missing key');
