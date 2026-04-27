import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Calendar, Clock, Download, Share2, Sparkles, MessageSquare, CalendarPlus } from 'lucide-react';
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

export function WeddingSkin({ 
  data, image, onReset, showCalendarMenu, setShowCalendarMenu, 
  getGoogleCalendarUrl, getOutlookWebUrl, downloadIcs 
}: SkinProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-8"
    >
      {/* Premium Header */}
      <div className="relative min-h-[50vh] md:min-h-[65vh] overflow-hidden flex items-center justify-center text-center p-6 py-20">
        <div 
          className="absolute inset-0 z-0 opacity-10 bg-cover bg-center grayscale scale-110"
          style={{ backgroundImage: `url(${image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#fafaf9]/50 to-[#fafaf9] z-1" />
        
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 max-w-4xl"
        >
          <h1 className="text-5xl md:text-8xl serif leading-[0.95] md:leading-[0.9] tracking-tighter mb-12 px-4 italic underline decoration-gold/20 underline-offset-[1.5rem] text-ink">
            {data.names.split('&').map((name, i) => (
              <span key={name} className="block">
                {name.trim()}
                {i === 0 && <span className="inline-block text-2xl md:text-4xl mx-3 italic font-light lowercase opacity-30 align-middle">&</span>}
              </span>
            ))}
          </h1>
        </motion.div>

      </div>

      <div className="max-w-7xl mx-auto px-6 pt-3 grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12 text-ink">
        {/* Left Column: Image and Main Info */}
        <div className="lg:col-span-8 space-y-16">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-16 shadow-2xl shadow-ink/5 border border-ink/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#F3F2EE] rounded-bl-full -mr-16 -mt-16 opacity-50" />
             <div className="flex flex-col md:flex-row gap-12 items-start relative z-10">
               <div className="flex-1 space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-12">
                      <DetailItem icon={<Calendar className="w-5 h-5 text-gold" />} label="When" title={data.date} />
                      <DetailItem icon={<Clock className="w-5 h-5 text-gold" />} label="At" title={data.time} />
                    </div>
                    <DetailItem icon={<MapPin className="w-5 h-5 text-gold" />} label="Where" title="The Venue" subtitle={data.location} />
                  </div>
                  
                  <div className="pt-12 border-t border-ink/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-8">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold mb-10">Event Schedule</h3>
                        <TimelineItem time={data.time} event="Wedding Ceremony" />
                        <TimelineItem time="Following" event="Reception" />
                      </div>
                      {data.rsvp && (
                        <div className="space-y-4">
                          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold mb-10">Kindly RSVP</h3>
                          <div className="serif text-2xl">{data.rsvp.contact}</div>
                          {data.rsvp.phone && <div className="text-sm opacity-50 font-light">{data.rsvp.phone}</div>}
                        </div>
                      )}
                    </div>
                  </div>
               </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ActionButton 
              title="Save Event" 
              subtitle="Sync to calendar" 
              icon={<CalendarPlus className="w-6 h-6 text-gold" />} 
              onClick={() => setShowCalendarMenu(true)}
            />
            <ActionButton 
              title="Concierge" 
              subtitle="Map and access" 
              icon={<MapPin className="w-6 h-6 text-gold" />} 
              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.location)}`, '_blank')}
            />
            <a 
              href={data.rsvp?.phone ? `tel:${data.rsvp.phone.replace(/\D/g, '')}` : '#'}
              className="group w-full bg-white p-8 rounded-[2rem] border border-ink/5 text-left hover:border-ink transition-all shadow-sm hover:shadow-2xl"
            >
              <div className="w-14 h-14 bg-[#F3F2EE] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-ink group-hover:text-cream transition-all">
                <MessageSquare className="w-6 h-6 text-gold" />
              </div>
              <div className="font-bold text-xs uppercase tracking-widest mb-1">RSVP Now</div>
              <div className="text-[10px] uppercase tracking-widest opacity-40">Confirm attendance</div>
            </a>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-4 lg:sticky lg:top-12 self-start h-fit">
          <div className="group relative">
            <div className="absolute -inset-6 bg-[#F3F2EE] rounded-[3rem] -z-1 opacity-50 blur-xl" />
            <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-ink/10 overflow-hidden border border-ink/5">
               <img src={image} alt="Invite" className="w-full h-auto rounded-[2rem]" />
               <div className="mt-8 flex items-center justify-between px-2 pb-2">
                 <div className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-30">Digital Keepsake</div>
                 <Share2 className="w-4 h-4 opacity-50" />
               </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCalendarMenu && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCalendarMenu(false)}
              className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-gold mb-8">Select Calendar</h3>
              <div className="space-y-3">
                <CalendarButton label="Google Calendar" url={getGoogleCalendarUrl()} onClick={() => setShowCalendarMenu(false)} />
                <CalendarButton label="Outlook Web" url={getOutlookWebUrl()} onClick={() => setShowCalendarMenu(false)} />
                <button onClick={downloadIcs} className="w-full flex items-center gap-4 p-5 hover:bg-[#F3F2EE] rounded-2xl transition-all border border-transparent hover:border-ink/5">
                  <span className="text-xs font-bold uppercase tracking-widest">Apple Calendar</span>
                </button>
              </div>
              <button 
                onClick={() => setShowCalendarMenu(false)}
                className="mt-8 w-full py-4 text-[10px] uppercase tracking-widest font-bold opacity-30"
              >
                Dismiss
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mt-16 pb-8 text-center opacity-20">
        <div className="w-12 h-[1px] bg-ink mx-auto mb-6" />
        <div className="text-[10px] font-black tracking-[0.5em] uppercase">SNAPPED BY ENVITEFY</div>
      </div>
    </motion.div>
  );
}

function DetailItem({ icon, label, title, subtitle }: any) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 opacity-20">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">{label}</span>
      </div>
      <div className="text-3xl serif leading-tight">{title}</div>
      {subtitle && <div className="text-sm opacity-50 lowercase-first tracking-tight leading-relaxed font-light">{subtitle}</div>}
    </div>
  );
}

function TimelineItem({ time, event }: any) {
  return (
    <div className="flex gap-8 items-center group">
      <div className="w-24 text-[10px] font-extrabold opacity-10 uppercase tracking-[0.4em] group-hover:text-gold transition-colors">{time}</div>
      <div className="flex-1 text-lg serif border-l border-ink/5 pl-8 py-2 group-hover:border-gold transition-colors">{event}</div>
    </div>
  );
}

function ActionButton({ title, subtitle, icon, onClick }: any) {
  return (
    <button onClick={onClick} className="group w-full bg-white p-8 rounded-[2rem] border border-ink/5 text-left hover:border-ink transition-all shadow-sm hover:shadow-2xl">
      <div className="w-14 h-14 bg-[#F3F2EE] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-ink group-hover:text-cream transition-all">{icon}</div>
      <div className="font-bold text-xs uppercase tracking-widest mb-1">{title}</div>
      <div className="text-[10px] uppercase tracking-widest opacity-40">{subtitle}</div>
    </button>
  );
}

function CalendarButton({ label, url, onClick }: any) {
  return (
    <a href={url} target="_blank" rel="noreferrer" onClick={onClick} className="flex items-center gap-4 p-5 hover:bg-[#F3F2EE] rounded-2xl transition-all border border-transparent hover:border-ink/5">
      <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
    </a>
  );
}
