const fs = require('fs');

const path = 'C:/Users/rithe/OneDrive/Desktop/MP/src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/<Route path="settings" element={<ComingSoon title="Settings" \/>} \/>/g, '<Route path="settings" element={<Navigate to="/language" replace />} />');
content = content.replace(/<Route path="reports" element={<ComingSoon title="Health Reports" \/>} \/>/g, '<Route path="reports" element={<AdminReports />} />');

fs.writeFileSync(path, content);
console.log("Replaced remaining Coming Soon pages");
