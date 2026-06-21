import React, { createContext, useContext, useState, useEffect } from 'react';
import { languages } from '../data/translations';

// Dynamically import translation JSONs
import en from '../locales/en.json';
import ta from '../locales/ta.json';
import hi from '../locales/hi.json';
import te from '../locales/te.json';
import kn from '../locales/kn.json';
import ml from '../locales/ml.json';

const translationFiles = { en, ta, hi, te, kn, ml };

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return localStorage.getItem('language') || localStorage.getItem('ma_lang') || 'en';
  });
  
  const [languageLoaded, setLanguageLoaded] = useState(false);

  useEffect(() => {
    // Check both keys for backward compatibility, but set to 'language' moving forward
    const savedLanguage = localStorage.getItem('language') || localStorage.getItem('ma_lang');
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
      localStorage.setItem('language', savedLanguage);
      const langConfig = languages.find(l => l.code === savedLanguage);
      if (langConfig) {
        document.documentElement.lang = langConfig.code;
      }
    }
    setLanguageLoaded(true);
  }, []);

  useEffect(() => {
    if (selectedLanguage) {
      const langConfig = languages.find(l => l.code === selectedLanguage);
      if (langConfig) {
        document.documentElement.lang = langConfig.code;
      }
    }
  }, [selectedLanguage]);

  const t = (key) => {
    if (!selectedLanguage) return translationFiles['en']?.[key] || key;
    const value = translationFiles[selectedLanguage]?.[key] || translationFiles['en']?.[key];
    if (value === undefined) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation key: ${key}`);
      }
      return key;
    }
    return value;
  };

  const changeLanguage = (langCode) => {
    setSelectedLanguage(langCode);
    localStorage.setItem('language', langCode);
    // Keep legacy key for older components if any
    localStorage.setItem('ma_lang', langCode);
  };

  if (!languageLoaded) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ selectedLanguage, setSelectedLanguage, changeLanguage, t, languageLoaded }}>
      {children}
    </LanguageContext.Provider>
  );
};
