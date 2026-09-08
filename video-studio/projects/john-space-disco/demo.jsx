import React from 'react';
import {createRoot} from 'react-dom/client';
import SharedStudioCardPage from '../../../src/components/studio/SharedStudioCardPage';
import ConciergeChatClient from '../../../src/app/chat/ConciergeChatClient';
const mode=new URL(location.href).searchParams.get('view');
const data=window.__JOHN_DATA__;
createRoot(document.getElementById('root')).render(mode==='chat'?<ConciergeChatClient userInitials="JM"/>:<SharedStudioCardPage title="John is 10" eventId="demo-john-is-10" imageUrl="/john-card.webp" invitationData={data.invitationData} shareUrl="https://envitefy.com/card/john-is-10"/>);
