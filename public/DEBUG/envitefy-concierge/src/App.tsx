import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Plus, Image as ImageIcon, Camera, Mic, Send, 
  ChevronRight, Calendar, MapPin, Users, Info, 
  Layout, FileText, Smartphone, CreditCard, ChevronDown,
  X, History, Trash2, CheckCircle2, Loader2, MessageSquare,
  MoreVertical, Share2, ExternalLink, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  CelebrationType, ProductType, Thread, Message, ConciergeEventDraft 
} from "./types";
import { conciergeService } from "./services/geminiService";

// --- Components ---

const Sidebar = ({ 
  threads, 
  activeThreadId, 
  onSelectThread, 
  onNewThread, 
  onDeleteThread 
}: { 
  threads: Thread[], 
  activeThreadId: string | null, 
  onSelectThread: (id: string) => void,
  onNewThread: () => void,
  onDeleteThread: (id: string) => void
}) => (
  <div className="w-80 h-full border-r border-slate-200 flex flex-col bg-white overflow-hidden">
    <div className="p-6">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="font-semibold text-lg tracking-tight">Envitefy</span>
      </div>
      
      <button 
        onClick={onNewThread}
        className="w-full py-3 px-4 rounded-xl border border-slate-200 flex items-center gap-3 text-slate-600 hover:bg-slate-50 transition-colors bg-white shadow-sm"
      >
        <Plus className="w-4 h-4" />
        <span className="font-medium">New chat</span>
      </button>
    </div>

    <div className="flex-1 overflow-y-auto px-6 scrollbar-hide">
      <div className="mb-4">
        <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <History className="w-3 h-3" />
          Recent Chats
        </h3>
        <div className="space-y-1">
          {threads.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4">No recent chats</p>
          ) : threads.map(thread => (
            <div 
              key={thread.id}
              className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                activeThreadId === thread.id ? 'bg-brand-light text-brand' : 'hover:bg-slate-50 text-slate-600'
              }`}
              onClick={() => onSelectThread(thread.id)}
            >
              <MessageSquare className="w-4 h-4 opacity-60" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{thread.title}</p>
                <p className="text-[10px] opacity-60">{new Date(thread.createdAt).toLocaleDateString()}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteThread(thread.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const StarterCard = ({ type, onClick }: { type: CelebrationType, onClick: (t: CelebrationType) => void }) => {
  const getBanner = (type: CelebrationType) => {
    switch (type) {
      case CelebrationType.BIRTHDAY: return "https://images.unsplash.com/photo-1530103043960-ef38714abb15?w=600&auto=format&fit=crop";
      case CelebrationType.WEDDING: return "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop";
      case CelebrationType.BABY_SHOWER: return "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop"; // Placeholder
      case CelebrationType.HOUSEWARMING: return "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop";
      case CelebrationType.GAME_DAY: return "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=600&auto=format&fit=crop";
      case CelebrationType.FIELD_TRIP: return "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop";
      case CelebrationType.OPEN_HOUSE: return "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop";
      case CelebrationType.CUSTOM: return "https://images.unsplash.com/photo-1512909002072-4aba6f69fc03?w=600&auto=format&fit=crop";
      case CelebrationType.UPLOAD: return "https://images.unsplash.com/photo-1510074377623-8cf13fb86c08?w=600&auto=format&fit=crop";
      default: return "https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=600&auto=format&fit=crop";
    }
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(type)}
      className="relative aspect-[4/3] rounded-3xl overflow-hidden cursor-pointer group shadow-sm bg-slate-100"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
      <img src={getBanner(type)} alt={type} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
      <div className="absolute bottom-6 left-6 z-20">
        <h4 className="text-white font-bold text-lg uppercase tracking-wider">{type}</h4>
        <p className="text-white/70 text-xs mt-1">Start your celebration &rarr;</p>
      </div>
    </motion.div>
  );
};

const ProductSelector = ({ 
  selected, 
  onSelect,
  isMobile = false
}: { 
  selected: ProductType, 
  onSelect: (p: ProductType) => void,
  isMobile?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const products = [
    { type: ProductType.LIVE_CARD, icon: Smartphone, desc: "Public card with RSVP", color: "text-purple-500", bg: "bg-purple-50" },
    { type: ProductType.FLYER, icon: FileText, desc: "Shareable graphic", color: "text-rose-500", bg: "bg-rose-50" },
    { type: ProductType.EVENT_PAGE, icon: Layout, desc: "Full public website", color: "text-emerald-500", bg: "bg-emerald-50" },
  ];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-brand-light/50 md:bg-slate-50 rounded-full text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200/50 group ${isOpen ? 'ring-2 ring-brand/10 border-brand/20' : ''}`}
      >
        <span className={`flex items-center justify-center w-5 h-5 rounded-full border transition-colors ${isOpen ? 'bg-brand border-brand text-white' : 'bg-white border-slate-200 text-slate-400 group-hover:text-brand transition-colors'}`}>
            {isOpen ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </span>
        <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Product</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`absolute bottom-full mb-4 ${isMobile ? 'left-[-12px] w-[calc(100vw-32px)]' : 'left-0 w-80'} bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden z-50`}
          >
            <div className="p-4 space-y-1">
              <p className="px-4 py-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest">Choose Output</p>
              {products.map(p => (
                <button
                  key={p.type}
                  onClick={() => { onSelect(p.type); setIsOpen(false); }}
                  className={`w-full flex items-center gap-4 p-3 rounded-2xl text-left transition-all ${
                    selected === p.type ? 'bg-slate-50 translate-x-1' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl ${selected === p.type ? p.bg : 'bg-slate-50'} flex items-center justify-center flex-shrink-0`}>
                    <p.icon className={`w-5 h-5 ${selected === p.type ? p.color : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-700">{p.type}</h5>
                    <p className="text-[10px] text-slate-400 leading-tight">{p.desc}</p>
                  </div>
                  {selected === p.type && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


const RSVPDashboard = ({ rsvps = [] }: { rsvps?: RSVP[] }) => {
  const attending = rsvps.filter(r => r.status === 'attending');
  const maybe = rsvps.filter(r => r.status === 'maybe');
  const notAttending = rsvps.filter(r => r.status === 'not_attending');
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
           <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">Attending</p>
           <p className="text-2xl font-bold text-green-700">{attending.length}</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
           <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Maybe</p>
           <p className="text-2xl font-bold text-amber-700">{maybe.length}</p>
        </div>
        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
           <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1">Declined</p>
           <p className="text-2xl font-bold text-rose-700">{notAttending.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Guest List</h4>
          <span className="text-[10px] font-bold text-brand uppercase tracking-widest">{rsvps.length} Total</span>
        </div>
        <div className="divide-y divide-slate-50 max-h-[320px] overflow-y-auto scrollbar-hide">
          {rsvps.length === 0 ? (
             <div className="p-12 text-center text-slate-400 text-xs italic">No responses yet</div>
          ) : rsvps.map(rsvp => (
            <div key={rsvp.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-[10px] font-bold text-brand">
                  {rsvp.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{rsvp.name}</p>
                  <p className="text-[10px] text-slate-400">{rsvp.email}</p>
                </div>
              </div>
              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                rsvp.status === 'attending' ? 'bg-green-50 text-green-600 border-green-100' :
                rsvp.status === 'maybe' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                'bg-rose-50 text-rose-600 border-rose-100'
              }`}>
                {rsvp.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-slate-100/50 rounded-2xl border border-dashed border-slate-200">
         <div className="flex items-center gap-2 mb-2">
            <Info className="w-3 h-3 text-slate-400" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">RSVP Link</p>
         </div>
         <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-500 truncate flex-1">envitefy.com/e/preview-mode-link</p>
            <button className="p-1.5 hover:bg-slate-50 rounded-lg text-brand transition-colors">
               <Share2 className="w-3 h-3" />
            </button>
         </div>
      </div>
    </div>
  );
};

export default function App() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [draft, setDraft] = useState<ConciergeEventDraft>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<"idle" | "selecting_product" | "chatting" | "generating" | "generated">("idle");
  const [previewTab, setPreviewTab] = useState<"preview" | "rsvp">("preview");
  
  // Mobile & Layout states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileView, setMobileView] = useState<"chat" | "preview">("chat");

  const isDraftComplete = draft.title && draft.date && draft.location;
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchThreads();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchThreads = async () => {
    const res = await fetch("/api/creation/threads");
    const data = await res.json();
    setThreads(data);
  };

  const startNewChat = async () => {
    const res = await fetch("/api/creation/threads", { method: "POST" });
    const newThread = await res.json();
    setThreads([newThread, ...threads]);
    setActiveThreadId(newThread.id);
    setMessages([]);
    setDraft({});
    setStatus("idle");
    setIsSidebarOpen(false);
  };

  const handleSelectCategory = (cat: CelebrationType) => {
    setDraft({ ...draft, category: cat });
    setStatus("selecting_product");
  };

  const handleSelectProduct = (product: ProductType) => {
    setDraft(prev => ({ ...prev, productType: product }));
    setStatus("chatting");
    
    const initialMsg: Message = {
      id: "sys-1",
      role: "assistant",
      content: `Fabulous choice! A ${draft.category} ${product} is going to look amazing. To make this event perfect, tell me a bit about what you have in mind. Any specific date, location, or vibe you're going for?`,
      timestamp: new Date().toISOString()
    };
    setMessages([initialMsg]);
  };

  const handleSendMessage = async (text?: string) => {
    const content = text || input;
    if (!content.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      role: "user",
      content,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // Simulate AI thinking
    setIsGenerating(true);
    
    // Extract info using Gemini
    const updatedDraft = await conciergeService.extractEventDetails(content, draft);
    setDraft(updatedDraft);

    setTimeout(() => {
      const aiMsg: Message = {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        content: `Got it! I've updated your workspace with ${content.length > 50 ? 'those details' : content}. Is there anything else we should add, or are we ready to generate your ${draft.productType || 'Live Card'}?`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsGenerating(false);
    }, 1000);
  };

  const generateProduct = async () => {
    setStatus("generating");
    // Simulate generation steps
    const steps = ["Planning layout...", "Creating assets...", "Optimizing content...", "Finalizing workspace..."];
    
    for (const step of steps) {
        await new Promise(r => setTimeout(r, 800));
    }

    const res = await fetch("/api/concierge/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft })
    });
    const finalEvent = await res.json();
    setDraft(finalEvent);
    setStatus("generated");
    // Auto-switch to preview on mobile when generated
    setMobileView("preview");
  };

  return (
    <div className="flex h-screen w-full bg-[#f8f9fc] overflow-hidden relative">
      {/* Sidebar - Desktop (static) & Mobile (overlay) */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-all duration-300 md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isSidebarCollapsed ? 'md:w-20' : 'md:w-80'}
      `}>
        <Sidebar 
          threads={threads}
          activeThreadId={activeThreadId}
          onSelectThread={(id) => {
              setActiveThreadId(id);
              setIsSidebarOpen(false);
          }}
          onNewThread={startNewChat}
          onDeleteThread={async (id) => {
              await fetch(`/api/creation/threads/${id}`, { method: "DELETE" });
              fetchThreads();
              if (activeThreadId === id) {
                setActiveThreadId(null);
                setStatus("idle");
              }
          }}
        />
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden md:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-400 hover:text-brand transition-colors shadow-sm z-10"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3 -rotate-90" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col relative h-full w-full">
        {/* Mobile Navbar */}
        {status !== "idle" && (
          <div className="md:hidden h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 z-30">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-500">
              <History className="w-5 h-5" />
            </button>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setMobileView("chat")}
                className={`px-4 py-1 text-xs font-bold rounded-md transition-all ${
                  mobileView === 'chat' ? 'bg-white text-brand shadow-sm' : 'text-slate-400'
                }`}
              >
                Chat
              </button>
              <button 
                onClick={() => setMobileView("preview")}
                className={`px-4 py-1 text-xs font-bold rounded-md transition-all ${
                  mobileView === 'preview' ? 'bg-white text-brand shadow-sm' : 'text-slate-400'
                }`}
              >
                Preview
              </button>
            </div>
            <button className="p-2 -mr-2 text-slate-500">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        )}

        {status === "idle" ? (
          <div className="flex-1 flex flex-col items-center p-6 md:p-12 overflow-y-auto w-full pt-16 md:pt-12">
            {/* Header for IDLE screen on mobile */}
            <div className="md:hidden absolute top-4 left-4 h-10 flex items-center gap-2">
                 <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                    <History className="w-4 h-4 text-slate-400" />
                 </button>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl w-full text-center mb-10 md:mb-16"
            >
              <h1 className="font-serif text-4xl md:text-6xl text-slate-800 mb-4 font-bold tracking-tight px-4 leading-tight">What are we celebrating?</h1>
              <p className="text-slate-400 text-sm md:text-lg px-6">Start with a few details, choose a format, or upload an invite.</p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl w-full px-2">
              {[
                CelebrationType.BIRTHDAY, CelebrationType.WEDDING, 
                CelebrationType.BRIDAL_SHOWER, CelebrationType.BABY_SHOWER,
                CelebrationType.GAME_DAY, CelebrationType.FIELD_TRIP,
                CelebrationType.OPEN_HOUSE, CelebrationType.HOUSEWARMING,
                CelebrationType.CUSTOM, CelebrationType.UPLOAD
              ].map(cat => (
                <StarterCard key={cat} type={cat} onClick={handleSelectCategory} />
              ))}
            </div>
            
            <div className="mt-12 md:hidden italic text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">Envitefy Concierge</div>
          </div>
        ) : status === "selecting_product" ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 bg-white">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl w-full text-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-light text-brand rounded-full text-[10px] font-bold uppercase tracking-widest mb-6">
                Step 2: Choose your format
              </div>
              <h2 className="font-serif text-4xl md:text-5xl text-slate-800 mb-4 font-bold tracking-tight italic">Choose your output</h2>
              <p className="text-slate-400 mb-12">How would you like to share your {draft.category}?</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { type: ProductType.LIVE_CARD, icon: Smartphone, desc: "Public card with RSVP", color: "text-purple-500", bg: "bg-purple-50" },
                  { type: ProductType.FLYER, icon: FileText, desc: "Shareable graphic", color: "text-rose-500", bg: "bg-rose-50" },
                  { type: ProductType.EVENT_PAGE, icon: Layout, desc: "Full public website", color: "text-emerald-500", bg: "bg-emerald-50" },
                ].map(p => (
                  <motion.button
                    key={p.type}
                    whileHover={{ y: -8 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectProduct(p.type)}
                    className="p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-brand/20 transition-all text-center flex flex-col items-center group"
                  >
                    <div className={`w-16 h-16 rounded-2xl ${p.bg} flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform`}>
                      <p.icon className={`w-8 h-8 ${p.color}`} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{p.type}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium uppercase tracking-tighter">{p.desc}</p>
                  </motion.button>
                ))}
              </div>

              <button 
                onClick={() => setStatus("idle")}
                className="mt-12 text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-2 mx-auto text-sm font-medium"
              >
                <X className="w-4 h-4" />
                Change category
              </button>
            </motion.div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden w-full h-full">
            {/* Chat Area - Responsive Visibility */}
            <div className={`
              flex-1 flex-col h-full bg-white relative
              ${mobileView === 'chat' ? 'flex' : 'hidden md:flex'}
            `}>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 scrollbar-hide pb-24 md:pb-8">
                    {messages.map(msg => (
                        <motion.div 
                            key={msg.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] md:max-w-[80%] p-4 md:p-5 rounded-2xl md:rounded-3xl ${
                                msg.role === 'user' 
                                ? 'bg-brand text-white rounded-tr-none shadow-md' 
                                : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100'
                            }`}>
                                <p className="text-sm leading-relaxed">{msg.content}</p>
                            </div>
                        </motion.div>
                    ))}
                    {isGenerating && (
                        <div className="flex justify-start">
                            <div className="p-3 md:p-4 rounded-2xl bg-slate-50 text-slate-400 animate-pulse text-[10px] md:text-xs italic">
                                Envitefy is thinking...
                            </div>
                        </div>
                    )}
                </div>

                {/* Composer */}
                <div className="fixed bottom-0 md:relative left-0 right-0 p-4 md:p-8 bg-white/95 backdrop-blur-md z-30">
                        {/* AI Suggestions / Action Chips */}
                        <AnimatePresence>
                            {(status === 'chatting' && !isGenerating) && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-wrap gap-2 mb-4"
                                >
                                    {!draft.date && (
                                        <button 
                                            onClick={() => handleSendMessage("Let's set the date for next Saturday")}
                                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 hover:border-brand hover:text-brand transition-all shadow-sm"
                                        >
                                            📅 Suggest Date
                                        </button>
                                    )}
                                    {!draft.location && (
                                        <button 
                                            onClick={() => handleSendMessage("It's at my house")}
                                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 hover:border-brand hover:text-brand transition-all shadow-sm"
                                        >
                                            📍 My Place
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleSendMessage("Change the energy to more 'Elegant'")}
                                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 hover:border-brand hover:text-brand transition-all shadow-sm"
                                    >
                                        ✨ Make it Elegant
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="relative group p-1 bg-white rounded-full border border-slate-200/60 shadow-sm focus-within:shadow-md focus-within:border-brand/30 transition-all flex items-center gap-1 md:gap-2">
                             <div className="pl-1 shrink-0">
                                <ProductSelector 
                                    selected={draft.productType || ProductType.LIVE_CARD} 
                                    onSelect={(p) => setDraft({...draft, productType: p})} 
                                    isMobile={window.innerWidth < 768}
                                />
                             </div>
                             
                             <div className="hidden md:flex items-center gap-3 px-2 border-l border-slate-100">
                                <button className="text-slate-400 hover:text-brand transition-colors"><ImageIcon className="w-4 h-4" /></button>
                                <button className="text-slate-400 hover:text-brand transition-colors"><Camera className="w-4 h-4" /></button>
                             </div>

                             <div className="flex-1 min-w-0">
                                <input 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Describe your event..."
                                    className="w-full h-11 md:h-12 bg-transparent border-none focus:ring-0 text-sm outline-none px-2 text-slate-700 placeholder:text-slate-300"
                                />
                             </div>

                             <div className="flex items-center gap-2 pr-1">
                                <button className="text-slate-400 hover:text-brand transition-colors px-1 shrink-0">
                                    <Mic className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleSendMessage()}
                                    className="w-9 h-9 md:w-10 md:h-10 bg-brand-light text-brand rounded-full flex items-center justify-center hover:bg-brand hover:text-white transition-all shadow-sm active:scale-95"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                             </div>
                        </div>

                        <div className="flex items-center justify-center md:pb-0">
                            <div className="text-[9px] md:text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] text-center">
                                Envitefy Concierge - Beta
                            </div>
                        </div>
                   </div>
                </div>

            {/* Preview Panel - Responsive Visibility */}
            <div className={`
                w-full md:w-[480px] h-full bg-[#fbfbfe] border-l border-slate-200 flex flex-col
                ${mobileView === 'preview' ? 'flex' : 'hidden md:flex'}
            `}>
                <div className="p-4 md:p-6 border-bottom border-slate-100 flex items-center justify-between">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-brand" />
                        Workspace Preview
                    </h2>
                    <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"><Share2 className="w-4 h-4" /></button>
                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"><MoreVertical className="w-4 h-4" /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide space-y-6 pb-24 md:pb-6">
                    {status === 'generated' && (
                        <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                            <button 
                                onClick={() => setPreviewTab("preview")}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                    previewTab === 'preview' ? 'bg-white text-brand shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                Invitation
                            </button>
                            <button 
                                onClick={() => setPreviewTab("rsvp")}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                    previewTab === 'rsvp' ? 'bg-white text-brand shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                RSVP
                            </button>
                        </div>
                    )}

                    {previewTab === 'rsvp' && status === 'generated' ? (
                        <RSVPDashboard rsvps={draft.rsvps} />
                    ) : (
                        <>
                            {/* Event Snapshot */}
                            <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100 relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            status === 'generated' ? 'bg-green-100 text-green-600' : 'bg-brand-light text-brand'
                                        }`}>
                                            {status === 'generating' ? 'Generating...' : status === 'chatting' ? 'Drafting' : 'Ready'}
                                        </span>
                                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{draft.category || 'Celebration'}</span>
                                    </div>
                                    
                                    <h3 className="text-xl md:text-2xl font-serif font-bold text-slate-800 mb-6 italic">
                                        {draft.title || "Your Event Title"}
                                    </h3>

                                    <div className="space-y-4">
                                        <div className={`flex items-center gap-3 transition-colors ${!draft.date ? 'text-slate-300 italic' : 'text-slate-600'}`}>
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                                !draft.date ? 'bg-slate-50 text-slate-300' : 'bg-orange-50 text-orange-500'
                                            }`}>
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-xs md:text-sm">{draft.date || "When is it happening?"}</span>
                                                {!draft.date && status === 'chatting' && <div className="h-1 w-8 bg-brand/20 mt-1 rounded-full animate-pulse" />}
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-3 transition-colors ${!draft.location ? 'text-slate-300 italic' : 'text-slate-600'}`}>
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                                !draft.location ? 'bg-slate-50 text-slate-300' : 'bg-blue-50 text-blue-500'
                                            }`}>
                                                <MapPin className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-xs md:text-sm truncate max-w-[200px]">{draft.location || "Where is the party?"}</span>
                                                {!draft.location && status === 'chatting' && <div className="h-1 w-12 bg-brand/20 mt-1 rounded-full animate-pulse" />}
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-3 transition-colors ${!draft.guestCount ? 'text-slate-300 italic' : 'text-slate-600'}`}>
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                                !draft.guestCount ? 'bg-slate-50 text-slate-300' : 'bg-purple-50 text-purple-500'
                                            }`}>
                                                <Users className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-xs md:text-sm">{draft.guestCount || "Who's invited?"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Visual Preview */}
                            <div className={`
                                bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8 flex flex-col justify-between items-center text-center relative overflow-hidden group transition-all duration-500
                                ${draft.productType === ProductType.EVENT_PAGE ? 'aspect-video w-full' : 'aspect-[4/5]'}
                            `}>
                                {status === 'generating' ? (
                                    <div className="flex flex-col items-center gap-4 text-slate-400">
                                        <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-brand" />
                                        <p className="text-sm font-medium">Brewing magic...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="absolute inset-0 opacity-20 pointer-events-none">
                                            <img 
                                                src="https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop" 
                                                className="w-full h-full object-cover grayscale"
                                                alt="Event Background"
                                            />
                                        </div>

                                        {draft.productType === ProductType.FLYER ? (
                                            <div className="relative z-10 w-full flex flex-col items-center justify-center h-full">
                                                <div className="w-full aspect-square bg-slate-100 rounded-2xl mb-6 shadow-inner flex items-center justify-center border-2 border-dashed border-slate-200">
                                                    <ImageIcon className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <h2 className="text-2xl font-serif italic mb-2">{draft.title || "Your Event"}</h2>
                                                <p className="text-[8px] font-bold text-brand uppercase tracking-[0.3em]">{draft.date || "DATE TBD"}</p>
                                            </div>
                                        ) : draft.productType === ProductType.EVENT_PAGE ? (
                                            <div className="relative z-10 w-full text-left flex flex-col h-full">
                                                <div className="flex justify-between items-start mb-8">
                                                    <div>
                                                        <p className="text-[10px] font-black italic uppercase tracking-tighter text-brand mb-1">Live Event Web</p>
                                                        <h2 className="text-3xl font-serif italic">{draft.title || "Majestic Celebration"}</h2>
                                                    </div>
                                                    <div className="px-4 py-2 bg-slate-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest">Register</div>
                                                </div>
                                                <div className="flex-1 border-t border-slate-100 pt-6">
                                                    <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                                                        {draft.description || "A full immersive website experience for your guests."}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative z-10 w-full">
                                                <p className="text-brand font-bold uppercase tracking-[0.2em] text-[8px] md:text-[10px] mb-6 md:mb-8">Celebration Invitation</p>
                                                <h2 className="text-3xl md:text-4xl font-serif italic mb-4">{draft.title || "Your Event"}</h2>
                                                <div className="h-[1px] w-8 md:w-12 bg-slate-200 mx-auto my-6 md:my-8" />
                                                <p className="text-xs md:text-sm text-slate-500 leading-relaxed max-w-[240px] mx-auto italic">
                                                    {draft.description || "Describe your event vision and see it come to life right here."}
                                                </p>
                                            </div>
                                        )}
                                        
                                        <div className="relative z-10 text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {draft.vibe || "Enchanting vibe"}
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}

                    {/* Actions */}
                    <div className="space-y-3">
                        {status === 'generated' ? (
                            <>
                                <button className="w-full py-3 md:py-4 bg-brand text-white rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand/20 hover:bg-brand/90 transition-all text-sm">
                                    <ExternalLink className="w-4 h-4" />
                                    Open Workspace
                                </button>
                                <button className="w-full py-3 md:py-4 bg-white text-slate-600 border border-slate-200 rounded-xl md:rounded-2xl font-bold hover:bg-slate-50 transition-all text-sm">
                                    View Full Product
                                </button>
                                <button 
                                    onClick={generateProduct}
                                    className="w-full flex items-center justify-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest py-2 hover:text-brand transition-colors"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    Regenerate Version
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={generateProduct}
                                disabled={status === 'generating'}
                                className={`w-full py-3 md:py-4 rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-sm ${
                                    status === 'generating' 
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                    : 'bg-brand text-white shadow-lg shadow-brand/20 hover:bg-brand/90'
                                }`}
                            >
                                {status === 'generating' ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Generate workspace
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
