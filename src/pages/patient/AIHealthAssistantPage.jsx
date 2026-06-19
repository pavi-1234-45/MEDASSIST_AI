import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { useLanguage } from '../../context/LanguageContext';
import { MessageSquare, Mic, Send, Bot, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AIHealthAssistantPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat');
  
  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your MedAssist AI. How can I help you today?' }
  ]);

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');

  const handleSendChat = (e) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', text: chatInput }]);
    const query = chatInput.toLowerCase();
    setChatInput('');
    
    const emergencyKeywords = ['chest pain', 'breathing difficulty', 'accident', 'severe pain', 'unconscious', 'stroke', 'severe bleeding'];
    const isEmergency = emergencyKeywords.some(kw => query.includes(kw));

    setTimeout(() => {
      if (isEmergency) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          text: "CRITICAL: Potential medical emergency detected.",
          isEmergencyCard: true 
        }]);
      } else {
        let reply = "I am a mock AI assistant. I can only understand basic keywords like 'fever' or 'headache'.";
        if (query.includes('fever') || query.includes('headache')) {
          reply = "Please rest well and stay hydrated. If symptoms persist for more than 2 days, please consult your doctor or use the emergency SOS.";
        }
        setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
      }
    }, 1000);
  };

  const handleMicToggle = () => {
    setIsListening(!isListening);
    if (!isListening) {
      toast.success("Voice listening started... (Mock)");
      setTimeout(() => {
        setIsListening(false);
        setVoiceText("I need help with my medication.");
      }, 3000);
    } else {
      toast.error("Voice listening stopped.");
    }
  };

  return (
    <Layout title={t('ai_health_assistant') || 'AI Health Assistant'}>
      <div className="max-w-4xl mx-auto py-8 flex flex-col h-[85vh]">
        
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-medical-blue/10 text-medical-blue rounded-xl">
              <Bot size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{t('ai_health_assistant') || 'AI Health Assistant'}</h1>
              <p className="text-gray-500 mt-1">Chat or speak with your virtual health companion</p>
            </div>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
            <button 
              onClick={() => setActiveTab('chat')}
              className={`flex-1 md:w-32 py-2 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'chat' ? 'bg-white text-medical-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <MessageSquare size={16} /> Chat Mode
            </button>
            <button 
              onClick={() => setActiveTab('voice')}
              className={`flex-1 md:w-32 py-2 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'voice' ? 'bg-white text-medical-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Mic size={16} /> Voice Mode
            </button>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden flex flex-col relative">
          
          {activeTab === 'chat' ? (
            <motion.div key="chat" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col h-full absolute inset-0">
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.isEmergencyCard ? (
                      <div className="max-w-[85%] md:max-w-[70%] p-5 rounded-2xl bg-red-50 border border-red-200 text-red-800 shadow-sm flex flex-col items-center text-center">
                        <AlertTriangle size={32} className="text-red-600 mb-2 animate-pulse" />
                        <span className="font-bold mb-4">{m.text}</span>
                        <button onClick={() => navigate('/patient/emergency')} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 transition-all">
                          <AlertTriangle size={20} /> SOS Emergency
                        </button>
                      </div>
                    ) : (
                      <div className={`max-w-[80%] p-4 rounded-2xl ${m.role === 'user' ? 'bg-medical-blue text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                        {m.text}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendChat} className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2 shrink-0">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Type your health concern here..." 
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-medical-blue outline-none"
                />
                <button type="submit" disabled={!chatInput.trim()} className="p-3 bg-medical-blue hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50">
                  <Send size={20} />
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div key="voice" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col items-center justify-center p-8 absolute inset-0 text-center">
              
              <div className="relative mb-8">
                {isListening && (
                  <>
                    <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20 scale-150"></div>
                    <div className="absolute inset-0 bg-blue-300 rounded-full animate-pulse opacity-40 scale-125"></div>
                  </>
                )}
                <button 
                  onClick={handleMicToggle}
                  className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white shadow-xl shadow-red-500/40' : 'bg-medical-blue text-white shadow-xl shadow-medical-blue/30 hover:scale-105'}`}
                >
                  <Mic size={48} />
                </button>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {isListening ? 'Listening...' : 'Tap to Speak'}
              </h2>
              <p className="text-gray-500 max-w-md mb-8">
                {isListening ? 'Speak your symptoms or requests clearly into your microphone.' : 'Use your voice to ask medical questions, log symptoms, or check your schedule.'}
              </p>

              <div className="w-full max-w-md">
                <label className="block text-sm font-bold text-gray-700 mb-2 text-left">Fallback Text Input</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={voiceText}
                    onChange={(e) => setVoiceText(e.target.value)}
                    placeholder="Transcribed text will appear here..." 
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-blue outline-none"
                  />
                  <button className="p-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors">
                    <Send size={20} />
                  </button>
                </div>
              </div>

            </motion.div>
          )}

        </div>
      </div>
    </Layout>
  );
}
