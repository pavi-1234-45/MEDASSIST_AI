import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../utils/firebaseService';
import { FileText, Save, Trash2, Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function DoctorNotes() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  
  const [patients, setPatients] = useState([]);
  const [notes, setNotes] = useState([]);
  const [filterQuery, setFilterQuery] = useState('');
  
  const [formData, setFormData] = useState({
    patientId: '',
    note: ''
  });

  useEffect(() => {
    // Fetch patients for the dropdown
    const unsubPat = dbService.onValue('users', (data) => {
      if (data) {
        setPatients(Object.keys(data)
          .map(k => ({ id: k, ...data[k] }))
          .filter(u => u.role === 'patient'));
      }
    });

    if (currentUser?.uid) {
      const unsubNotes = dbService.onValue(`notes/${currentUser.uid}`, (data) => {
        if (data) {
          const arr = Object.keys(data).map(key => ({ id: key, ...data[key] }));
          arr.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
          setNotes(arr);
        } else {
          setNotes([]);
        }
      });
      return () => { unsubPat(); unsubNotes(); };
    }
    return () => unsubPat();
  }, [currentUser]);

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.note.trim()) {
      toast.error("Please select a patient and write a note.");
      return;
    }
    try {
      const noteId = dbService.generateId();
      const patient = patients.find(p => p.id === formData.patientId);
      await dbService.set(`notes/${currentUser.uid}/${noteId}`, {
        noteId,
        doctorId: currentUser.uid,
        patientId: formData.patientId,
        patientName: patient?.displayName || 'Unknown',
        note: formData.note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      toast.success(t('save_note') || "Note saved");
      setFormData({ patientId: '', note: '' });
    } catch (error) {
      toast.error(t('somethingWentWrong'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this consultation note?")) {
      await dbService.remove(`notes/${currentUser.uid}/${id}`);
      toast.success("Note deleted");
    }
  };

  const filteredNotes = notes.filter(n => n.patientName.toLowerCase().includes(filterQuery.toLowerCase()));

  return (
    <Layout title={t('consultation_notes')}>
      <div className="max-w-6xl mx-auto py-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">{t('consultation_notes')}</h1>
          <p className="text-gray-500 mt-1">Manage clinical observations for your patients</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Add Note Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FileText size={20} className="text-medical-blue" /> Add New Note
              </h2>
              
              <form onSubmit={handleSaveNote} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{t('patient_name')}</label>
                  <select 
                    value={formData.patientId}
                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-blue outline-none"
                    required
                  >
                    <option value="" disabled>Select a patient</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.displayName || p.email}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Observation / Note</label>
                  <textarea 
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    rows="6"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-blue outline-none resize-none"
                    placeholder="Enter clinical notes here..."
                    required
                  ></textarea>
                </div>

                <div className="pt-2 flex gap-2">
                  <button type="button" onClick={() => setFormData({ patientId: '', note: '' })} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                    {t('clear')}
                  </button>
                  <button type="submit" className="flex-[2] py-3 bg-medical-blue text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-medical-blue/30">
                    <Save size={18} /> {t('save_note')}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Notes List */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter by patient name..." 
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-[16px] shadow-sm focus:ring-2 focus:ring-medical-blue outline-none"
              />
              {filterQuery && (
                <button onClick={() => setFilterQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              )}
            </div>

            {filteredNotes.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-white rounded-[24px] border border-gray-100 shadow-sm">
                No notes found.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotes.map((note) => (
                  <motion.div key={note.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{note.patientName}</h3>
                        <p className="text-xs text-gray-500">{new Date(note.createdAt).toLocaleString()}</p>
                      </div>
                      <button onClick={() => handleDelete(note.id)} className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                      {note.note}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}
