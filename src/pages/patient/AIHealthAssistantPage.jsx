import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { useLanguage } from '../../context/LanguageContext';
import { MessageSquare, Mic, Send, Bot, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { apiClient } from '../../utils/apiClient';

export default function AIHealthAssistantPage() {
  const { t, selectedLanguage } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [voiceResponse, setVoiceResponse] = useState('');
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

  // Stop TTS when component unmounts or mode switches
  React.useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const speakText = (text, langCode) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Map internal lang codes to TTS standard codes
    const langMap = {
      'en': 'en-US',
      'ta': 'ta-IN',
      'hi': 'hi-IN',
      'kn': 'kn-IN',
      'te': 'te-IN',
      'ml': 'ml-IN'
    };
    utterance.lang = langMap[langCode] || 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const handleSendChat = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || isLoading) return;
    
    const userMessage = chatInput;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setChatInput('');
    setIsLoading(true);

    try {
      const history = messages
        .filter(m => !m.isEmergencyCard)
        .map(m => ({ role: m.role, text: m.text }));

      const response = await apiClient('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: userMessage,
          language: selectedLanguage || 'en',
          role: 'patient',
          history: history
        })
      });

      const data = await response.json();

      if (data.emergency) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          text: "CRITICAL: Potential medical emergency detected. Please seek immediate help.",
          isEmergencyCard: true 
        }]);
      }
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
    } catch (error) {
      console.error(error);
      if (error.message !== 'Unauthorized') {
        toast.error('Failed to get response from AI');
        setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I am having trouble connecting to the server." }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceSubmit = async (textToSubmit = voiceText) => {
    if (!textToSubmit.trim() || isLoading) return;
    
    const userMessage = textToSubmit;
    setVoiceText(''); // Clear input
    setIsLoading(true);
    setVoiceResponse('Thinking...');

    try {
      const response = await apiClient('/ai/voice-assistant', {
        method: 'POST',
        body: JSON.stringify({
          message: userMessage,
          language: selectedLanguage || 'en',
          role: 'patient'
        })
      });

      const data = await response.json();

      setVoiceResponse(data.reply);
      speakText(data.reply, selectedLanguage || 'en');
      
      if (data.emergency) {
        toast.error("EMERGENCY DETECTED!");
        navigate('/patient/emergency');
      }
    } catch (error) {
      console.error(error);
      if (error.message !== 'Unauthorized') {
        toast.error('Failed to get response from AI');
        setVoiceResponse('Sorry, an error occurred while calling the AI.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicToggle = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error("Your browser does not support Speech Recognition. Please use Chrome.");
      return;
    }

    if (isListening) {
      // We don't have direct access to the recognition instance here to call stop(), 
      // but it will timeout automatically. For simplicity, just toggle state.
      setIsListening(false);
      toast.error("Voice listening stopped.");
      return;
    }

    const recognition = new SpeechRecognition();
    
    // Set language map for speech recognition
    const langMap = {
      'en': 'en-US',
      'ta': 'ta-IN',
      'hi': 'hi-IN',
      'kn': 'kn-IN',
      'te': 'te-IN',
      'ml': 'ml-IN'
    };
    
    recognition.lang = langMap[selectedLanguage || 'en'] || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast.success("Listening... Speak now");
      window.speechSynthesis.cancel(); // Stop talking if listening
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setVoiceText(transcript);
      // Auto submit the recognized text
      handleVoiceSubmit(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      toast.error(`Mic error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
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
                {isLoading && activeTab === 'chat' && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] p-4 rounded-2xl bg-gray-100 text-gray-500 rounded-bl-none animate-pulse">
                      Thinking...
                    </div>
                  </div>
                )}
              </div>
              <form onSubmit={handleSendChat} className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2 shrink-0">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Type your health concern here..." 
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-medical-blue outline-none"
                />
                <button type="submit" disabled={!chatInput.trim() || isLoading} className="p-3 bg-medical-blue hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50">
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
                    onKeyDown={(e) => e.key === 'Enter' && handleVoiceSubmit()}
                    placeholder="Type or speak..." 
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-medical-blue outline-none"
                  />
                  <button 
                    onClick={handleVoiceSubmit}
                    disabled={isLoading || !voiceText.trim()}
                    className="p-3 bg-medical-blue hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>

              {voiceResponse && (
                <div className="w-full max-w-md mt-6 p-4 bg-blue-50 text-blue-900 rounded-xl border border-blue-100 shadow-sm text-left">
                  <p className="font-bold text-sm mb-1 text-blue-700">AI Voice Assistant:</p>
                  <p className="whitespace-pre-wrap">{voiceResponse}</p>
                </div>
              )}

            </motion.div>
          )}

        </div>
      </div>
    </Layout>
  );
}
