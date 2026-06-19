import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, languages } from '../data/translations';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return localStorage.getItem('ma_lang') || '';
  });
  
  const [languageLoaded, setLanguageLoaded] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('ma_lang');
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
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
    if (!selectedLanguage) return translations['en'][key] || key;
    const value = translations[selectedLanguage]?.[key] || translations['en'][key];
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
