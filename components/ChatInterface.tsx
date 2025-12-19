
import React, { useRef, useEffect, useState } from 'react';
import { Send, Bot, User, Cpu, AlertTriangle, CheckCircle, PenTool, Wrench, Hash, X } from 'lucide-react';
import { Message, Sender } from '../types';
import { ERROR_CODE_PROMPT_TEMPLATE } from '../constants';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isStreaming: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isStreaming }) => {
  const [input, setInput] = useState('');
  const [isErrorCodeMode, setIsErrorCodeMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isStreaming) {
      if (isErrorCodeMode) {
        onSendMessage(ERROR_CODE_PROMPT_TEMPLATE(input.trim()));
        setIsErrorCodeMode(false);
      } else {
        onSendMessage(input);
      }
      setInput('');
    }
  };

  const toggleErrorCodeMode = () => {
    setIsErrorCodeMode(!isErrorCodeMode);
    setInput('');
  };

  // Basic Markdown Renderer
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith('### ')) return <h3 key={idx} className="text-lg font-bold text-brand-blue mt-4 mb-2">{line.replace('### ', '')}</h3>;
      if (line.startsWith('**') && line.includes(':**')) {
        const parts = line.split(':**');
        return <div key={idx} className="mt-2 mb-1"><span className="font-bold text-safety-yellow">{parts[0].replace('**', '')}:</span>{parts[1]}</div>
      }
      if (line.startsWith('**') && line.endsWith('**')) return <h4 key={idx} className="font-bold text-white mt-3 mb-1">{line.replace(/\*\*/g, '')}</h4>;
      
      // Lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return <li key={idx} className="ml-4 list-disc text-industrial-200">{line.replace(/^[-*]\s/, '')}</li>;
      }
      if (line.match(/^\d+\.\s/)) {
         return <div key={idx} className="ml-4 flex gap-2 mt-1"><span className="font-mono text-industrial-400 select-none">{line.match(/^\d+\./)?.[0]}</span><span>{line.replace(/^\d+\.\s/, '')}</span></div>;
      }

      if (line.startsWith('```')) return null;
      if (line.trim() === '') return <div key={idx} className="h-2"></div>;

      const boldParts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} className="text-industrial-100 leading-relaxed min-h-[1.2em]">
          {boldParts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-industrial-900">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-30 select-none">
            <Cpu className="w-24 h-24 mb-4 text-industrial-600" />
            <p className="text-xl font-mono text-industrial-500">SYSTEM READY. AWAITING QUERY.</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-4 max-w-4xl mx-auto ${msg.sender === Sender.USER ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg
              ${msg.sender === Sender.USER ? 'bg-industrial-700' : 'bg-brand-blue'}
            `}>
              {msg.sender === Sender.USER ? <User size={20} /> : <Bot size={20} />}
            </div>

            <div className={`
              rounded-xl p-5 shadow-xl max-w-[85%] border
              ${msg.sender === Sender.USER 
                ? 'bg-industrial-800 border-industrial-700 text-industrial-100' 
                : 'bg-industrial-800/80 border-industrial-700/50 backdrop-blur-sm text-gray-100'
              }
            `}>
              {msg.sender === Sender.BOT && (
                <div className="flex items-center gap-2 mb-3 border-b border-industrial-700/50 pb-2">
                   <div className="text-xs font-mono text-brand-blue font-bold uppercase tracking-wider flex items-center gap-1">
                     <Wrench size={12} /> Maintenance Agent
                   </div>
                   {msg.isStreaming && <span className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></span>}
                </div>
              )}
              
              <div className="prose prose-invert prose-sm max-w-none">
                {msg.sender === Sender.USER ? (
                   <p className="text-base">{msg.text}</p>
                ) : (
                  <div>{renderMarkdown(msg.text)}</div>
                )}
              </div>

              {msg.sender === Sender.BOT && !msg.isStreaming && (
                <div className="mt-4 pt-3 border-t border-industrial-700/50 flex gap-3 text-xs text-industrial-500 font-mono">
                    <span className="flex items-center gap-1 hover:text-safety-yellow cursor-help"><AlertTriangle size={12}/> Verify Safety Specs</span>
                    <span className="flex items-center gap-1 hover:text-green-400 cursor-help"><CheckCircle size={12}/> Manual v1.0 Referenced</span>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-industrial-800 border-t border-industrial-700 p-4">
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          
          <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={toggleErrorCodeMode}
              title="Lookup Error Code"
              className={`flex-shrink-0 p-3 rounded-lg border transition-all flex items-center gap-2 font-mono text-xs uppercase font-bold
                ${isErrorCodeMode 
                  ? 'bg-safety-red text-white border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)] bg-red-600' 
                  : 'bg-industrial-900 text-industrial-400 border-industrial-600 hover:border-red-500 hover:text-red-400'
                }`}
            >
              {isErrorCodeMode ? <X size={18} /> : <Hash size={18} />}
              <span className="hidden sm:inline">{isErrorCodeMode ? 'Cancel' : 'Fault Code'}</span>
            </button>

            <div className="relative flex-1">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-industrial-500">
                {isErrorCodeMode ? <AlertTriangle size={18} className="text-safety-yellow" /> : <PenTool size={18} />}
              </div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isErrorCodeMode 
                    ? "Enter Fault Code (e.g. E102, F-44)..." 
                    : "Ask maintenance question..."
                }
                disabled={isStreaming}
                className={`w-full bg-industrial-900 text-white placeholder-industrial-500 border rounded-lg py-3 pl-12 pr-12 focus:outline-none transition-all font-mono text-sm
                  ${isErrorCodeMode 
                    ? 'border-safety-orange ring-1 ring-safety-orange/30' 
                    : 'border-industrial-600 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue'
                  }`}
              />
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md transition-colors
                  ${isErrorCodeMode 
                    ? 'bg-safety-orange hover:bg-orange-600 text-white' 
                    : 'bg-brand-blue hover:bg-blue-600 text-white disabled:opacity-50'
                  }`}
              >
                <Send size={18} />
              </button>
            </div>
          </form>
          
          <div className="text-center">
            <p className="text-[10px] text-industrial-500 uppercase tracking-widest flex items-center justify-center gap-2">
              <ShieldAlert size={10} className="text-safety-yellow" />
              Perform Lockout/Tagout before troubleshooting internal faults
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add missing icon for the footer
const ShieldAlert = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </svg>
);
