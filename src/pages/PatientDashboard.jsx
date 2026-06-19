import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, FileText, HeartPulse, Pill, CheckCircle, Clock, Calendar, UserPlus, PhoneCall, Bell, MessageSquare, Mic, User, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { dbService } from '../utils/firebaseService';

import { useGreeting } from '../utils/greeting';

export default function PatientDashboard() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [medicines, setMedicines] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [caregiver, setCaregiver] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const greetingKey = useGreeting();

  useEffect(() => {
    if (!currentUser?.uid) return;
    
    const unsubMeds = dbService.onValue(`medicines/${currentUser.uid}`, (data) => {
      if (data) {
        const medsArray = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setMedicines(medsArray);
      } else {
        setMedicines([]);
      }
    });

    const unsubAppts = dbService.onValue(`appointments`, (data) => {
      if (data) {
        const apptsArray = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter(a => a.patientId === currentUser.uid);
        setAppointments(apptsArray);
      } else {
        setAppointments([]);
      }
    });

    const unsubCaregiver = dbService.onValue(`users/${currentUser.uid}/caregiver`, (data) => {
      setCaregiver(data || null);
    });

    const unsubAlerts = dbService.onValue(`alerts/${currentUser.uid}`, (data) => {
      if (data) {
        setAlerts(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      } else {
        setAlerts([]);
      }
    });

    return () => {
      unsubMeds();
      unsubAppts();
      unsubCaregiver();
      unsubAlerts();
    };
  }, [currentUser]);

  const handleSOS = () => {
    navigate("/patient/emergency");
  };

  const handleCallCaregiver = () => {
    if (caregiver?.phone) {
      window.location.href = `tel:${caregiver.phone}`;
    } else {
      toast.error(t('somethingWentWrong') || "No caregiver linked.");
    }
  };

  const updateMedicineStatus = async (med, newStatus) => {
    if (!currentUser?.uid) return;
    
    await dbService.update(`medicines/${currentUser.uid}/${med.id}`, { status: newStatus });
    
    if (newStatus === "skipped") {
      const alertId = dbService.generateId();
      await dbService.set(`alerts/${currentUser.uid}/${alertId}`, {
        type: "missed_medicine",
        status: "unread",
        timestamp: new Date().toISOString(),
        medicineName: med.name,
        patientId: currentUser.uid
      });
      toast.error(t('medicine_skipped_alert'));
    } else if (newStatus === "taken") {
      toast.success(t('medicine_marked_taken'));
    } else {
      toast.success(t('reminder_delayed'));
    }
  };

  const todayMeds = medicines; // For demo, assuming all in DB are today's
  const takenCount = todayMeds.filter(m => m.status === 'taken').length;
  const skippedCount = todayMeds.filter(m => m.status === 'skipped').length;
  const pendingCount = todayMeds.filter(m => !m.status || m.status === 'pending' || m.status === 'pending_later').length;
  
  let adherence = 0;
  if (takenCount + skippedCount > 0) {
    adherence = Math.round((takenCount / (takenCount + skippedCount)) * 100);
  } else if (takenCount > 0 && skippedCount === 0) {
    adherence = 100;
  }

  const hasEmergency = alerts.some(a => a.type === 'emergency');
  const allTaken = todayMeds.length > 0 && pendingCount === 0 && skippedCount === 0;
  const hasPending = pendingCount > 0 || skippedCount > 0;
  
  let pulseColor = "text-medical-teal bg-medical-teal/10";
  if (hasEmergency) pulseColor = "text-red-500 bg-red-500/10";
  else if (allTaken) pulseColor = "text-medical-green bg-medical-green/10";
  else if (hasPending) pulseColor = "text-amber-500 bg-amber-500/10";

  const nextAppt = appointments.filter(a => a.status === 'accepted' || a.status === 'pending').sort((a,b) => new Date(a.date) - new Date(b.date))[0];

  return (
    <Layout title={t('dashboard')}>
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
        
        {/* 1. HERO HEALTH SUMMARY CARD */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-medical-blue to-medical-teal rounded-[24px] p-8 md:p-10 text-white shadow-xl shadow-medical-blue/20 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          
          <div className="relative z-10 w-full">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-full ${pulseColor} backdrop-blur-md flex items-center gap-2 w-fit`}>
                <HeartPulse size={24} className={hasEmergency ? "animate-ping" : "animate-pulse"} />
                <span className="text-sm font-bold pr-2">{t('care_pulse')}</span>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{t(greetingKey)}, {currentUser?.displayName || 'User'}!</h1>
            <p className="text-white/90 text-lg">{t('health_plan_today')}</p>
          </div>
          
          <button 
            onClick={handleSOS}
            className="relative z-10 bg-red-500 hover:bg-red-600 text-white border-2 border-red-400 px-8 py-4 rounded-[20px] font-bold flex items-center gap-3 transition-all group shadow-lg shadow-red-500/30 shrink-0"
          >
            <AlertTriangle size={24} className="group-hover:animate-ping" /> 
            <span className="text-lg">{t('sos_emergency')}</span>
          </button>
        </motion.div>

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* 2. TODAY'S MEDICINE SUMMARY CARD */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-medical-blue rounded-xl">
                  <Pill size={24} />
                </div>
                <h2 className="text-xl font-bold text-gray-800">{t('todays_medicines')}</h2>
              </div>
              <button onClick={() => navigate('/patient/medicines')} className="text-medical-blue font-bold text-sm hover:underline">
                {t('view_all')}
              </button>
            </div>

            {/* Status Summary & Adherence */}
            <div className="grid grid-cols-4 gap-2 mb-6 bg-gray-50 p-4 rounded-2xl">
              <div className="text-center">
                <p className="text-xl font-bold text-medical-green">{takenCount}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">{t('taken')}</p>
              </div>
              <div className="text-center border-l border-gray-200">
                <p className="text-xl font-bold text-amber-500">{pendingCount}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">{t('pending')}</p>
              </div>
              <div className="text-center border-l border-gray-200">
                <p className="text-xl font-bold text-red-500">{skippedCount}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">{t('skipped')}</p>
              </div>
              <div className="text-center border-l border-gray-200">
                <p className="text-xl font-bold text-medical-blue">{adherence}%</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">{t('adherence')}</p>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              {todayMeds.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {t('no_medicines') || "No medicines added yet"}
                </div>
              ) : todayMeds.slice(0, 3).map((med) => (
                <div key={med.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-[16px] border border-gray-100 gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-12 rounded-full ${med.status === 'taken' ? 'bg-medical-green' : med.status === 'skipped' ? 'bg-red-400' : 'bg-amber-400'}`}></div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{med.name}</h3>
                      <p className="text-sm text-gray-500 font-medium flex items-center gap-1">
                        <Clock size={14} /> {med.time} • 
                        <span className={`font-bold ${med.status === 'taken' ? 'text-medical-green' : med.status === 'skipped' ? 'text-red-500' : 'text-amber-500'}`}>
                          {med.status ? t(med.status) : t('pending')}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  {(!med.status || med.status === 'pending' || med.status === 'pending_later') && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateMedicineStatus(med, 'taken')} className="flex items-center gap-1 px-4 py-2 bg-medical-green text-white rounded-xl text-sm font-bold hover:bg-emerald-500 transition-colors">
                        <CheckCircle size={16} /> {t('mark_taken')}
                      </button>
                      <button onClick={() => updateMedicineStatus(med, 'skipped')} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors">
                        {t('skip')}
                      </button>
                      <button onClick={() => updateMedicineStatus(med, 'pending_later')} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-300 transition-colors">
                        {t('remind_later')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6 flex flex-col h-full">
            
            {/* NEXT APPOINTMENT CARD */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex-1 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                    <Calendar size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">{t('next_appointment')}</h2>
                </div>
              </div>
              
              {nextAppt ? (
                <div className="bg-purple-50/50 p-4 rounded-[16px] border border-purple-100 mb-4 flex-1">
                  <h3 className="font-bold text-gray-800">{nextAppt.doctorName}</h3>
                  <p className="text-sm text-gray-600">{nextAppt.department} • {t(nextAppt.mode === 'Hospital Visit' ? 'hospital_visit' : 'online')}</p>
                  <div className="mt-3 flex items-center gap-2 text-sm font-bold text-purple-700 bg-purple-100 w-fit px-3 py-1 rounded-lg">
                    <Clock size={16} /> {nextAppt.date}, {nextAppt.time}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 flex-1 rounded-2xl flex items-center justify-center text-sm text-gray-500 mb-4">
                  No upcoming appointments.
                </div>
              )}

              <div className="flex gap-2 mt-auto">
                <button onClick={() => navigate('/patient/appointments')} className="flex-1 bg-medical-blue hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">
                  {t('view_all')}
                </button>
                <button onClick={() => navigate('/patient/appointments')} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-xl font-bold text-sm transition-colors">
                  {t('book_appointment')}
                </button>
              </div>
            </motion.div>

            {/* CAREGIVER LINKED CARD */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-orange-50 text-orange-500 rounded-xl">
                  <UserPlus size={24} />
                </div>
                <h2 className="text-xl font-bold text-gray-800">{t('caregiver_linked_title')}</h2>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                {caregiver ? (
                  <>
                    <div className="truncate pr-2">
                      <h3 className="font-bold text-gray-800 truncate">{caregiver.name} ({caregiver.relationship})</h3>
                      <p className="text-sm text-gray-500">{caregiver.phone}</p>
                    </div>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold shrink-0">{t('status_linked')}</span>
                  </>
                ) : (
                  <div className="text-sm text-gray-500">No caregiver linked.</div>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={handleCallCaregiver} className="flex-1 flex items-center justify-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-700 py-2.5 rounded-xl font-bold text-sm transition-colors">
                  <PhoneCall size={16} /> {t('call_caregiver')}
                </button>
                <button onClick={() => {
                  if (caregiver) toast.success(t('emergency_alert_sent'));
                  else navigate('/patient/caregiver');
                }} className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl font-bold text-sm transition-colors">
                  <Bell size={16} /> {t('alert_caregiver')}
                </button>
              </div>
            </motion.div>

          </div>
        </div>

        {/* QUICK ACTIONS SECTION */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6 ml-2">{t('quick_actions')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <motion.div whileHover={{ y: -4 }} onClick={() => navigate('/patient/chat')} className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 hover:shadow-md hover:border-medical-blue/30 cursor-pointer flex items-center gap-4 group transition-all">
              <div className="w-12 h-12 bg-blue-50 text-medical-blue rounded-[14px] flex items-center justify-center group-hover:scale-110 transition-transform"><MessageSquare size={24} /></div>
              <div>
                <h3 className="font-bold text-gray-800 group-hover:text-medical-blue transition-colors">{t('ai_chat')}</h3>
                <p className="text-xs text-gray-500">{t('ai_chat_desc')}</p>
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} onClick={() => navigate('/patient/voice')} className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 hover:shadow-md hover:border-medical-blue/30 cursor-pointer flex items-center gap-4 group transition-all">
              <div className="w-12 h-12 bg-teal-50 text-medical-teal rounded-[14px] flex items-center justify-center group-hover:scale-110 transition-transform"><Mic size={24} /></div>
              <div>
                <h3 className="font-bold text-gray-800 group-hover:text-medical-teal transition-colors">{t('voice_assistant')}</h3>
                <p className="text-xs text-gray-500">{t('voice_assistant_desc')}</p>
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} onClick={handleSOS} className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 hover:shadow-md hover:border-red-300 cursor-pointer flex items-center gap-4 group transition-all">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-[14px] flex items-center justify-center group-hover:scale-110 transition-transform"><AlertTriangle size={24} /></div>
              <div>
                <h3 className="font-bold text-gray-800 group-hover:text-red-600 transition-colors">{t('emergency')}</h3>
                <p className="text-xs text-gray-500">{t('emergency_sos_desc')}</p>
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} onClick={() => navigate('/patient/profile')} className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 hover:shadow-md hover:border-medical-blue/30 cursor-pointer flex items-center gap-4 group transition-all">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-[14px] flex items-center justify-center group-hover:scale-110 transition-transform"><User size={24} /></div>
              <div>
                <h3 className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{t('profile')}</h3>
                <p className="text-xs text-gray-500">{t('health_profile_desc')}</p>
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} onClick={() => navigate('/patient/reports')} className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 hover:shadow-md hover:border-medical-blue/30 cursor-pointer flex items-center gap-4 group transition-all">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-[14px] flex items-center justify-center group-hover:scale-110 transition-transform"><Activity size={24} /></div>
              <div>
                <h3 className="font-bold text-gray-800 group-hover:text-emerald-700 transition-colors">{t('reports')}</h3>
                <p className="text-xs text-gray-500">{t('reports_desc')}</p>
              </div>
            </motion.div>

          </div>
        </div>

      </div>
    </Layout>
  );
}
