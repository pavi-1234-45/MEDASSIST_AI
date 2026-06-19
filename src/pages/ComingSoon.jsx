import React from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { Settings } from 'lucide-react';

export default function ComingSoon({ title }) {
  const { t } = useLanguage();

  return (
    <Layout title={title || t('dashboard') || "Module"}>
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <Settings size={48} className="text-gray-400 animate-[spin_4s_linear_infinite]" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">{title || "Feature"} Coming Soon</h2>
        <p className="text-gray-500 max-w-md">
          This module is currently under development. Please check back in a future update!
        </p>
      </div>
    </Layout>
  );
}
