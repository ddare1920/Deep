import React, { useRef, useEffect } from 'react';
import { Send, Bot, User, Cpu, AlertTriangle, CheckCircle, PenTool, Wrench } from 'lucide-react';
import { Message, Sender } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isStreaming: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isStreaming }) => {
  const [input, setInput] = React.useState('');
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
      onSendMessage(input);
      setInput('');
    }
  };

  // Basic Markdown Renderer
  const renderMarkdown = (text: string) => {
    // Split by newlines to handle blocks
    const lines = text.split('\n');
    let inList = false;

    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith('### ')) return <h3 key={idx} className="text-lg font-bold text-brand-blue mt-4 mb-2">{line.replace('### ', '')}</h3>;
      if (line.startsWith('**') && line.includes(':**')) {
        // Key-Value style bolding often used in my system prompt
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

      // Code blocks (simple detection)
      if (line.startsWith('```')) return null; // Skip code fences for now or implement block logic
      
      // Empty lines
      if (line.trim() === '') return <div key={idx} className="h-2"></div>;

      // Regular text with bold support
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
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
            <div className="absolute left-4 text-industrial-500">
               <PenTool size={18} />
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isStreaming ? "Analyzing manual..." : "Ask troubleshooting question or request a summary..."}
              disabled={isStreaming}
              className="w-full bg-industrial-900 text-white placeholder-industrial-500 border border-industrial-600 rounded-lg py-3 pl-12 pr-12 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all font-mono text-sm"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="absolute right-2 p-2 bg-brand-blue text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-brand-blue transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
          <div className="text-center mt-2">
            <p className="text-[10px] text-industrial-500 uppercase tracking-widest">
              Always follow Lockout/Tagout procedures before maintenance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
