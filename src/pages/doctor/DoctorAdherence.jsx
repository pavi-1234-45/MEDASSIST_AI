import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useLanguage } from '../../context/LanguageContext';
import { dbService } from '../../utils/firebaseService';
import { Activity, Pill, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DoctorAdherence() {
  const { t } = useLanguage();
  const [patients, setPatients] = useState([]);
  const [adherenceData, setAdherenceData] = useState({});

  useEffect(() => {
    // 1. Fetch patients
    const unsubPat = dbService.onValue('users', (data) => {
      if (data) {
        const pList = Object.keys(data).map(k => ({ id: k, ...data[k] })).filter(u => u.role === 'patient');
        setPatients(pList);
      }
    });

    // 2. Fetch all medicines and map to patients to calculate adherence
    const unsubMeds = dbService.onValue('medicines', (data) => {
      if (data) {
        const stats = {};
        Object.keys(data).forEach(patientId => {
          const meds = Object.values(data[patientId]);
          const takenCount = meds.filter(m => m.status === 'taken').length;
          const skippedCount = meds.filter(m => m.status === 'skipped').length;
          const totalLogs = takenCount + skippedCount;
          let adherence = 0;
          if (totalLogs > 0) {
            adherence = Math.round((takenCount / totalLogs) * 100);
          } else if (takenCount > 0 && skippedCount === 0) {
            adherence = 100;
          }
          
          stats[patientId] = {
            takenCount,
            skippedCount,
            adherence,
            medsList: meds
          };
        });
        setAdherenceData(stats);
      } else {
        setAdherenceData({});
      }
    });

    return () => { unsubPat(); unsubMeds(); };
  }, []);

  return (
    <Layout title={t('patient_adherence')}>
      <div className="max-w-5xl mx-auto py-8">
        
        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl">
            <Activity size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{t('patient_adherence')}</h1>
            <p className="text-gray-500 mt-1">Review medication compliance across all patients</p>
          </div>
        </div>

        {patients.length === 0 ? (
          <div className="bg-white rounded-[24px] p-12 text-center shadow-sm border border-gray-100">
            <p className="text-gray-500">No patients linked to your account.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {patients.map(p => {
              const stats = adherenceData[p.id] || { adherence: 0, takenCount: 0, skippedCount: 0, medsList: [] };
              let barColor = 'bg-gray-200';
              if (stats.adherence > 80) barColor = 'bg-medical-green';
              else if (stats.adherence > 50) barColor = 'bg-amber-400';
              else if (stats.adherence > 0) barColor = 'bg-red-500';

              return (
                <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center gap-6">
                  
                  <div className="flex items-center gap-4 min-w-[250px]">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-lg">
                      {p.displayName ? p.displayName.charAt(0).toUpperCase() : <User size={20} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{p.displayName || 'Unknown Patient'}</h3>
                      <p className="text-xs text-gray-500 font-mono">{p.id.substring(0,8)}</p>
                    </div>
                  </div>

                  <div className="flex-1 w-full">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">7-Day Adherence</span>
                      <span className={`text-xl font-bold ${stats.adherence > 80 ? 'text-green-600' : stats.adherence > 50 ? 'text-amber-500' : 'text-red-500'}`}>
                        {stats.adherence}%
                      </span>
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} rounded-full transition-all duration-1000`} style={{ width: `${stats.adherence}%` }}></div>
                    </div>
                  </div>

                  <div className="flex gap-4 shrink-0 min-w-[200px]">
                    <div className="bg-green-50 p-3 rounded-xl flex-1 text-center border border-green-100">
                      <p className="text-lg font-bold text-green-600">{stats.takenCount}</p>
                      <p className="text-[10px] font-bold text-green-700 uppercase">Taken</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-xl flex-1 text-center border border-red-100">
                      <p className="text-lg font-bold text-red-500">{stats.skippedCount}</p>
                      <p className="text-[10px] font-bold text-red-700 uppercase">Skipped</p>
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
