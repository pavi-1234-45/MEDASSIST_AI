const fs = require('fs');

const trPath = 'C:/Users/rithe/OneDrive/Desktop/MP/src/data/translations.js';
let content = fs.readFileSync(trPath, 'utf8');

// Fix the unterminated greeting string
content = content.replace(/greeting:\s*"([^"]+)\{name,/g, 'greeting: "$1{name}",');

// Fix the ai_chat syntax
content = content.replace(/\r?\n\s*\}"\,\r?\n\s*ai_chat:/g, ',\n    ai_chat:');
content = content.replace(/resolved: "Resolved"\r?\n\s*\},?\r?\n\s*ai_chat:/g, 'resolved: "Resolved",\n    ai_chat:');
content = content.replace(/admin_role: "Admin Role \(e\.g\. IT, Manager\)",?,\n    ai_chat:/g, 'admin_role: "Admin Role (e.g. IT, Manager)",\n    ai_chat:');

fs.writeFileSync(trPath, content);
console.log("Fixed translations.js syntax errors.");
