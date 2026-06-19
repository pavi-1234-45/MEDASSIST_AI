import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../utils/firebaseService';
import { FileText, Activity, AlertTriangle, Calendar, Pill, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Reports() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  
  const [medicines, setMedicines] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubMeds = dbService.onValue(`medicines/${currentUser.uid}`, (data) => {
      if (data) setMedicines(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      else setMedicines([]);
    });

    const unsubEmerg = dbService.onValue(`emergencies/${currentUser.uid}`, (data) => {
      if (data) setEmergencies(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      else setEmergencies([]);
    });

    const unsubAppts = dbService.onValue(`appointments`, (data) => {
      if (data) {
        setAppointments(Object.keys(data).map(key => ({ id: key, ...data[key] })).filter(a => a.patientId === currentUser.uid));
      } else {
        setAppointments([]);
      }
    });

    return () => { unsubMeds(); unsubEmerg(); unsubAppts(); };
  }, [currentUser]);

  const takenCount = medicines.filter(m => m.status === 'taken').length;
  const skippedCount = medicines.filter(m => m.status === 'skipped').length;
  const missedList = medicines.filter(m => m.status === 'skipped' || (!m.status && m.time < new Date().toLocaleTimeString())); // Simulated missed

  let adherence = 0;
  if (takenCount + skippedCount > 0) {
    adherence = Math.round((takenCount / (takenCount + skippedCount)) * 100);
  } else if (takenCount > 0 && skippedCount === 0) {
    adherence = 100;
  }

  const completedAppts = appointments.filter(a => a.status === 'completed').length;
  const missedAppts = appointments.filter(a => a.status === 'missed' || a.status === 'cancelled').length;

  return (
    <Layout title={t('reports')}>
      <div className="max-w-6xl mx-auto py-8 space-y-6">
        
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{t('reports')}</h1>
          <p className="text-gray-500 mt-1">{t('reports_desc')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Adherence Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
            <div className="w-24 h-24 rounded-full border-8 border-emerald-100 flex items-center justify-center mb-4 relative">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-emerald-500" strokeDasharray={`${adherence * 2.89} 289`} />
              </svg>
              <span className="text-2xl font-bold text-emerald-600">{adherence}%</span>
            </div>
            <h3 className="font-bold text-gray-800 text-lg">{t('adherence')}</h3>
            <p className="text-sm text-gray-500">7-Day Moving Average</p>
          </motion.div>

          {/* Counts Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm md:col-span-2 grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-2xl p-6 flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                <CheckCircle size={24} />
              </div>
              <p className="text-3xl font-bold text-gray-800">{takenCount}</p>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{t('taken')}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6 flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-3">
                <AlertTriangle size={24} />
              </div>
              <p className="text-3xl font-bold text-gray-800">{skippedCount}</p>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{t('skipped')}</p>
            </div>
          </motion.div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Missed Medicines */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-50 text-orange-500 rounded-xl"><Pill size={20} /></div>
              <h2 className="text-xl font-bold text-gray-800">{t('missed_medicines')}</h2>
            </div>
            {missedList.length === 0 ? (
              <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl">No missed medicines. Great job!</div>
            ) : (
              <div className="space-y-3">
                {missedList.map(m => (
                  <div key={m.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div>
                      <p className="font-bold text-gray-800">{m.name}</p>
                      <p className="text-xs text-gray-500">{m.dosage}</p>
                    </div>
                    <span className="text-sm font-bold text-orange-500 bg-orange-100 px-3 py-1 rounded-full">{m.time}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Emergency History */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-50 text-red-500 rounded-xl"><AlertTriangle size={20} /></div>
              <h2 className="text-xl font-bold text-gray-800">{t('emergency_history')}</h2>
            </div>
            {emergencies.length === 0 ? (
              <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl">No emergency events recorded.</div>
            ) : (
              <div className="space-y-3">
                {emergencies.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5).map(e => (
                  <div key={e.id} className="flex flex-col p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="font-bold text-red-600 mb-1">{e.reason}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 font-medium">Loc: {e.location || 'Unknown'}</span>
                      <span className="text-xs text-gray-400">{new Date(e.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Appointment Summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><Calendar size={20} /></div>
              <h2 className="text-xl font-bold text-gray-800">Appointment Status Summary</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl text-center border border-gray-100">
                <p className="text-2xl font-bold text-gray-800">{appointments.length}</p>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Total</p>
              </div>
              <div className="bg-green-50 p-4 rounded-2xl text-center border border-green-100">
                <p className="text-2xl font-bold text-green-600">{completedAppts}</p>
                <p className="text-xs font-bold text-green-600 uppercase tracking-wider mt-1">Completed</p>
              </div>
              <div className="bg-red-50 p-4 rounded-2xl text-center border border-red-100">
                <p className="text-2xl font-bold text-red-500">{missedAppts}</p>
                <p className="text-xs font-bold text-red-500 uppercase tracking-wider mt-1">Cancelled</p>
              </div>
            </div>
          </motion.div>

        </div>

      </div>
    </Layout>
  );
}
