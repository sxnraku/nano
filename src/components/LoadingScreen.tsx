import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onFadeComplete?: () => void;
  isLoading: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading, onFadeComplete }) => {
  const [shouldRender, setShouldRender] = useState(true);
  const [bootStatus, setBootStatus] = useState("INITIALIZING_KERNEL...");
  const [isVisible, setIsVisible] = useState(true);

  const statuses = [
    "INITIALIZING_KERNEL...",
    "ESTABLISHING_NEURAL_LINK...",
    "LOADING_GANG_DATABASE...",
    "DECRYPTING_WARRIOR_PROFILES...",
    "SYNCING_SCRAP_WALLET...",
    "OVERCLOCKING_CPU...",
    "READY_FOR_CONFLICT."
  ];

  const [glitchText, setGlitchText] = useState("");

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index++;
      if (index < statuses.length) {
        setBootStatus(statuses[index]);
      } else {
        clearInterval(interval);
      }
    }, 600);

    // Random glitchy character effect
    const glitchInterval = setInterval(() => {
      const chars = "!@#$%^&*()_+-=[]{}|;:,.<>?/0123456789";
      let res = "";
      for (let i = 0; i < 3; i++) {
        res += chars[Math.floor(Math.random() * chars.length)];
      }
      setGlitchText(res);
    }, 100);

    return () => {
      clearInterval(interval);
      clearInterval(glitchInterval);
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      // Small delay to ensure "READY" state is seen
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 700);

      // Final unmount after fade animation (700ms in CSS)
      const unmountTimer = setTimeout(() => {
        setShouldRender(false);
        if (onFadeComplete) onFadeComplete();
      }, 1400);

      return () => {
        clearTimeout(timer);
        clearTimeout(unmountTimer);
      };
    }
  }, [isLoading, onFadeComplete]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center transition-opacity duration-700 ease-in-out font-mono ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        
        {/* Moving scanline */}
        <div className="absolute top-0 left-0 w-full h-20 bg-white/5 blur-xl animate-[scanline_4s_linear_infinite]" />
      </div>

      {/* Center Content */}
      <div className="relative group">
        {/* Rapid Glitch Box */}
        <div className="w-40 h-40 border-4 border-white relative mb-12 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-red-600/20 group-hover:bg-red-600/40 transition-colors" />
          <div className="absolute inset-2 border-2 border-dashed border-white/30 animate-[spin_10s_linear_infinite]" />
          
          {/* Logo with Glitch Blur */}
          <div className="relative z-10 text-center">
            <span className="text-6xl font-black text-white italic tracking-tighter drop-shadow-[5px_5px_0_#dc2626]">N/V</span>
            <div className="text-[10px] text-zinc-400 mt-2 font-black tracking-[0.4em] uppercase opacity-50">Core_Sys</div>
          </div>
          
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-red-600" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-red-600" />
          
          {/* Random glitch bars */}
          <div className="absolute top-1/4 left-0 w-full h-[1px] bg-white/20 animate-pulse" />
          <div className="absolute bottom-1/3 right-0 w-full h-[1px] bg-red-600/20 animate-pulse delay-75" />
        </div>

        {/* Binary Rain Decoration */}
        <div className="absolute -left-24 top-0 h-full w-8 overflow-hidden text-[6px] text-red-600/30 italic flex flex-col gap-1">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
              {Math.random() > 0.5 ? '10110' : '00101'}
            </div>
          ))}
        </div>
      </div>

      {/* Status Text Area */}
      <div className="w-72 relative px-4">
        {/* Fake decorative border */}
        <div className="absolute -left-2 top-0 bottom-0 w-0.5 bg-red-600/50" />
        
        <div className="flex justify-between items-end mb-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Matrix_Boot</span>
          <span className="text-[10px] font-bold text-red-500 animate-pulse italic">
            0x{Math.floor(Math.random() * 16777215).toString(16).toUpperCase()}
          </span>
        </div>
        
        <div className="h-1 w-full bg-zinc-900 overflow-hidden mb-6 relative">
          <div 
            className={`h-full bg-white transition-all duration-[2500ms] ease-in-out shadow-[0_0_10px_#fff] ${!isLoading ? 'w-full' : 'w-2/3'}`} 
          />
          <div className="absolute inset-0 bg-transparent overflow-hidden">
             <div className="h-full w-1/4 bg-red-600/50 blur-sm animate-[loading_shine_2s_infinite]" />
          </div>
        </div>

        <div className="font-mono text-[10px] text-zinc-300 leading-tight">
          <div className="flex items-start gap-3">
             <span className="text-red-700 font-black animate-pulse">{'>'}</span>
             <div className="flex flex-col">
                <span className="uppercase tracking-wider">{bootStatus}</span>
                <span className="text-[8px] text-zinc-600 mt-1 italic font-mono lowercase opacity-50">
                  {glitchText} kernel_id::{(Math.random() * 9999).toFixed(0)}
                </span>
             </div>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end opacity-20 border-t border-zinc-900 pt-4">
        <div className="text-[8px] font-mono text-zinc-500 space-y-1">
          <div className="uppercase tracking-widest">NanoVerse_OS Release 3.2.0</div>
          <div className="italic">Memory_Guard: ACTIVE // Neural_Filter: ON</div>
        </div>
        <div className="text-[10px] font-black text-white/50 tracking-tighter italic">
          NANO_CORP_2026
        </div>
      </div>

      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(1000%); }
        }
        @keyframes loading_shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
};
