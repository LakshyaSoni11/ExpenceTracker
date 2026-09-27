import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, MessageCircle, Loader2 } from 'lucide-react';
import api, { TOKEN_KEY } from '@/api/axios';
import { toast } from 'sonner';

const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

const AIChatbot = ({ onRefresh, onAutoAddExpense, onAutoCreateGroup }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [messages, setMessages] = useState([
    { role: "model", parts: [{ text: "Hi! I'm ExpenseBuddy. I can add expenses or create groups if you just tell me what to do!" }] }
  ]);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

const handleSend = async () => {
    if (!input.trim() || loading) return;

    // 1. Add the user's message to the local UI state
    const userMsg = { role: "user", parts: [{ text: input }] };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setStreamingText("");

    try {
      const historyForAPI = messages[0]?.role === 'model'
        ? messages.slice(1)
        : messages;

      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${baseURL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: input,
          history: historyForAPI,
          stream: true,
        }),
      });

      if (!res.ok) {
        let reason = "AI Assistant is offline";
        try {
          const errData = await res.json();
          reason = errData?.message || errData?.error || reason;
        } catch { /* ignore parse */ }
        throw new Error(reason);
      }

      if (res.headers.get("content-type")?.includes("text/event-stream")) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let full = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";
          for (const evt of events) {
            const line = evt.split("\n").find(l => l.startsWith("data: "));
            if (!line) continue;
            const data = JSON.parse(line.slice(6));
            if (data.delta) {
              full += data.delta;
              setStreamingText(full);
            }
            if (data.done) break;
          }
        }

        setStreamingText("");

        if (full.trim().startsWith('{')) {
          try {
            const action = JSON.parse(full.trim());
            if (action.type === "ACTION") {
              const ok = await executeTask(action);
              setMessages(prev => [
                ...prev,
                { role: "model", parts: [{ text: ok ? ` I've successfully performed that task for you!` : ` I wasn't able to complete that task.` }] }
              ]);
            } else {
              setMessages(prev => [...prev, { role: "model", parts: [{ text: full }] }]);
            }
          } catch {
            setMessages(prev => [...prev, { role: "model", parts: [{ text: full }] }]);
          }
        } else if (full.trim()) {
          setMessages(prev => [...prev, { role: "model", parts: [{ text: full }] }]);
        }
      } else {
        // Fallback for non-stream responses
        const data = await res.json();
        const botText = data.response || "";
        if (botText.startsWith('{')) {
          try {
            const action = JSON.parse(botText);
            if (action.type === "ACTION") {
              const ok = await executeTask(action);
              setMessages(prev => [
                ...prev,
                { role: "model", parts: [{ text: ok ? ` I've successfully performed that task for you!` : ` I wasn't able to complete that task.` }] }
              ]);
            }
          } catch {
            setMessages(prev => [...prev, { role: "model", parts: [{ text: botText }] }]);
          }
        } else if (botText && !botText.startsWith('{')) {
          setMessages(prev => [...prev, { role: "model", parts: [{ text: botText }] }]);
        } else {
          setMessages(prev => [...prev, { role: "model", parts: [{ text: botText }] }]);
        }
      }
    } catch (err) {
      console.error("Chat Error:", err);
      toast.error(err.message || "AI Assistant is offline");
      setMessages(prev => [
        ...prev,
        { role: "model", parts: [{ text: err.message || " Sorry, I'm having trouble connecting to the server right now." }] }
      ]);
    } finally {
      setLoading(false);
      setStreamingText("");
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
      return true;
    } catch (err) {
      const reason = err?.response?.data?.message || err?.message || "The task could not be completed.";
      console.error("Task failed", err);
      toast.error(reason);
      setMessages(prev => [
        ...prev,
        { role: "model", parts: [{ text: ` Sorry, I couldn't do that: ${reason}` }] }
      ]);
      return false;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
      {isOpen ? (
        <div className="w-[calc(100vw-2rem)] max-w-80 sm:w-80 h-[70vh] max-h-[520px] sm:h-[450px] bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 animate-in slide-in-from-bottom-5">
          <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-2xl flex justify-between items-center">
            <span className="flex items-center gap-2 font-bold tracking-tight"><Bot size={20}/> ExpenseBuddy AI</span>
            <X className="cursor-pointer hover:rotate-90 hover:bg-white/10 rounded-full p-1 transition-all" onClick={() => setIsOpen(false)} />
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-2xl text-sm max-w-[85%] ${
                  m.role === 'user' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-soft' : 'bg-white text-slate-800 border border-slate-200 shadow-sm'
                }`}>
                  {m.parts[0].text}
                </div>
              </div>
            ))}
            {loading && streamingText && (
              <div className="flex justify-start">
                <div className="p-3 rounded-2xl text-sm max-w-[85%] bg-white text-slate-800 border border-slate-200 shadow-sm">
                  {streamingText}
                  <span className="ml-0.5 inline-block w-1.5 h-3.5 align-middle bg-emerald-500 animate-pulse rounded-sm" />
                </div>
              </div>
            )}
            {loading && !streamingText && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> thinking…
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          <div className="p-3 border-t bg-white flex gap-2 items-center">
            <input 
              className="flex-1 outline-none text-sm p-2 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/15 transition-all" 
              value={input} 
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="e.g. Add 50 for Pizza in Trip" 
            />
            <button onClick={handleSend} disabled={loading || !input.trim()} className="bg-gradient-to-r from-emerald-500 to-teal-600 p-2 rounded-xl text-white shadow-soft disabled:opacity-50 active:scale-95 transition-all">
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)} 
          className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full text-white shadow-lift hover:scale-110 active:scale-95 transition-all"
        >
          <MessageCircle size={28} />
        </button>
      )}
    </div>
  );
};

export default AIChatbot;