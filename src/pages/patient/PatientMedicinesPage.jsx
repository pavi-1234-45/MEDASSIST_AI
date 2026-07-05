import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../utils/firebaseService';
import { motion, AnimatePresence } from 'framer-motion';
import { Pill, Plus, X, CheckCircle, Clock, Bell, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PatientMedicinesPage() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  
  const [medicines, setMedicines] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'Daily',
    time: '',
    startDate: '',
    notes: '',
    reminderChannel: 'App Notification'
  });

  useEffect(() => {
    if (!currentUser?.uid) return;

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const unsub = dbService.onValue(`medicines/${currentUser.uid}`, (data) => {
      if (data) {
        setMedicines(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      } else {
        setMedicines([]);
      }
    });
    return () => unsub();
  }, [currentUser]);
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser?.uid) return;

    try {
      if (editingMed) {
        await dbService.update(`medicines/${currentUser.uid}/${editingMed.id}`, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        toast.success(t('medicine_updated') || 'Medicine updated');
      } else {
        const newId = dbService.generateId();
        await dbService.set(`medicines/${currentUser.uid}/${newId}`, {
          medicineId: newId,
          patientId: currentUser.uid,
          ...formData,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        toast.success(t('medicine_added') || 'Medicine added');
      }
      setIsModalOpen(false);
      setEditingMed(null);
      setFormData({ name: '', dosage: '', frequency: 'Daily', time: '', startDate: '', notes: '', reminderChannel: 'App Notification' });
    } catch (err) {
      toast.error(t('somethingWentWrong'));
    }
  };

  const handleEdit = (med) => {
    setEditingMed(med);
    setFormData({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      time: med.time,
      startDate: med.startDate,
      notes: med.notes || '',
      reminderChannel: med.reminderChannel || 'App Notification'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete medicine?")) {
      await dbService.remove(`medicines/${currentUser.uid}/${id}`);
      toast.success(t('medicine_deleted') || 'Medicine deleted');
    }
  };

  const updateStatus = async (med, newStatus) => {
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

  const getDoseGroup = (timeStr) => {
    if (!timeStr) return 'morning';
    const hour = parseInt(timeStr.split(':')[0]);
    if (timeStr.toLowerCase().includes('pm') && hour !== 12) return hour < 5 ? 'afternoon' : 'night';
    if (timeStr.toLowerCase().includes('am') && hour === 12) return 'night';
    return hour < 12 ? 'morning' : 'afternoon';
  };

  const morningMeds = medicines.filter(m => getDoseGroup(m.time) === 'morning');
  const afternoonMeds = medicines.filter(m => getDoseGroup(m.time) === 'afternoon');
  const nightMeds = medicines.filter(m => getDoseGroup(m.time) === 'night');

  const takenCount = medicines.filter(m => m.status === 'taken').length;
  const skippedCount = medicines.filter(m => m.status === 'skipped').length;
  let adherence = 0;
  if (takenCount + skippedCount > 0) {
    adherence = Math.round((takenCount / (takenCount + skippedCount)) * 100);
  } else if (takenCount > 0 && skippedCount === 0) {
    adherence = 100;
  }

  const renderMedicineList = (meds, titleKey) => {
    if (meds.length === 0) return null;
    return (
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4 ml-2">{t(titleKey)}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meds.map(med => (
            <motion.div key={med.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-12 rounded-full ${med.status === 'taken' ? 'bg-medical-green' : med.status === 'skipped' ? 'bg-red-400' : 'bg-amber-400'}`}></div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-800">{med.name}</h4>
                    <p className="text-sm text-gray-500 font-medium flex items-center gap-1">
                      <Clock size={14} /> {med.time} • {med.dosage}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(med)} className="p-2 text-gray-400 hover:text-medical-blue bg-gray-50 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(med.id)} className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                </div>
              </div>

              {/* Reminder Details */}
              <div className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                <Bell size={12} /> {t('reminder_channel')}: {med.reminderChannel ? (t(med.reminderChannel.toLowerCase().replace(' ', '_')) || med.reminderChannel) : 'App Notification'}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => updateStatus(med, 'taken')} disabled={med.status === 'taken'} className={`py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-colors ${med.status === 'taken' ? 'bg-medical-green text-white cursor-default' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                  <CheckCircle size={16} /> {t('mark_taken')}
                </button>
                <button onClick={() => updateStatus(med, 'skipped')} disabled={med.status === 'skipped'} className={`py-2 rounded-xl text-sm font-bold transition-colors ${med.status === 'skipped' ? 'bg-red-500 text-white cursor-default' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                  {t('skip')}
                </button>
                <button onClick={() => updateStatus(med, 'pending_later')} className="py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl text-sm font-bold transition-colors">
                  {t('remind_later')}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Layout title={t('my_medicines')}>
      <div className="max-w-5xl mx-auto">
        
        {/* Header & Adherence */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{t('my_medicines')}</h1>
            <p className="text-gray-500 mt-1">Manage your prescriptions and reminders</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-medical-blue flex items-center justify-center font-bold text-lg">
                {adherence}%
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{t('adherence')}</p>
                <div className="w-24 h-2 bg-gray-100 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-medical-blue rounded-full" style={{ width: `${adherence}%` }}></div>
                </div>
              </div>
            </div>
            <button onClick={() => { setEditingMed(null); setFormData({ name: '', dosage: '', frequency: 'Daily', time: '', startDate: '', notes: '', reminderChannel: 'App Notification' }); setIsModalOpen(true); }} className="bg-medical-blue hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors ml-auto md:ml-4">
              <Plus size={18} /> <span className="hidden sm:inline">{t('add_medicine')}</span>
            </button>
          </div>
        </div>

        {medicines.length === 0 ? (
          <div className="bg-white rounded-[24px] p-12 text-center shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-blue-50 text-medical-blue rounded-full flex items-center justify-center mx-auto mb-4">
              <Pill size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Medicines Added</h2>
            <p className="text-gray-500 mb-6">Start tracking your health by adding your first prescription.</p>
            <button onClick={() => setIsModalOpen(true)} className="bg-medical-blue hover:bg-blue-700 text-white px-8 py-3 rounded-[16px] font-bold inline-flex items-center gap-2 transition-colors">
              <Plus size={20} /> {t('add_medicine')}
            </button>
          </div>
        ) : (
          <div>
            {renderMedicineList(morningMeds, 'morning')}
            {renderMedicineList(afternoonMeds, 'afternoon')}
            {renderMedicineList(nightMeds, 'night')}
          </div>
        )}

        {/* Form Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                  <h3 className="text-xl font-bold text-gray-800">{editingMed ? t('edit_medicine') : t('add_medicine')}</h3>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-800"><X size={24} /></button>
                </div>
                
                <div className="overflow-y-auto p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">{t('medicine_name') || "Medicine Name"}</label>
                      <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-blue focus:border-medical-blue outline-none transition-all" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('dosage')}</label>
                        <input type="text" name="dosage" value={formData.dosage} onChange={handleChange} required placeholder="e.g. 1 Tablet" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-blue focus:border-medical-blue outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('frequency')}</label>
                        <select name="frequency" value={formData.frequency} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-blue focus:border-medical-blue outline-none transition-all">
                          <option value="Daily">Daily</option>
                          <option value="Weekly">Weekly</option>
                          <option value="As Needed">As Needed</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('time')}</label>
                        <input type="time" name="time" value={formData.time} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-blue focus:border-medical-blue outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('start_date')}</label>
                        <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-blue focus:border-medical-blue outline-none transition-all" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">{t('reminder_channel')}</label>
                      <select name="reminderChannel" value={formData.reminderChannel} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-blue focus:border-medical-blue outline-none transition-all">
                        <option value="App Notification">{t('app_notification')}</option>
                        <option value="WhatsApp">{t('whatsapp')}</option>
                        <option value="SMS">{t('sms')}</option>
                        <option value="IVR Call">{t('ivr_call')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">{t('notes')}</label>
                      <textarea name="notes" value={formData.notes} onChange={handleChange} rows="2" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-blue focus:border-medical-blue outline-none transition-all"></textarea>
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                        Cancel
                      </button>
                      <button type="submit" className="flex-1 px-6 py-3 bg-medical-blue text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-medical-blue/30">
                        {editingMed ? "Update" : "Save"}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </Layout>
  );
}
