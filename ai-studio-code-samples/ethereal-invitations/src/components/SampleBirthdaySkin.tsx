import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Calendar, Clock, Download, Sparkles, ArrowLeft, MessageSquare, CalendarPlus, Phone } from 'lucide-react';
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

export function SampleBirthdaySkin({ data, image, onReset, showCalendarMenu, setShowCalendarMenu, getGoogleCalendarUrl, getOutlookWebUrl, downloadIcs }: SkinProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-4 md:p-8 font-sans"
      style={{ backgroundColor: 'var(--theme-background)' }}
    >
      {/* Playful Floating Header */}
      <div className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row items-center justify-between gap-8 pt-12 relative">
        <button 
          onClick={onReset}
          className="absolute -top-4 left-0 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50 text-ink"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex-1 text-center md:text-left space-y-4">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: -5 }}
            className="inline-block px-6 py-2 rounded-full text-white text-[10px] font-black tracking-[0.3em] uppercase shadow-lg"
            style={{ backgroundColor: 'var(--theme-accent)', boxShadow: '0 10px 20px -5px var(--theme-accent)' }}
          >
            Birthday Bash!
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-6xl md:text-8xl font-black tracking-tight leading-none lowercase"
            style={{ color: 'var(--theme-text)' }}
          >
            {data.names}
          </motion.h1>
        </div>

        {/* Sticker Preview */}
        <motion.div 
          whileHover={{ rotate: 5, scale: 1.05 }}
          className="relative w-full max-w-[300px] aspect-[3/4] bg-white p-3 rounded-[2.5rem] shadow-2xl rotate-3 border-8 border-white group"
        >
          <div 
            className="absolute -top-4 -right-4 w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl z-10 animate-bounce"
            style={{ backgroundColor: 'var(--theme-primary)' }}
          >
            <Sparkles className="w-8 h-8" />
          </div>
          <img src={image} className="w-full h-full object-cover rounded-[1.8rem] transition-all duration-700" alt="Invite" />
        </motion.div>
      </div>

      {/* Bento Grid Layout */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Main Info Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 bg-white rounded-[3rem] p-10 shadow-xl border border-ink/5 flex flex-col justify-between group hover:shadow-2xl transition-shadow"
        >
          <div className="space-y-8">
            <div className="flex items-center gap-6">
              <div 
                className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ backgroundColor: 'var(--theme-primary)', opacity: 0.2, color: 'var(--theme-primary)' }}
              >
                <Calendar className="w-8 h-8" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-30">When</div>
                <div className="text-3xl font-bold">{data.date}</div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div
                className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ backgroundColor: 'var(--theme-secondary)', opacity: 0.2, color: 'var(--theme-secondary)' }}
              >
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-30">At</div>
                <div className="text-3xl font-bold">{data.time}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div 
                className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ backgroundColor: 'var(--theme-accent)', opacity: 0.2, color: 'var(--theme-accent)' }}
              >
                <MapPin className="w-8 h-8" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-30">The Spot</div>
                <div className="text-3xl font-bold">Party Location</div>
                <div className="text-lg opacity-50 truncate max-w-[200px]">{data.location}</div>
              </div>
            </div>

            {data.rsvp && (
              <div className="flex items-center gap-6 pt-6 border-t border-ink/5">
                <div 
                  className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: 'var(--theme-secondary)', opacity: 0.2, color: 'var(--theme-secondary)' }}
                >
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-30">RSVP to</div>
                  <div className="text-2xl font-bold">{data.rsvp.contact}</div>
                  {data.rsvp.phone && <div className="text-lg opacity-50">{data.rsvp.phone}</div>}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.location)}`, '_blank')}
            className="mt-12 w-full py-6 text-white rounded-[2rem] font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all text-sm"
            style={{ backgroundColor: 'var(--theme-text)' }}
          >
            Get Directions
          </button>
        </motion.div>

        {/* Action Cards */}
        <div className="md:col-span-2 grid grid-cols-2 gap-6">
          <motion.button 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            onClick={() => setShowCalendarMenu(true)}
            className="p-8 rounded-[3rem] text-white flex flex-col items-center justify-center gap-4 hover:scale-105 transition-transform"
            style={{ backgroundColor: 'var(--theme-primary)' }}
          >
            <CalendarPlus className="w-10 h-10" />
            <span className="font-bold uppercase tracking-tighter text-sm">Save to Calendar</span>
          </motion.button>

          <motion.a 
            href={data.rsvp?.phone ? `tel:${data.rsvp.phone.replace(/\D/g, '')}` : '#'}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="p-8 rounded-[3rem] text-white flex flex-col items-center justify-center gap-4 hover:scale-105 transition-transform cursor-pointer"
            style={{ backgroundColor: 'var(--theme-secondary)' }}
          >
            <MessageSquare className="w-10 h-10" />
            <span className="font-bold uppercase tracking-tighter text-sm">RSVP Now</span>
          </motion.a>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="col-span-2 bg-white/50 p-10 rounded-[3rem] border border-ink/5 flex items-center justify-between group backdrop-blur-sm shadow-sm"
          >
            <div className="space-y-1">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-30">Plan of Action</div>
              <div className="text-2xl font-bold">Games, Food & Fun!</div>
            </div>
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg group-hover:scale-125 transition-transform bg-white"
              style={{ color: 'var(--theme-primary)' }}
            >
              <Sparkles className="w-6 h-6" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Calendar Modal Redesign for Birthday */}
      <AnimatePresence>
        {showCalendarMenu && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCalendarMenu(false)}
              className="absolute inset-0 bg-ink/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.5, y: 100, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.5, y: 100, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-[3.5rem] p-10 text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-gold/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-gold">
                <Calendar className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold mb-8">Ready to Party?</h3>
              <div className="space-y-4">
                {[
                  { label: 'Google', url: getGoogleCalendarUrl(), color: 'bg-blue-500' },
                  { label: 'Outlook', url: getOutlookWebUrl(), color: 'bg-sky-500' },
                  { label: 'ICS File', onClick: downloadIcs, color: 'bg-ink' }
                ].map((btn) => (
                  <a 
                    key={btn.label}
                    href={btn.url}
                    onClick={btn.onClick || (() => setShowCalendarMenu(false))}
                    target="_blank"
                    rel="noreferrer"
                    className={`block w-full py-5 ${btn.color} text-white rounded-[1.8rem] font-bold uppercase tracking-widest text-xs hover:scale-105 transition-transform`}
                  >
                    {btn.label}
                  </a>
                ))}
              </div>
              <button 
                onClick={() => setShowCalendarMenu(false)}
                className="mt-8 font-bold uppercase tracking-widest text-[10px] opacity-30 hover:opacity-100 transition-opacity"
              >
                Maybe later
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mt-20 pb-8 text-center opacity-20 hover:opacity-50 transition-opacity">
        <div className="w-8 h-[1px] bg-ink mx-auto mb-4" />
        <div className="text-[10px] font-black tracking-[0.5em] uppercase">SNAPPED BY ENVITEFY</div>
      </div>
    </motion.div>
  );
}
