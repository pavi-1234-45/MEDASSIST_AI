import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../utils/firebaseService';
import { Send, Phone, AlertTriangle, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Chat() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  
  const [messages, setMessages] = useState([
    { id: '1', text: "Hello! I am MedAssist AI. How can I help you today?", isBot: true, isEmergency: false }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processMockAiResponse = async (inputText) => {
    const text = inputText.toLowerCase();
    const emergencyKeywords = ['emergency', 'chest pain', 'breathing difficulty', 'accident', 'severe pain', 'severe bleeding', 'unconscious', 'stroke'];
    
    const isEmergency = emergencyKeywords.some(kw => text.includes(kw));

    if (isEmergency) {
      if (currentUser?.uid) {
        await dbService.set(`emergencies/${currentUser.uid}/${Date.now()}`, {
          patientId: currentUser.uid,
          status: "emergency",
          reason: inputText,
          timestamp: new Date().toISOString()
        });
      }
      return {
        isEmergency: true,
        text: "EMERGENCY DETECTED. Please seek immediate medical help."
      };
    }

    if (text.includes('fever')) return { text: "For a fever, rest and stay hydrated. Monitor your temperature. If it exceeds 103°F (39.4°C) or lasts more than 3 days, consult a doctor." };
    if (text.includes('headache')) return { text: "For a headache, try resting in a quiet, dark room and drink water. If it is unusually severe, seek medical help." };
    if (text.includes('hand pain') || text.includes('wrist pain') || text.includes('arm pain')) return { text: "Avoid straining the affected area. Apply an ice pack for 15-20 minutes. If pain persists or swelling occurs, consult an orthopedic doctor." };
    if (text.includes('diabetes') || text.includes('sugar')) return { text: "Maintain a balanced diet, monitor your blood sugar levels regularly, and take your prescribed medication on time." };
    if (text.includes('blood pressure') || text.includes('bp')) return { text: "Reduce salt intake, manage stress, and ensure you take your BP medication regularly. Check your BP daily." };
    if (text.includes('asthma')) return { text: "Keep your inhaler nearby. Avoid triggers like dust or smoke. Use your rescue inhaler if you feel tightness in your chest." };
    if (text.includes('missed medicine')) return { text: "If you miss a dose, take it as soon as you remember. If it is almost time for your next dose, skip the missed one. Do not double the dose." };
    if (text.includes('appointment')) return { text: "You can manage your appointments from the Appointments tab on the sidebar. Do you need help booking one?" };

    return { text: "I am your AI assistant. Could you please specify your symptoms or question more clearly? For emergencies, please type 'emergency'." };
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now().toString(), text: input, isBot: false };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');

    // Simulate typing delay
    setTimeout(async () => {
      const response = await processMockAiResponse(currentInput);
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        isBot: true,
        isEmergency: response.isEmergency
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  const handleCall112 = () => {
    window.location.href = "tel:112";
  };

  const handleAlertCaregiver = async () => {
    if (currentUser?.uid) {
      await dbService.set(`emergencies/${currentUser.uid}/${Date.now()}`, {
        patientId: currentUser.uid,
        status: "emergency",
        reason: "Manual Alert from Chat",
        timestamp: new Date().toISOString()
      });
      alert("Alert sent to caregiver!");
    }
  };

  return (
    <Layout title={t('ai_chat')}>
      <div className="max-w-4xl mx-auto h-[calc(100vh-180px)] flex flex-col bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Chat Header */}
        <div className="bg-medical-blue p-4 flex items-center gap-4 text-white">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <ShieldAlert size={24} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">MedAssist AI</h2>
            <p className="text-xs text-blue-100">{t('aiDisclaimer')}</p>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50 space-y-6">
          {messages.map((msg) => (
            <motion.div 
              key={msg.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${msg.isBot ? 'items-start' : 'items-end'}`}
            >
              <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl ${
                msg.isEmergency 
                  ? 'bg-red-50 border border-red-200' 
                  : msg.isBot 
                    ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm' 
                    : 'bg-medical-blue text-white rounded-tr-sm shadow-md'
              }`}>
                {msg.isEmergency && (
                  <div className="flex items-center gap-2 text-red-600 font-bold mb-2">
                    <AlertTriangle size={20} /> EMERGENCY CRITICAL
                  </div>
                )}
                
                <p className={`text-[15px] leading-relaxed ${msg.isEmergency ? 'text-red-700 font-medium' : ''}`}>
                  {msg.text}
                </p>

                {msg.isEmergency && (
                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <button onClick={handleCall112} className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 px-4 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">
                      <Phone size={16} /> Dial 112
                    </button>
                    <button onClick={handleAlertCaregiver} className="flex-1 flex items-center justify-center gap-2 bg-red-100 text-red-700 py-2.5 px-4 rounded-xl font-bold text-sm hover:bg-red-200 transition-colors">
                      <AlertTriangle size={16} /> Alert Caregiver
                    </button>
                  </div>
                )}

                {msg.isBot && !msg.isEmergency && (
                  <p className="text-[10px] text-gray-400 mt-2 italic">
                    {t('aiDisclaimer')}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <form onSubmit={handleSend} className="flex items-end gap-2 relative">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Type your symptoms here..."
              className="flex-1 max-h-32 min-h-[56px] resize-none px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-medical-blue focus:border-medical-blue outline-none transition-all text-sm custom-scrollbar"
              rows="1"
            />
            <button 
              type="submit" 
              disabled={!input.trim()}
              className="w-14 h-14 bg-medical-blue text-white rounded-2xl flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors shadow-lg shadow-medical-blue/20"
            >
              <Send size={20} className="ml-1" />
            </button>
          </form>
        </div>
        
      </div>
    </Layout>
  );
}
