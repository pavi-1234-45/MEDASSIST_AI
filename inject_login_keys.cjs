const fs = require('fs');
const trPath = 'C:/Users/rithe/OneDrive/Desktop/MP/src/data/translations.js';
let content = fs.readFileSync(trPath, 'utf8');

const newKeys = {
  signInToAccount: {
    en: "Sign in to your account",
    ta: "உங்கள் கணக்கில் உள்நுழைக",
    te: "మీ ఖాతాలోకి సైన్ ఇన్ చేయండి",
    ml: "നിങ്ങളുടെ അക്കൗണ്ടിൽ സൈൻ ഇൻ ചെയ്യുക",
    kn: "ನಿಮ್ಮ ಖಾತೆಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ",
    hi: "अपने खाते में साइन इन करें"
  },
  createNewAccount: {
    en: "Create a new account",
    ta: "புதிய கணக்கை உருவாக்கவும்",
    te: "కొత్త ఖాతాను సృష్టించండి",
    ml: "പുതിയ അക്കൗണ്ട് സൃഷ്ടിക്കുക",
    kn: "ಹೊಸ ಖಾತೆಯನ್ನು ರಚಿಸಿ",
    hi: "एक नया खाता बनाएं"
  }
};

const langs = ['en', 'ta', 'te', 'ml', 'kn', 'hi'];

langs.forEach(lang => {
  const langMatch = content.match(new RegExp(`${lang}:\\s*{[\\s\\S]*?}`));
  if (langMatch) {
    const langBlock = langMatch[0];
    let insertedKeys = '';
    
    for (const [key, valueObj] of Object.entries(newKeys)) {
      if (!langBlock.includes(`${key}:`)) {
        insertedKeys += `    ${key}: "${valueObj[lang]}",\n`;
      }
    }

    if (insertedKeys) {
      const updatedBlock = langBlock.replace(/},\n?$/, `,\n${insertedKeys}}`);
      content = content.replace(langBlock, updatedBlock);
    }
  }
});

fs.writeFileSync(trPath, content, 'utf8');
console.log("Login keys injected.");
