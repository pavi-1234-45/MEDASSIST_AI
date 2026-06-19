import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../utils/firebaseService';
import { Users, Phone, Mail, Edit2, CheckCircle, Bell, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Caregiver() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  
  const [caregiver, setCaregiver] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = dbService.onValue(`users/${currentUser.uid}/caregiver`, (data) => {
      if (data) {
        setCaregiver(data);
        setFormData(data);
      } else {
        setCaregiver(null);
        setIsEditing(true); // Auto open form if no caregiver
      }
    });
    return () => unsub();
  }, [currentUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentUser?.uid) return;
    
    try {
      await dbService.set(`users/${currentUser.uid}/caregiver`, formData);
      toast.success("Caregiver details saved");
      setIsEditing(false);
    } catch (err) {
      toast.error(t('somethingWentWrong'));
    }
  };

  const handleCallCaregiver = () => {
    if (caregiver?.phone) {
      window.location.href = `tel:${caregiver.phone}`;
    }
  };

  const handleSendTestAlert = async () => {
    if (!currentUser?.uid) return;
    try {
      const alertId = dbService.generateId();
      await dbService.set(`alerts/${currentUser.uid}/${alertId}`, {
        type: "caregiver_test",
        status: "unread",
        timestamp: new Date().toISOString(),
        patientId: currentUser.uid
      });
      toast.success("Test alert sent to caregiver");
    } catch (error) {
      toast.error(t('somethingWentWrong'));
    }
  };

  return (
    <Layout title={t('caregiver')}>
      <div className="max-w-3xl mx-auto py-8">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{t('caregiver')}</h1>
            <p className="text-gray-500 mt-1">Manage your linked emergency contact</p>
          </div>
          {caregiver && !isEditing && (
            <button onClick={() => setIsEditing(true)} className="p-3 bg-blue-50 text-medical-blue rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-2 font-bold">
              <Edit2 size={18} /> <span className="hidden sm:inline">Edit</span>
            </button>
          )}
        </div>

        {caregiver && !isEditing ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                <Users size={40} />
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-gray-800">{caregiver.name}</h2>
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-bold mt-2">{caregiver.relationship}</span>
              </div>
              <div className="hidden md:block flex-1"></div>
              <div className="flex items-center gap-2 bg-green-50 text-medical-green px-4 py-2 rounded-2xl font-bold">
                <CheckCircle size={20} /> {t('status_linked')}
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="p-3 bg-white rounded-xl shadow-sm"><Phone size={20} className="text-gray-500" /></div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Phone Number</p>
                  <p className="font-bold text-gray-800">{caregiver.phone}</p>
                </div>
              </div>
              {caregiver.email && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="p-3 bg-white rounded-xl shadow-sm"><Mail size={20} className="text-gray-500" /></div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Email Address</p>
                    <p className="font-bold text-gray-800">{caregiver.email}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-gray-100">
              <button onClick={handleCallCaregiver} className="flex items-center justify-center gap-2 bg-medical-blue hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-medical-blue/20">
                <Phone size={20} /> {t('call_caregiver')}
              </button>
              <button onClick={handleSendTestAlert} className="flex items-center justify-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-600 py-4 rounded-xl font-bold text-lg transition-colors">
                <Bell size={20} /> Send Test Alert
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="w-12 h-12 bg-blue-50 text-medical-blue rounded-full flex items-center justify-center">
                <UserPlus size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Caregiver Details</h2>
            </div>
            
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Caregiver Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                    placeholder="E.g., John Doe"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-blue outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Relationship</label>
                  <input 
                    type="text" 
                    name="relationship" 
                    value={formData.relationship} 
                    onChange={handleChange} 
                    required 
                    placeholder="E.g., Son, Daughter, Spouse"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-blue outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    required 
                    placeholder="+1 234 567 8900"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-blue outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email Address (Optional)</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    placeholder="caregiver@example.com"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-blue outline-none"
                  />
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                {caregiver && (
                  <button type="button" onClick={() => { setIsEditing(false); setFormData(caregiver); }} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                    Cancel
                  </button>
                )}
                <button type="submit" className="flex-1 py-3 bg-medical-blue text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-medical-blue/30">
                  Save Details
                </button>
              </div>
            </form>
          </motion.div>
        )}

      </div>
    </Layout>
  );
}
