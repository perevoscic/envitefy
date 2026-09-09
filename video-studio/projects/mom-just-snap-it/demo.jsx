import React from 'react';
import {createRoot} from 'react-dom/client';
import BirthdaySkin from '../../../src/components/BirthdaySkin';
import EventGuestActions from '../../../src/components/event-templates/EventGuestActions';
import {buildCalendarLinks} from '../../../src/utils/calendar-links';
import SnapLaunchCards from '../../../src/app/event/SnapLaunchCards';
const title="Mia's 8th Birthday";
const location='Maple Park, 820 W 7th Street, Austin, TX';
const links=buildCalendarLinks({title,description:'Cake, games and birthday fun!',location,startIso:'2026-10-17T14:00:00-05:00',endIso:'2026-10-17T16:00:00-05:00',timezone:'America/Chicago',allDay:false,reminders:null,recurrence:null});
window.snapAnimeCalendarLinks=links;
const showSnap=new URLSearchParams(window.location.search).has('snap');
createRoot(document.getElementById('root')).render(showSnap?<main className="min-h-screen px-4 py-10" style={{background:'#faf9fd'}}><section className="text-center"><p className="mb-4 text-xs font-bold uppercase tracking-[0.26em] text-[#6b5ee8]">Snap / Upload</p><h1 className="text-[2.2rem] font-semibold leading-tight tracking-tight" style={{fontFamily:'Georgia,serif'}}>Snap or upload your<br/><em style={{color:'#7951d4'}}>flyer or invite</em></h1></section><SnapLaunchCards/><p className="mt-6 text-center text-lg leading-8 text-[#767287]">Envitefy reads the details, detects invitation types, and routes them into polished, interactive event pages automatically.</p></main>:<>
 <BirthdaySkin title={title} honoreeName="Mia" dateLabel="Saturday, October 17" timeLabel="2:00 PM – 4:00 PM" venueName="Maple Park" location="820 W 7th Street, Austin, TX" imageUrl="/snap-anime-flyer.webp" shareUrl="https://envitefy.com/event/mias-8th-birthday" calendarLinks={links} rsvpName="Mia’s mom" rsvpEmail="birthday-demo@envitefy.com" rsvpSenderName="Mom" rsvpSenderEmail="mom-demo@envitefy.com" palette={{background:'#fff9ef',primary:'#e98475',secondary:'#468e88',accent:'#f1c96c',text:'#33302d'}} />
 <div id="sharing" style={{padding:'24px 16px',background:'#fff9ef'}}><EventGuestActions title={title} shareUrl="https://envitefy.com/event/mias-8th-birthday" /></div>
</>);
