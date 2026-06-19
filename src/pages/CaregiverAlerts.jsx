import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { dbService } from '../utils/firebaseService';
import { Bell, CheckCircle, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function CaregiverAlerts() {
  const { t } = useLanguage();
  const [patient, setPatient] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const unsubPat = dbService.onValue('users', (data) => {
      if (data) {
        const p = Object.keys(data).map(k => ({id:k, ...data[k]})).find(u => u.role === 'patient');
        if (p) {
          setPatient(p);
          dbService.onValue(`alerts/${p.id}`, (aData) => {
            if (aData) {
              const arr = Object.keys(aData).map(k => ({id:k, ...aData[k]}));
              arr.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
              setAlerts(arr);
            } else {
              setAlerts([]);
            }
          }, true);
        }
      }
    });
    return () => unsubPat();
  }, []);

  const handleUpdateStatus = async (alertId, status) => {
    if (!patient?.id) return;
    try {
      await dbService.update(`alerts/${patient.id}/${alertId}`, { status });
      toast.success(status === 'read' ? 'Alert marked as read' : 'Alert resolved');
    } catch (e) {
      toast.error(t('somethingWentWrong'));
    }
  };

  const handleCall = () => {
    if (patient?.phone) window.location.href = `tel:${patient.phone}`;
  };

  const getAlertStyle = (type, status) => {
    if (status === 'resolved') return 'border-l-gray-300 bg-gray-50 opacity-75';
    if (type?.includes('emergency')) return 'border-l-red-500 bg-red-50/30';
    if (type?.includes('missed')) return 'border-l-amber-500 bg-amber-50/30';
    return 'border-l-medical-blue bg-blue-50/30';
  };

  return (
    <Layout title={t('alerts')}>
      <div className="max-w-4xl mx-auto py-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">{t('alerts')}</h1>
          <p className="text-gray-500 mt-1">Review notifications for your linked patient</p>
        </div>

        {alerts.length === 0 ? (
          <div className="bg-white rounded-[24px] p-12 text-center shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell size={40} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No Alerts Found</h2>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map(a => (
              <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`bg-white p-6 rounded-[24px] shadow-sm border border-l-4 border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center ${getAlertStyle(a.type, a.status)}`}>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{a.type?.replace(/_/g, ' ') || 'Notification'}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${a.status === 'unread' ? 'bg-amber-100 text-amber-700' : a.status === 'read' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                      {a.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-800">{a.message || 'Alert triggered'}</h3>
                  <p className="text-sm text-gray-500 mt-1">{new Date(a.timestamp).toLocaleString()}</p>
                </div>

                <div className="flex gap-2 w-full md:w-auto shrink-0">
                  <button onClick={handleCall} className="flex-1 md:flex-none px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                    <Phone size={16} /> Call
                  </button>
                  {a.status === 'unread' && (
                    <button onClick={() => handleUpdateStatus(a.id, 'read')} className="flex-1 md:flex-none px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                      <Bell size={16} /> Mark Read
                    </button>
                  )}
                  {a.status !== 'resolved' && (
                    <button onClick={() => handleUpdateStatus(a.id, 'resolved')} className="flex-1 md:flex-none px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                      <CheckCircle size={16} /> Resolve
                    </button>
                  )}
                </div>

              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
