
import React, { useState } from 'react';
import { Message, Sender, UploadedFile, MaintenanceItem } from './types';
import { streamResponse, extractMaintenanceData } from './services/geminiService';
import { SUGGESTED_QUERIES } from './constants';
import { FileUpload } from './components/FileUpload';
import { ChatInterface } from './components/ChatInterface';
import { AnalysisView } from './components/AnalysisView';
import { 
    Star, 
    MessageSquare, 
    LayoutDashboard, 
    FileText, 
    Trash2,
    Settings,
    ShieldAlert
} from 'lucide-react';

export default function App() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'analysis'>('chat');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceItem[]>([]);

  // Handle File Upload
  const handleFilesSelected = (newFiles: UploadedFile[]) => {
    setIsProcessing(true);
    // Simulate initial "reading" delay
    setTimeout(() => {
        setFiles(newFiles);
        setMessages([
            {
                id: 'init-1',
                text: `**Manual Analyzed:** ${newFiles[0].name}\n\nI have indexed the document. I can help you with:\n- Troubleshooting faults\n- Explaining error codes\n- Maintenance procedures\n- Safety protocols\n\nWhat is the current machine status?`,
                sender: Sender.BOT,
                timestamp: Date.now()
            }
        ]);
        setIsProcessing(false);
        
        // Trigger background extraction for dashboard
        analyzeManual(newFiles);
    }, 1500);
  };

  const analyzeManual = async (currentFiles: UploadedFile[]) => {
      setIsAnalyzing(true);
      const data = await extractMaintenanceData(currentFiles);
      setMaintenanceData(data);
      setIsAnalyzing(false);
  };

  const handleSendMessage = async (text: string) => {
    const newUserMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: Sender.USER,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMsg]);

    const botMsgId = (Date.now() + 1).toString();
    const newBotMsg: Message = {
      id: botMsgId,
      text: '',
      sender: Sender.BOT,
      timestamp: Date.now(),
      isStreaming: true
    };

    setMessages(prev => [...prev, newBotMsg]);

    // Construct history for API
    const history = messages.map(m => ({
        role: m.sender === Sender.USER ? 'user' : 'model',
        parts: [{ text: m.text }]
    }));

    let fullText = '';
    await streamResponse(
      history, 
      files, 
      text, 
      (chunk) => {
        fullText += chunk;
        setMessages(prev => prev.map(msg => 
          msg.id === botMsgId 
            ? { ...msg, text: fullText } 
            : msg
        ));
      }
    );

    setMessages(prev => prev.map(msg => 
        msg.id === botMsgId 
          ? { ...msg, isStreaming: false } 
          : msg
    ));
  };

  const resetSession = () => {
      setFiles([]);
      setMessages([]);
      setMaintenanceData([]);
      setActiveTab('chat');
  };

  if (files.length === 0) {
    return (
      <div className="min-h-screen bg-industrial-900 text-white flex flex-col">
        <header className="p-6 border-b border-industrial-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-brand-blue p-2 rounded-lg">
                    <Star className="text-white fill-current" size={24} />
                </div>
                <div>
                    <h1 className="font-bold text-xl tracking-tight">Maintenance assistant</h1>
                    <p className="text-xs text-industrial-500 font-mono">INDUSTRIAL INTELLIGENCE AGENT</p>
                </div>
            </div>
        </header>
        <main className="flex-1">
            <FileUpload onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen bg-industrial-900 text-white flex overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-industrial-950 border-r border-industrial-800 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-industrial-800 flex items-center gap-3">
             <div className="bg-brand-blue p-2 rounded-lg">
                <Star className="text-white fill-current" size={20} />
             </div>
             <div>
                <h1 className="font-bold text-lg tracking-tight leading-tight">Maintenance assistant</h1>
                <p className="text-[10px] text-industrial-500 font-mono">V1.0.4 | ONLINE</p>
             </div>
        </div>
        
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
            <div className="text-xs font-semibold text-industrial-500 uppercase tracking-wider mb-2 px-2">Active Manual</div>
            {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-industrial-900 rounded-lg border border-industrial-800 text-sm">
                    <FileText size={16} className="text-brand-blue" />
                    <span className="truncate">{f.name}</span>
                </div>
            ))}

            <div className="h-6"></div>
            
            <div className="text-xs font-semibold text-industrial-500 uppercase tracking-wider mb-2 px-2">Tools</div>
            <button 
                onClick={() => setActiveTab('chat')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-sm font-medium
                ${activeTab === 'chat' ? 'bg-industrial-800 text-white border border-industrial-700' : 'text-industrial-400 hover:text-white hover:bg-industrial-900'}`}
            >
                <MessageSquare size={18} />
                Diagnostics Chat
            </button>
            <button 
                onClick={() => setActiveTab('analysis')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-sm font-medium
                ${activeTab === 'analysis' ? 'bg-industrial-800 text-white border border-industrial-700' : 'text-industrial-400 hover:text-white hover:bg-industrial-900'}`}
            >
                <LayoutDashboard size={18} />
                Maintenance Dash
                {isAnalyzing && <span className="w-2 h-2 bg-brand-blue rounded-full animate-pulse ml-auto"></span>}
            </button>
        </div>

        <div className="p-4 border-t border-industrial-800">
             <div className="bg-red-900/20 border border-red-900/50 p-3 rounded-lg mb-4">
                 <div className="flex items-center gap-2 text-red-500 text-xs font-bold mb-1">
                     <ShieldAlert size={14} /> SAFETY ACTIVE
                 </div>
                 <p className="text-[10px] text-red-400 leading-tight">
                     Verify all LOTO procedures before physical intervention.
                 </p>
             </div>
             <button 
                onClick={resetSession}
                className="flex items-center gap-2 text-industrial-500 hover:text-red-400 transition-colors text-sm w-full p-2"
             >
                 <Trash2 size={16} /> Close Session
             </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative">
         {/* Mobile Header */}
         <header className="md:hidden p-4 border-b border-industrial-800 flex justify-between items-center bg-industrial-950">
             <div className="flex items-center gap-2">
                 <Star className="text-brand-blue fill-current" size={20} />
                 <h1 className="font-bold">Maintenance assistant</h1>
             </div>
             <div className="flex gap-2">
                 <button onClick={() => setActiveTab('chat')} className={`p-2 rounded ${activeTab === 'chat' ? 'bg-industrial-800' : ''}`}><MessageSquare size={20}/></button>
                 <button onClick={() => setActiveTab('analysis')} className={`p-2 rounded ${activeTab === 'analysis' ? 'bg-industrial-800' : ''}`}><LayoutDashboard size={20}/></button>
             </div>
         </header>

         {/* Viewport */}
         <div className="flex-1 overflow-hidden relative">
            {activeTab === 'chat' ? (
                <>
                    <ChatInterface 
                        messages={messages} 
                        onSendMessage={handleSendMessage} 
                        isStreaming={messages.some(m => m.isStreaming)}
                    />
                    {/* Suggested Chips */}
                    {messages.length < 3 && !messages.some(m => m.isStreaming) && (
                        <div className="absolute bottom-24 left-0 right-0 px-4">
                            <div className="flex gap-2 overflow-x-auto pb-2 max-w-4xl mx-auto no-scrollbar">
                                {SUGGESTED_QUERIES.map((q, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => handleSendMessage(q)}
                                        className="whitespace-nowrap bg-industrial-800/80 backdrop-blur border border-industrial-700 hover:border-brand-blue text-industrial-300 hover:text-white px-4 py-2 rounded-full text-xs transition-all shadow-lg"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <AnalysisView maintenanceData={maintenanceData} isLoading={isAnalyzing} />
            )}
         </div>
      </main>
    </div>
  );
}
