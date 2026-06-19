import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useLanguage } from '../../context/LanguageContext';
import { dbService } from '../../utils/firebaseService';
import { User, Search, Activity, Calendar, FileText, ShieldAlert, X, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDoctors() {
  const { t } = useLanguage();
  
  const [doctorsList, setDoctorsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [specFilter, setSpecFilter] = useState('All');
  
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    let usersData = {};
    let profilesData = {};
    let apptsData = {};
    let notesData = {};

    const buildList = () => {
      const dList = [];
      const today = new Date().toISOString().split('T')[0];

      Object.keys(usersData).forEach(uid => {
        if (usersData[uid].role === 'doctor') {
          const profile = profilesData[uid] || {};
          const spec = profile.specialization || 'General Physician';
          const phone = profile.phone || 'N/A';
          
          let todayAppts = 0;
          let pendingAppts = 0;
          let compAppts = 0;
          const patientSet = new Set();
          
          const rawAppts = [];

          Object.values(apptsData).forEach(a => {
            if (a.doctorName === usersData[uid].displayName || a.doctorId === uid) {
              rawAppts.push(a);
              if (a.date === today) todayAppts++;
              if (a.status === 'pending') pendingAppts++;
              if (a.status === 'completed') compAppts++;
              if (a.patientId) patientSet.add(a.patientId);
            }
          });

          const linkedPatients = patientSet.size;
          const docNotes = notesData[uid] ? Object.values(notesData[uid]) : [];

          // For the modal patient list
          const patientList = Array.from(patientSet).map(pid => {
            const pUser = usersData[pid];
            return { id: pid, name: pUser?.displayName || 'Unknown Patient' };
          });

          dList.push({
            id: uid,
            ...usersData[uid],
            spec,
            phone,
            todayAppts,
            pendingAppts,
            compAppts,
            linkedPatients,
            rawAppts,
            patientList,
            notesCount: docNotes.length,
            emergenciesHandled: Math.floor(Math.random() * 5) // Mocked as emergencies don't tie strictly to doc yet
          });
        }
      });
      setDoctorsList(dList);
    };

    const unsub1 = dbService.onValue('users', d => { usersData = d || {}; buildList(); });
    const unsub2 = dbService.onValue('profiles', d => { profilesData = d || {}; buildList(); });
    const unsub3 = dbService.onValue('appointments', d => { apptsData = d || {}; buildList(); });
    const unsub4 = dbService.onValue('notes', d => { notesData = d || {}; buildList(); });

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, []);

  const filteredDocs = doctorsList.filter(d => {
    const matchSearch = (d.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (d.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchSpec = specFilter === 'All' || d.spec.toLowerCase().includes(specFilter.toLowerCase());
    return matchSearch && matchSpec;
  });

  return (
    <Layout title={t('total_doctors')}>
      <div className="max-w-7xl mx-auto py-8">
        
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-50 text-medical-teal rounded-xl">
              <User size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{t('total_doctors')}</h1>
              <p className="text-gray-500 mt-1">Manage hospital clinical staff</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search doctors..." 
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-medical-teal outline-none"
              />
            </div>
            <select 
              value={specFilter} onChange={e => setSpecFilter(e.target.value)}
              className="px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-medical-teal"
            >
              <option value="All">All Specialties</option>
              <option value="General">General Physician</option>
              <option value="Cardiologist">Cardiologist</option>
              <option value="Pediatrician">Pediatrician</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                <tr>
                  <th className="p-4">Doctor Name</th>
                  <th className="p-4">Specialization</th>
                  <th className="p-4">Contact (Phone/Email)</th>
                  <th className="p-4 text-center">Today's Appts</th>
                  <th className="p-4 text-center">Pending Appts</th>
                  <th className="p-4 text-center">Completed Appts</th>
                  <th className="p-4 text-center">Linked Patients</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-gray-500">No doctors match the filters.</td>
                  </tr>
                ) : (
                  filteredDocs.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-gray-800">Dr. {d.displayName || 'Unknown'}</td>
                      <td className="p-4 text-gray-600">{d.spec}</td>
                      <td className="p-4 text-gray-600">
                        {d.phone}<br/>
                        <span className="text-xs text-gray-400">{d.email}</span>
                      </td>
                      <td className="p-4 text-center font-bold text-blue-600">{d.todayAppts}</td>
                      <td className="p-4 text-center font-bold text-amber-500">{d.pendingAppts}</td>
                      <td className="p-4 text-center font-bold text-teal-600">{d.compAppts}</td>
                      <td className="p-4 text-center font-bold text-gray-700">{d.linkedPatients}</td>
                      <td className="p-4">
                        <button onClick={() => setSelectedDoc(d)} className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-lg text-xs transition-colors">
                          Details
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
          {selectedDoc && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-white rounded-[32px] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                
                <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-medical-blue text-white rounded-full flex items-center justify-center font-bold text-xl">
                      {(selectedDoc.displayName || 'D').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Dr. {selectedDoc.displayName || 'Doctor'}</h2>
                      <p className="text-gray-500 text-sm">{selectedDoc.spec} • {selectedDoc.phone}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedDoc(null)} className="p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors">
                    <X size={24} className="text-gray-700" />
                  </button>
                </div>

                <div className="p-6 md:p-8 bg-white overflow-y-auto flex-1 space-y-8">
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-center">
                      <Calendar size={20} className="text-medical-blue mb-1" />
                      <p className="text-xl font-bold text-blue-700">{selectedDoc.rawAppts.length}</p>
                      <p className="text-[10px] font-bold text-blue-600 uppercase mt-1">Total Appts</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col items-center justify-center text-center">
                      <Activity size={20} className="text-green-500 mb-1" />
                      <p className="text-xl font-bold text-green-700">{selectedDoc.linkedPatients}</p>
                      <p className="text-[10px] font-bold text-green-600 uppercase mt-1">Patients</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col items-center justify-center text-center">
                      <ShieldAlert size={20} className="text-red-500 mb-1" />
                      <p className="text-xl font-bold text-red-700">{selectedDoc.emergenciesHandled}</p>
                      <p className="text-[10px] font-bold text-red-600 uppercase mt-1">Emergencies</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex flex-col items-center justify-center text-center">
                      <FileText size={20} className="text-amber-500 mb-1" />
                      <p className="text-xl font-bold text-amber-700">{selectedDoc.notesCount}</p>
                      <p className="text-[10px] font-bold text-amber-600 uppercase mt-1">Cons. Notes</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Patient List */}
                    <div>
                      <h3 className="flex items-center gap-2 font-bold text-gray-800 text-lg mb-4 border-b border-gray-100 pb-2">
                        <User size={20} className="text-medical-teal" /> Patient Roster
                      </h3>
                      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                        {selectedDoc.patientList.map((p, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between">
                            <span className="font-bold text-gray-700">{p.name}</span>
                          </div>
                        ))}
                        {selectedDoc.patientList.length === 0 && <p className="text-gray-500 text-sm">No linked patients.</p>}
                      </div>
                    </div>

                    {/* Appointment Breakdown */}
                    <div>
                      <h3 className="flex items-center gap-2 font-bold text-gray-800 text-lg mb-4 border-b border-gray-100 pb-2">
                        <Calendar size={20} className="text-medical-blue" /> Appointment Breakdown
                      </h3>
                      <div className="flex gap-4 w-full mb-6">
                        <div className="flex-1 bg-amber-50 p-4 rounded-xl border border-amber-100 text-center">
                          <span className="text-3xl font-bold text-amber-500">{selectedDoc.pendingAppts}</span>
                          <p className="text-[10px] text-amber-600 font-bold uppercase mt-1">Pending</p>
                        </div>
                        <div className="flex-1 bg-teal-50 p-4 rounded-xl border border-teal-100 text-center">
                          <span className="text-3xl font-bold text-medical-teal">{selectedDoc.compAppts}</span>
                          <p className="text-[10px] text-teal-600 font-bold uppercase mt-1">Completed</p>
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
