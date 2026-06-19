const fs = require('fs');

const trPath = 'C:/Users/rithe/OneDrive/Desktop/MP/src/data/translations.js';
let content = fs.readFileSync(trPath, 'utf8');

const newKeys = {
  voice_assistant: "Voice Assistant",
  tap_to_speak: "Tap to speak",
  listening: "Listening...",
  stop_listening: "Stop Listening",
  transcript: "Transcript",
  ai_response: "AI Response",
  speak_response: "Speak Response",
  clear: "Clear",
  emergency_detected: "Emergency Detected",
  voice_not_supported: "Voice recognition is not supported in this browser. Please type your query."
};

const langs = ['en', 'ta', 'te', 'ml', 'kn', 'hi'];

langs.forEach(lang => {
  const langMatch = content.match(new RegExp(`${lang}:\\s*{[\\s\\S]*?}`));
  if (langMatch) {
    const langBlock = langMatch[0];
    let insertedKeys = '';
    
    for (const [key, value] of Object.entries(newKeys)) {
      if (!langBlock.includes(`${key}:`)) {
        insertedKeys += `    ${key}: "${value}",\n`;
      }
    }

    if (insertedKeys) {
      // Find the last property in the block to insert after it
      const updatedBlock = langBlock.replace(/},\n?$/, `,\n${insertedKeys}}`);
      content = content.replace(langBlock, updatedBlock);
    }
  }
});

fs.writeFileSync(trPath, content, 'utf8');
console.log("Voice keys injected successfully.");
