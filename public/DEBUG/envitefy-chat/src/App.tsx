/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Mic, 
  ArrowUp, 
  Upload, 
  CreditCard, 
  Mail, 
  Sparkles,
  Loader2,
  X
} from 'lucide-react';

import { chatWithAI } from './services/geminiService';

// --- Types ---

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'upload_status';
}

interface StarterChip {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

// --- Components ---

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isBuildingWorkspace, setIsBuildingWorkspace] = useState(false);
  const [isWorkspaceActive, setIsWorkspaceActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'creative' | 'guests'>('creative');
  const [buildProgress, setBuildProgress] = useState(0);
  const [generatedFlyerUrl, setGeneratedFlyerUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const generateFlyerVisual = async () => {
    setIsGeneratingImage(true);
    // Simulate generation since the real tool hit a quota
    setTimeout(() => {
      setGeneratedFlyerUrl("https://images.unsplash.com/photo-1545127398-14699f92334b?auto=format&fit=crop&q=80&w=1000");
      setIsGeneratingImage(false);
    }, 2000);
  };
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const buildingSteps = [
    "Analyzing preferences...",
    "Generating event assets...",
    "Syncing guest database...",
    "Finalizing workspace canvas..."
  ];

  const currentStep = Math.min(
    Math.floor((buildProgress / 100) * buildingSteps.length),
    buildingSteps.length - 1
  );

  const starterChips: StarterChip[] = [
    { id: 'birthday', label: 'Birthday' },
    { id: 'wedding', label: 'Wedding' },
    { id: 'baby-shower', label: 'Baby shower' },
    { id: 'graduation', label: 'Graduation' },
    { id: 'upload', label: 'Upload old invite', icon: <Upload size={14} className="mr-1.5" /> },
    { id: 'surprise', label: 'Surprise me', icon: <Sparkles size={14} className="mr-1.5 text-envitefy-purple" /> },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSendMessage = async (text: string = inputValue) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsThinking(true);

    try {
      // Prepare history for AI
      const history = newMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const responseText = await chatWithAI(history);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Broader trigger for workspace builder
      const lowerResponse = responseText.toLowerCase();
      const triggers = ['building your workspace', 'finalizing the setup', 'preparing your custom event', 'ready to build', 'workspace for'];
      
      if (triggers.some(t => lowerResponse.includes(t))) {
        setTimeout(() => {
          setIsBuildingWorkspace(true);
          setBuildProgress(0);
          let progress = 0;
          const interval = setInterval(() => {
            progress += Math.random() * 12 + 5;
            if (progress >= 100) {
              progress = 100;
              clearInterval(interval);
              setTimeout(() => {
                setIsBuildingWorkspace(false);
                setIsWorkspaceActive(true);
              }, 1200);
            }
            setBuildProgress(progress);
          }, 400);
        }, 800);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsThinking(false);
    }
  };

  const [isRSVPModalOpen, setIsRSVPModalOpen] = useState(false);
  const [rsvpForm, setRsvpForm] = useState({ name: '', email: '', status: 'yes' });
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);

  const handleRSVPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRsvpSubmitted(true);
    setTimeout(() => {
      setIsRSVPModalOpen(false);
      setRsvpSubmitted(false);
      setRsvpForm({ name: '', email: '', status: 'yes' });
    }, 2000);
  };

  const handleUploadClick = () => {
    setIsMenuOpen(false);
    setIsThinking(true);
    
    // Simulate "Reading upload" text
    const readingMessage: Message = {
      id: 'upload-reading',
      role: 'assistant',
      content: "Reading upload...",
      type: 'upload_status'
    };
    
    // Push temporary reading message
    setMessages(prev => [...prev, readingMessage]);
    
    setTimeout(() => {
      const assistantMessage: Message = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        content: "I've analyzed your invitation! It looks like a 7th Birthday Party for Lara with a Cinema theme. I've initialized your workspace with the extracted details. What would you like to refine first?",
      };
      
      // Remove reading message and add real response
      setMessages((prev) => {
        const filtered = prev.filter(m => m.id !== 'upload-reading');
        return [...filtered, assistantMessage];
      });
      setIsThinking(false);
      
      // Trigger workspace build automatically on upload
      setTimeout(() => {
        setIsBuildingWorkspace(true);
        setBuildProgress(0);
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 15 + 10;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
              setIsBuildingWorkspace(false);
              setIsWorkspaceActive(true);
            }, 1000);
          }
          setBuildProgress(progress);
        }, 300);
      }, 500);
    }, 2500);
  };
  const toggleAddMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="flex flex-col h-screen overflow-hidden chat-gradient font-sans selection:bg-envitefy-purple/10 selection:text-envitefy-purple">
      {/* Header */}
      <header className="p-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-envitefy-purple rounded-lg flex items-center justify-center shadow-lg shadow-envitefy-purple/20">
            <Sparkles className="text-white" size={18} />
          </div>
          <span className="font-display font-semibold text-lg tracking-tight text-plum">
            Envitefy Chat
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {isWorkspaceActive ? (
            <motion.div
              key="split-workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-full"
            >
              {/* Left Column: Chat */}
              <div className="w-full md:w-[400px] lg:w-[450px] border-r border-lavender-light bg-white/50 backdrop-blur-sm flex flex-col relative z-20">
                <div className="flex-1 overflow-y-auto px-4 py-8 no-scrollbar">
                  <div className="space-y-6 max-w-lg mx-auto">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                         <div 
                          className={`max-w-[90%] px-4 py-3 rounded-2xl shadow-sm ${
                            message.role === 'user' 
                              ? 'bg-envitefy-purple text-white rounded-tr-none' 
                              : 'bg-white border border-lavender-light text-plum rounded-tl-none'
                          }`}
                        >
                          <p className="text-[14px] leading-relaxed font-normal">
                            {message.content}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    {isThinking && (
                      <div className="flex justify-start">
                        <div className="bg-white/80 backdrop-blur-sm border border-lavender-light px-4 py-2 rounded-full flex items-center space-x-2 shadow-sm">
                          <Loader2 size={12} className="animate-spin text-envitefy-purple" />
                          <span className="text-[10px] font-medium text-plum/50">Thinking</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Scoped Composer for Split View */}
                <div className="p-4 bg-white/80 border-t border-lavender-light">
                   <div className="bg-white border border-lavender-medium rounded-2xl shadow-lg flex items-center p-1.5 pl-3">
                    <button onClick={toggleAddMenu} className="p-1.5 text-plum/40 hover:text-plum transition-colors">
                      <Plus size={18} />
                    </button>
                    <input
                      type="text"
                      placeholder="Refine workspace..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 mx-2 text-plum placeholder:text-plum/30 outline-none text-xs bg-transparent"
                    />
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleSendMessage()}
                      disabled={!inputValue.trim()}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        inputValue.trim() ? 'bg-envitefy-purple text-white' : 'bg-lavender-light text-white cursor-not-allowed'
                      }`}
                    >
                      <ArrowUp size={16} />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Right Column: Workspace Dashboard */}
              <div className="flex-1 overflow-y-auto bg-lavender-extralight/20 no-scrollbar">
                <div className="max-w-5xl mx-auto w-full px-6 py-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                      <h2 className="text-xl font-display font-semibold text-plum">Event Workspace</h2>
                      <p className="text-plum/40 text-xs">Lara's 7th Birthday • Cinema & Dinner Party</p>
                    </div>
                    <div className="flex items-center bg-white p-1 rounded-2xl border border-lavender-light shadow-sm">
                      <button 
                        onClick={() => setActiveTab('creative')}
                        className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${activeTab === 'creative' ? 'bg-plum text-white shadow-md' : 'text-plum/50 hover:text-plum'}`}
                      >
                        Creative
                      </button>
                      <button 
                        onClick={() => setActiveTab('guests')}
                        className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${activeTab === 'guests' ? 'bg-plum text-white shadow-md' : 'text-plum/50 hover:text-plum'}`}
                      >
                        Guests & RSVPs
                      </button>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {activeTab === 'creative' ? (
                      <motion.div 
                        key="creative-tab"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                      >
                        {/* Invite Preview */}
                        <div className="lg:col-span-7 bg-white rounded-3xl border border-lavender-light shadow-xl shadow-plum/5 overflow-hidden">
                          <div className="aspect-[4/5] relative bg-lavender-extralight flex items-center justify-center p-8 lg:p-12 overflow-hidden">
                            {generatedFlyerUrl ? (
                              <motion.img 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                src={generatedFlyerUrl} 
                                alt="Generated Party Background"
                                className="absolute inset-0 w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : null}
                            <motion.div 
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              className={`relative z-10 p-8 w-full h-full shadow-2xl rounded-sm border border-plum/5 flex flex-col items-center justify-center text-center ${generatedFlyerUrl ? 'bg-white/90 backdrop-blur-[2px]' : 'bg-white'}`}
                            >
                              <Sparkles className="text-envitefy-purple mb-4" size={24} />
                              <h3 className="font-display text-3xl lg:text-4xl text-plum mb-2 tracking-tight">Lara's 7th</h3>
                              <p className="font-serif italic text-plum/60 mb-6 text-lg lg:text-xl">Cinema & Dinner Party</p>
                              <div className="w-10 h-px bg-plum/10 mb-6" />
                              <p className="text-[10px] tracking-widest uppercase text-plum/40 font-bold mb-1">Saturday, June 15th</p>
                              <p className="text-sm text-plum/60 font-medium tracking-tight">Urban Air Adventures • 4:00 PM</p>
                              <div className="mt-8">
                                <button 
                                  onClick={() => setIsRSVPModalOpen(true)}
                                  className="px-6 py-2 bg-plum text-white text-[11px] font-bold rounded-sm tracking-widest uppercase hover:bg-plum/90 transition-colors"
                                >
                                  RSVP Online
                                </button>
                              </div>
                            </motion.div>
                          </div>
                          <div className="p-5 bg-white flex justify-between items-center border-t border-lavender-light">
                            <span className="text-xs font-semibold text-plum/60">Digital Flyer Design</span>
                            <div className="flex space-x-2">
                              <button 
                                onClick={generateFlyerVisual}
                                disabled={isGeneratingImage}
                                className="text-[11px] font-bold text-envitefy-purple flex items-center"
                              >
                                {isGeneratingImage ? <Loader2 size={12} className="animate-spin mr-1" /> : <Sparkles size={12} className="mr-1" />}
                                {generatedFlyerUrl ? "Regenerate" : "AI Graphic"}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Right Rail */}
                        <div className="lg:col-span-5 space-y-6">
                          <div className="bg-white p-6 rounded-3xl border border-lavender-light shadow-sm">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                                <Sparkles size={14} className="text-green-600" />
                              </div>
                              <h4 className="text-xs font-bold text-plum">AI Recommendations</h4>
                            </div>
                            <div className="space-y-3">
                              <button className="w-full p-3 bg-lavender-extralight text-left rounded-xl hover:bg-lavender-light transition-colors group">
                                <p className="text-[11px] font-bold text-plum">Enable "Cat Theme" RSVP buttons?</p>
                                <span className="text-[10px] text-plum/50">Add custom illustrations for button states.</span>
                              </button>
                              <button className="w-full p-3 bg-lavender-extralight text-left rounded-xl hover:bg-lavender-light transition-colors group">
                                <p className="text-[11px] font-bold text-plum">Generate Gift Registry card?</p>
                                <span className="text-[10px] text-plum/50">Link your Target list automatically.</span>
                              </button>
                            </div>
                          </div>
                          <button className="w-full py-4 bg-plum text-white text-[11px] font-bold rounded-3xl shadow-xl shadow-plum/20 uppercase tracking-widest">
                            Continue to Publishing
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="guests-tab"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-6"
                      >
                        {/* Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { label: "Invites Sent", val: "12", sub: "Via Email" },
                            { label: "Attending", val: "8", sub: "Confirmed" },
                            { label: "Pending", val: "4", sub: "Opened email" },
                          ].map((stat, i) => (
                            <div key={i} className="bg-white p-5 rounded-3xl border border-lavender-light shadow-sm">
                              <div className="text-[10px] uppercase tracking-widest text-plum/30 font-bold mb-1">{stat.label}</div>
                              <div className="text-2xl font-display font-semibold text-plum">{stat.val}</div>
                              <div className="text-[10px] text-plum/40">{stat.sub}</div>
                            </div>
                          ))}
                        </div>

                        {/* Guest List Table */}
                        <div className="bg-white rounded-3xl border border-lavender-light shadow-sm overflow-hidden">
                          <div className="p-6 border-b border-lavender-light flex items-center justify-between">
                            <h3 className="text-sm font-bold text-plum">RSVP Management</h3>
                            <button className="px-4 py-2 bg-envitefy-purple text-white text-[10px] font-bold rounded-full">
                              + Import Emails
                            </button>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="bg-lavender-extralight/30">
                                  <th className="px-6 py-4 text-[10px] font-bold text-plum/40 uppercase tracking-wider">Email Address</th>
                                  <th className="px-6 py-4 text-[10px] font-bold text-plum/40 uppercase tracking-wider">Delivery Status</th>
                                  <th className="px-6 py-4 text-[10px] font-bold text-plum/40 uppercase tracking-wider">Response</th>
                                  <th className="px-6 py-4 text-[10px] font-bold text-plum/40 uppercase tracking-wider">Last Activity</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-lavender-light">
                                {[
                                  { email: "sarah.jones@gmail.com", status: "Delivered", rsvp: "Attending", time: "2h ago" },
                                  { email: "mike88@outlook.com", status: "Opened", rsvp: "Pending", time: "5h ago" },
                                  { email: "nina.smith@tech.co", status: "Delivered", rsvp: "Declined", time: "1d ago" },
                                  { email: "the.davises@me.com", status: "Delivered", rsvp: "Attending", time: "3h ago" },
                                  { email: "j.parker@edu.com", status: "Sent", rsvp: "Pending", time: "12m ago" },
                                ].map((item, i) => (
                                  <tr key={i} className="hover:bg-lavender-extralight/20 transition-colors">
                                    <td className="px-6 py-4 text-xs font-medium text-plum">{item.email}</td>
                                    <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide ${
                                        item.status === 'Opened' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                                      }`}>
                                        {item.status}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide ${
                                        item.rsvp === 'Attending' ? 'bg-envitefy-purple/10 text-envitefy-purple' : 
                                        item.rsvp === 'Declined' ? 'bg-pink-50 text-pink-500' : 'bg-lavender-light text-plum/40'
                                      }`}>
                                        {item.rsvp}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-[10px] text-plum/40">{item.time}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="max-w-2xl mx-auto w-full pt-8 pb-48">
              <AnimatePresence mode="wait">
                {messages.length === 0 ? (
                  <motion.div 
                    key="empty-state"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center justify-center min-h-[50vh] text-center px-6"
                  >
                    <h1 className="text-4xl md:text-5xl font-display font-medium text-plum mb-10 tracking-tight">
                      Where should we begin?
                    </h1>
                    
                    <div className="flex flex-wrap justify-center gap-2 max-w-lg lg:max-w-xl">
                      {starterChips.map((chip, index) => (
                        <motion.button
                          key={chip.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                          onClick={() => handleSendMessage(chip.label)}
                          className="inline-flex items-center px-5 py-2.5 bg-white border border-lavender-light rounded-full text-sm font-medium text-plum/70 hover:text-envitefy-purple hover:border-envitefy-purple/30 hover:bg-lavender-extralight transition-all duration-200 shadow-sm active:scale-95"
                        >
                          {chip.icon}
                          {chip.label}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-6 px-4">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.type === 'upload_status' ? (
                          <div className="bg-white/80 backdrop-blur-sm border border-lavender-light px-4 py-2 rounded-full flex items-center space-x-2 shadow-sm">
                            <Loader2 size={14} className="animate-spin text-envitefy-purple" />
                            <span className="text-xs font-medium text-plum/50">{message.content}</span>
                          </div>
                        ) : (
                          <div 
                            className={`max-w-[85%] px-5 py-3.5 rounded-2xl shadow-sm ${
                              message.role === 'user' 
                                ? 'bg-envitefy-purple text-white rounded-tr-none' 
                                : 'bg-white border border-lavender-light text-plum rounded-tl-none'
                            }`}
                          >
                            <p className="text-[15px] leading-relaxed font-normal">
                              {message.content}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {isThinking && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="bg-white/80 backdrop-blur-sm border border-lavender-light px-4 py-2 rounded-full flex items-center space-x-2 shadow-sm">
                          <Loader2 size={14} className="animate-spin text-envitefy-purple" />
                          <span className="text-xs font-medium text-plum/50">Thinking</span>
                        </div>
                      </motion.div>
                    )}

                    {!isThinking && !isBuildingWorkspace && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-wrap gap-2 pt-2"
                      >
                        {['Sounds good', 'I have a theme', 'Not sure yet'].map((reply, i) => (
                          <button 
                            key={i}
                            onClick={() => handleSendMessage(reply)}
                            className="px-3 py-1.5 bg-lavender-light/30 border border-lavender-light rounded-lg text-xs font-medium text-envitefy-purple hover:bg-lavender-light/50 transition-colors"
                          >
                            {reply}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Composer Area (Only visible when Workspace is NOT active, as a separate composer exists in split view) */}
      {!isWorkspaceActive && (
        <div className="fixed bottom-0 left-0 right-0 p-6 md:p-10 flex flex-col items-center pointer-events-none z-30">
          
          {/* Expanded Add Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="mb-4 bg-white rounded-2xl border border-lavender-light shadow-xl shadow-plum/5 p-2 w-[280px] pointer-events-auto"
              >
                {[
                  { icon: <Upload size={18} />, label: "Upload invite", desc: "Use an existing flyer or card", color: "bg-blue-50 text-blue-600", action: handleUploadClick },
                  { icon: <CreditCard size={18} />, label: "Live Card", desc: "Mobile event card with RSVP", color: "bg-purple-50 text-purple-600", action: () => handleSendMessage("Tell me about Live Cards") },
                  { icon: <Mail size={18} />, label: "Digital Flyer", desc: "Shareable poster-style invite", color: "bg-pink-50 text-pink-600", action: () => handleSendMessage("Tell me about Digital Flyers") },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={item.action}
                    className="w-full flex items-start space-x-3 p-3 hover:bg-lavender-extralight rounded-xl transition-colors text-left"
                  >
                    <div className={`p-2 rounded-lg ${item.color}`}>
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-plum">{item.label}</div>
                      <div className="text-[12px] text-plum/50">{item.desc}</div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full max-w-2xl relative pointer-events-auto">
            <div className="bg-white border border-lavender-medium rounded-[32px] shadow-2xl shadow-plum/5 flex items-center p-1.5 pl-4 ring-4 ring-white">
              <button 
                onClick={toggleAddMenu}
                className={`p-2 rounded-full transition-all duration-200 ${isMenuOpen ? 'bg-plum text-white rotate-45' : 'bg-lavender-extralight text-plum/60 hover:text-plum hover:bg-lavender-light'}`}
              >
                <Plus size={20} />
              </button>
              <input
                type="text"
                placeholder="Ask anything"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 mx-3 text-plum placeholder:text-plum/30 outline-none text-[15px] focus:ring-0 bg-transparent"
              />
              <div className="flex items-center space-x-2">
                <button className="p-2 text-plum/40 hover:text-envitefy-purple transition-colors">
                  <Mic size={20} />
                </button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim()}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    inputValue.trim() 
                      ? 'bg-envitefy-purple text-white shadow-lg shadow-envitefy-purple/30' 
                      : 'bg-lavender-light text-white cursor-not-allowed'
                  }`}
                >
                  <ArrowUp size={20} strokeWidth={2.5} />
                </motion.button>
              </div>
            </div>
          </div>
          <p className="mt-4 text-[11px] font-medium text-plum/30 uppercase tracking-widest pointer-events-auto">
            Envitefy Concierge AI • Beta
          </p>
        </div>
      )}


      {/* Decorative Blur Orbs */}
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-envitefy-purple/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-envitefy-indigo/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Building Workspace Overlay */}
      <AnimatePresence>
        {isBuildingWorkspace && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="max-w-md w-full"
            >
              <div className="mb-10 relative inline-block">
                <div className="w-24 h-24 bg-envitefy-purple rounded-3xl rotate-12 flex items-center justify-center shadow-2xl shadow-envitefy-purple/40">
                  <Sparkles className="text-white" size={40} />
                </div>
                <motion.div 
                  className="absolute -top-2 -right-2 w-8 h-8 bg-plum rounded-full flex items-center justify-center border-4 border-white shadow-lg"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                >
                  <Plus size={16} className="text-white" />
                </motion.div>
              </div>

              <h2 className="text-3xl font-display font-medium text-plum mb-2">
                {buildProgress === 100 ? "Ready to launch!" : "Building your workspace"}
              </h2>
              <p className="text-plum/50 text-sm mb-12">
                {buildProgress === 100 ? "Your custom dashboard is ready." : "Crafting your custom event experience with AI"}
              </p>

              <div className="space-y-6">
                {/* Progress Bar Container */}
                <div className="h-1.5 w-full bg-lavender-light rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-envitefy-purple"
                    initial={{ width: "0%" }}
                    animate={{ width: `${buildProgress}%` }}
                    transition={{ ease: "easeInOut" }}
                  />
                </div>

                <div className="flex flex-col items-center">
                  <AnimatePresence mode="wait">
                    {buildProgress === 100 ? (
                       <motion.div
                        key="done"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center space-x-2 text-green-600 font-bold"
                      >
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Plus size={14} className="text-white rotate-45" />
                        </div>
                        <span>Workspace Finalized</span>
                      </motion.div>
                    ) : ( 
                      <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center space-x-3"
                      >
                        <Loader2 className="animate-spin text-envitefy-purple" size={16} />
                        <span className="text-[15px] font-medium text-plum/80">{buildingSteps[currentStep]}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* RSVP Modal Overlay */}
      <AnimatePresence>
        {isRSVPModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-plum/40 backdrop-blur-md flex items-center justify-center p-6 pointer-events-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white max-w-sm w-full rounded-[32px] shadow-2xl overflow-hidden shadow-plum/20"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-display font-semibold text-plum">RSVP to Lara's 7th</h3>
                    <p className="text-plum/50 text-xs">Confirm your attendance</p>
                  </div>
                  <button onClick={() => setIsRSVPModalOpen(false)} className="p-2 hover:bg-lavender-extralight rounded-full transition-colors">
                    <X size={20} className="text-plum/30" />
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {rsvpSubmitted ? (
                    <motion.div 
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-10 text-center"
                    >
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="text-green-600" size={32} />
                      </div>
                      <h4 className="text-lg font-bold text-plum">Response Received!</h4>
                      <p className="text-sm text-plum/50">We've updated the guest list.</p>
                    </motion.div>
                  ) : (
                    <motion.form 
                      key="form"
                      onSubmit={handleRSVPSubmit}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-[10px] font-bold text-plum uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                        <input 
                          required
                          type="text" 
                          value={rsvpForm.name}
                          onChange={e => setRsvpForm({...rsvpForm, name: e.target.value})}
                          placeholder="Enter attendee name"
                          className="w-full px-4 py-3 bg-lavender-extralight border border-lavender-light rounded-2xl text-sm outline-none focus:border-envitefy-purple transition-colors" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-plum uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                        <input 
                          required
                          type="email" 
                          value={rsvpForm.email}
                          onChange={e => setRsvpForm({...rsvpForm, email: e.target.value})}
                          placeholder="hello@example.com"
                          className="w-full px-4 py-3 bg-lavender-extralight border border-lavender-light rounded-2xl text-sm outline-none focus:border-envitefy-purple transition-colors" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-plum uppercase tracking-widest mb-1.5 ml-1">Will you attend?</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['yes', 'maybe', 'no'].map(status => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => setRsvpForm({...rsvpForm, status})}
                              className={`py-2 text-[10px] font-bold uppercase rounded-xl border transition-all ${
                                rsvpForm.status === status 
                                  ? 'bg-envitefy-purple border-envitefy-purple text-white shadow-lg shadow-envitefy-purple/20' 
                                  : 'bg-white border-lavender-light text-plum/40 hover:border-lavender-medium'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button 
                        type="submit"
                        className="w-full mt-4 py-4 bg-plum text-white text-[11px] font-bold rounded-2xl shadow-xl shadow-plum/10 uppercase tracking-widest"
                      >
                        Submit Response
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

