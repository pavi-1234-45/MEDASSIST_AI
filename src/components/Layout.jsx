import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Menu, X, AlertTriangle, Globe } from 'lucide-react';
import { languages } from '../data/translations';
import { patientMenu, doctorMenu, caregiverMenu, adminMenu } from '../data/menuConfig';

export default function Layout({ children, title }) {
  const { t, dir, selectedLanguage, changeLanguage } = useLanguage();
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavItems = () => {
    const role = currentUser?.role || 'patient';
    if (role === 'doctor') return doctorMenu;
    if (role === 'caregiver') return caregiverMenu;
    if (role === 'admin') return adminMenu;
    return patientMenu;
  };

  const navItems = getNavItems();

  const LanguageSelector = () => (
    <div className="relative">
      <button 
        onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors font-medium text-sm text-gray-700"
      >
        <Globe size={18} />
        {languages.find(l => l.code === selectedLanguage)?.nativeName || 'English'}
      </button>
      
      <AnimatePresence>
        {isLangMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 shadow-xl rounded-2xl overflow-hidden z-50"
          >
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => {
                  changeLanguage(lang.code);
                  setIsLangMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-sm font-medium ${selectedLanguage === lang.code ? 'text-medical-blue bg-blue-50' : 'text-gray-700'}`}
              >
                {lang.nativeName} ({lang.name})
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex" dir={dir}>
      
      {/* Desktop Sidebar */}
      <motion.aside 
        initial={{ x: dir === 'rtl' ? 100 : -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden md:flex flex-col w-64 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 shadow-sm fixed h-full z-20"
      >
        <div className="p-6 flex items-center gap-3 border-b border-gray-100/50">
          <img src="https://www.image2url.com/r2/default/images/1781779461062-c1bcda3a-8c82-472a-ba22-af59e7330b01.png" alt="Logo" className="w-10 h-10 drop-shadow-sm" />
          <h1 className="font-bold text-xl text-gray-800 tracking-tight">{t('app_name') || "MedAssist AI"}</h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`sidebar-menu-item ${
                  isActive 
                    ? 'bg-gradient-to-r from-medical-blue to-medical-teal text-white shadow-md shadow-medical-blue/20' 
                    : 'bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <item.icon />
                <span className="sidebar-menu-label">{t(item.labelKey) || item.labelKey}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100/50 bg-white/50">
          <div className="bg-gray-50/80 rounded-2xl p-4 mb-4 border border-gray-100">
            <p className="text-sm font-bold text-gray-800 line-clamp-1">{currentUser?.displayName || 'User'}</p>
            <p className="text-xs text-medical-blue uppercase font-bold mt-1 tracking-wider">{currentUser?.role || 'Patient'}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="sidebar-menu-item text-red-500 hover:bg-red-50"
          >
            <LogOut />
            <span className="sidebar-menu-label">{t('logout') || "Logout"}</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 pb-20 md:pb-0 flex flex-col min-h-screen">
        
        {/* Mobile Header */}
        <header className="md:hidden bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <img src="https://www.image2url.com/r2/default/images/1781779461062-c1bcda3a-8c82-472a-ba22-af59e7330b01.png" alt="Logo" className="w-8 h-8" />
            <h1 className="font-bold text-lg text-gray-800">{title || t('dashboard')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-500 bg-gray-50 rounded-lg">
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </header>

        {/* Mobile Slide-down Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden fixed inset-x-0 top-[60px] bg-white border-b border-gray-100 shadow-xl z-20 px-4 py-6 rounded-b-3xl max-h-[80vh] overflow-y-auto"
            >
              <nav className="space-y-2">
                {navItems.map((item, index) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={index}
                      onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                      className={`sidebar-menu-item ${
                        isActive 
                          ? 'bg-gradient-to-r from-medical-blue to-medical-teal text-white shadow-md shadow-medical-blue/20' 
                          : 'bg-transparent text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon />
                      <span className="sidebar-menu-label">{t(item.labelKey) || item.labelKey}</span>
                    </button>
                  );
                })}
                <button 
                  onClick={handleLogout}
                  className="sidebar-menu-item text-red-500 hover:bg-red-50 mt-4"
                >
                  <LogOut />
                  <span className="sidebar-menu-label">{t('logout') || "Logout"}</span>
                </button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Header */}
        <header className="hidden md:flex bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-8 py-5 items-center justify-between sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-gray-800">{title || t('dashboard')}</h2>
          <div className="flex items-center gap-6">
             {currentUser?.role === 'patient' && (
               <button onClick={() => navigate('/patient/emergency')} className="flex items-center gap-2 px-5 py-2.5 bg-red-50 border border-red-100 text-red-600 rounded-2xl font-bold text-sm hover:bg-red-100 hover:shadow-lg hover:shadow-red-500/20 transition-all">
                 <AlertTriangle size={18} /> SOS Emergency
               </button>
             )}
             <LanguageSelector />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
      
      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-30 pb-safe">
        <nav className="flex justify-around items-center h-16">
          {navItems.slice(0, 5).map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 ${
                  isActive ? 'text-medical-blue' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <item.icon size={isActive ? 24 : 20} className="transition-all" />
                <span className="text-[10px] font-medium truncate max-w-[70px]">{t(item.labelKey) || item.labelKey}</span>
              </button>
            );
          })}
        </nav>
      </div>

    </div>
  );
}
