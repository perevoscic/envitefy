/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  MapPin, 
  Calendar, 
  Clock, 
  Sparkles, 
  ArrowLeft, 
  Download, 
  Share2,
  Trash2,
  ChevronRight,
  Heart
} from 'lucide-react';
import { extractEventData, EventData } from './services/geminiService';
import { WeddingSkin } from './components/WeddingSkin';
import { SampleBirthdaySkin } from './components/SampleBirthdaySkin';
import { FormalSkin } from './components/FormalSkin';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EventData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImage(base64);
      setLoading(true);
      const extractedData = await extractEventData(base64);
      setData(extractedData);
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setImage(null);
    setData(null);
    setLoading(false);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-cream selection:bg-gold/20">
      <AnimatePresence mode="wait">
        {!data ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center min-h-screen p-8 text-center"
          >
            <div className="max-w-xl w-full">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-12"
              >
                <div className="w-12 h-12 bg-white border border-ink/5 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                  <Sparkles className="w-5 h-5 text-ink" />
                </div>
                <h1 className="text-5xl md:text-6xl tracking-tight serif mb-4 uppercase text-ink">Ethereal<br/>Invitations</h1>
                <p className="text-neutral-500 text-base font-light tracking-wide max-w-md mx-auto">Upload your physical invitation to generate a digitally synchronized event portal.</p>
              </motion.div>

              <button
                id="upload-button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative w-full aspect-[4/3] md:aspect-[21/9] bg-[#F3F2EE] border border-black/5 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:shadow-2xl transition-all duration-500 overflow-hidden"
              >
                <div className="absolute top-6 left-6 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-neutral-300"></div>
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-30 text-ink">Waiting for payload</span>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-sm">
                    <Upload className="w-5 h-5 text-neutral-400 group-hover:text-ink" />
                  </div>
                  <span className="text-xs uppercase tracking-[0.2em] font-semibold text-neutral-400 group-hover:text-ink">Scan Invitation</span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
              </button>
            </div>
          </motion.div>
        ) : (
          <EventPage data={data} image={image!} onReset={reset} />
        )}
      </AnimatePresence>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-8 text-center">
      <motion.div
        animate={{ 
          scale: [1, 1.05, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="w-20 h-20 bg-[#F3F2EE] border border-ink/5 rounded-full flex items-center justify-center mb-8 shadow-sm"
      >
        <Sparkles className="w-8 h-8 text-ink" />
      </motion.div>
      <h2 className="serif text-3xl mb-3 italic gold-accent">Synthesizing Mood</h2>
      <p className="text-neutral-400 text-[10px] uppercase tracking-[0.3em] max-w-xs leading-relaxed">Reading context and adapting UI skin...</p>
    </div>
  );
}

function EventPage({ data, image, onReset }: { data: EventData, image: string, onReset: () => void }) {
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getGoogleCalendarUrl = () => {
    const { title, startIso, endIso, location } = data.calendarData;
    const start = startIso.replace(/[-:]/g, '').split('.')[0] + 'Z';
    const end = endIso.replace(/[-:]/g, '').split('.')[0] + 'Z';
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&location=${encodeURIComponent(location)}`;
  };

  const getOutlookWebUrl = () => {
    const { title, startIso, endIso, location } = data.calendarData;
    return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodeURIComponent(title)}&startdt=${startIso}&enddt=${endIso}&location=${encodeURIComponent(location)}`;
  };

  const downloadIcs = () => {
    const { title, startIso, endIso, location } = data.calendarData;
    const start = startIso.replace(/[-:]/g, '').split('.')[0] + 'Z';
    const end = endIso.replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${title}`,
      `LOCATION:${location}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'event.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowCalendarMenu(false);
  };

  const themeStyle = {
    '--theme-primary': data.colors.primary,
    '--theme-secondary': data.colors.secondary,
    '--theme-accent': data.colors.accent,
    '--theme-background': data.colors.background,
    '--theme-text': data.colors.text,
  } as React.CSSProperties;

  const skinProps = {
    data, image, onReset, showCalendarMenu, setShowCalendarMenu, 
    getGoogleCalendarUrl, getOutlookWebUrl, downloadIcs
  };

  return (
    <div style={themeStyle}>
      {data.eventType === 'birthday' ? (
        <SampleBirthdaySkin {...skinProps} />
      ) : data.eventType === 'wedding' ? (
        <WeddingSkin {...skinProps} />
      ) : (
        <FormalSkin {...skinProps} />
      )}
    </div>
  );
}
