import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useLanguage } from '../../context/LanguageContext';
import { dbService } from '../../utils/firebaseService';
import { Calendar, Phone, Bell, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function CaregiverAppointments() {
  const { t } = useLanguage();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const unsubPat = dbService.onValue('users', (data) => {
      if (data) {
        const p = Object.keys(data).map(k => ({id:k, ...data[k]})).find(u => u.role === 'patient');
        if (p) {
          setPatient(p);
          dbService.onValue('appointments', (appData) => {
            if (appData) {
              const arr = Object.keys(appData).map(k => ({id:k, ...appData[k]})).filter(a => a.patientId === p.id);
              arr.sort((a,b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`));
              setAppointments(arr);
            } else {
              setAppointments([]);
            }
          }, true);
        }
      }
    });
    return () => unsubPat();
  }, []);

  const handleCall = () => {
    if (patient?.phone) window.location.href = `tel:${patient.phone}`;
  };

  const handleRemind = async () => {
    if (!patient?.id) return;
    try {
      const alertId = dbService.generateId();
      await dbService.set(`alerts/${patient.id}/${alertId}`, {
        type: 'caregiver_reminder',
        status: 'unread',
        message: 'Caregiver reminded patient about upcoming appointment',
        timestamp: new Date().toISOString()
      });
      toast.success('Reminder sent to patient');
    } catch (e) {
      toast.error(t('somethingWentWrong'));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'bg-medical-green text-white';
      case 'completed': return 'bg-teal-500 text-white';
      case 'rejected':
      case 'cancelled':
      case 'missed': return 'bg-red-500 text-white';
      default: return 'bg-amber-400 text-white';
    }
  };

  return (
    <Layout title={t('appointments')}>
      <div className="max-w-4xl mx-auto py-8">
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{t('appointments')}</h1>
            <p className="text-gray-500 mt-1">Review {patient?.displayName || 'patient'}'s appointments</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCall} className="p-3 bg-white border border-gray-200 hover:bg-gray-50 text-medical-blue rounded-xl transition-colors shadow-sm">
              <Phone size={20} />
            </button>
            <button onClick={handleRemind} className="p-3 bg-medical-blue hover:bg-blue-700 text-white rounded-xl transition-colors shadow-sm">
              <Bell size={20} />
            </button>
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-[24px] p-12 text-center shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-blue-50 text-medical-blue rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={40} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No Appointments Found</h2>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map(a => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden flex flex-col sm:flex-row">
                
                <div className="bg-gray-50 p-6 flex flex-col justify-center items-center sm:w-48 border-b sm:border-b-0 sm:border-r border-gray-100 shrink-0">
                  <Calendar size={28} className="text-medical-blue mb-2" />
                  <p className="font-bold text-gray-800">{a.date}</p>
                  <p className="text-sm font-bold text-medical-blue">{a.time}</p>
                </div>
                
                <div className="p-6 flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{a.department}</h3>
                      <p className="text-sm font-medium text-gray-500">Dr. {a.doctorName || 'Not assigned'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(a.status)}`}>
                      {t(a.status) || a.status}
                    </span>
                  </div>
                  
                  <div className="mt-4 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-800 uppercase mb-1">Reason for Visit</p>
                    <p className="text-sm text-gray-700">{a.reason || 'Not specified'}</p>
                  </div>
                </div>

              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
