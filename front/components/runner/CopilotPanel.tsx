
import React, { useRef, useEffect } from 'react';
import { Bot, X, User, Sparkles, Send } from 'lucide-react';
import { useConfig } from '../../ConfigContext';

interface ChatMessage {
    role: 'user' | 'ai';
    text: string;
}

interface CopilotPanelProps {
    show: boolean;
    onClose: () => void;
    messages: ChatMessage[];
    isChatting: boolean;
    onSendMessage: (msg: string) => void;
}

export const CopilotPanel: React.FC<CopilotPanelProps> = ({ show, onClose, messages, isChatting, onSendMessage }) => {
    const { t } = useConfig();
    const [input, setInput] = React.useState("");
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isChatting]);

    const handleSend = () => {
        if (input.trim()) {
            onSendMessage(input);
            setInput("");
        }
    };

    if (!show) return null;

    return (
        <div className="w-[450px] bg-slate-50 border-l border-slate-200 flex flex-col animate-slide-in-right shadow-2xl relative z-20 h-full">
            <div className="p-5 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm sticky top-0 z-10">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600 shadow-sm border border-purple-200"><Bot size={20}/></div>
                    <div>
                        <h3 className="font-bold text-slate-800">{t('runner.copilot')}</h3>
                        <p className="text-xs text-slate-500 font-medium">{t('runner.contextAware')}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><X size={18}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex items-end max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mb-1 ${msg.role === 'user' ? 'bg-indigo-600 text-white ml-2' : 'bg-purple-100 text-purple-600 mr-2 border border-purple-200'}`}>
                                {msg.role === 'user' ? <User size={14}/> : <Sparkles size={14}/>}
                            </div>
                            <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                msg.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-tr-none' 
                                : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    </div>
                ))}
                {isChatting && (
                    <div className="flex justify-start">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 border border-purple-200 flex items-center justify-center"><Sparkles size={14}/></div>
                                <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2">
                                    <div className="flex space-x-1">
                                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                    </div>
                                    <span className="text-xs text-slate-400 font-medium ml-2">Analyzing...</span>
                                </div>
                            </div>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-200 sticky bottom-0">
                    <div className="relative shadow-sm">
                        <input 
                        className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-sm"
                        placeholder="Ask about the logs or error..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        />
                        <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isChatting}
                        className="absolute right-2 top-2 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:bg-slate-300 transition-colors"
                        >
                            <Send size={16}/>
                        </button>
                    </div>
            </div>
        </div>
    );
};
