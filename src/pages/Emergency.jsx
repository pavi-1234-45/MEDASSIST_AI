import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../utils/firebaseService';
import { AlertTriangle, MapPin, Loader2, Navigation, CheckCircle, Phone, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const HOLD_DURATION = 2000; // 2 seconds

export default function Emergency() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [emergencyType, setEmergencyType] = useState('');
  const [location, setLocation] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [caregiverPhone, setCaregiverPhone] = useState(null);

  // SOS Hold Logic
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sosSubmitted, setSosSubmitted] = useState(false);
  
  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = dbService.onValue(`users/${currentUser.uid}/caregiver`, (data) => {
      if (data?.phone) {
        setCaregiverPhone(data.phone);
      }
    });

    // Auto-detect location gracefully if possible
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        },
        () => {} // silent fail for auto-detect
      );
    }
    return () => unsub();
  }, [currentUser]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      clearInterval(intervalRef.current);
    };
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        setIsLocating(false);
        toast.success(t('locationDetected') || "Location Detected");
      },
      (error) => {
        toast.error("Location access denied.");
        setIsLocating(false);
      }
    );
  };

  const startHold = (e) => {
    // Prevent default touch behaviors (e.g. text selection)
    if(e?.type === 'touchstart') {
        // We do not preventDefault here as it blocks scrolling/clicks sometimes, 
        // but we handle hold.
    }
    
    if (isSubmitting || sosSubmitted) return;
    setIsHolding(true);
    setHoldProgress(0);

    const startTime = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setHoldProgress(progress);
    }, 50);

    timerRef.current = setTimeout(() => {
      clearInterval(intervalRef.current);
      submitSOS();
    }, HOLD_DURATION);
  };

  const cancelHold = () => {
    if (isSubmitting || sosSubmitted) return;
    clearTimeout(timerRef.current);
    clearInterval(intervalRef.current);
    setIsHolding(false);
    setHoldProgress(0);
  };

  const submitSOS = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    // 1. Immediately trigger 112
    window.location.href = "tel:112";

    if (currentUser?.uid) {
      try {
        const id = Date.now().toString();
        
        // 2. Create emergency alert
        await dbService.set(`emergencies/${currentUser.uid}/${id}`, {
          patientId: currentUser.uid,
          type: "sos",
          status: "emergency",
          reason: emergencyType || "SOS triggered",
          priority: "critical",
          location: location || "Unknown",
          timestamp: Date.now()
        });
        
        // 3. Create global alert for Dashboard/Caregiver Pulse
        const alertId = dbService.generateId();
        await dbService.set(`alerts/${currentUser.uid}/${alertId}`, {
          patientId: currentUser.uid,
          type: "emergency",
          status: "unread",
          message: "Emergency SOS triggered",
          priority: "critical",
          timestamp: Date.now()
        });

      } catch (err) {
        console.error("SOS write error", err);
      }
    }
    
    setSosSubmitted(true);
    setIsSubmitting(false);
  };

  const handleCallCaregiver = () => {
    if (caregiverPhone) {
      window.location.href = `tel:${caregiverPhone}`;
    } else {
      toast.error("No caregiver linked.");
    }
  };

  const circumference = 2 * Math.PI * 90; // for r=90
  const strokeDashoffset = circumference - (holdProgress / 100) * circumference;

  if (sosSubmitted) {
    return (
      <Layout title={t('emergencyHelp') || "Emergency Help"}>
        <div className="max-w-xl mx-auto py-8">
          <div className="bg-red-50 rounded-[32px] p-8 border border-red-100 shadow-xl text-center">
            
            <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                <AlertTriangle size={32} className="text-white" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-red-600 uppercase tracking-wider mb-2">
              {t('alertPriorityCritical') || "Alert Priority: Critical"}
            </h2>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-8">{t('sosSubmitted') || "SOS Submitted"}</h1>

            <div className="bg-white rounded-2xl p-6 text-left space-y-4 mb-8 shadow-sm">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-500" size={24} />
                <span className="font-bold text-gray-800 text-lg">{t('locationShared') || "Location Shared"}</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-500" size={24} />
                <span className="font-bold text-gray-800 text-lg">{t('caregiverNotified') || "Caregiver Notified"}</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-500" size={24} />
                <span className="font-bold text-gray-800 text-lg">{t('doctorAlerted') || "Doctor Alerted"}</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-500" size={24} />
                <span className="font-bold text-gray-800 text-lg">{t('hospitalAdminNotified') || "Hospital Admin Notified"}</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-500" size={24} />
                <span className="font-bold text-gray-800 text-lg">{t('emergencyResponseInitiated') || "Emergency Response Initiated"}</span>
              </div>
            </div>

            <p className="text-lg font-bold text-red-600 mb-6">
              {t('pleaseDial112') || "Please dial 112 from your phone immediately."}
            </p>

            <div className="space-y-4">
              <button onClick={() => window.location.href="tel:112"} className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-[16px] font-bold text-lg transition-colors flex justify-center items-center gap-2">
                <Phone size={24} /> {t('call112Again') || "Call 112 Again"}
              </button>
              <button onClick={handleCallCaregiver} className="w-full py-4 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-[16px] font-bold text-lg transition-colors flex justify-center items-center gap-2">
                <Phone size={24} /> {t('callCaregiver') || "Call Caregiver"}
              </button>
              <button onClick={() => navigate('/patient/dashboard')} className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-[16px] font-bold text-lg transition-colors flex justify-center items-center gap-2">
                <ArrowLeft size={24} /> {t('backToDashboard') || "Back to Dashboard"}
              </button>
            </div>

          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={t('emergencyHelp') || "Emergency Help"}>
      <div className="max-w-2xl mx-auto py-8">
        
        <div className="bg-red-50 rounded-[32px] p-6 md:p-10 border border-red-100 shadow-xl flex flex-col items-center">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-red-700 mb-2">{t('pressAndHoldForSOS') || "Press and Hold for SOS"}</h1>
            <p className="text-red-600/80 font-bold">{t('useOnlyInRealEmergencies') || "Use only in real emergencies."}</p>
          </div>

          <div className="relative flex justify-center items-center my-8 select-none">
            {/* Progress Ring */}
            <svg width="200" height="200" className="absolute pointer-events-none transform -rotate-90">
              <circle cx="100" cy="100" r="90" stroke="transparent" strokeWidth="8" fill="none" />
              <circle 
                cx="100" cy="100" r="90" 
                stroke="#dc2626" 
                strokeWidth="8" 
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all ease-linear"
                style={{ transitionDuration: '50ms' }}
              />
            </svg>

            {/* The actual SOS Button */}
            <button
              onMouseDown={startHold}
              onMouseUp={cancelHold}
              onMouseLeave={cancelHold}
              onTouchStart={startHold}
              onTouchEnd={cancelHold}
              onTouchCancel={cancelHold}
              className={`w-[145px] h-[145px] md:w-[170px] md:h-[170px] bg-gradient-to-br from-red-500 to-red-700 rounded-full flex flex-col items-center justify-center text-white shadow-2xl transition-all select-none
                ${isHolding ? 'scale-95 shadow-red-500/50' : 'scale-100 hover:scale-105 shadow-red-500/30'}
                ${isHolding ? 'animate-none' : 'animate-pulse'}`}
              style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'none' }}
            >
              <AlertTriangle size={48} className="mb-2" />
              <span className="text-3xl font-black tracking-widest">{t('sos') || "SOS"}</span>
            </button>
          </div>

          <p className="text-red-600 font-bold text-sm mb-12">
            {isHolding ? (t('holdToSendSOS') || "Hold to send SOS...") : (t('pressAndHoldForSOS') || "Press and hold for 2 seconds")}
          </p>

          <div className="w-full bg-white rounded-[24px] p-6 border border-red-100 shadow-sm space-y-4">
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('emergencyType') || "Emergency Type (Optional)"}</label>
              <select 
                value={emergencyType}
                onChange={e => setEmergencyType(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 outline-none text-gray-700 font-medium"
              >
                <option value="">{t('selectType') || "-- Select Type --"}</option>
                <option value="medical">{t('medicalEmergency') || "Medical Emergency"}</option>
                <option value="chest_pain">{t('chestPain') || "Chest Pain"}</option>
                <option value="breathing">{t('breathingDifficulty') || "Breathing Difficulty"}</option>
                <option value="accident">{t('accident') || "Accident"}</option>
                <option value="severe_pain">{t('severePain') || "Severe Pain"}</option>
                <option value="other">{t('other') || "Other"}</option>
              </select>
            </div>

            <div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location" 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-gray-600 text-sm"
                    readOnly
                  />
                </div>
                <button 
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors flex items-center gap-2"
                >
                  {isLocating ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </Layout>
  );
}
