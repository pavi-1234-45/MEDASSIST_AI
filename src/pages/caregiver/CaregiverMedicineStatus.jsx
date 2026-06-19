import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useLanguage } from '../../context/LanguageContext';
import { dbService } from '../../utils/firebaseService';
import { Pill, Phone, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function CaregiverMedicineStatus() {
  const { t } = useLanguage();
  const [patient, setPatient] = useState(null);
  const [medicines, setMedicines] = useState([]);

  useEffect(() => {
    const unsubPat = dbService.onValue('users', (data) => {
      if (data) {
        const p = Object.keys(data).map(k => ({id:k, ...data[k]})).find(u => u.role === 'patient');
        if (p) {
          setPatient(p);
          dbService.onValue(`medicines/${p.id}`, (mData) => {
            if (mData) {
              const arr = Object.values(mData);
              setMedicines(arr);
            } else {
              setMedicines([]);
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
        message: 'Caregiver reminded patient about medicine',
        timestamp: new Date().toISOString()
      });
      toast.success('Reminder sent to patient');
    } catch (e) {
      toast.error('Failed to send reminder');
    }
  };

  const takenCount = medicines.filter(m => m.status === 'taken').length;
  const skippedCount = medicines.filter(m => m.status === 'skipped').length;
  const pendingCount = medicines.filter(m => !m.status || m.status === 'pending').length;
  const adherence = medicines.length > 0 ? Math.round((takenCount / medicines.length) * 100) : 0;

  return (
    <Layout title={t('medicine_status')}>
      <div className="max-w-4xl mx-auto py-8">
        
        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 bg-teal-50 text-medical-teal rounded-xl">
            <Pill size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{t('medicine_status')}</h1>
            <p className="text-gray-500 mt-1">Review {patient?.displayName || 'patient'}'s adherence today</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
            <p className="text-sm font-bold text-gray-500 uppercase">Adherence</p>
            <p className={`text-2xl font-bold ${adherence >= 80 ? 'text-green-500' : adherence >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{adherence}%</p>
          </div>
          <div className="bg-green-50 p-4 rounded-2xl border border-green-100 text-center">
            <p className="text-sm font-bold text-green-700 uppercase">Taken</p>
            <p className="text-2xl font-bold text-green-600">{takenCount}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-center">
            <p className="text-sm font-bold text-red-700 uppercase">Skipped</p>
            <p className="text-2xl font-bold text-red-600">{skippedCount}</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-center">
            <p className="text-sm font-bold text-amber-700 uppercase">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-lg text-gray-800">Today's Medicines</h2>
          </div>
          
          {medicines.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No medicines scheduled for today.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {medicines.map((m, idx) => (
                <div key={idx} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <div>
                    <h3 className="font-bold text-gray-800">{m.name}</h3>
                    <p className="text-sm text-gray-500">{m.dosage} • {m.time} • {m.frequency}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${m.status === 'taken' ? 'bg-green-100 text-green-700' : m.status === 'skipped' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {m.status || 'pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={handleCall} className="flex-1 py-4 bg-white border-2 border-gray-200 hover:border-medical-blue hover:shadow-md text-gray-800 font-bold rounded-2xl transition-all flex items-center justify-center gap-2">
            <Phone size={20} className="text-medical-blue" /> {t('call_patient')}
          </button>
          <button onClick={handleRemind} className="flex-1 py-4 bg-medical-blue hover:bg-blue-700 shadow-lg shadow-medical-blue/30 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2">
            <Bell size={20} /> {t('remind_patient')}
          </button>
        </div>

      </div>
    </Layout>
  );
}
