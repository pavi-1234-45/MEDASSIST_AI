import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../utils/firebaseService';
import { User, Pill, Bell, AlertTriangle, Phone, MessageSquare, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGreeting } from '../utils/greeting';
import toast from 'react-hot-toast';

export default function CaregiverDashboard() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const greetingKey = useGreeting();
  
  const [patient, setPatient] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [emergencies, setEmergencies] = useState([]);

  // For the sake of the mock app without proper linked relations, we assume the caregiver is linked to the first patient they see, or a hardcoded ID if we had one. We'll fetch the first patient for demo purposes.
  useEffect(() => {
    const unsubPat = dbService.onValue('users', (data) => {
      if (data) {
        const p = Object.keys(data).map(k => ({id:k, ...data[k]})).find(u => u.role === 'patient');
        if (p) {
          setPatient(p);
          
          // Fetch their specifics
          dbService.onValue(`medicines/${p.id}`, (mData) => {
            setMedicines(mData ? Object.values(mData) : []);
          }, true);
          
          dbService.onValue(`alerts/${p.id}`, (aData) => {
            setAlerts(aData ? Object.keys(aData).map(k=>({id:k, ...aData[k]})) : []);
          }, true);
          
          dbService.onValue(`emergencies/${p.id}`, (eData) => {
            setEmergencies(eData ? Object.values(eData) : []);
          }, true);
        }
      }
    });
    return () => unsubPat();
  }, []);

  const takenCount = medicines.filter(m => m.status === 'taken').length;
  const skippedCount = medicines.filter(m => m.status === 'skipped').length;
  const pendingCount = medicines.filter(m => !m.status || m.status === 'pending').length;

  const unreadAlerts = alerts.filter(a => a.status === 'unread');
  const activeEmergencies = emergencies.filter(e => e.status === 'emergency' || e.status === 'in_progress');
  const latestEmergency = [...emergencies].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

  let pulseColor = 'bg-medical-teal shadow-teal-500/40';
  if (activeEmergencies.length > 0) pulseColor = 'bg-red-500 shadow-red-500/60 animate-pulse';
  else if (unreadAlerts.length > 0) pulseColor = 'bg-amber-500 shadow-amber-500/40';
  else if (pendingCount === 0 && takenCount > 0) pulseColor = 'bg-medical-green shadow-green-500/40';

  const handleCall = () => {
    if (patient?.phone) window.location.href = `tel:${patient.phone}`;
    else toast.error("Phone number not available");
  };

  const handleWhatsApp = () => {
    if (patient?.phone) window.open(`https://wa.me/${patient.phone}`, '_blank');
    else toast.error("Phone number not available");
  };

  const handleMarkAlertsRead = async () => {
    if (!patient?.id) return;
    try {
      for (const alert of unreadAlerts) {
        await dbService.update(`alerts/${patient.id}/${alert.id}`, { status: 'read' });
      }
      toast.success("Alerts marked as read");
    } catch (e) {
      toast.error("Error updating alerts");
    }
  };

  return (
    <Layout title={t('patient_monitoring_center')}>
      <div className="max-w-6xl mx-auto py-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{t(greetingKey)}, {currentUser?.displayName || t('caregiver')}</h1>
            <p className="text-gray-500 mt-1">{t('patient_monitoring_center')}</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100">
            <span className="font-bold text-gray-700 text-sm uppercase tracking-wider">{t('care_pulse')}</span>
            <div className="relative flex h-4 w-4">
              {pulseColor.includes('red-500') && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-4 w-4 shadow-lg ${pulseColor}`}></span>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-medical-blue/10 text-medical-blue rounded-xl">
                  <User size={24} />
                </div>
              </div>
              <h3 className="font-bold text-gray-700 mb-1">{t('linked_patient_card')}</h3>
              <p className="text-xl font-bold text-gray-800 truncate">{patient?.displayName || 'Loading...'}</p>
              <p className="text-sm text-gray-500 mt-1">Dependent</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-teal-50 text-medical-teal rounded-xl">
                <Pill size={24} />
              </div>
              <span className="text-3xl font-bold text-gray-800">{medicines.length}</span>
            </div>
            <h3 className="font-bold text-gray-700 mb-1">{t('today_medicine_status')}</h3>
            <div className="flex gap-2 text-xs font-bold uppercase mt-2">
              <span className="text-green-600 bg-green-50 px-2 py-1 rounded">{takenCount} Taken</span>
              <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded">{pendingCount} Pend</span>
              <span className="text-red-600 bg-red-50 px-2 py-1 rounded">{skippedCount} Skip</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${unreadAlerts.length > 0 ? 'bg-amber-100 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>
                <Bell size={24} />
              </div>
              <span className={`text-3xl font-bold ${unreadAlerts.length > 0 ? 'text-amber-600' : 'text-gray-800'}`}>{unreadAlerts.length}</span>
            </div>
            <h3 className="font-bold text-gray-700 mb-1">{t('unread_alerts')}</h3>
            <p className="text-sm text-gray-500">Missed meds, reminders</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 relative overflow-hidden">
             {activeEmergencies.length > 0 && <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full -z-0"></div>}
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${activeEmergencies.length > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
                  <AlertTriangle size={24} />
                </div>
              </div>
              <h3 className="font-bold text-gray-700 mb-1">{t('last_emergency')}</h3>
              <p className="text-sm text-gray-500 font-bold text-red-500 truncate">
                {latestEmergency ? new Date(latestEmergency.timestamp).toLocaleString() : t('no_active_emergencies')}
              </p>
              <p className="text-xs text-gray-400 mt-1 uppercase">{latestEmergency?.status || ''}</p>
            </div>
          </motion.div>

        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">{t('quick_actions')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button onClick={handleCall} className="py-4 bg-white hover:bg-gray-50 text-gray-800 font-bold rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center gap-2 transition-all">
              <Phone size={20} className="text-medical-blue" /> {t('call_patient')}
            </button>
            <button onClick={handleWhatsApp} className="py-4 bg-white hover:bg-gray-50 text-gray-800 font-bold rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center gap-2 transition-all">
              <MessageSquare size={20} className="text-green-500" /> {t('send_whatsapp')}
            </button>
            <button onClick={handleMarkAlertsRead} disabled={unreadAlerts.length === 0} className="py-4 bg-white hover:bg-gray-50 text-gray-800 font-bold rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50">
              <CheckCircle size={20} className="text-medical-teal" /> {t('mark_read')}
            </button>
          </div>
        </div>

      </div>
    </Layout>
  );
}
