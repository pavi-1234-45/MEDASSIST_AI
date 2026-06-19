import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useLanguage } from '../../context/LanguageContext';
import { dbService } from '../../utils/firebaseService';
import { Users, Search, Activity, Pill, AlertTriangle, Calendar, X, FileText, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPatients() {
  const { t } = useLanguage();
  
  const [patientsList, setPatientsList] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [conditionFilter, setConditionFilter] = useState('All');
  const [emergencyFilter, setEmergencyFilter] = useState('All');
  
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    // We need users, profiles, medicines, appointments, alerts/emergencies to build the table
    let usersData = {};
    let profilesData = {};
    let medsData = {};
    let apptsData = {};
    let emergData = {};

    const buildList = () => {
      const pList = [];
      Object.keys(usersData).forEach(uid => {
        if (usersData[uid].role === 'patient') {
          const profile = profilesData[uid] || {};
          
          // Last Medicine
          let lastMedStatus = 'Unknown';
          if (medsData[uid]) {
            const mArr = Object.values(medsData[uid]);
            if (mArr.length > 0) {
              const last = mArr.sort((a,b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`))[0];
              lastMedStatus = last.status || 'pending';
            }
          }

          // Last Appt
          let lastApptStatus = 'Unknown';
          const pAppts = Object.values(apptsData).filter(a => a.patientId === uid);
          if (pAppts.length > 0) {
            const last = pAppts.sort((a,b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`))[0];
            lastApptStatus = last.status || 'pending';
          }

          // Emergencies
          let emergStatus = 'Safe';
          const pEmerg = emergData[uid] ? Object.values(emergData[uid]) : [];
          if (pEmerg.some(e => e.status !== 'resolved')) {
            emergStatus = 'Active SOS';
          }

          pList.push({
            id: uid,
            ...usersData[uid],
            profile,
            lastMedStatus,
            lastApptStatus,
            emergStatus,
            rawMeds: medsData[uid] ? Object.values(medsData[uid]) : [],
            rawAppts: pAppts,
            rawEmerg: pEmerg
          });
        }
      });
      setPatientsList(pList);
    };

    const unsub1 = dbService.onValue('users', d => { usersData = d || {}; buildList(); });
    const unsub2 = dbService.onValue('profiles', d => { profilesData = d || {}; buildList(); });
    const unsub3 = dbService.onValue('medicines', d => { medsData = d || {}; buildList(); });
    const unsub4 = dbService.onValue('appointments', d => { apptsData = d || {}; buildList(); });
    const unsub5 = dbService.onValue('emergencies', d => { emergData = d || {}; buildList(); });

    // One time pull if profiles are stored inside users like users/UID/profile
    dbService.get('users').then(d => {
      if(d) {
        Object.keys(d).forEach(k => {
          if(d[k].profile) profilesData[k] = d[k].profile;
        });
        buildList();
      }
    });

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); };
  }, []);

  const openModal = (p) => setSelectedPatient(p);
  const closeModal = () => setSelectedPatient(null);

  const filteredPatients = patientsList.filter(p => {
    const matchSearch = (p.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (p.profile?.phone || '').includes(searchQuery);
    
    const matchCond = conditionFilter === 'All' || (p.profile?.conditions || '').toLowerCase().includes(conditionFilter.toLowerCase());
    const matchEmerg = emergencyFilter === 'All' || p.emergStatus === emergencyFilter;

    return matchSearch && matchCond && matchEmerg;
  });

  return (
    <Layout title={t('patients')}>
      <div className="max-w-7xl mx-auto py-8">
        
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-50 text-medical-teal rounded-xl">
              <Users size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{t('total_patients')}</h1>
              <p className="text-gray-500 mt-1">Directory of all registered patients</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name or phone..." 
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-medical-blue outline-none"
              />
            </div>
            <select 
              value={conditionFilter} onChange={e => setConditionFilter(e.target.value)}
              className="px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-medical-blue"
            >
              <option value="All">All Conditions</option>
              <option value="diabetes">Diabetes</option>
              <option value="hypertension">Hypertension</option>
              <option value="asthma">Asthma</option>
            </select>
            <select 
              value={emergencyFilter} onChange={e => setEmergencyFilter(e.target.value)}
              className="px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-medical-blue"
            >
              <option value="All">All Status</option>
              <option value="Safe">Safe</option>
              <option value="Active SOS">Active SOS</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                <tr>
                  <th className="p-4">Patient Name</th>
                  <th className="p-4">Age/Phone</th>
                  <th className="p-4">Medical Conditions</th>
                  <th className="p-4">Linked Caregiver</th>
                  <th className="p-4">Last Medicine</th>
                  <th className="p-4">Last Appt</th>
                  <th className="p-4">Emerg. Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-gray-500">No patients match the filters.</td>
                  </tr>
                ) : (
                  filteredPatients.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-gray-800">{p.displayName || 'Unknown'}</td>
                      <td className="p-4 text-gray-600">
                        {p.profile?.age ? `${p.profile.age}y` : 'N/A'}<br/>
                        <span className="text-xs text-gray-400">{p.profile?.phone || 'No phone'}</span>
                      </td>
                      <td className="p-4 text-gray-600 max-w-[150px] truncate" title={p.profile?.conditions}>{p.profile?.conditions || 'None'}</td>
                      <td className="p-4 text-gray-600">{p.profile?.caregiverName || 'None'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${p.lastMedStatus === 'taken' ? 'bg-green-100 text-green-700' : p.lastMedStatus === 'skipped' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                          {p.lastMedStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${p.lastApptStatus === 'completed' ? 'bg-green-100 text-green-700' : p.lastApptStatus === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                          {p.lastApptStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        {p.emergStatus === 'Safe' ? (
                          <span className="text-green-500 font-bold flex items-center gap-1"><CheckCircle size={14}/> Safe</span>
                        ) : (
                          <span className="text-red-500 font-bold flex items-center gap-1 animate-pulse"><AlertTriangle size={14}/> SOS</span>
                        )}
                      </td>
                      <td className="p-4">
                        <button onClick={() => openModal(p)} className="px-4 py-2 bg-medical-blue hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors">
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <AnimatePresence>
          {selectedPatient && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-white rounded-[32px] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
                
                <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-medical-teal text-white rounded-full flex items-center justify-center font-bold text-xl">
                      {(selectedPatient.displayName || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{selectedPatient.displayName || 'Patient'}</h2>
                      <p className="text-gray-500 text-sm">{selectedPatient.profile?.age ? `${selectedPatient.profile.age} yrs • ` : ''}{selectedPatient.profile?.phone || 'No phone'}</p>
                    </div>
                  </div>
                  <button onClick={closeModal} className="p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors">
                    <X size={24} className="text-gray-700" />
                  </button>
                </div>

                <div className="p-6 md:p-8 overflow-y-auto bg-white flex-1 space-y-8">
                  
                  {/* Summary row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-teal-50 p-4 rounded-xl">
                      <p className="text-xs font-bold text-teal-600 uppercase mb-1">Adherence (7 days)</p>
                      <p className="text-2xl font-bold text-teal-700">
                        {selectedPatient.rawMeds.length > 0 ? Math.round((selectedPatient.rawMeds.filter(m => m.status === 'taken').length / selectedPatient.rawMeds.length) * 100) : 0}%
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl">
                      <p className="text-xs font-bold text-blue-600 uppercase mb-1">Appointments</p>
                      <p className="text-2xl font-bold text-blue-700">{selectedPatient.rawAppts.length}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-xl">
                      <p className="text-xs font-bold text-red-600 uppercase mb-1">Emergencies</p>
                      <p className="text-2xl font-bold text-red-700">{selectedPatient.rawEmerg.length}</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-xl">
                      <p className="text-xs font-bold text-amber-600 uppercase mb-1">Conditions</p>
                      <p className="font-bold text-amber-700 truncate">{selectedPatient.profile?.conditions || 'None'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    <div className="space-y-6">
                      {/* Current Medicines */}
                      <div>
                        <h3 className="flex items-center gap-2 font-bold text-gray-800 text-lg mb-4 border-b border-gray-100 pb-2">
                          <Pill size={20} className="text-medical-teal" /> Current Medicines
                        </h3>
                        <div className="space-y-2">
                          {selectedPatient.rawMeds.slice(0,3).map((m, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex justify-between">
                              <span className="font-bold text-gray-700">{m.name}</span>
                              <span className="text-sm text-gray-500">{m.time}</span>
                            </div>
                          ))}
                          {selectedPatient.rawMeds.length === 0 && <p className="text-gray-500 text-sm">No medicines found.</p>}
                        </div>
                      </div>

                      {/* Appointment History */}
                      <div>
                        <h3 className="flex items-center gap-2 font-bold text-gray-800 text-lg mb-4 border-b border-gray-100 pb-2">
                          <Calendar size={20} className="text-medical-blue" /> Appointment History
                        </h3>
                        <div className="space-y-2">
                          {selectedPatient.rawAppts.slice(0,3).map((a, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex justify-between">
                              <span className="font-bold text-gray-700">{a.date} w/ Dr. {a.doctorName || 'Unassigned'}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${a.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{a.status}</span>
                            </div>
                          ))}
                          {selectedPatient.rawAppts.length === 0 && <p className="text-gray-500 text-sm">No appointments found.</p>}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Emergency History */}
                      <div>
                        <h3 className="flex items-center gap-2 font-bold text-gray-800 text-lg mb-4 border-b border-gray-100 pb-2">
                          <AlertTriangle size={20} className="text-red-500" /> Emergency History
                        </h3>
                        <div className="space-y-2">
                          {selectedPatient.rawEmerg.slice(0,3).map((e, idx) => (
                            <div key={idx} className="p-3 bg-red-50 border border-red-100 rounded-xl flex justify-between">
                              <span className="font-bold text-red-700">{new Date(e.timestamp).toLocaleString()}</span>
                              <span className="text-sm font-bold text-red-600 uppercase">{e.status}</span>
                            </div>
                          ))}
                          {selectedPatient.rawEmerg.length === 0 && <p className="text-gray-500 text-sm">No emergencies reported.</p>}
                        </div>
                      </div>

                      {/* Caregiver */}
                      <div>
                        <h3 className="flex items-center gap-2 font-bold text-gray-800 text-lg mb-4 border-b border-gray-100 pb-2">
                          <Phone size={20} className="text-amber-500" /> Caregiver Contact
                        </h3>
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                          <p className="font-bold text-gray-800">{selectedPatient.profile?.caregiverName || 'No Caregiver Linked'}</p>
                          <p className="text-sm text-gray-500 mb-3">{selectedPatient.profile?.relationship || ''}</p>
                          {selectedPatient.profile?.caregiverPhone && (
                            <a href={`tel:${selectedPatient.profile.caregiverPhone}`} className="inline-block px-4 py-2 bg-white border border-amber-200 rounded-lg text-sm font-bold text-amber-700 hover:bg-amber-100 transition-colors">
                              Call Caregiver
                            </a>
                          )}
                        </div>
                      </div>
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
// Placeholder for CheckCircle to avoid undefined error
const CheckCircle = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);
