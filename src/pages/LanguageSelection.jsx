import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { languages } from '../data/translations';
import { Check } from 'lucide-react';

export default function LanguageSelection() {
  const { selectedLanguage, changeLanguage, t } = useLanguage();
  const [localSelection, setLocalSelection] = useState(selectedLanguage || '');
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!localSelection) return;
    changeLanguage(localSelection);
    navigate('/auth'); // Only navigate to auth
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const staggerItem = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="language-page">
      <motion.div 
        initial={{ y: 30, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="language-selection-box flex flex-col items-center"
      >
        <img 
          src="https://www.image2url.com/r2/default/images/1781779461062-c1bcda3a-8c82-472a-ba22-af59e7330b01.png" 
          alt="Logo" 
          className="language-logo"
        />
        
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full flex flex-col items-center"
        >
          <h1 className="language-title">
            {localSelection ? t('choose_language') : "Choose Your Language"}
          </h1>
          <p className="language-subtitle">
            {localSelection ? t('select_language') : "Select your preferred language to continue"}
          </p>
        </motion.div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="language-grid mb-2"
        >
          {languages.filter(lang => lang.code !== 'ur').map((lang) => (
            <motion.button
              key={lang.code}
              variants={staggerItem}
              onClick={() => setLocalSelection(lang.code)}
              className={`language-card ${localSelection === lang.code ? 'selected' : ''}`}
            >
              <span className="native-text text-sky-700">
                {lang.nativeName}
              </span>
              <span className="english-label text-slate-500 uppercase">
                {lang.name}
              </span>
              {localSelection === lang.code && (
                <motion.div 
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute top-2 right-2 bg-sky-500 text-white p-1 rounded-full shadow-md"
                >
                  <Check size={12} strokeWidth={3} />
                </motion.div>
              )}
            </motion.button>
          ))}
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={handleContinue}
          disabled={!localSelection}
          className={`continue-button flex items-center justify-center gap-2 
            ${!localSelection ? 'opacity-50 cursor-not-allowed bg-slate-400 shadow-none' : ''}
          `}
        >
          {localSelection ? (t('continue') || "Continue") : "Select a language"}
        </motion.button>
      </motion.div>
    </div>
  );
}
