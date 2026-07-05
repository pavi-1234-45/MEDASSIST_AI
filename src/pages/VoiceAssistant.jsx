import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../utils/firebaseService';
import { apiClient } from '../utils/apiClient';
import { Mic, Square, Volume2, AlertTriangle, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VoiceAssistant() {
  const { t, selectedLanguage } = useLanguage();
  const { currentUser } = useAuth();
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [botResponse, setBotResponse] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const recognitionRef = useRef(null);

  // Map MedAssist language codes to BCP 47 locale tags
  const voiceLangMap = {
    'en': 'en-IN',
    'ta': 'ta-IN',
    'te': 'te-IN',
    'ml': 'ml-IN',
    'kn': 'kn-IN',
    'hi': 'hi-IN'
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        // We'll process in the effect below
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  // Process voice when listening stops and there's a transcript
  const lastProcessedRef = useRef('');
  useEffect(() => {
    if (!isListening && transcript.trim() && transcript !== lastProcessedRef.current) {
      lastProcessedRef.current = transcript;
      handleProcessVoice(transcript);
    }
  }, [isListening]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      setBotResponse('');
      setIsEmergency(false);
      setIsLoading(false);
      lastProcessedRef.current = '';
      window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        recognitionRef.current.lang = voiceLangMap[selectedLanguage] || 'en-IN';
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        alert("Speech recognition is not supported in this browser. Please use Chrome.");
      }
    }
  };

  const callAIVoiceBackend = async (inputText) => {
    try {
      const response = await apiClient('/ai/voice-assistant', {
        method: 'POST',
        body: JSON.stringify({
          message: inputText,
          language: selectedLanguage || 'en',
          role: currentUser?.role || 'patient'
        })
      });

      const data = await response.json();
      return {
        isEmergency: data.emergency || false,
        text: data.reply
      };
    } catch (error) {
      console.error('AI voice backend error:', error);
      // Fall back to local mock if backend is unreachable
      return processMockAiResponse(inputText);
    }
  };

  const processMockAiResponse = async (inputText) => {
    const text = inputText.toLowerCase();
    const emergencyKeywords = ['emergency', 'chest pain', 'breathing difficulty', 'accident', 'severe pain', 'severe bleeding', 'unconscious', 'stroke'];
    const isEmerg = emergencyKeywords.some(kw => text.includes(kw));

    if (isEmerg) {
      if (currentUser?.uid) {
        await dbService.set(`emergencies/${currentUser.uid}/${Date.now()}`, {
          patientId: currentUser.uid,
          status: "emergency",
          reason: inputText,
          timestamp: new Date().toISOString()
        });
      }
      return { isEmergency: true, text: "EMERGENCY DETECTED. Please seek immediate medical help." };
    }

    if (text.includes('fever')) return { isEmergency: false, text: "For a fever, rest and stay hydrated. Monitor your temperature. If it exceeds 103°F or lasts more than 3 days, consult a doctor." };
    if (text.includes('headache')) return { isEmergency: false, text: "For a headache, try resting in a quiet, dark room and drink water. If it is unusually severe, seek medical help." };
    if (text.includes('hand pain') || text.includes('wrist pain') || text.includes('arm pain')) return { isEmergency: false, text: "Avoid straining the affected area. Apply an ice pack. If pain persists, consult a doctor." };
    if (text.includes('diabetes')) return { isEmergency: false, text: "Maintain a balanced diet, monitor your blood sugar levels regularly, and take your prescribed medication on time." };
    if (text.includes('blood pressure')) return { isEmergency: false, text: "Reduce salt intake, manage stress, and ensure you take your BP medication regularly. Check your BP daily." };
    if (text.includes('asthma')) return { isEmergency: false, text: "Keep your inhaler nearby. Avoid triggers like dust or smoke. Use your rescue inhaler if you feel tightness." };
    
    return { isEmergency: false, text: "I am your AI assistant. Could you please specify your symptoms more clearly?" };
  };

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voiceLangMap[selectedLanguage] || 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  const handleProcessVoice = async (textToProcess) => {
    setIsLoading(true);
    setBotResponse('Thinking...');
    
    try {
      const response = await callAIVoiceBackend(textToProcess);

      // If emergency, create alert
      if (response.isEmergency && currentUser?.uid) {
        await dbService.set(`emergencies/${currentUser.uid}/${Date.now()}`, {
          patientId: currentUser.uid,
          status: "emergency",
          reason: textToProcess,
          timestamp: new Date().toISOString()
        });
      }

      setBotResponse(response.text);
      setIsEmergency(response.isEmergency);
      speakText(response.text);
    } catch (error) {
      console.error(error);
      setBotResponse("Sorry, I couldn't process your request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall112 = () => {
    window.location.href = "tel:112";
  };

  return (
    <Layout title={t('voice_assistant')}>
      <div className="max-w-2xl mx-auto py-8">
        
        <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
          
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-teal-50 to-transparent"></div>

          <div className="relative z-10 mb-8">
            <motion.div 
              animate={isListening ? { scale: [1, 1.2, 1], boxShadow: ["0 0 0px rgba(0, 201, 167, 0)", "0 0 40px rgba(0, 201, 167, 0.4)", "0 0 0px rgba(0, 201, 167, 0)"] } : {}}
              transition={{ repeat: isListening ? Infinity : 0, duration: 1.5 }}
              onClick={toggleListening}
              className={`w-32 h-32 rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-xl ${
                isListening ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-medical-teal text-white shadow-teal-500/30 hover:bg-teal-600'
              }`}
            >
              {isListening ? <Square size={40} className="fill-current" /> : <Mic size={48} />}
            </motion.div>
            <p className="mt-6 font-bold text-gray-600">
              {isListening ? "Listening... Tap to stop" : isLoading ? "Processing..." : "Tap the mic to speak"}
            </p>
          </div>

          <div className="w-full space-y-6 relative z-10">
            {transcript && (
              <div className="bg-gray-50 p-6 rounded-[24px] text-left border border-gray-100">
                <p className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">You said:</p>
                <p className="text-lg text-gray-800 leading-relaxed">"{transcript}"</p>
              </div>
            )}

            {botResponse && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-[24px] text-left border ${isEmergency ? 'bg-red-50 border-red-200' : 'bg-teal-50/50 border-teal-100'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <p className={`text-sm font-bold uppercase tracking-wider ${isEmergency ? 'text-red-600' : 'text-medical-teal'}`}>
                    AI Assistant Response:
                  </p>
                  <button onClick={() => speakText(botResponse)} className={`p-2 rounded-full transition-colors ${isEmergency ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-teal-100 text-teal-700 hover:bg-teal-200'}`}>
                    <Volume2 size={16} />
                  </button>
                </div>
                
                {isEmergency && (
                  <div className="flex items-center gap-2 text-red-600 font-bold mb-3">
                    <AlertTriangle size={20} /> EMERGENCY DETECTED
                  </div>
                )}
                
                <p className={`text-lg leading-relaxed ${isEmergency ? 'text-red-700 font-medium' : 'text-gray-800'}`}>
                  {botResponse}
                </p>

                {isEmergency && (
                  <div className="mt-5">
                    <button onClick={handleCall112} className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">
                      <Phone size={20} /> Dial 112
                    </button>
                  </div>
                )}

                {!isEmergency && (
                  <p className="text-xs text-gray-400 mt-4 italic">
                    {t('aiDisclaimer')}
                  </p>
                )}
              </motion.div>
            )}
          </div>

          {/* Text input fallback */}
          {!isListening && !botResponse && !isLoading && (
            <div className="mt-8 w-full">
              <p className="text-sm text-gray-400 mb-3">Or type your symptoms:</p>
              <form onSubmit={(e) => {
                e.preventDefault();
                if(transcript.trim()) handleProcessVoice(transcript);
              }} className="flex gap-2">
                <input 
                  type="text" 
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="E.g., I have a headache..." 
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-teal outline-none"
                />
                <button type="submit" className="bg-gray-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-900 transition-colors">
                  Ask
                </button>
              </form>
            </div>
          )}

        </div>

      </div>
    </Layout>
  );
}
