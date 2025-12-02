"use client";

import React, { useState, useEffect } from 'react';
import { Camera, Scan, RotateCcw } from 'lucide-react';

export default function OcrLoadingShowcase() {
  const [status, setStatus] = useState<'idle' | 'flashing' | 'scanning' | 'complete'>('idle');
  const [scanPosition, setScanPosition] = useState(0);

  // Simulation Logic
  useEffect(() => {
    if (status === 'flashing') {
      const timer = setTimeout(() => setStatus('scanning'), 150);
      return () => clearTimeout(timer);
    }

    if (status === 'scanning') {
      let startTime = Date.now();
      const duration = 5000; // 5 seconds scan

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = (elapsed / duration) * 100;

        if (newProgress >= 100) {
          setScanPosition(100);
          setStatus('complete');
          clearInterval(interval);
        } else {
          setScanPosition(newProgress);
        }
      }, 16);

      return () => clearInterval(interval);
    }
  }, [status]);

  const takePhoto = () => {
    setStatus('flashing');
    setScanPosition(0);
  };

  const reset = () => {
    setStatus('idle');
    setScanPosition(0);
  };

  // Generic "Flyer" image for demo
  const flyerImage = "https://images.unsplash.com/photo-1567425886364-58682055627f?auto=format&fit=crop&w=600&q=80";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans flex flex-col items-center justify-center">
      
      <div className="max-w-md w-full mb-6 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Smart Scan</h1>
        <p className="text-slate-400 text-sm">
          {status === 'idle' && "Align flyer within frame"}
          {status === 'scanning' && "Analyzing text & layout..."}
          {status === 'complete' && "Scan Complete"}
        </p>
      </div>

      {/* Device Frame */}
      <div className="relative max-w-sm w-full bg-black rounded-[2rem] overflow-hidden border-8 border-slate-900 shadow-2xl aspect-[9/16] ring-1 ring-slate-800">
        
        {/* 1. Viewfinder Layer (The "Image") */}
        <div className="absolute inset-0 bg-black">
          {/* The Image (Simulating Camera Feed) */}
          <img 
            src={flyerImage} 
            alt="Flyer"
            className={`w-full h-full object-cover transition-all duration-500 ${
              status === 'idle' ? 'opacity-80 scale-105 blur-[1px]' : 'opacity-100 scale-100 blur-0'
            }`} 
          />
          
          {/* Camera UI Overlays (Only in idle) */}
          {status === 'idle' && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner Brackets */}
              <div className="absolute top-8 left-8 w-8 h-8 border-t-4 border-l-4 border-white/50 rounded-tl-lg" />
              <div className="absolute top-8 right-8 w-8 h-8 border-t-4 border-r-4 border-white/50 rounded-tr-lg" />
              <div className="absolute bottom-24 left-8 w-8 h-8 border-b-4 border-l-4 border-white/50 rounded-bl-lg" />
              <div className="absolute bottom-24 right-8 w-8 h-8 border-b-4 border-r-4 border-white/50 rounded-br-lg" />
              
              {/* Center Focus Reticle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-yellow-400/50 rounded-full flex items-center justify-center opacity-70">
                 <div className="w-1 h-1 bg-yellow-400 rounded-full" />
              </div>
            </div>
          )}
        </div>

        {/* 2. Flash Layer */}
        <div 
          className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-300 ${
            status === 'flashing' ? 'opacity-100' : 'opacity-0'
          }`} 
        />

        {/* 3. Scanning Layer */}
        {status === 'scanning' && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {/* The Laser Line */}
            <div 
              className="absolute w-full h-1 bg-cyan-400 shadow-[0_0_40px_rgba(34,211,238,1)] z-20"
              style={{ top: `${scanPosition}%` }}
            >
               {/* Leading edge glow */}
               <div className="absolute inset-0 bg-white opacity-50 blur-[2px]" />
            </div>

            {/* The "Processed" Area (Top Half) - Darken slightly to show contrast with active scan area */}
            <div 
              className="absolute top-0 left-0 right-0 bg-cyan-900/20 mix-blend-overlay transition-all duration-75 border-b border-cyan-500/30"
              style={{ height: `${scanPosition}%` }} 
            />
            
            {/* Scanned Data Particles (Simulated) */}
            <div className="absolute inset-0 overflow-hidden">
               {/* We move a grid background down with the scan line to look like it's leaving a trail */}
               <div 
                 className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"
                 style={{ 
                   height: `${scanPosition}%`,
                   opacity: 0.5
                 }}
               />
            </div>
          </div>
        )}

        {/* 4. Controls Layer */}
        <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center items-end h-32 bg-gradient-to-t from-black/80 to-transparent z-30">
          {status === 'idle' && (
            <button 
              onClick={takePhoto}
              className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-white/10 hover:bg-white/30 transition-all active:scale-95"
            >
              <div className="w-12 h-12 bg-white rounded-full" />
            </button>
          )}

          {status === 'scanning' && (
             <div className="flex flex-col items-center gap-2 animate-pulse">
                <Scan className="text-cyan-400 w-8 h-8" />
                <span className="text-cyan-400 text-xs font-bold uppercase tracking-widest">Processing</span>
             </div>
          )}

          {status === 'complete' && (
            <button 
              onClick={reset}
              className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors"
            >
              <RotateCcw size={18} />
              Scan Again
            </button>
          )}
        </div>
      </div>
      
      <p className="mt-8 text-slate-600 text-xs max-w-xs text-center">
        Simulates taking a photo, the camera flash, and the AI scanning process over the captured image.
      </p>
    </div>
  );
}

