import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, X, Loader2, Send, Briefcase } from 'lucide-react';
import { GeminiService } from '../../services/GeminiService';
import { OdooService } from '../../services/OdooService';

const SupportChat = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([
        { role: 'assistant', text: "Hello! I'm the DesiMart AI. I can help with navigation or basic queries. For complex issues, I can open a ticket for you." }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const handleSend = async (text = input) => {
        if (!text.trim()) return;
        const newMessages = [...messages, { role: 'user', text }];
        setMessages(newMessages);
        setInput('');
        setLoading(true);
        const reply = await GeminiService.generateContent(text);
        setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
        setLoading(false);
    };

    const handleEscalate = async () => {
        setLoading(true);
        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.text || "General Inquiry";
        const result = await OdooService.createCrmLead(lastUserMsg, "Guest User"); // Creates 'crm.lead'
        setLoading(false);
        if (result.success) {
            setMessages(prev => [...prev, { role: 'assistant', text: "✅ I've created a support ticket (Lead) in our CRM system. A human agent will contact you shortly." }]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-24 right-4 md:right-8 w-[90vw] md:w-80 bg-white rounded-t-lg shadow-2xl z-50 flex flex-col border border-slate-200 animate-in slide-in-from-bottom-5 duration-300 h-[450px]">
            <div className="bg-slate-800 text-white p-3 rounded-t-lg flex justify-between items-center shadow-md">
                <div className="flex items-center gap-2">
                    <HelpCircle size={18} className="text-white" />
                    <h3 className="font-bold text-sm">Customer Support</h3>
                </div>
                <button onClick={onClose} className="hover:bg-slate-700 p-1 rounded transition-colors">
                    <X size={18} />
                </button>
            </div>

            <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50 text-sm">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-lg leading-relaxed shadow-sm ${msg.role === 'user'
                                ? 'bg-emerald-700 text-white'
                                : 'bg-white text-slate-800 border border-slate-200'
                            }`}>
                            {msg.text.split('\n').map((line, i) => (
                                <React.Fragment key={i}>
                                    {line}
                                    {i !== msg.text.split('\n').length - 1 && <br />}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
                            <Loader2 size={14} className="animate-spin text-emerald-700" />
                            <span className="text-xs text-slate-500">Connecting...</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="px-4 py-2 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto scrollbar-hide">
                <button onClick={() => handleSend("Where is my order?")} className="whitespace-nowrap px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded hover:bg-slate-200 transition-colors">Track Order</button>
                <button onClick={handleEscalate} className="whitespace-nowrap px-3 py-1 bg-amber-100 text-amber-800 text-amber-800 text-xs font-bold rounded hover:bg-amber-200 transition-colors flex items-center gap-1"><Briefcase size={12} /> Escalate to Human</button>
            </div>

            <div className="p-3 bg-white border-t border-slate-200">
                <div className="flex items-center gap-2 bg-slate-100 rounded px-3 py-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a question..."
                        className="flex-grow bg-transparent border-none text-sm focus:ring-0 placeholder:text-slate-400"
                    />
                    <button onClick={() => handleSend()} disabled={!input.trim() || loading} className="text-emerald-700 hover:text-emerald-900 disabled:opacity-50 transition-colors">
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SupportChat;
