import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useLanguage } from '../../context/LanguageContext';
import { dbService } from '../../utils/firebaseService';
import { Bell, AlertTriangle, Phone, CheckCircle, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function AdminAlerts() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState([]);
  const [patients, setPatients] = useState({});

  useEffect(() => {
    // 1. Fetch Patients mapping for details
    const unsubPat = dbService.onValue('users', (data) => {
      if (data) {
        const pMap = {};
        Object.keys(data).forEach(k => {
          if (data[k].role === 'patient') pMap[k] = data[k];
        });
        setPatients(pMap);
      }
    });

    // 2. Fetch Alerts
    const unsubAlerts = dbService.onValue('alerts', (data) => {
      const allAlerts = [];
      if (data) {
        Object.keys(data).forEach(patientId => {
          Object.keys(data[patientId]).forEach(alertId => {
            allAlerts.push({ id: alertId, patientId, ...data[patientId][alertId], isEmergency: false });
          });
        });
      }
      
      // 3. Fetch Emergencies and combine
      dbService.onValue('emergencies', (eData) => {
        const finalArr = [...allAlerts];
        if (eData) {
          Object.keys(eData).forEach(patientId => {
            Object.keys(eData[patientId]).forEach(emergId => {
              finalArr.push({ id: emergId, patientId, ...eData[patientId][emergId], isEmergency: true });
            });
          });
        }
        finalArr.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setAlerts(finalArr);
      }, true);

    });

    return () => { unsubPat(); unsubAlerts(); };
  }, []);

  const handleUpdateStatus = async (item, status) => {
    const path = item.isEmergency ? `emergencies/${item.patientId}/${item.id}` : `alerts/${item.patientId}/${item.id}`;
    try {
      await dbService.update(path, { status });
      toast.success(status === 'read' ? 'Marked as read' : 'Resolved successfully');
    } catch (e) {
      toast.error(t('somethingWentWrong'));
    }
  };

  const handleCallPatient = (patientId) => {
    const p = patients[patientId];
    if (p?.phone) window.location.href = `tel:${p.phone}`;
    else toast.error("Patient phone not available");
  };

  const handleCallCaregiver = async (patientId) => {
    try {
      const pProfile = await dbService.get(`users/${patientId}/profile`);
      if (pProfile?.caregiverPhone) window.location.href = `tel:${pProfile.caregiverPhone}`;
      else toast.error("Caregiver phone not available");
    } catch (e) {
      toast.error("Could not retrieve caregiver phone");
    }
  };

  return (
    <Layout title={t('alerts')}>
      <div className="max-w-6xl mx-auto py-8">
        
        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
            <Bell size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Global Alerts Feed</h1>
            <p className="text-gray-500 mt-1">Monitor real-time system alerts and emergencies</p>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="bg-white rounded-[24px] p-12 text-center shadow-sm border border-gray-100">
            <p className="text-gray-500">No active alerts recorded.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map(item => {
              const p = patients[item.patientId] || { displayName: 'Unknown Patient' };
              const isCrit = item.isEmergency || item.status === 'emergency';
              
              return (
                <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`bg-white rounded-[24px] shadow-sm border-l-4 p-6 flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center ${item.status === 'resolved' ? 'border-l-gray-300 bg-gray-50/50 opacity-75' : isCrit ? 'border-l-red-500 bg-red-50/30' : 'border-l-amber-500 bg-amber-50/30'}`}>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {isCrit ? <AlertTriangle size={20} className="text-red-500" /> : <Bell size={18} className="text-amber-500" />}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.status === 'resolved' ? 'bg-gray-200 text-gray-600' : isCrit ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-amber-100 text-amber-700'}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-bold text-gray-400 uppercase">{item.isEmergency ? 'SOS' : (item.type || 'Alert').replace(/_/g, ' ')}</span>
                    </div>

                    <h3 className="font-bold text-xl text-gray-800 mb-1">{item.reason || item.message || 'Alert Triggered'}</h3>
                    <p className="text-sm text-gray-600 mb-2 font-medium">Patient: {p.displayName}</p>
                    <p className="text-xs text-gray-400">{new Date(item.timestamp).toLocaleString()}</p>
                  </div>

                  <div className="flex flex-wrap gap-3 w-full lg:w-auto shrink-0">
                    <button onClick={() => handleCallPatient(item.patientId)} className="flex-1 lg:flex-none px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                      <Phone size={16} /> Patient
                    </button>
                    <button onClick={() => handleCallCaregiver(item.patientId)} className="flex-1 lg:flex-none px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                      <Phone size={16} /> Caregiver
                    </button>
                    
                    {item.status === 'unread' && !item.isEmergency && (
                      <button onClick={() => handleUpdateStatus(item, 'read')} className="flex-1 lg:flex-none px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                        <CheckCircle size={16} /> Mark Read
                      </button>
                    )}

                    {item.status !== 'resolved' && (
                      <button onClick={() => handleUpdateStatus(item, 'resolved')} className="flex-1 lg:flex-none px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                        <CheckCircle size={16} /> Resolve
                      </button>
                    )}
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
