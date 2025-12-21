import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, MessageCircle, Loader2 } from 'lucide-react';
import api from '@/api/axios';
import { toast } from 'sonner';

const AIChatbot = ({ onRefresh, onAutoAddExpense, onAutoCreateGroup }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: "model", parts: [{ text: "Hi! I'm ExpenseBuddy. I can add expenses or create groups if you just tell me what to do!" }] }
  ]);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

const handleSend = async () => {
    if (!input.trim()) return;

    // 1. Add the user's message to the local UI state
    const userMsg = { role: "user", parts: [{ text: input }] };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      /**
       * 2. PREPARE HISTORY FOR GEMINI
       * Gemini requires the conversation to START with a 'user' role.
       * If your first message in 'messages' is the bot greeting (role: 'model'), 
       * we skip it for the API call.
       */
      const historyForAPI = messages[0]?.role === 'model' 
        ? messages.slice(1) 
        : messages;

      // 3. Call the Backend
      const { data } = await api.post('/chat', { 
        message: input, 
        history: historyForAPI 
      });

      const botText = data.response;

      // 4. Handle JSON Actions (Automation)
      if (botText.startsWith('{')) {
        try {
          const action = JSON.parse(botText);
          if (action.type === "ACTION") {
            await executeTask(action);
            setMessages(prev => [
              ...prev, 
              { role: "model", parts: [{ text: `✅ I've successfully performed that task for you!` }] }
            ]);
          }
        } catch (jsonErr) {
          // Fallback if it looked like JSON but wasn't valid
          setMessages(prev => [...prev, { role: "model", parts: [{ text: botText }] }]);
        }
      } else {
        // 5. Handle standard text responses
        setMessages(prev => [...prev, { role: "model", parts: [{ text: botText }] }]);
      }
    } catch (err) {
      console.error("Chat Error:", err);
      toast.error("AI Assistant is offline");
      
      // Optional: Add a message to the chat so the user knows it failed
      setMessages(prev => [
        ...prev, 
        { role: "model", parts: [{ text: "⚠️ Sorry, I'm having trouble connecting to the server right now." }] }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const executeTask = async (action) => {
    try {
      if (action.command === "ADD_EXPENSE") {
        await onAutoAddExpense(action.params);
      } else if (action.command === "CREATE_GROUP") {
        await onAutoCreateGroup(action.params);
      }
      onRefresh(); // Refresh dashboard data
    } catch (err) {
      console.error("Task failed", err);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="w-80 h-[450px] bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 animate-in slide-in-from-bottom-5">
          <div className="p-4 bg-emerald-600 text-white rounded-t-2xl flex justify-between items-center">
            <span className="flex items-center gap-2 font-medium"><Bot size={20}/> ExpenseBuddy AI</span>
            <X className="cursor-pointer hover:rotate-90 transition-transform" onClick={() => setIsOpen(false)} />
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-2xl text-sm max-w-[85%] ${
                  m.role === 'user' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-800 border'
                }`}>
                  {m.parts[0].text}
                </div>
              </div>
            ))}
            {loading && <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />}
            <div ref={scrollRef} />
          </div>

          <div className="p-3 border-t bg-white flex gap-2">
            <input 
              className="flex-1 outline-none text-sm p-2" 
              value={input} 
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="e.g. Add 50 for Pizza in Trip" 
            />
            <button onClick={handleSend} className="bg-emerald-600 p-2 rounded-lg text-white">
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)} 
          className="p-4 bg-emerald-600 rounded-full text-white shadow-lg hover:scale-110 active:scale-95 transition-all"
        >
          <MessageCircle size={28} />
        </button>
      )}
    </div>
  );
};

export default AIChatbot;