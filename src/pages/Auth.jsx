import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Shield, Phone, Stethoscope, HeartHandshake, Building2, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ROLES = [
  { id: 'patient', label: 'Patient', icon: User },
  { id: 'doctor', label: 'Doctor', icon: Stethoscope },
  { id: 'caregiver', label: 'Caregiver', icon: HeartHandshake },
  { id: 'admin', label: 'Admin', icon: Building2 }
];

export default function Auth() {
  const { t } = useLanguage();
  const { login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [activeRole, setActiveRole] = useState('patient');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    email: '', password: '', name: '', phone: '',
    // Patient
    age: '', gender: '', condition: '', caregiverName: '', caregiverPhone: '', emergencyContact: '',
    // Doctor
    specialization: '', hospital: '', registrationNumber: '', experience: '', availableTime: '',
    // Caregiver
    relationship: '',
    // Admin
    adminRole: ''
  });

  const handleAuth = async (e) => {
    e.preventDefault();
    
    if (!isLogin && step === 1) {
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password, activeRole);
        localStorage.setItem('ma_role', activeRole);
        navigate(`/${activeRole}/dashboard`);
        toast.success(`Welcome to ${activeRole} portal`);
      } else {
        let extraData = { phone: formData.phone };
        if (activeRole === 'patient') {
          extraData = { ...extraData, age: formData.age, gender: formData.gender, condition: formData.condition, caregiverName: formData.caregiverName, caregiverPhone: formData.caregiverPhone, emergencyContact: formData.emergencyContact };
        } else if (activeRole === 'doctor') {
          extraData = { ...extraData, specialization: formData.specialization, hospital: formData.hospital, registrationNumber: formData.registrationNumber, experience: formData.experience, availableTime: formData.availableTime };
        } else if (activeRole === 'caregiver') {
          extraData = { ...extraData, relationship: formData.relationship };
        } else if (activeRole === 'admin') {
          extraData = { ...extraData, hospital: formData.hospital, adminRole: formData.adminRole };
        }

        await signup(formData.email, formData.password, formData.name, activeRole, extraData);
        localStorage.setItem('ma_role', activeRole);
        navigate(`/${activeRole}/dashboard`);
        toast.success(`Account created successfully`);
      }
    } catch (error) {
      toast.error("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      await loginWithGoogle(activeRole);
      localStorage.setItem('ma_role', activeRole);
      navigate(`/${activeRole}/dashboard`);
      toast.success(`Welcome back!`);
    } catch (error) {
      toast.error("Google Auth failed");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = `auth-input transition-all`;

  return (
    <div className="auth-bg flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="auth-card overflow-hidden relative z-10 flex flex-col mx-auto"
      >
        <div className="px-6 pt-6 pb-4 text-center relative z-20">
          <img src="https://www.image2url.com/r2/default/images/1781779461062-c1bcda3a-8c82-472a-ba22-af59e7330b01.png" alt="Logo" className="auth-logo" />
          <p className="text-gray-500 font-medium">{isLogin ? t('signInToAccount') : t('createNewAccount')}</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="px-6 pb-4">
          <div className="role-tabs bg-gray-100 p-1.5 rounded-2xl relative overflow-hidden">
            {ROLES.map((role) => {
              const Icon = role.icon;
              const isActive = activeRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => { setActiveRole(role.id); setStep(1); }}
                  className={`role-tab flex flex-col items-center justify-center relative z-10 transition-colors duration-200 ${isActive ? 'text-medical-blue' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabBg"
                      className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-200/50 z-[-1]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon size={18} className="mb-1" />
                  <span className="font-bold uppercase tracking-wider">{t(role.id) || role.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleAuth} className="px-6 pb-6 flex-1 flex flex-col justify-between overflow-y-auto custom-scrollbar">
          <div className="space-y-3">
          <AnimatePresence mode="wait">
            {/* Step 1: Core Auth Fields */}
            {(isLogin || step === 1) && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                {!isLogin && (
                  <div className="auth-input-wrapper">
                    <User className="auth-input-icon" />
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder={t('full_name')} className={`${inputStyle} has-icon`} required />
                  </div>
                )}
                <div className="auth-input-wrapper">
                  <Mail className="auth-input-icon" />
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder={t('email_address')} className={`${inputStyle} has-icon`} required />
                </div>
                <div className="auth-input-wrapper">
                  <Lock className="auth-input-icon" />
                  <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={t('password')} className={`${inputStyle} has-icon`} required minLength="6" />
                </div>
              </motion.div>
            )}

            {/* Step 2: Role Specific Fields (Register Only) */}
            {!isLogin && step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2 pb-2"
              >
                <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder={t('phone_number')} className={inputStyle} required />

                {activeRole === 'patient' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} placeholder={t('age')} className={inputStyle} />
                      <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className={inputStyle}>
                        <option value="">{t('gender')}</option><option>{t('male')}</option><option>{t('female')}</option><option>{t('other')}</option>
                      </select>
                    </div>
                    <input type="text" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} placeholder={t('health_conditions')} className={inputStyle} />
                    <input type="text" value={formData.caregiverName} onChange={e => setFormData({...formData, caregiverName: e.target.value})} placeholder={t('caregiver_name')} className={inputStyle} />
                    <input type="tel" value={formData.caregiverPhone} onChange={e => setFormData({...formData, caregiverPhone: e.target.value})} placeholder={t('caregiver_phone')} className={inputStyle} />
                    <input type="tel" value={formData.emergencyContact} onChange={e => setFormData({...formData, emergencyContact: e.target.value})} placeholder={t('emergency_contact')} className={inputStyle} required />
                  </>
                )}

                {activeRole === 'doctor' && (
                  <>
                    <input type="text" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} placeholder={t('specialization')} className={inputStyle} required />
                    <input type="text" value={formData.hospital} onChange={e => setFormData({...formData, hospital: e.target.value})} placeholder={t('hospital_clinic')} className={inputStyle} required />
                    <input type="text" value={formData.registrationNumber} onChange={e => setFormData({...formData, registrationNumber: e.target.value})} placeholder={t('medical_reg_no')} className={inputStyle} required />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="number" value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} placeholder={t('years_exp')} className={inputStyle} />
                      <input type="text" value={formData.availableTime} onChange={e => setFormData({...formData, availableTime: e.target.value})} placeholder={t('available_time')} className={inputStyle} />
                    </div>
                  </>
                )}

                {activeRole === 'caregiver' && (
                  <input type="text" value={formData.relationship} onChange={e => setFormData({...formData, relationship: e.target.value})} placeholder={t('relationship')} className={inputStyle} required />
                )}

                {activeRole === 'admin' && (
                  <>
                    <input type="text" value={formData.hospital} onChange={e => setFormData({...formData, hospital: e.target.value})} placeholder={t('hospital_org')} className={inputStyle} required />
                    <input type="text" value={formData.adminRole} onChange={e => setFormData({...formData, adminRole: e.target.value})} placeholder={t('admin_role')} className={inputStyle} required />
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}

            <button 
              type="submit" 
              disabled={loading}
              className={`auth-button w-full mt-4 bg-gray-900 hover:bg-gray-800 text-white shadow-xl shadow-gray-900/20 transition-all duration-300 active:scale-95 disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center gap-2`}
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {isLogin ? t('login') : (step === 1 ? t('next_step') : t('register'))}
                  {(!isLogin && step === 1) && <ChevronRight size={20} />}
                </>
              )}
            </button>

            <button 
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full mt-3 py-3 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl font-bold shadow-sm transition-all flex items-center justify-center gap-3"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
              {t('continueWithGoogle')}
            </button>

            <div className="mt-4 text-center">
              <button 
                type="button"
                onClick={() => { setIsLogin(!isLogin); setStep(1); }} 
                className="text-gray-500 hover:text-medical-blue transition-colors font-semibold"
              >
                {isLogin ? t('dontHaveAccount') : t('alreadyHaveAccount')}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
