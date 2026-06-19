import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../utils/firebaseService';
import { Activity, Calendar, AlertTriangle, Users, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGreeting } from '../utils/greeting';

export default function DoctorDashboard() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const greetingKey = useGreeting();
  
  const [appointments, setAppointments] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [patients, setPatients] = useState([]);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    // Listen to appointments
    const unsubAppt = dbService.onValue(`appointments`, (data) => {
      if (data) {
        setAppointments(Object.values(data));
      } else {
        setAppointments([]);
      }
    });

    // Listen to all emergencies (Firebase mock doesn't have good queries, so fetch all and filter client side if needed, or assume all in /emergencies)
    const unsubEmerg = dbService.onValue(`emergencies`, (data) => {
      if (data) {
        let allEmergencies = [];
        Object.values(data).forEach(patientEmergencies => {
          Object.values(patientEmergencies).forEach(e => allEmergencies.push(e));
        });
        setEmergencies(allEmergencies);
      } else {
        setEmergencies([]);
      }
    });

    // Mock total patients
    const unsubPat = dbService.onValue(`users`, (data) => {
      if (data) {
        setPatients(Object.values(data).filter(u => u.role === 'patient'));
      }
    });

    const unsubNotes = dbService.onValue(`notes/${currentUser?.uid}`, (data) => {
      if (data) {
        setNotes(Object.values(data).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } else {
        setNotes([]);
      }
    });

    return () => { unsubAppt(); unsubEmerg(); unsubPat(); unsubNotes(); };
  }, [currentUser]);

  // Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.date === todayStr);
  const pendingAppts = todayAppts.filter(a => a.status === 'pending');
  const acceptedAppts = todayAppts.filter(a => a.status === 'accepted');
  
  const activeEmergencies = emergencies.filter(e => e.status === 'emergency' || e.status === 'in_progress');
  const latestEmergency = activeEmergencies.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

  const recentNote = notes[0];

  let pulseColor = 'bg-medical-teal shadow-teal-500/40';
  if (activeEmergencies.length > 0) pulseColor = 'bg-red-500 shadow-red-500/60 animate-pulse';
  else if (pendingAppts.length > 0) pulseColor = 'bg-amber-500 shadow-amber-500/40';

  return (
    <Layout title={t('clinical_review_center')}>
      <div className="max-w-6xl mx-auto py-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{t(greetingKey)}, Dr. {currentUser?.displayName || 'Doctor'}</h1>
            <p className="text-gray-500 mt-1">{t('clinical_review_center')}</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100">
            <span className="font-bold text-gray-700 text-sm uppercase tracking-wider">{t('care_pulse')}</span>
            <div className="relative flex h-4 w-4">
              {activeEmergencies.length > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-4 w-4 shadow-lg ${pulseColor}`}></span>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-medical-blue rounded-xl">
                <Calendar size={24} />
              </div>
              <span className="text-3xl font-bold text-gray-800">{todayAppts.length}</span>
            </div>
            <h3 className="font-bold text-gray-700 mb-1">{t('today_appointments')}</h3>
            <p className="text-sm text-gray-500">
              {pendingAppts.length} {t('pending')} • {acceptedAppts.length} Accepted
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-[24px] shadow-sm border border-red-100 relative overflow-hidden">
            {activeEmergencies.length > 0 && <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full -z-0"></div>}
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${activeEmergencies.length > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
                  <AlertTriangle size={24} />
                </div>
                <span className={`text-3xl font-bold ${activeEmergencies.length > 0 ? 'text-red-600' : 'text-gray-800'}`}>{activeEmergencies.length}</span>
              </div>
              <h3 className="font-bold text-gray-700 mb-1">{t('emergency_requests')}</h3>
              <p className="text-sm text-gray-500 truncate">
                {activeEmergencies.length > 0 ? `Latest: ${latestEmergency?.reason || 'SOS'}` : t('no_active_emergencies')}
              </p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-teal-50 text-medical-teal rounded-xl">
                <Users size={24} />
              </div>
              <span className="text-3xl font-bold text-gray-800">{patients.length}</span>
            </div>
            <h3 className="font-bold text-gray-700 mb-1">{t('total_patients')}</h3>
            <p className="text-sm text-gray-500">Linked to your clinic</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <FileText size={24} />
              </div>
              <span className="text-3xl font-bold text-gray-800">{notes.length}</span>
            </div>
            <h3 className="font-bold text-gray-700 mb-1">{t('recent_consultation')}</h3>
            <p className="text-sm text-gray-500 truncate">
              {recentNote ? recentNote.note : t('no_recent_consultations')}
            </p>
          </motion.div>

        </div>

        {/* Detailed View Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('emergency_requests')}</h2>
            {activeEmergencies.length === 0 ? (
              <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl">{t('no_active_emergencies')}</div>
            ) : (
              <div className="space-y-3">
                {activeEmergencies.slice(0,4).map(e => (
                  <div key={e.id || e.timestamp} className="p-4 bg-red-50 rounded-xl border border-red-100 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-red-700">{e.reason || 'SOS Triggered'}</p>
                      <p className="text-xs text-red-500">{new Date(e.timestamp).toLocaleTimeString()}</p>
                    </div>
                    <span className="px-3 py-1 bg-red-200 text-red-800 text-xs font-bold rounded-full uppercase tracking-wider">{e.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('today_appointments')}</h2>
            {todayAppts.length === 0 ? (
              <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl">{t('no_pending_appointments')}</div>
            ) : (
              <div className="space-y-3">
                {todayAppts.slice(0,4).map(a => (
                  <div key={a.id || a.appointmentId} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-800">{a.patientName || 'Unknown Patient'}</p>
                      <p className="text-xs text-gray-500">{a.time} • {a.mode}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${a.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                      {t(a.status) || a.status}
                    </span>
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
