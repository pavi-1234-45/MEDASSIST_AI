import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { dbService } from '../utils/firebaseService';
import { AlertTriangle, MapPin, Clock, Phone, Activity, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function DoctorEmergencies() {
  const { t } = useLanguage();
  const [emergencies, setEmergencies] = useState([]);

  useEffect(() => {
    // Flatten emergencies from all patients
    const unsub = dbService.onValue('emergencies', (data) => {
      if (data) {
        let allEmergencies = [];
        Object.keys(data).forEach(patientId => {
          Object.keys(data[patientId]).forEach(emergId => {
            allEmergencies.push({ id: emergId, patientId, ...data[patientId][emergId] });
          });
        });
        allEmergencies.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setEmergencies(allEmergencies);
      } else {
        setEmergencies([]);
      }
    });
    return () => unsub();
  }, []);

  const handleUpdateStatus = async (eId, pId, status) => {
    try {
      await dbService.update(`emergencies/${pId}/${eId}`, { status });
      toast.success(t('status_updated') || `Marked as ${status.replace('_', ' ')}`);
    } catch (err) {
      toast.error(t('somethingWentWrong'));
    }
  };

  const handleCall = async (pId) => {
    // In a real app we would fetch the user's phone, here we simulate
    const data = await new Promise(resolve => dbService.onValue(`users/${pId}/profile`, resolve, true));
    const phone = data?.phone || '112';
    window.location.href = `tel:${phone}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'emergency': return 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40';
      case 'in_progress': return 'bg-amber-500 text-white';
      case 'completed':
      case 'resolved': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <Layout title={t('emergency_requests')}>
      <div className="max-w-5xl mx-auto py-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">{t('emergency_requests')}</h1>
          <p className="text-gray-500 mt-1">Review and manage SOS alerts from your patients</p>
        </div>

        {emergencies.length === 0 ? (
          <div className="bg-white rounded-[24px] p-12 text-center shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('no_active_emergencies')}</h2>
          </div>
        ) : (
          <div className="space-y-4">
            {emergencies.map((e) => (
              <motion.div key={e.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`bg-white rounded-[24px] shadow-sm border-l-4 overflow-hidden ${e.status === 'emergency' ? 'border-l-red-500' : e.status === 'in_progress' ? 'border-l-amber-500' : 'border-l-green-500'}`}>
                <div className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-xl text-gray-800">Patient: {e.patientId.substring(0,6)}...</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(e.status)}`}>
                        {t(e.status) || e.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-2 mt-4">
                      <div className="flex items-start gap-2 text-gray-700 font-bold text-lg">
                        <AlertTriangle size={20} className="text-red-500 mt-1" />
                        <span>{e.reason || 'SOS Triggered manually'}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                          <Clock size={16} /> {new Date(e.timestamp).toLocaleString()}
                        </div>
                        {e.location && e.location !== 'Unknown' && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                            <MapPin size={16} /> {e.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
                    <button onClick={() => handleCall(e.patientId)} className="w-full md:w-48 py-3 bg-medical-blue hover:bg-blue-700 text-white font-bold rounded-xl text-sm flex justify-center items-center gap-2 transition-colors shadow-lg shadow-medical-blue/20">
                      <Phone size={18} /> {t('call_patient')}
                    </button>
                    
                    {e.status === 'emergency' && (
                      <button onClick={() => handleUpdateStatus(e.id, e.patientId, 'in_progress')} className="w-full md:w-48 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-xl text-sm flex justify-center items-center gap-2 transition-colors">
                        <Activity size={18} /> {t('mark_in_progress')}
                      </button>
                    )}
                    
                    {(e.status === 'emergency' || e.status === 'in_progress') && (
                      <button onClick={() => handleUpdateStatus(e.id, e.patientId, 'completed')} className="w-full md:w-48 py-3 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-xl text-sm flex justify-center items-center gap-2 transition-colors">
                        <CheckCircle size={18} /> {t('mark_completed')}
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
