import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useLanguage } from '../../context/LanguageContext';
import { dbService } from '../../utils/firebaseService';
import { FileText, Activity, AlertTriangle, Pill } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CaregiverReports() {
  const { t } = useLanguage();
  const [patient, setPatient] = useState(null);
  
  const [medicines, setMedicines] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [emergencies, setEmergencies] = useState([]);

  useEffect(() => {
    const unsubPat = dbService.onValue('users', (data) => {
      if (data) {
        const p = Object.keys(data).map(k => ({id:k, ...data[k]})).find(u => u.role === 'patient');
        if (p) {
          setPatient(p);
          dbService.onValue(`medicines/${p.id}`, (mData) => setMedicines(mData ? Object.values(mData) : []), true);
          dbService.onValue(`alerts/${p.id}`, (aData) => {
            const arr = aData ? Object.values(aData) : [];
            arr.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
            setAlerts(arr);
          }, true);
          dbService.onValue(`emergencies/${p.id}`, (eData) => {
            const arr = eData ? Object.values(eData) : [];
            arr.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
            setEmergencies(arr);
          }, true);
        }
      }
    });
    return () => unsubPat();
  }, []);

  const takenCount = medicines.filter(m => m.status === 'taken').length;
  const skippedCount = medicines.filter(m => m.status === 'skipped').length;
  const adherence = medicines.length > 0 ? Math.round((takenCount / medicines.length) * 100) : 0;
  
  const missedMeds = medicines.filter(m => m.status === 'skipped');

  return (
    <Layout title={t('reports')}>
      <div className="max-w-5xl mx-auto py-8">
        
        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl">
            <FileText size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{t('reports')}</h1>
            <p className="text-gray-500 mt-1">Analytics and history for {patient?.displayName || 'patient'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 col-span-1 md:col-span-2">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Activity size={20} className="text-medical-teal" /> 7-Day Adherence
            </h2>
            <div className="flex items-end gap-6">
              <div className="w-32 h-32 rounded-full border-[12px] border-gray-100 flex items-center justify-center relative">
                <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="52" fill="none" stroke={adherence >= 80 ? '#10B981' : adherence >= 50 ? '#F59E0B' : '#EF4444'} strokeWidth="12" strokeDasharray="326.72" strokeDashoffset={326.72 - (326.72 * adherence) / 100} className="transition-all duration-1000" strokeLinecap="round" />
                </svg>
                <span className="text-3xl font-bold text-gray-800">{adherence}%</span>
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                  <span className="font-bold text-gray-600">Total Meds</span>
                  <span className="font-bold text-gray-800">{medicines.length}</span>
                </div>
                <div className="flex justify-between items-center bg-green-50 p-3 rounded-xl border border-green-100">
                  <span className="font-bold text-green-700">Taken</span>
                  <span className="font-bold text-green-600">{takenCount}</span>
                </div>
                <div className="flex justify-between items-center bg-red-50 p-3 rounded-xl border border-red-100">
                  <span className="font-bold text-red-700">Skipped/Missed</span>
                  <span className="font-bold text-red-600">{skippedCount}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Pill size={18} className="text-medical-blue" /> Missed Meds
            </h2>
            {missedMeds.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl">No missed meds.</div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {missedMeds.map((m, i) => (
                  <div key={i} className="p-3 bg-red-50/50 border border-red-100 rounded-xl">
                    <p className="font-bold text-red-800">{m.name}</p>
                    <p className="text-xs text-red-500">{m.time} • {m.dosage}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-500" /> Alert History
            </h2>
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No alerts recorded.</div>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0,5).map((a, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl flex justify-between items-center border border-gray-100">
                    <div>
                      <p className="font-bold text-gray-800">{a.message}</p>
                      <p className="text-xs text-gray-500">{new Date(a.timestamp).toLocaleString()}</p>
                    </div>
                    <span className="text-xs font-bold uppercase text-gray-400">{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-500" /> Emergency History
            </h2>
            {emergencies.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No emergencies recorded.</div>
            ) : (
              <div className="space-y-3">
                {emergencies.slice(0,5).map((e, i) => (
                  <div key={i} className="p-4 bg-red-50 rounded-xl flex justify-between items-center border border-red-100">
                    <div>
                      <p className="font-bold text-red-800">{e.reason || 'SOS Triggered'}</p>
                      <p className="text-xs text-red-500">{new Date(e.timestamp).toLocaleString()}</p>
                    </div>
                    <span className="text-xs font-bold uppercase text-red-400">{e.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}
