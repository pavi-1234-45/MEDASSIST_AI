const fs = require('fs');

const trPath = 'C:/Users/rithe/OneDrive/Desktop/MP/src/data/translations.js';
let content = fs.readFileSync(trPath, 'utf8');

// The keys we want to add
const newKeys = {
  primary_caregiver: "Primary Caregiver",
  caregiver_desc: "This person will be contacted during emergencies.",
  save_details: "Save Details",
  alert_history: "Alert History",
  no_alerts: "No alerts have been sent yet.",
  caregiver_saved: "Caregiver details saved",
  emergency_alert: "Emergency Alert",
  missed_medicine_alert: "Missed Medicine Alert",
  unread: "Unread",
  resolved: "Resolved"
};

const langs = ['en', 'ta', 'te', 'ml', 'kn', 'hi'];

langs.forEach(lang => {
  const regex = new RegExp(`(${lang}:\\s*\\{[\\s\\S]*?)(})`, 'g');
  content = content.replace(regex, (match, p1, p2) => {
    let injection = ``;
    for (const [key, value] of Object.entries(newKeys)) {
      if (!p1.includes(`${key}:`)) {
        injection += `    ${key}: "${value}",\n`;
      }
    }
    let cleanP1 = p1.replace(/,\s*$/, '');
    if (injection.length > 0) {
        return cleanP1 + ',\n' + injection.slice(0, -2) + '\n  ' + p2;
    }
    return p1 + p2;
  });
});

fs.writeFileSync(trPath, content);
console.log("Injected Caregiver specific translation keys.");
