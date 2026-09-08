import React from 'react';
import {createRoot} from 'react-dom/client';
import BirthdaySkin from '../../../src/components/BirthdaySkin';
import EventGuestActions from '../../../src/components/event-templates/EventGuestActions';
import {buildCalendarLinks} from '../../../src/utils/calendar-links';

const title="Mia's 8th Birthday";
const links=buildCalendarLinks({title,description:'Cake, games and birthday fun!',location:'Maple Park, Austin, TX',startIso:'2026-10-17T14:00:00-05:00',endIso:'2026-10-17T16:00:00-05:00',timezone:'America/Chicago',allDay:false,reminders:null,recurrence:null});
window.fridgeCalendarLinks=links;
createRoot(document.getElementById('root')).render(<>
  <BirthdaySkin title={title} honoreeName="Mia" dateLabel="Saturday, October 17" timeLabel="2:00 PM – 4:00 PM" venueName="Maple Park" location="Austin, TX" imageUrl="/fridge-flyer.webp" shareUrl="https://envitefy.com/event/mias-8th-birthday" calendarLinks={links} palette={{background:'#fff9ef',primary:'#e98475',secondary:'#468e88',accent:'#f1c96c',text:'#33302d'}} />
  <div id="sharing" style={{padding:'24px 16px',background:'#fff9ef'}}><EventGuestActions title={title} shareUrl="https://envitefy.com/event/mias-8th-birthday" /></div>
</>);
