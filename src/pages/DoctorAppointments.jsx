import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { dbService } from '../utils/firebaseService';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function DoctorAppointments() {
  const { t } = useLanguage();
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const unsub = dbService.onValue('appointments', (data) => {
      if (data) {
        const arr = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        arr.sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`));
        setAppointments(arr);
      } else {
        setAppointments([]);
      }
    });
    return () => unsub();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await dbService.update(`appointments/${id}`, { status });
      toast.success(`Appointment marked as ${status}`);
    } catch (err) {
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
      <div className="max-w-6xl mx-auto py-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">{t('appointments')}</h1>
          <p className="text-gray-500 mt-1">Manage and review patient requests</p>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-[24px] p-12 text-center shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-blue-50 text-medical-blue rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Appointments</h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {appointments.map((appt) => (
              <motion.div key={appt.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                  <div>
                    <h3 className="font-bold text-xl text-gray-800">{appt.patientName || 'Patient'}</h3>
                    <p className="text-sm text-gray-500 font-medium">{appt.department}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${getStatusColor(appt.status)}`}>
                    {t(appt.status) || appt.status}
                  </span>
                </div>
                
                <div className="p-5 flex-1 space-y-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={16} className="text-gray-400" />
                    <span className="font-bold">{appt.date} at {appt.time}</span>
                  </div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="font-bold block mb-1">Reason:</span>
                    {appt.reason || 'Not specified'}
                  </div>
                  <div className="text-sm font-bold text-medical-blue">
                    Mode: {t(appt.mode.toLowerCase().replace(' ', '_')) || appt.mode}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-3 gap-2">
                  <button onClick={() => handleUpdateStatus(appt.id, 'accepted')} disabled={appt.status === 'accepted' || appt.status === 'completed' || appt.status === 'rejected'} className="py-2.5 bg-green-100 hover:bg-green-200 text-green-700 font-bold rounded-xl text-xs flex justify-center items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <CheckCircle size={14} /> {t('accept')}
                  </button>
                  <button onClick={() => handleUpdateStatus(appt.id, 'rejected')} disabled={appt.status === 'accepted' || appt.status === 'completed' || appt.status === 'rejected'} className="py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl text-xs flex justify-center items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <XCircle size={14} /> {t('reject')}
                  </button>
                  <button onClick={() => handleUpdateStatus(appt.id, 'completed')} disabled={appt.status !== 'accepted'} className="py-2.5 bg-teal-100 hover:bg-teal-200 text-teal-700 font-bold rounded-xl text-xs flex justify-center items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <CheckCircle size={14} /> {t('complete')}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
