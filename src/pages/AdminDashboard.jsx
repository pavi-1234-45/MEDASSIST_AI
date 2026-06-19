import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../utils/firebaseService';
import { Users, Calendar, AlertTriangle, UserPlus, Pill, Activity, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGreeting } from '../utils/greeting';

export default function AdminDashboard() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const greetingKey = useGreeting();
  
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [adherenceData, setAdherenceData] = useState({ taken: 0, skipped: 0 });

  useEffect(() => {
    const unsubUsers = dbService.onValue('users', (data) => {
      if (data) {
        const uList = Object.values(data);
        setPatients(uList.filter(u => u.role === 'patient'));
        setDoctors(uList.filter(u => u.role === 'doctor'));
      }
    });

    const unsubAppts = dbService.onValue('appointments', (data) => {
      if (data) setAppointments(Object.values(data));
      else setAppointments([]);
    });

    const unsubAlerts = dbService.onValue('alerts', (data) => {
      if (data) {
        const allAlerts = [];
        Object.values(data).forEach(pAlerts => Object.values(pAlerts).forEach(a => allAlerts.push(a)));
        allAlerts.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        setAlerts(allAlerts);
      } else setAlerts([]);
    });

    const unsubEmerg = dbService.onValue('emergencies', (data) => {
      if (data) {
        const allEmerg = [];
        Object.values(data).forEach(pEmerg => Object.values(pEmerg).forEach(e => allEmerg.push(e)));
        allEmerg.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        setEmergencies(allEmerg);
      } else setEmergencies([]);
    });

    const unsubMeds = dbService.onValue('medicines', (data) => {
      if (data) {
        let taken = 0, skipped = 0;
        Object.values(data).forEach(patientMeds => {
          Object.values(patientMeds).forEach(m => {
            if (m.status === 'taken') taken++;
            if (m.status === 'skipped') skipped++;
          });
        });
        setAdherenceData({ taken, skipped });
      }
    });

    return () => { unsubUsers(); unsubAppts(); unsubAlerts(); unsubEmerg(); unsubMeds(); };
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.date === todayStr);
  const pendingAppts = appointments.filter(a => a.status === 'pending');
  
  const missedMedsToday = alerts.filter(a => a.type === 'missed_medicine' && a.timestamp.includes(todayStr));
  const activeEmergencies = emergencies.filter(e => e.status === 'emergency' || e.status === 'in_progress');

  let pulseColor = 'bg-medical-teal shadow-teal-500/40';
  if (activeEmergencies.length > 0) pulseColor = 'bg-red-500 shadow-red-500/60 animate-pulse';
  else if (missedMedsToday.length > 0 || pendingAppts.length > 0) pulseColor = 'bg-amber-500 shadow-amber-500/40';

  const adherencePct = adherenceData.taken + adherenceData.skipped > 0 
    ? Math.round((adherenceData.taken / (adherenceData.taken + adherenceData.skipped)) * 100) 
    : 0;

  return (
    <Layout title={t('hospital_operations_center')}>
      <div className="max-w-7xl mx-auto py-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{t(greetingKey)}, {currentUser?.displayName || 'Admin'}</h1>
            <p className="text-gray-500 mt-1">{t('hospital_operations_center')}</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100">
            <span className="font-bold text-gray-700 text-sm uppercase tracking-wider">{t('care_pulse')}</span>
            <div className="relative flex h-4 w-4">
              {activeEmergencies.length > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-4 w-4 shadow-lg ${pulseColor}`}></span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <MetricCard title={t('total_patients')} value={patients.length} icon={<Users size={20} />} color="blue" />
          <MetricCard title={t('total_doctors')} value={doctors.length} icon={<UserPlus size={20} />} color="teal" />
          <MetricCard title={t('today_appointments')} value={todayAppts.length} icon={<Calendar size={20} />} color="indigo" />
          <MetricCard title={t('pending_appointments')} value={pendingAppts.length} icon={<Clock size={20} />} color="amber" />
          <MetricCard title={t('missed_medicines_today')} value={missedMedsToday.length} icon={<Pill size={20} />} color="orange" />
          <MetricCard title={t('active_emergencies')} value={activeEmergencies.length} icon={<AlertTriangle size={20} />} color="red" pulse={activeEmergencies.length > 0} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Alerts Feed */}
          <div className="lg:col-span-1 bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col max-h-[500px]">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Bell size={20} className="text-amber-500" /> {t('recent_alerts_feed')}
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {alerts.length === 0 && emergencies.length === 0 ? (
                <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl">No recent activity.</div>
              ) : (
                [...emergencies, ...alerts].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0,10).map((item, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border ${item.reason ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${item.reason ? 'text-red-600' : 'text-gray-500'}`}>
                        {item.reason ? 'SOS Emergency' : item.type?.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-gray-400">{new Date(item.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className={`font-bold text-sm ${item.reason ? 'text-red-800' : 'text-gray-800'}`}>{item.reason || item.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Today's Appointments & Adherence */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Activity size={20} className="text-medical-teal" /> {t('adherence_overview')}
              </h2>
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">System-Wide Adherence</span>
                    <span className="text-2xl font-bold text-medical-teal">{adherencePct}%</span>
                  </div>
                  <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-medical-teal rounded-full transition-all duration-1000" style={{ width: `${adherencePct}%` }}></div>
                  </div>
                </div>
                <div className="flex gap-4 shrink-0">
                  <div className="text-center">
                    <p className="text-xl font-bold text-green-600">{adherenceData.taken}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Taken</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-red-500">{adherenceData.skipped}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Skipped</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex-1">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-medical-blue" /> {t('today_appointments')}
              </h2>
              {todayAppts.length === 0 ? (
                <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl">No appointments today.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-500">
                        <th className="pb-2 font-medium">Patient</th>
                        <th className="pb-2 font-medium">Doctor</th>
                        <th className="pb-2 font-medium">Time</th>
                        <th className="pb-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayAppts.slice(0, 5).map(a => (
                        <tr key={a.id} className="border-b border-gray-50">
                          <td className="py-3 font-bold text-gray-800">{a.patientName}</td>
                          <td className="py-3 text-gray-600">{a.doctorName || 'Unassigned'}</td>
                          <td className="py-3 text-gray-600">{a.time}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${a.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </Layout>
  );
}

function MetricCard({ title, value, icon, color, pulse }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    teal: 'bg-teal-50 text-teal-600 border-teal-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    red: 'bg-red-50 text-red-600 border-red-100'
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${colors[color]} ${pulse ? 'animate-pulse shadow-lg' : ''}`}>
        {icon}
      </div>
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 line-clamp-1">{title}</p>
      <h3 className={`text-2xl font-bold ${pulse ? 'text-red-600' : 'text-gray-800'}`}>{value}</h3>
    </motion.div>
  );
}

function Clock(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
