const fs = require('fs');
const path = require('path');

const transPath = path.join(__dirname, 'src/data/translations.js');
let content = fs.readFileSync(transPath, 'utf8');

const newKeys = {
  emergencyHelp: "Emergency Help",
  pressAndHoldForSOS: "Press and Hold for SOS",
  useOnlyInRealEmergencies: "Use only in real emergencies.",
  sos: "SOS",
  emergencyType: "Emergency Type",
  medicalEmergency: "Medical Emergency",
  chestPain: "Chest Pain",
  breathingDifficulty: "Breathing Difficulty",
  accident: "Accident",
  severePain: "Severe Pain",
  other: "Other",
  locationDetected: "Location Detected",
  locationShared: "Location Shared",
  caregiverNotified: "Caregiver Notified",
  doctorAlerted: "Doctor Alerted",
  hospitalAdminNotified: "Hospital Admin Notified",
  emergencyResponseInitiated: "Emergency Response Initiated",
  alertPriorityCritical: "Alert Priority: Critical",
  sosSubmitted: "SOS Submitted",
  call112Again: "Call 112 Again",
  callCaregiver: "Call Caregiver",
  backToDashboard: "Back to Dashboard",
  pleaseDial112: "Please dial 112 from your phone immediately.",
  holdToSendSOS: "Hold to send SOS",
  releaseToCancel: "Release to cancel",
  sosTriggered: "SOS Triggered",
  emergencyAlertSent: "Emergency Alert Sent"
};

const languages = ['en', 'ta', 'te', 'ml', 'kn', 'hi'];

languages.forEach(lang => {
  const regex = new RegExp(`(${lang}:\\s*{[\\s\\S]*?)(})`, 'm');
  const match = content.match(regex);
  if (match) {
    let langBlock = match[1];
    
    Object.entries(newKeys).forEach(([key, val]) => {
      if (!langBlock.includes(`${key}:`)) {
        langBlock += `    ${key}: "${val}",\n`;
      }
    });

    content = content.replace(regex, langBlock + '$2');
  }
});

fs.writeFileSync(transPath, content, 'utf8');
console.log('Successfully injected SOS keys into translations.js');
