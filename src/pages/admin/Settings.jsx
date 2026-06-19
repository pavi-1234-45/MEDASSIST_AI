import React from 'react';
import Layout from '../../components/Layout';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Settings as SettingsIcon, Type, Eye, Globe, LogOut } from 'lucide-react';

export default function AdminSettings() {
  const { t, changeLanguage, currentLanguage } = useLanguage();
  const { logout } = useAuth();

  const handleFontSizeChange = (size) => {
    localStorage.setItem('ma_fontsize', size);
    document.documentElement.style.fontSize = size;
  };

  const toggleHighContrast = () => {
    const isContrast = document.body.classList.toggle('high-contrast');
    localStorage.setItem('ma_contrast', isContrast);
  };

  const handleLogout = async () => {
    await logout();
  };

  const isHighContrast = document.body.classList.contains('high-contrast');

  return (
    <Layout title={t('settings')}>
      <div className="max-w-4xl mx-auto py-8">
        
        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 bg-gray-100 text-gray-600 rounded-xl">
            <SettingsIcon size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{t('settings')}</h1>
            <p className="text-gray-500 mt-1">Manage system accessibility and preferences</p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
          
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">{t('preferred_language')}</h3>
                <p className="text-sm text-gray-500">Change application language instantly</p>
              </div>
            </div>
            <select
              value={currentLanguage}
              onChange={(e) => changeLanguage(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-teal outline-none"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="ml">മലയാളം (Malayalam)</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
            </select>
          </div>

          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center">
                <Type size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">{t('font_size')}</h3>
                <p className="text-sm text-gray-500">Adjust text size for better readability</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleFontSizeChange('14px')} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold">A-</button>
              <button onClick={() => handleFontSizeChange('16px')} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-base font-bold">A</button>
              <button onClick={() => handleFontSizeChange('18px')} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-lg font-bold">A+</button>
            </div>
          </div>

          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center">
                <Eye size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">{t('high_contrast')}</h3>
                <p className="text-sm text-gray-500">Increase visual contrast</p>
              </div>
            </div>
            <button 
              onClick={toggleHighContrast}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isHighContrast ? 'bg-medical-teal' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isHighContrast ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="p-6 flex items-center justify-between bg-red-50/30">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                <LogOut size={20} />
              </div>
              <div>
                <h3 className="font-bold text-red-600 text-lg">{t('logout')}</h3>
                <p className="text-sm text-red-400">Sign out of your account</p>
              </div>
            </div>
            <button onClick={handleLogout} className="px-6 py-2 bg-red-100 hover:bg-red-200 text-red-600 font-bold rounded-xl transition-colors">
              {t('logout')}
            </button>
          </div>

        </div>
      </div>
    </Layout>
  );
}
