const fs = require('fs');

const path = 'C:/Users/rithe/OneDrive/Desktop/MP/src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

const imports = `
import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorNotes from './pages/doctor/DoctorNotes';
import DoctorAdherence from './pages/doctor/DoctorAdherence';

import AdminPatients from './pages/admin/AdminPatients';
import AdminReports from './pages/admin/AdminReports';
import AdminAppointments from './pages/admin/AdminAppointments';
import AdminAlerts from './pages/admin/AdminAlerts';
import AdminDoctors from './pages/admin/AdminDoctors';
`;

content = content.replace("import AdminDashboard from './pages/AdminDashboard';", "import AdminDashboard from './pages/AdminDashboard';\n" + imports);

// Doctor
content = content.replace('<Route path="patients" element={<ComingSoon title="Patient List" />} />', '<Route path="patients" element={<DoctorPatients />} />');
content = content.replace('<Route path="notes" element={<ComingSoon title="Consultation Notes" />} />', '<Route path="notes" element={<DoctorNotes />} />');
content = content.replace('<Route path="adherence" element={<ComingSoon title="Patient Adherence" />} />', '<Route path="adherence" element={<DoctorAdherence />} />');

// Caregiver
content = content.replace('<Route path="patient" element={<ComingSoon title="Linked Patient" />} />', '<Route path="patient" element={<DoctorPatients />} />');
content = content.replace('<Route path="medicine-status" element={<ComingSoon title="Medicine Status" />} />', '<Route path="medicine-status" element={<DoctorAdherence />} />');
content = content.replace('<Route path="appointments" element={<ComingSoon title="Appointments" />} />', '<Route path="appointments" element={<AdminAppointments />} />');
content = content.replace('<Route path="emergencies" element={<ComingSoon title="Emergency Alerts" />} />', '<Route path="emergencies" element={<CaregiverAlerts />} />');
content = content.replace('<Route path="reports" element={<ComingSoon title="Reports" />} />', '<Route path="reports" element={<AdminReports />} />');

// Admin
content = content.replace('<Route path="patients" element={<ComingSoon title="Patient List" />} />', '<Route path="patients" element={<AdminPatients />} />');
content = content.replace('<Route path="appointments" element={<ComingSoon title="Appointments" />} />', '<Route path="appointments" element={<AdminAppointments />} />');
content = content.replace('<Route path="alerts" element={<ComingSoon title="Alerts" />} />', '<Route path="alerts" element={<AdminAlerts />} />');
content = content.replace('<Route path="reports" element={<ComingSoon title="System Reports" />} />', '<Route path="reports" element={<AdminReports />} />');
content = content.replace('<Route path="doctors" element={<ComingSoon title="Doctors" />} />', '<Route path="doctors" element={<AdminDoctors />} />');

fs.writeFileSync(path, content);
console.log("Updated App.jsx with new routes");
