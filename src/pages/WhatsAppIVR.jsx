import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MessageCircle, Send, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function WhatsAppIVR() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('whatsapp');
  
  const [messages, setMessages] = useState([
    { text: "Welcome to MedAssist Support on WhatsApp! How can I help you today?", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');

  const [ivrLog, setIvrLog] = useState([
    "Welcome to MedAssist IVR Support.",
    "Press 1 for Medicine Reminder",
    "Press 2 to Book Appointment",
    "Press 3 for Emergency Help",
    "Press 4 to Speak to Support"
  ]);

  const handleSendWA = () => {
    if (!input.trim()) return;
    setMessages([...messages, { text: input, sender: 'user' }]);
    const query = input.toLowerCase();
    setInput('');
    
    setTimeout(() => {
      let botResponse = "I didn't quite catch that. Try asking to book an appointment or set a reminder.";
      if (query.includes('appointment')) botResponse = "Please go to the Appointments section in the app to book.";
      else if (query.includes('remind')) botResponse = "You can set up medication reminders in the Reminders tab.";
      else if (query.includes('emergency')) botResponse = "For emergencies, please use the Emergency Help section immediately.";
      setMessages(prev => [...prev, { text: botResponse, sender: 'bot' }]);
    }, 1000);
  };

  const handleIVRKey = (key) => {
    setIvrLog(prev => [...prev, `> Pressed ${key}`]);
    setTimeout(() => {
      if (key === '1') {
        setIvrLog(prev => [...prev, "Routing to Medicine Reminder..."]);
        setTimeout(() => navigate('/reminders'), 1000);
      } else if (key === '2') {
        setIvrLog(prev => [...prev, "Routing to Appointment Booking..."]);
        setTimeout(() => navigate('/appointments'), 1000);
      } else if (key === '3') {
        setIvrLog(prev => [...prev, "Routing to Emergency Help..."]);
        setTimeout(() => navigate('/emergency'), 1000);
      } else if (key === '4') {
        setIvrLog(prev => [...prev, "Connecting to Support Executive... Please wait."]);
      } else {
        setIvrLog(prev => [...prev, "Invalid Option. Try 1, 2, 3, or 4."]);
      }
    }, 500);
  };

  return (
    <Layout title={t('whatsapp_ivr')}>
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6 h-[calc(100vh-10rem)] md:h-[calc(100vh-6rem)]">
        
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-4">
          <button 
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 p-4 rounded-2xl transition-all ${activeTab === 'whatsapp' ? 'bg-[#25D366] text-white shadow-md shadow-green-500/30' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'}`}
          >
            <MessageCircle size={24} />
            <span className="font-semibold hidden sm:inline">WhatsApp Bot</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('ivr')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 p-4 rounded-2xl transition-all ${activeTab === 'ivr' ? 'bg-medical-blue text-white shadow-md shadow-medical-blue/30' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'}`}
          >
            <Phone size={24} />
            <span className="font-semibold hidden sm:inline">IVR System</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
          
          {activeTab === 'whatsapp' ? (
            <div className="flex flex-col h-full bg-[#E5DDD5]">
              <div className="bg-[#075E54] text-white p-4 flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1">
                  <img src="https://www.image2url.com/r2/default/images/1781779461062-c1bcda3a-8c82-472a-ba22-af59e7330b01.png" alt="Bot" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">MedAssist Bot</h3>
                  <span className="text-xs opacity-80">online</span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${msg.sender === 'user' ? 'bg-[#DCF8C6] text-gray-800 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-3 bg-[#f0f0f0] shrink-0 flex gap-2">
                <input 
                  type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendWA()}
                  className="flex-1 px-4 py-3 rounded-full border-none focus:outline-none" placeholder="Type a message"
                />
                <button onClick={handleSendWA} className="w-12 h-12 bg-[#075E54] hover:bg-[#128C7E] text-white rounded-full flex items-center justify-center transition-colors">
                  <Send size={20} className="ml-1" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full p-6 md:p-10 items-center justify-center bg-gray-50">
              
              <div className="bg-black text-green-400 font-mono text-sm p-4 rounded-xl w-full max-w-sm mb-8 h-48 overflow-y-auto shadow-inner">
                {ivrLog.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                {[1,2,3,4,5,6,7,8,9,'*',0,'#'].map(key => (
                  <button 
                    key={key} 
                    onClick={() => handleIVRKey(key.toString())}
                    className="aspect-square bg-white border border-gray-200 rounded-full flex flex-col items-center justify-center text-2xl font-bold text-gray-700 hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all shadow-sm"
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
