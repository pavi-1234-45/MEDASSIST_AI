const fs = require('fs');

const trPath = 'C:/Users/rithe/OneDrive/Desktop/MP/src/data/translations.js';
let content = fs.readFileSync(trPath, 'utf8');

// The issue was:
// resolved: "Resolved"
//   }",
//     select_language:
content = content.replace(/\r?\n\s*\}"\,\r?\n\s*select_language:/g, ',\n    select_language:');

fs.writeFileSync(trPath, content);
console.log("Fixed translations.js syntax errors part 5.");
