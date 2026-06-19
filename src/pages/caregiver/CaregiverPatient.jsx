import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useLanguage } from '../../context/LanguageContext';
import { dbService } from '../../utils/firebaseService';
import { User, Phone, MessageSquare, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CaregiverPatient() {
  const { t } = useLanguage();
  const [patient, setPatient] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const unsubPat = dbService.onValue('users', (data) => {
      if (data) {
        const p = Object.keys(data).map(k => ({id:k, ...data[k]})).find(u => u.role === 'patient');
        if (p) {
          setPatient(p);
          dbService.onValue(`users/${p.id}/profile`, (pData) => setProfile(pData || {}), true);
        }
      }
    });
    return () => unsubPat();
  }, []);

  const handleCall = () => {
    if (patient?.phone) window.location.href = `tel:${patient.phone}`;
    else toast.error("Phone number not available");
  };

  const handleWhatsApp = () => {
    if (patient?.phone) window.open(`https://wa.me/${patient.phone}`, '_blank');
    else toast.error("Phone number not available");
  };

  const handleAlertDoctor = async () => {
    if (!patient?.id) return;
    try {
      const alertId = dbService.generateId();
      await dbService.set(`alerts/${patient.id}/${alertId}`, {
        type: 'caregiver_doctor_alert',
        status: 'unread',
        message: 'Caregiver requested doctor attention',
        timestamp: new Date().toISOString()
      });
      toast.success("Doctor alerted");
    } catch (e) {
      toast.error(t('somethingWentWrong'));
    }
  };

  if (!patient) return <Layout><div className="p-8 text-center">Loading...</div></Layout>;

  return (
    <Layout title={t('linked_patient')}>
      <div className="max-w-4xl mx-auto py-8">
        
        <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100">
          
          <div className="bg-gradient-to-r from-medical-teal to-teal-400 p-8 text-white flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-4xl font-bold shadow-inner">
              {patient.displayName ? patient.displayName.charAt(0).toUpperCase() : <User size={40} />}
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold">{patient.displayName || 'Unnamed Patient'}</h1>
              <p className="text-teal-50 mt-1">{profile?.age ? `${profile.age} yrs • ` : ''}{profile?.gender || 'Unknown'} • {patient.phone}</p>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Medical Conditions</h3>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 font-medium text-gray-800">
                  {profile?.conditions || 'None specified'}
                </div>
              </div>
              
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Allergies</h3>
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100 font-medium text-red-800">
                  {profile?.allergies || 'None specified'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Blood Group</h3>
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 font-medium text-blue-800 text-center">
                    {profile?.bloodGroup || 'N/A'}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Primary Doctor</h3>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 font-medium text-gray-800 text-center truncate">
                    {profile?.doctorName || 'Not assigned'}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Quick Actions</h3>
              
              <button onClick={handleCall} className="w-full p-4 bg-white border-2 border-gray-100 hover:border-medical-blue hover:shadow-md rounded-2xl flex items-center gap-4 transition-all group">
                <div className="w-12 h-12 bg-blue-50 text-medical-blue rounded-full flex items-center justify-center group-hover:bg-medical-blue group-hover:text-white transition-colors">
                  <Phone size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-800">{t('call_patient')}</p>
                  <p className="text-xs text-gray-500">Call via mobile network</p>
                </div>
              </button>

              <button onClick={handleWhatsApp} className="w-full p-4 bg-white border-2 border-gray-100 hover:border-green-500 hover:shadow-md rounded-2xl flex items-center gap-4 transition-all group">
                <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors">
                  <MessageSquare size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-800">{t('send_whatsapp')}</p>
                  <p className="text-xs text-gray-500">Message securely</p>
                </div>
              </button>

              <button onClick={handleAlertDoctor} className="w-full p-4 bg-white border-2 border-gray-100 hover:border-amber-500 hover:shadow-md rounded-2xl flex items-center gap-4 transition-all group">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <AlertTriangle size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-800">{t('alert_doctor')}</p>
                  <p className="text-xs text-gray-500">Request clinical review</p>
                </div>
              </button>

            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
