import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Globe, Type, Eye, Bell, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { languages } from '../../data/translations';

export default function Settings() {
  const { t, selectedLanguage, changeLanguage } = useLanguage();
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [fontSize, setFontSize] = useState(localStorage.getItem('ma_fontsize') || '14px');
  const [highContrast, setHighContrast] = useState(localStorage.getItem('ma_contrast') === 'true');
  const [notifications, setNotifications] = useState(Notification.permission === 'granted');

  useEffect(() => {
    document.documentElement.style.fontSize = fontSize;
    localStorage.setItem('ma_fontsize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    localStorage.setItem('ma_contrast', highContrast.toString());
  }, [highContrast]);

  const handleLanguageChange = (e) => {
    changeLanguage(e.target.value);
    toast.success(t('preferred_language') + " updated");
  };

  const handleNotificationRequest = async () => {
    if (!("Notification" in window)) {
      toast.error("Notifications not supported in this browser");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotifications(permission === 'granted');
    if (permission === 'granted') {
      toast.success("Notifications enabled");
    } else {
      toast.error("Notifications denied");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <Layout title={t('settings')}>
      <div className="max-w-3xl mx-auto py-8">
        
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-gray-100 text-gray-700 rounded-xl">
            <SettingsIcon size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{t('settings')}</h1>
            <p className="text-gray-500 mt-1">Manage app preferences and account</p>
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-gray-100 space-y-8">
          
          {/* Language Selection */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-medical-blue rounded-full flex items-center justify-center">
                <Globe size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">{t('preferred_language')}</h3>
                <p className="text-sm text-gray-500">Change application language instantly</p>
              </div>
            </div>
            <select 
              value={selectedLanguage}
              onChange={handleLanguageChange}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 focus:ring-2 focus:ring-medical-blue outline-none md:w-48"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.nativeName}</option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center">
                <Type size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">{t('font_size')}</h3>
                <p className="text-sm text-gray-500">Adjust text size for better readability</p>
              </div>
            </div>
            <div className="flex gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200 w-fit">
              <button onClick={() => setFontSize('14px')} className={`px-4 py-2 rounded-lg font-bold transition-colors ${fontSize === '14px' ? 'bg-white shadow-sm text-medical-blue' : 'text-gray-500 hover:text-gray-800'}`}>A</button>
              <button onClick={() => setFontSize('16px')} className={`px-4 py-2 rounded-lg font-bold text-lg transition-colors ${fontSize === '16px' ? 'bg-white shadow-sm text-medical-blue' : 'text-gray-500 hover:text-gray-800'}`}>A+</button>
              <button onClick={() => setFontSize('18px')} className={`px-4 py-2 rounded-lg font-bold text-xl transition-colors ${fontSize === '18px' ? 'bg-white shadow-sm text-medical-blue' : 'text-gray-500 hover:text-gray-800'}`}>A++</button>
            </div>
          </div>

          {/* High Contrast */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-800 text-white rounded-full flex items-center justify-center">
                <Eye size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">{t('high_contrast')}</h3>
                <p className="text-sm text-gray-500">Enable dark, high-visibility themes</p>
              </div>
            </div>
            <button 
              onClick={() => setHighContrast(!highContrast)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${highContrast ? 'bg-medical-blue' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${highContrast ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Notifications */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center">
                <Bell size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">{t('notifications')}</h3>
                <p className="text-sm text-gray-500">Browser push notification permission</p>
              </div>
            </div>
            <button 
              onClick={handleNotificationRequest}
              disabled={notifications}
              className={`px-6 py-2.5 rounded-xl font-bold transition-colors ${notifications ? 'bg-green-100 text-green-700 cursor-default' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
            >
              {notifications ? "Enabled" : "Request Permission"}
            </button>
          </div>

          {/* Logout */}
          <div className="pt-4">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-4 rounded-[16px] font-bold text-lg transition-colors">
              <LogOut size={20} /> Logout
            </button>
          </div>

        </div>

      </div>
    </Layout>
  );
}
