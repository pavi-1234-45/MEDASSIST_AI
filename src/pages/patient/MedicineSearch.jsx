import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { useLanguage } from '../../context/LanguageContext';
import { Search, Pill, Tag, Package, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function MedicineSearch() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Replace with the actual data.gov.in resource ID for Jan Aushadhi
  const JAN_AUSHADHI_RESOURCE_ID = '3b01bc74-a957-41a4-b03d-3dfd73024c08'; // Example ID

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      // Using our backend proxy to avoid exposing API keys
      // Filters parameter usually depends on the exact dataset schema. 
      // We will search across all fields if standard search param is supported.
      const url = `/api/medical/datagov/resource/${JAN_AUSHADHI_RESOURCE_ID}?format=json&limit=20&filters[generic_name]=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch from Data.gov.in proxy');
      }

      const data = await response.json();
      
      // Map the dataset fields. Example schema:
      // { generic_name: "Paracetamol", price: "10", unit: "10 Tablets" }
      if (data && data.records) {
        setMedicines(data.records);
      } else {
        setMedicines([]);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch data or dataset not found.');
      // For demonstration if API fails, load mock data
      setMedicines([
        { id: 1, generic_name: `${query} (Generic A)`, unit_size: '10 Tablets', price: '₹12.50' },
        { id: 2, generic_name: `${query} (Generic B)`, unit_size: '1 Bottle (100ml)', price: '₹25.00' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title={t('search_medicines') || 'Generic Medicine Search'}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-medical-blue to-medical-teal rounded-[24px] p-8 text-white shadow-lg"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              <Pill size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{t('search_medicines') || 'Generic Medicine Search'}</h1>
              <p className="text-white/80 mt-1">{t('search_medicines_desc') || 'Find affordable Jan Aushadhi alternatives'}</p>
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
                placeholder={t('search_placeholder_meds') || 'Search medicines by name...'}
                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-800 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-inner text-lg font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-white text-medical-blue hover:bg-gray-50 px-8 py-4 rounded-xl font-bold text-lg shadow-md transition-all flex items-center justify-center min-w-[140px]"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : 'Search'}
            </button>
          </form>
        </motion.div>

        {/* Results Section */}
        {searched && !loading && medicines.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-[24px] p-10 text-center border border-gray-100 shadow-sm"
          >
            <AlertCircle className="mx-auto text-amber-500 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Medicines Found</h3>
            <p className="text-gray-500">We couldn't find any generic alternatives for "{query}". Try searching with a different name.</p>
          </motion.div>
        )}

        {medicines.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medicines.map((med, index) => (
              <motion.div
                key={med.id || index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 hover:shadow-md hover:border-medical-blue/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-xl text-gray-800 leading-tight">
                      {med.generic_name || med.drug_name || 'Generic Medicine'}
                    </h3>
                    <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-sm shrink-0 ml-4">
                      Jan Aushadhi
                    </span>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Package size={16} className="text-gray-400" />
                      <span className="text-sm font-medium">{med.unit_size || med.pack_size || 'Standard Pack'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag size={18} className="text-medical-teal" />
                    <span className="font-bold text-gray-500">Price</span>
                  </div>
                  <span className="text-2xl font-black text-medical-blue">
                    {med.price || med.mrp ? `₹${med.price || med.mrp}` : 'Price N/A'}
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
