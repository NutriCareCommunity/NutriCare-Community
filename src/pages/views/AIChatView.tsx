import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { processChat, getExplainedSimply } from "../../services/gemini";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, User, Bot, Sparkles, Loader2, Volume2, CheckCircle2, Droplet, Image as ImageIcon, Camera } from "lucide-react";
import { VoiceNarration } from "../../components/common/VoiceNarration";
import { db, handleFirestoreError, OperationType } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { GeminiAIBackend } from "../../services/geminiService";
import { translations } from "../../constants/translations";

interface Message {
  role: "user" | "ai";
  content: string;
}

export default function AIChatView() {
  const { language, profile, user, appMode } = useApp();
  const t = translations[language] || translations.en;
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Namaste! I am your Caring Nutrition Companion. I'm here to help you and your family eat well. ❤️" }
  ]);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].role === 'ai') {
        return [{ role: "ai", content: t.aiChat.greeting || "Namaste! I am your Caring Nutrition Companion. I'm here to help you and your family eat well. ❤️" }];
      }
      return prev;
    });
  }, [language]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [pendingAction, setPendingAction] = useState<any | null>(null);
  const [explainingId, setExplainingId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ... (keeping voice recognition logic) ...

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    setMessages(prev => [...prev, { role: "user", content: "Analyzing food image... 📸" }]);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const analysis = await GeminiAIBackend.analyzeIndianFood(base64, user.uid);
        
        const aiResponse = `I see **${analysis.name}**! 
        - ⚡ Calories: ${analysis.calories}kcal
        - 💪 Protein: ${analysis.protein}g
        - 🥗 Health Score: ${analysis.healthScore}/10
        
        **Ingredients:** ${analysis.ingredients.join(', ')}
        
        **Caring Tip:** ${analysis.alternatives[0]}
        
        I've logged this for you! ❤️`;

        setMessages(prev => [...prev, { role: "ai", content: aiResponse }]);
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", content: "I couldn't analyze the image. Please try again with a clearer photo! 🙏" }]);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pendingAction]);

  // Voice Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language === 'en' ? 'en-US' : language === 'hi' ? 'hi-IN' : 'te-IN';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [language]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const executeAction = async (action: any) => {
    if (!user || !action || action.type !== 'log_habit') return;

    const path = `users/${user.uid}/habits`;
    try {
      await addDoc(collection(db, "users", user.uid, "habits"), {
        userId: user.uid,
        type: action.habitType,
        value: action.value,
        description: action.description,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    await executeAction(pendingAction);
    const actionDesc = pendingAction.description || (pendingAction.habitType === 'water' ? `${pendingAction.value}L of Water` : 'a Meal');
    setPendingAction(null);
    setMessages(prev => [...prev, { role: "ai", content: `Successfully logged: **${actionDesc}**. Keep going! 🏆` }]);
  };

  const handleExplainSimply = async (messageIndex: number, originalContent: string) => {
    setExplainingId(messageIndex);
    try {
        const simplified = await getExplainedSimply(originalContent, language);
        setMessages(prev => {
            const next = [...prev];
            next[messageIndex] = { ...next[messageIndex], content: `${next[messageIndex].content}\n\n---\n**Simplified Heart Tip:** ${simplified} ❤️` };
            return next;
        });
    } catch (err) {
        console.error(err);
    } finally {
        setExplainingId(null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const response = await processChat(userMsg, language, { appMode, profileName: profile?.displayName });
      setMessages(prev => [...prev, { role: "ai", content: response.text }]);
      
      if (response.action) {
        setPendingAction(response.action);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", content: "I'm sorry, I'm having trouble connecting. Let's stay positive and try again! ❤️" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[75vh]">
      {/* Caring Companion Header */}
      <div className="flex items-center gap-4 mb-6 p-6 bg-white/40 glass-card rounded-[40px] border-white shadow-xl shadow-indigo-100/50">
        <motion.div 
            animate={{ scale: [1, 1.1, 1] }} 
            transition={{ repeat: Infinity, duration: 3 }}
            className="w-16 h-16 bg-indigo-100 rounded-[28px] flex items-center justify-center text-3xl shadow-inner border-2 border-white"
        >
            👩‍⚕️
        </motion.div>
        <div>
            <h3 className="text-xl font-black text-indigo-900 tracking-tighter">{t.aiChat.companion || "Companion"}</h3>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{t.aiChat.onlineCaring || "Online & Caring"}</span>
            </div>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-6 pr-2 no-scrollbar px-4 w-full flex flex-col items-center"
      >
        <div className="w-full max-w-3xl space-y-6">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[100%] md:max-w-[85%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-5 rounded-[32px] shadow-sm text-sm leading-relaxed relative ${
                      msg.role === 'user' 
                      ? 'gradient-indigo text-white rounded-tr-none' 
                      : 'bg-white border border-gray-100 text-gray-700 rounded-tl-none glass-card'
                  }`}>
                    <div className="markdown-body prose prose-sm max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                  
                  {msg.role === 'ai' && (
                      <div className="flex items-center gap-2 mt-2 ml-2">
                          <VoiceNarration text={msg.content} />
                          <button 
                              onClick={() => handleExplainSimply(i, msg.content)}
                              disabled={explainingId === i}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                                  explainingId === i ? 'bg-gray-100 text-gray-300' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
                              }`}
                          >
                              {explainingId === i ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3" />}
                              {t.aiChat.explainSimply || "Explain Simply"}
                          </button>
                      </div>
                  )}
                </div>
              </motion.div>
            ))}

            {loading && (
                <div className="flex gap-3 ml-2">
                    <div className="w-10 h-10 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-center p-2">
                        <Loader2 className="w-full h-full text-indigo-600 animate-spin" />
                    </div>
                </div>
            )}

            {pendingAction && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
                  <motion.div
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-white w-full max-w-lg rounded-[48px] p-10 shadow-3xl relative overflow-hidden"
                  >
                      <div className="absolute top-0 left-0 w-full h-3 gradient-indigo" />
                      <div className="flex flex-col items-center text-center space-y-8">
                          <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[32px] flex items-center justify-center shadow-inner border-2 border-white">
                              {pendingAction.habitType === 'water' ? <Droplet className="w-12 h-12" /> : <CheckCircle2 className="w-12 h-12" />}
                          </div>
                          
                          <div>
                              <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{t.aiChat.logActivity || "Log activity?"}</h3>
                              <p className="text-gray-400 font-bold text-[10px] mt-2 uppercase tracking-[0.3em]">{t.aiChat.confirmationLoop || "Confirmation Loop"}</p>
                          </div>

                          <div className="bg-gray-50 border border-gray-100 p-8 rounded-[36px] w-full shadow-inner">
                              <p className="text-2xl font-black text-gray-800 tracking-tight">
                                  {pendingAction.description || `Log ${pendingAction.value}${pendingAction.habitType === 'water' ? 'L Water' : ' Entry'}`}
                              </p>
                          </div>

                          <div className="flex gap-4 w-full">
                              <button onClick={() => setPendingAction(null)} className="flex-1 py-5 bg-gray-100 text-gray-400 rounded-[28px] font-black text-[10px] uppercase tracking-widest">{t.aiChat.later || "Later"}</button>
                              <button 
                                  onClick={handleConfirmAction}
                                  className="flex-1 py-5 gradient-indigo text-white rounded-[28px] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-indigo-200 active:scale-95 transition-all"
                              >
                                  {t.aiChat.logNow || "Log Now ❤️"}
                              </button>
                          </div>
                      </div>
                  </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Input Area */}
      <div className="mt-8 flex items-center gap-3 bg-white border-2 border-indigo-50 p-3 rounded-[36px] shadow-2xl shadow-indigo-100/50">
        <input 
            type="file" accept="image/*" className="hidden" 
            ref={fileInputRef} onChange={handleFileUpload}
        />
        <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => fileInputRef.current?.click()}
            className="p-4 rounded-[24px] bg-gray-50 text-indigo-400 hover:bg-indigo-50 transition-all"
        >
            <Camera className="w-6 h-6" />
        </motion.button>
        <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={toggleListening}
            className={`p-4 rounded-[24px] shadow-lg transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-gray-50 text-indigo-400 hover:bg-indigo-50'}`}
        >
            <Mic className="w-6 h-6" />
        </motion.button>
        <input 
          type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isListening ? (t.aiChat.listening || "Listening with care...") : (t.aiChat.askAnything || "Ask me anything...")}
          className="flex-1 bg-transparent border-none py-3 px-2 text-[15px] font-bold text-gray-800 placeholder-gray-300 outline-none"
        />
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className={`p-4 rounded-[24px] shadow-xl transition-all ${input.trim() ? 'gradient-indigo text-white shadow-indigo-200' : 'bg-gray-100 text-gray-300'}`}
        >
            <Send className="w-6 h-6" />
        </motion.button>
      </div>
    </div>
  );
}

function SuggestionButton({ children, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className="flex items-center gap-2 p-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:border-green-200 hover:bg-green-50 transition-all text-left"
        >
            <Sparkles className="w-3 h-3 text-green-500" />
            {children}
        </button>
    )
}
