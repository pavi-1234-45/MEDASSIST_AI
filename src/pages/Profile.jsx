import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../utils/firebaseService';
import { User, Activity, Edit2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Profile() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    bloodGroup: '',
    phone: '',
    address: '',
    conditions: '',
    allergies: '',
    currentMedicines: '',
    emergencyContact: '',
    preferredLanguage: 'English'
  });

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = dbService.onValue(`users/${currentUser.uid}/profile`, (data) => {
      if (data) {
        setProfile(data);
        setFormData(data);
      } else {
        setFormData(prev => ({ ...prev, name: currentUser.displayName || '' }));
      }
    });
    return () => unsub();
  }, [currentUser]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentUser?.uid) return;
    try {
      await dbService.set(`users/${currentUser.uid}/profile`, formData);
      toast.success(t('save_profile') || "Profile saved successfully");
      setIsEditing(false);
    } catch (err) {
      toast.error(t('somethingWentWrong'));
    }
  };

  return (
    <Layout title={t('profile')}>
      <div className="max-w-4xl mx-auto py-8">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{t('profile')}</h1>
            <p className="text-gray-500 mt-1">{t('health_profile_desc')}</p>
          </div>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-2 font-bold">
              <Edit2 size={18} /> <span className="hidden sm:inline">Edit Profile</span>
            </button>
          )}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden relative">
          
          <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-500 relative">
            <div className="absolute -bottom-12 left-8 w-24 h-24 bg-white rounded-full p-2 shadow-lg">
              <div className="w-full h-full bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center">
                <User size={40} />
              </div>
            </div>
            {profile && (
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2">
                <ShieldCheck size={16} /> Verified Patient
              </div>
            )}
          </div>

          <div className="pt-16 p-8">
            {isEditing || !profile ? (
              <form onSubmit={handleSave} className="space-y-6">
                
                <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">Personal Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('patient_name')}</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Age</label>
                      <input type="number" name="age" value={formData.age} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Gender</label>
                      <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('address')}</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 mt-8">Medical Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('blood_group')}</label>
                    <input type="text" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} placeholder="E.g., O+" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('allergies')}</label>
                    <input type="text" name="allergies" value={formData.allergies} onChange={handleChange} placeholder="E.g., Peanuts, Penicillin" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Medical Conditions</label>
                    <textarea name="conditions" value={formData.conditions} onChange={handleChange} rows="2" placeholder="E.g., Diabetes, Hypertension" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"></textarea>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t('current_medicines')}</label>
                    <textarea name="currentMedicines" value={formData.currentMedicines} onChange={handleChange} rows="2" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"></textarea>
                  </div>
                </div>

                <div className="pt-6 flex gap-3">
                  {profile && (
                    <button type="button" onClick={() => { setIsEditing(false); setFormData(profile); }} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30">
                    {t('save_profile')}
                  </button>
                </div>

              </form>
            ) : (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{profile.name}</h2>
                  <p className="text-gray-500">{profile.age} years • {profile.gender}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Contact Info</h3>
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 font-bold">Phone</p>
                          <p className="font-medium text-gray-800 mt-1">{profile.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-bold">Emergency</p>
                          <p className="font-medium text-gray-800 mt-1">{profile.emergencyContact || 'N/A'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500 font-bold">Address</p>
                          <p className="font-medium text-gray-800 mt-1">{profile.address || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Medical Summary</h3>
                    <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-indigo-400 font-bold">Blood Group</p>
                          <p className="font-bold text-indigo-700 mt-1">{profile.bloodGroup || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-indigo-400 font-bold">Allergies</p>
                          <p className="font-bold text-indigo-700 mt-1">{profile.allergies || 'None'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-indigo-400 font-bold">Conditions</p>
                          <p className="font-medium text-indigo-900 mt-1">{profile.conditions || 'None reported'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </motion.div>

      </div>
    </Layout>
  );
}
