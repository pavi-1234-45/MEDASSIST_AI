import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../utils/firebaseService';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, X, Video, Building2, Clock, MapPin, Trash2, Edit2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Appointments() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  
  const [appointments, setAppointments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState(null);

  const [formData, setFormData] = useState({
    doctorName: '',
    department: '',
    date: '',
    time: '',
    reason: '',
    mode: 'Hospital Visit',
    reminderChannel: 'App Notification'
  });

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = dbService.onValue(`appointments`, (data) => {
      if (data) {
        const apptArray = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter(a => (a.patientId || a.patient_id) === currentUser.uid);
        
        apptArray.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
        setAppointments(apptArray);
      } else {
        setAppointments([]);
      }
    });
    return () => unsub();
  }, [currentUser]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser?.uid) return;

    try {
      if (editingAppt) {
        await dbService.update(`appointments/${editingAppt.id}`, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        toast.success(t('appointment_updated') || 'Appointment updated');
      } else {
        const newId = dbService.generateId();
        await dbService.set(`appointments/${newId}`, {
          appointmentId: newId,
          patientId: currentUser.uid,
          patientName: currentUser.displayName || 'Patient',
          doctorId: 'doc_123',
          ...formData,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        toast.success(t('appointment_booked') || 'Appointment booked');
      }
      setIsModalOpen(false);
      setEditingAppt(null);
      setFormData({ doctorName: '', department: '', date: '', time: '', reason: '', mode: 'Hospital Visit', reminderChannel: 'App Notification' });
    } catch (err) {
      toast.error(t('somethingWentWrong'));
    }
  };

  const handleEdit = (appt) => {
    setEditingAppt(appt);
    setFormData({
      doctorName: appt.doctorName,
      department: appt.department,
      date: appt.date,
      time: appt.time,
      reason: appt.reason || '',
      mode: appt.mode,
      reminderChannel: appt.reminderChannel || 'App Notification'
    });
    setIsModalOpen(true);
  };

  const handleCancel = async (id) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      await dbService.update(`appointments/${id}`, { status: 'cancelled' });
      toast.success(t('appointment_cancelled') || 'Appointment cancelled');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Remove this record?")) {
      await dbService.remove(`appointments/${id}`);
      toast.success('Record removed');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'bg-medical-green text-white';
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'rejected':
      case 'cancelled':
      case 'missed': return 'bg-red-100 text-red-600';
      default: return 'bg-amber-100 text-amber-600';
    }
  };

  return (
    <Layout title={t('appointments')}>
      <div className="max-w-5xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{t('appointments')}</h1>
            <p className="text-gray-500 mt-1">Manage your doctor visits</p>
          </div>
          <button onClick={() => { setEditingAppt(null); setIsModalOpen(true); }} className="bg-medical-blue hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-medical-blue/20">
            <Plus size={20} /> <span className="hidden sm:inline">{t('book_appointment')}</span>
          </button>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-[24px] p-12 text-center shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Appointments</h2>
            <p className="text-gray-500 mb-6">You don't have any upcoming or past appointments.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {appointments.map(appt => (
              <motion.div key={appt.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${appt.mode === 'Online' ? 'bg-blue-50 text-medical-blue' : 'bg-purple-50 text-purple-600'}`}>
                      {appt.mode === 'Online' ? <Video size={24} /> : <Building2 size={24} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-gray-800">{appt.doctorName || appt.doctor_name}</h3>
                      <p className="text-sm text-gray-500 font-medium">{appt.department}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(appt.status)}`}>
                    {t(appt.status) || appt.status}
                  </span>
                </div>
                
                <div className="p-5 flex-1">
                  <div className="flex flex-col gap-3 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={16} className="text-gray-400" />
                      <span className="font-medium">{appt.date} at {appt.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={16} className="text-gray-400" />
                      <span className="font-medium">{t(appt.mode === 'Online' ? 'online' : 'hospital_visit')}</span>
                    </div>
                    {appt.reason && (
                      <div className="flex items-start gap-2 text-gray-600">
                        <FileText size={16} className="text-gray-400 mt-0.5" />
                        <span className="text-sm">{appt.reason}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100 flex gap-2">
                    {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                      <>
                        <button onClick={() => handleEdit(appt)} className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors flex justify-center items-center gap-2">
                          <Edit2 size={16} /> {t('edit')}
                        </button>
                        <button onClick={() => handleCancel(appt.id)} className="flex-1 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-sm transition-colors">
                          {t('cancel_appointment')}
                        </button>
                      </>
                    )}
                    {(appt.status === 'cancelled' || appt.status === 'completed' || appt.status === 'missed') && (
                      <button onClick={() => handleDelete(appt.id)} className="w-full px-4 py-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 font-bold rounded-xl text-sm transition-colors flex justify-center items-center gap-2">
                        <Trash2 size={16} /> Delete Record
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                  <h3 className="text-xl font-bold text-gray-800">{editingAppt ? t('edit_appointment') : t('book_appointment')}</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-800"><X size={24} /></button>
                </div>
                
                <div className="overflow-y-auto p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">{t('doctor_name')}</label>
                      <input type="text" name="doctorName" value={formData.doctorName} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-blue outline-none transition-all" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">{t('department')}</label>
                      <input type="text" name="department" value={formData.department} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-blue outline-none transition-all" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('date')}</label>
                        <input type="date" name="date" value={formData.date} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-blue outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('time')}</label>
                        <input type="time" name="time" value={formData.time} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-blue outline-none transition-all" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('mode')}</label>
                        <select name="mode" value={formData.mode} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-blue outline-none transition-all">
                          <option value="Hospital Visit">{t('hospital_visit')}</option>
                          <option value="Online">{t('online')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('reminder_channel')}</label>
                        <select name="reminderChannel" value={formData.reminderChannel} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-blue outline-none transition-all">
                          <option value="App Notification">{t('app_notification')}</option>
                          <option value="WhatsApp">{t('whatsapp')}</option>
                          <option value="SMS">{t('sms')}</option>
                          <option value="IVR Call">{t('ivr_call')}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">{t('reason')}</label>
                      <textarea name="reason" value={formData.reason} onChange={handleChange} rows="2" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-blue outline-none transition-all"></textarea>
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                        Cancel
                      </button>
                      <button type="submit" className="flex-1 px-6 py-3 bg-medical-blue text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-medical-blue/30">
                        {editingAppt ? "Update" : "Book"}
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
