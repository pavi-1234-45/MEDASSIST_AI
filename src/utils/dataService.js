export const seedMockData = () => {
  if (!localStorage.getItem('medassist_patients')) {
    localStorage.setItem('medassist_patients', JSON.stringify([
      { id: 'p1', name: 'John Doe', age: 45, gender: 'Male', phone: '1234567890', condition: 'Diabetes', caregiver: 'Jane Doe', adherence: 85, lastAlert: '2 hours ago', status: 'Active' },
      { id: 'p2', name: 'Alice Smith', age: 62, gender: 'Female', phone: '0987654321', condition: 'Hypertension', caregiver: 'Bob Smith', adherence: 60, lastAlert: '1 day ago', status: 'Needs Attention' },
      { id: 'p3', name: 'Michael Johnson', age: 34, gender: 'Male', phone: '5551234567', condition: 'Asthma', caregiver: 'Sarah Johnson', adherence: 95, lastAlert: 'None', status: 'Stable' },
      { id: 'p4', name: 'Emma Brown', age: 78, gender: 'Female', phone: '5559876543', condition: 'Arthritis', caregiver: 'Tom Brown', adherence: 40, lastAlert: '5 mins ago', status: 'Critical' }
    ]));
  }

  if (!localStorage.getItem('medassist_doctors')) {
    localStorage.setItem('medassist_doctors', JSON.stringify([
      { id: 'd1', name: 'Dr. Sarah Wilson', specialization: 'Cardiologist', hospital: 'City General', appointments: 12, emergencies: 2 },
      { id: 'd2', name: 'Dr. James Chen', specialization: 'Endocrinologist', hospital: 'Metro Health', appointments: 8, emergencies: 0 },
      { id: 'd3', name: 'Dr. Emily Davis', specialization: 'General Physician', hospital: 'City General', appointments: 15, emergencies: 5 }
    ]));
  }

  if (!localStorage.getItem('medassist_appointments_global')) {
    localStorage.setItem('medassist_appointments_global', JSON.stringify([
      { id: 'a1', patientId: 'p1', patientName: 'John Doe', doctorId: 'd1', doctorName: 'Dr. Sarah Wilson', date: '2023-11-15', time: '10:00 AM', status: 'Confirmed' },
      { id: 'a2', patientId: 'p2', patientName: 'Alice Smith', doctorId: 'd2', doctorName: 'Dr. James Chen', date: '2023-11-16', time: '02:30 PM', status: 'Scheduled' },
      { id: 'a3', patientId: 'p4', patientName: 'Emma Brown', doctorId: 'd3', doctorName: 'Dr. Emily Davis', date: '2023-11-14', time: '11:00 AM', status: 'Completed' },
      { id: 'a4', patientId: 'p3', patientName: 'Michael Johnson', doctorId: 'd3', doctorName: 'Dr. Emily Davis', date: '2023-11-10', time: '09:00 AM', status: 'Missed' }
    ]));
  }

  if (!localStorage.getItem('medassist_alerts_global')) {
    localStorage.setItem('medassist_alerts_global', JSON.stringify([
      { id: 'al1', type: 'Emergency', patientName: 'Emma Brown', symptom: 'Severe chest pain', status: 'unread', time: '5 mins ago' },
      { id: 'al2', type: 'Missed Medicine', patientName: 'Alice Smith', symptom: 'Lisinopril 10mg', status: 'unread', time: '2 hours ago' },
      { id: 'al3', type: 'Emergency', patientName: 'John Doe', symptom: 'Fainted', status: 'Resolved', time: '1 day ago' }
    ]));
  }
};

export const getPatients = () => JSON.parse(localStorage.getItem('medassist_patients') || '[]');
export const getDoctors = () => JSON.parse(localStorage.getItem('medassist_doctors') || '[]');
export const getAppointments = () => JSON.parse(localStorage.getItem('medassist_appointments_global') || '[]');
export const getAlerts = () => JSON.parse(localStorage.getItem('medassist_alerts_global') || '[]');

export const updateAppointmentStatus = (id, newStatus) => {
  const apps = getAppointments();
  const index = apps.findIndex(a => a.id === id);
  if (index !== -1) {
    apps[index].status = newStatus;
    localStorage.setItem('medassist_appointments_global', JSON.stringify(apps));
  }
};

export const updateAlertStatus = (id, newStatus) => {
  const alerts = getAlerts();
  const index = alerts.findIndex(a => a.id === id);
  if (index !== -1) {
    alerts[index].status = newStatus;
    localStorage.setItem('medassist_alerts_global', JSON.stringify(alerts));
  }
};
