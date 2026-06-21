import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { useLanguage } from '../../context/LanguageContext';
import { Search, MapPin, Building2, Phone, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function HospitalSearch() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Replace with the actual data.gov.in resource ID for Hospitals / Blood Banks
  const HOSPITAL_RESOURCE_ID = 'e16c75b6-7ee6-4ade-8e1f-2cd3043ff4c9'; // Example ID

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      // Using our backend proxy to avoid exposing API keys
      const url = `/api/medical/datagov/resource/${HOSPITAL_RESOURCE_ID}?format=json&limit=20&filters[state_name]=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch from Data.gov.in proxy');
      }

      const data = await response.json();
      
      // Map the dataset fields.
      if (data && data.records) {
        setFacilities(data.records);
      } else {
        setFacilities([]);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch data or dataset not found.');
      // For demonstration if API fails, load mock data
      setFacilities([
        { id: 1, facility_name: 'City General Hospital & Blood Bank', state_name: query, district: 'Central District', contact_number: '1800-111-222', type: 'Govt Hospital' },
        { id: 2, facility_name: 'Red Cross Blood Bank', state_name: query, district: 'North District', contact_number: '1800-333-444', type: 'Blood Bank' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title={t('hospital_directory') || 'Hospital & Blood Banks'}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-500 to-orange-500 rounded-[24px] p-8 text-white shadow-lg shadow-red-500/20"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              <Building2 size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{t('hospital_directory') || 'Hospital & Blood Banks'}</h1>
              <p className="text-white/90 mt-1">{t('hospital_directory_desc') || 'Find nearby healthcare facilities'}</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="mt-6 flex gap-3 relative z-10">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="text-gray-400" size={20} />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search_placeholder_hospitals') || 'Search state or city...'}
                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-800 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-inner text-lg font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-white text-red-600 hover:bg-gray-50 px-8 py-4 rounded-xl font-bold text-lg shadow-md transition-all flex items-center justify-center min-w-[140px]"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : 'Search'}
            </button>
          </form>
        </motion.div>

        {/* Results Section */}
        {searched && !loading && facilities.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-[24px] p-10 text-center border border-gray-100 shadow-sm"
          >
            <AlertCircle className="mx-auto text-amber-500 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Facilities Found</h3>
            <p className="text-gray-500">We couldn't find any hospitals or blood banks for "{query}". Try a different location.</p>
          </motion.div>
        )}

        {facilities.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {facilities.map((facility, index) => (
              <motion.div
                key={facility.id || index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 hover:shadow-md hover:border-red-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-xl text-gray-800 leading-tight">
                      {facility.facility_name || facility.hosp_name || facility.blood_bank_name || 'Healthcare Facility'}
                    </h3>
                  </div>
                  
                  <div className="space-y-3 mt-4">
                    <div className="flex items-start gap-3 text-gray-600">
                      <MapPin size={18} className="text-red-400 mt-0.5 shrink-0" />
                      <span className="text-sm font-medium leading-snug">
                        {facility.district || facility.city}, {facility.state_name || facility.state}
                        <br />
                        <span className="text-xs text-gray-400 font-normal">{facility.address || 'Address not provided'}</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-gray-600">
                      <Phone size={18} className="text-red-400 shrink-0" />
                      <span className="text-sm font-bold text-gray-700">{facility.contact_number || facility.mobile || 'Contact N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="bg-red-50 text-red-600 font-bold px-4 py-2 rounded-xl text-sm w-full text-center">
                    {facility.type || facility.facility_type || 'General Facility'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </Layout>
  );
}
