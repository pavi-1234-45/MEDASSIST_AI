import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useLanguage } from '../../context/LanguageContext';
import { dbService } from '../../utils/firebaseService';
import { Users, X, Activity, Pill, Calendar, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DoctorPatients() {
  const { t } = useLanguage();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // Modal Data
  const [patientProfile, setPatientProfile] = useState(null);
  const [patientMeds, setPatientMeds] = useState([]);
  const [patientAppts, setPatientAppts] = useState([]);

  useEffect(() => {
    const unsub = dbService.onValue('users', (data) => {
      if (data) {
        const pList = Object.keys(data)
          .map(k => ({ id: k, ...data[k] }))
          .filter(u => u.role === 'patient');
        setPatients(pList);
      }
    });
    return () => unsub();
  }, []);

  const openPatientModal = async (patient) => {
    setSelectedPatient(patient);
    
    dbService.onValue(`users/${patient.id}/profile`, (data) => setPatientProfile(data || {}), true);
    dbService.onValue(`medicines/${patient.id}`, (data) => {
      if (data) setPatientMeds(Object.values(data));
      else setPatientMeds([]);
    }, true);
    
    dbService.onValue(`appointments`, (data) => {
      if (data) setPatientAppts(Object.values(data).filter(a => a.patientId === patient.id));
      else setPatientAppts([]);
    }, true);
  };

  const closeModal = () => {
    setSelectedPatient(null);
    setPatientProfile(null);
    setPatientMeds([]);
    setPatientAppts([]);
  };

  return (
    <Layout title={t('patients')}>
      <div className="max-w-6xl mx-auto py-8">
        
        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 bg-teal-50 text-medical-teal rounded-xl">
            <Users size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{t('total_patients')}</h1>
            <p className="text-gray-500 mt-1">Review linked patient summaries</p>
          </div>
        </div>

        {patients.length === 0 ? (
          <div className="bg-white rounded-[24px] p-12 text-center shadow-sm border border-gray-100">
            <p className="text-gray-500">No patients linked to your account.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.map(p => (
              <motion.div key={p.id} onClick={() => openPatientModal(p)} className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-medical-blue transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-teal-400 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-teal-500/30">
                    {(p.displayName || 'P').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{p.displayName || 'Unnamed Patient'}</h3>
                    <p className="text-xs text-gray-500 font-mono">{p.id.substring(0,8)}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase">View Summary</span>
                  <Activity size={16} className="text-medical-teal" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {selectedPatient && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                
                <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-medical-blue text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg shadow-medical-blue/30">
                      {(selectedPatient.displayName || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{selectedPatient.displayName || 'Patient'}</h2>
                      <p className="text-gray-500 text-sm">{patientProfile?.age ? `${patientProfile.age} yrs • ` : ''}{patientProfile?.gender || 'Unknown'}</p>
                    </div>
                  </div>
                  <button onClick={closeModal} className="p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors">
                    <X size={24} className="text-gray-700" />
                  </button>
                </div>

                <div className="p-6 md:p-8 overflow-y-auto bg-white flex-1 space-y-8">
                  
                  {/* Profile Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                      <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Blood Group</p>
                      <p className="font-bold text-gray-800">{patientProfile?.bloodGroup || 'N/A'}</p>
                    </div>
                    <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100">
                      <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Allergies</p>
                      <p className="font-bold text-gray-800">{patientProfile?.allergies || 'None'}</p>
                    </div>
                    <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                      <p className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-1">Conditions</p>
                      <p className="font-bold text-gray-800">{patientProfile?.conditions || 'None'}</p>
                    </div>
                  </div>

                  {/* Split View */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Medicines */}
                    <div>
                      <h3 className="flex items-center gap-2 font-bold text-gray-800 text-lg mb-4 border-b border-gray-100 pb-2">
                        <Pill size={20} className="text-medical-teal" /> Current Medicines
                      </h3>
                      {patientMeds.length === 0 ? <p className="text-sm text-gray-500">No medicines logged.</p> : (
                        <div className="space-y-3">
                          {patientMeds.slice(0, 5).map(m => (
                            <div key={m.id || m.medicineId} className="flex justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <div>
                                <p className="font-bold text-gray-800">{m.name}</p>
                                <p className="text-xs text-gray-500">{m.dosage} • {m.frequency}</p>
                              </div>
                              <span className={`px-2 py-1 h-fit text-xs font-bold rounded-lg ${m.status === 'taken' ? 'bg-green-100 text-green-700' : m.status === 'skipped' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'}`}>{m.status || 'pending'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Appointments */}
                    <div>
                      <h3 className="flex items-center gap-2 font-bold text-gray-800 text-lg mb-4 border-b border-gray-100 pb-2">
                        <Calendar size={20} className="text-medical-blue" /> Recent Appointments
                      </h3>
                      {patientAppts.length === 0 ? <p className="text-sm text-gray-500">No appointments history.</p> : (
                        <div className="space-y-3">
                          {patientAppts.sort((a,b)=> new Date(b.date)-new Date(a.date)).slice(0, 5).map(a => (
                            <div key={a.id || a.appointmentId} className="flex flex-col p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <p className="font-bold text-gray-800">{a.date} at {a.time}</p>
                              <div className="flex justify-between items-center mt-1">
                                <p className="text-xs text-gray-500 truncate max-w-[200px]">{a.reason || 'No reason'}</p>
                                <span className="text-xs font-bold text-medical-blue">{a.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </Layout>
  );
}
