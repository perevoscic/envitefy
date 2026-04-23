import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Calendar, Download, Sparkles, ArrowLeft, MessageSquare, CalendarPlus, ChevronRight } from 'lucide-react';
import { EventData } from '../services/geminiService';

interface SkinProps {
  data: EventData;
  image: string;
  onReset: () => void;
  showCalendarMenu: boolean;
  setShowCalendarMenu: (show: boolean) => void;
  getGoogleCalendarUrl: () => string;
  getOutlookWebUrl: () => string;
  downloadIcs: () => void;
}

export function FormalSkin({ data, image, onReset, showCalendarMenu, setShowCalendarMenu, getGoogleCalendarUrl, getOutlookWebUrl, downloadIcs }: SkinProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white font-mono p-6 md:p-12 text-ink selection:bg-ink selection:text-white"
    >
      {/* Brutalist Header */}
      <div className="max-w-6xl mx-auto border-b-2 border-ink pb-12 mb-12 flex flex-col md:flex-row justify-between items-end gap-8">
        <div className="space-y-4">
          <button 
            onClick={onReset}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:line-through transition-all"
          >
            <ArrowLeft className="w-3 h-3" /> Back
          </button>
          <div className="text-[12px] font-bold uppercase tracking-[0.5em] opacity-30">
            {data.eventType} // event.portal.v1
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase leading-none tracking-tighter">
            {data.names}
          </h1>
        </div>
        <div className="text-right hidden md:block">
          <div className="text-sm font-bold opacity-30">[ {data.date} ]</div>
          <div className="text-sm font-bold opacity-30">{data.time}</div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-0 border-2 border-ink">
        {/* Technical Data Column */}
        <div className="lg:col-span-4 border-r-2 border-ink p-10 space-y-12 bg-gray-50">
          <TechnicalItem label="Schedule" value={data.date} subValue={data.time} />
          <TechnicalItem label="Coordinate" value={data.location} subValue="Physical Access Point" />
          
          {data.rsvp && (
            <TechnicalItem label="Registry" value={data.rsvp.contact} subValue={data.rsvp.phone || 'Contact Required'} />
          )}

          <div className="pt-12 border-t border-ink/10 flex flex-col gap-4">
            <button 
              onClick={() => setShowCalendarMenu(true)}
              className="w-full flex items-center justify-between p-6 bg-ink text-white hover:invert transition-all group"
            >
              <span className="text-[10px] font-black uppercase tracking-widest">Sync Calendar</span>
              <CalendarPlus className="w-4 h-4" />
            </button>
            <a 
              href={data.rsvp?.phone ? `tel:${data.rsvp.phone.replace(/\D/g, '')}` : '#'}
              className="w-full flex items-center justify-between p-6 border-2 border-ink hover:bg-ink hover:text-white transition-all group"
            >
              <span className="text-[10px] font-black uppercase tracking-widest">Execute RSVP</span>
              <MessageSquare className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Scan Column */}
        <div className="lg:col-span-8 p-1 relative min-h-[400px]">
          <div className="absolute top-8 left-8 z-10 flex gap-2">
            <div className="px-3 py-1 bg-ink text-white text-[8px] font-black uppercase tracking-widest">Raw Scan</div>
            <div className="px-3 py-1 bg-white border border-ink text-ink text-[8px] font-black uppercase tracking-widest">Verified Content</div>
          </div>
          <img 
            src={image} 
            className="w-full h-full object-cover filter contrast-125 brightness-95" 
            alt="Source Flyer" 
          />
        </div>
      </div>

      {/* Brutalist Footer */}
      <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-ink/10 flex justify-between items-center opacity-30 grayscale origin-left transition-all hover:grayscale-0 hover:opacity-100">
        <div className="text-[10px] font-black tracking-widest uppercase">
          ENVITEFY.OS // {new Date().getFullYear()}
        </div>
        <Sparkles className="w-4 h-4" />
      </div>

      {/* Reuse Calendar Menu with Brutalist styling */}
      <AnimatePresence>
        {showCalendarMenu && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCalendarMenu(false)}
              className="absolute inset-0 bg-white/90 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className="relative w-full max-w-sm bg-white border-4 border-ink p-10 shadow-[20px_20px_0px_#000]"
            >
              <h3 className="text-xl font-black uppercase tracking-tighter mb-8 italic">Choose Protocol:</h3>
              <div className="space-y-2">
                {[
                  { label: 'Google.api', url: getGoogleCalendarUrl() },
                  { label: 'Outlook.vcal', url: getOutlookWebUrl() },
                  { label: 'Apple.ics', onClick: downloadIcs }
                ].map((btn) => (
                  <a 
                    key={btn.label}
                    href={btn.url}
                    onClick={btn.onClick || (() => setShowCalendarMenu(false))}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full p-6 border-2 border-ink font-black uppercase tracking-widest text-[10px] hover:bg-ink hover:text-white transition-all flex justify-between items-center"
                  >
                    {btn.label}
                    <ChevronRight className="w-3 h-3" />
                  </a>
                ))}
              </div>
              <button 
                onClick={() => setShowCalendarMenu(false)}
                className="mt-8 text-[8px] font-black uppercase tracking-widest hover:line-through"
              >
                [ Abort ]
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TechnicalItem({ label, value, subValue }: { label: string, value: string, subValue: string }) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 select-none">{label}</div>
      <div className="text-2xl font-black leading-tight uppercase tracking-tighter">{value}</div>
      <div className="text-[12px] font-bold opacity-50">{subValue}</div>
    </div>
  );
}
