import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useLanguage } from '../../context/LanguageContext';
import { dbService } from '../../utils/firebaseService';
import { AlertTriangle, MapPin, Phone, ShieldAlert, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function CaregiverEmergencies() {
  const { t } = useLanguage();
  const [patient, setPatient] = useState(null);
  const [emergencies, setEmergencies] = useState([]);

  useEffect(() => {
    const unsubPat = dbService.onValue('users', (data) => {
      if (data) {
        const p = Object.keys(data).map(k => ({id:k, ...data[k]})).find(u => u.role === 'patient');
        if (p) {
          setPatient(p);
          dbService.onValue(`emergencies/${p.id}`, (eData) => {
            if (eData) {
              const arr = Object.keys(eData).map(k => ({id:k, ...eData[k]}));
              arr.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
              setEmergencies(arr);
            } else {
              setEmergencies([]);
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

  const handleCall112 = () => {
    window.location.href = 'tel:112';
  };

  const handleResolve = async (id) => {
    if (!patient?.id) return;
    try {
      await dbService.update(`emergencies/${patient.id}/${id}`, { status: 'resolved' });
      toast.success('Emergency marked as resolved');
    } catch (e) {
      toast.error(t('somethingWentWrong'));
    }
  };

  return (
    <Layout title={t('emergency_requests')}>
      <div className="max-w-4xl mx-auto py-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-red-600 flex items-center gap-2">
            <ShieldAlert size={32} /> {t('emergency_requests')}
          </h1>
          <p className="text-gray-500 mt-1">Critical SOS alerts triggered by your dependent</p>
        </div>

        {emergencies.length === 0 ? (
          <div className="bg-white rounded-[24px] p-12 text-center shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">{t('no_active_emergencies')}</h2>
          </div>
        ) : (
          <div className="space-y-6">
            {emergencies.map(e => (
              <motion.div key={e.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`bg-white rounded-[24px] shadow-sm border-l-4 overflow-hidden ${e.status === 'emergency' ? 'border-l-red-600 bg-red-50/20' : e.status === 'in_progress' ? 'border-l-amber-500' : 'border-l-green-500'}`}>
                
                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${e.status === 'emergency' ? 'bg-red-600 text-white animate-pulse' : e.status === 'in_progress' ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'}`}>
                        {e.status.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-bold text-gray-500">{new Date(e.timestamp).toLocaleString()}</span>
                    </div>

                    <h3 className={`text-2xl font-bold mb-2 flex items-center gap-2 ${e.status === 'emergency' ? 'text-red-700' : 'text-gray-800'}`}>
                      <AlertTriangle size={24} /> {e.reason || 'SOS Triggered'}
                    </h3>
                    
                    {e.location && e.location !== 'Unknown' && (
                      <div className="flex items-center gap-2 text-gray-600 bg-white p-3 rounded-xl border border-gray-200 mt-4">
                        <MapPin size={20} className="text-medical-blue" />
                        <span className="font-bold">{e.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 w-full md:w-48 shrink-0">
                    <button onClick={handleCall} className="w-full py-4 bg-medical-blue hover:bg-blue-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-colors">
                      <Phone size={18} /> {t('call_patient')}
                    </button>
                    <button onClick={handleCall112} className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-colors">
                      <Phone size={18} /> Call 112
                    </button>
                    {(e.status === 'emergency' || e.status === 'in_progress') && (
                      <button onClick={() => handleResolve(e.id)} className="w-full py-4 bg-white border-2 border-gray-200 hover:bg-green-50 hover:border-green-500 hover:text-green-600 text-gray-700 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                        <CheckCircle size={18} /> {t('resolve')}
                      </button>
                    )}
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
