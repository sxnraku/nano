import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { motion } from 'motion/react';
import { X, Share2, Download, Copy, Check, Zap, Shield, Sword, Heart } from 'lucide-react';
import type { WarriorData } from '../services/gemini';
import { createChallenge } from '../services/firebase';
import { auth } from '../services/firebase';

interface ShareWarriorModalProps {
  warrior: WarriorData;
  onClose: () => void;
}

export function ShareWarriorModal({ warrior, onClose }: ShareWarriorModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [challengeUrl, setChallengeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate challenge link automatically on mount if logged in
  useEffect(() => {
    if (auth.currentUser && !challengeUrl) {
      handleCreateChallenge();
    }
  }, []);

  const handleCreateChallenge = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const challengeId = await createChallenge(warrior, auth.currentUser);
      const url = `${window.location.origin}/?challenge=${challengeId}`;
      setChallengeUrl(url);
    } catch (error) {
      console.error("Error creating challenge:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      // Small delay to ensure everything is rendered
      await new Promise(r => setTimeout(r, 100));
      
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#000',
        scale: 3,
        useCORS: true,
        logging: false,
        allowTaint: true,
      });
      
      const link = document.createElement('a');
      link.download = `nanoverse-${warrior.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (error) {
      console.error("Error downloading card:", error);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = () => {
    if (challengeUrl) {
      navigator.clipboard.writeText(challengeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getRarityStyles = (rarity: string = 'Common') => {
    switch (rarity) {
      case 'Legendary': return { border: 'border-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/10', glow: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]' };
      case 'Epic': return { border: 'border-purple-500', text: 'text-purple-400', bg: 'bg-purple-500/10', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]' };
      case 'Rare': return { border: 'border-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/10', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]' };
      default: return { border: 'border-zinc-500', text: 'text-zinc-400', bg: 'bg-zinc-500/10', glow: 'shadow-none' };
    }
  };

  const rs = getRarityStyles(warrior.rarity);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-zinc-950 border-2 border-zinc-800 w-full max-w-md rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[95dvh] my-auto"
      >
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">Materialize Card</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg transition-colors border border-transparent hover:border-zinc-700">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center gap-8 overflow-y-auto custom-scrollbar pt-safe pb-safe">
          {/* Card Preview Container */}
          <div className="relative group">
            {/* The actual card to be screenshotted */}
            <div
              ref={cardRef}
              className={`relative w-[280px] aspect-[1/1.4] bg-zinc-950 border-[8px] border-black shadow-[15px_15px_0_#000] overflow-hidden flex flex-col ${rs.glow}`}
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-20 pointer-events-none z-0" />
              
              {/* Header Info */}
              <div className="absolute top-0 left-0 right-0 z-20 p-3 flex justify-between items-start">
                <div className="bg-black/90 border border-zinc-800 px-2 py-0.5 -rotate-2">
                  <span className="text-[10px] font-black text-white italic tracking-tighter">NANOVERSE GEN.1</span>
                </div>
                <div className={`${rs.bg} ${rs.border} border px-2 py-0.5 rotate-2`}>
                  <span className={`text-[10px] font-black uppercase ${rs.text}`}>{warrior.rarity}</span>
                </div>
              </div>

              {/* Character Image */}
              <div className="relative h-[65%] w-full overflow-hidden border-b-[6px] border-black z-10 shrink-0">
                <img src={warrior.imageUrl} alt={warrior.name} className="w-full h-full object-contain mix-blend-normal" crossOrigin="anonymous" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
              </div>

              {/* Info Area */}
              <div className="flex-1 p-3 flex flex-col bg-zinc-900 relative z-10">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                
                <h3 className="text-white font-marker text-2xl uppercase tracking-tighter drop-shadow-[3px_3px_0_#000] mb-2 z-10">
                  {warrior.name}
                </h3>

                <div className="flex gap-1.5 mb-4 z-10">
                  <span className="bg-cyan-950 text-cyan-400 px-1.5 py-0.5 text-[9px] font-black border border-cyan-500/30 uppercase italic">{warrior.class}</span>
                  <span className="bg-purple-950 text-purple-400 px-1.5 py-0.5 text-[9px] font-black border border-purple-500/30 uppercase italic">{warrior.element}</span>
                </div>

                {/* Refined Stats */}
                <div className="grid grid-cols-4 gap-1 mt-auto z-10">
                  {[
                    { label: 'HP', val: warrior.stats.hp, color: 'text-green-400', bg: 'bg-green-500/20' },
                    { label: 'ATK', val: warrior.stats.atk, color: 'text-red-400', bg: 'bg-red-500/20' },
                    { label: 'DEF', val: warrior.stats.def, color: 'text-blue-400', bg: 'bg-blue-500/20' },
                    { label: 'SPD', val: warrior.stats.spd, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
                  ].map(s => (
                    <div key={s.label} className="bg-black/80 border border-zinc-800 p-1 flex flex-col items-center">
                      <span className={`text-[8px] font-black ${s.color}`}>{s.label}</span>
                      <span className="text-sm font-black text-white font-mono leading-none">{s.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decorative Tape Bottom */}
              <div className="absolute -bottom-4 -right-12 w-32 h-8 bg-white border-y-2 border-black rotate-[-45deg] flex items-center justify-center z-20 shadow-lg">
                <span className="text-[10px] font-black text-black tracking-[0.3em]">VERIFIED</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full space-y-4">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-black uppercase rounded-lg shadow-[0_4px_0_#ccc] transition-all active:translate-y-[2px] active:shadow-none disabled:opacity-50 flex items-center justify-center gap-3 group"
            >
              {downloading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Download className="w-5 h-5 group-hover:bounce" />
                  Download PNG Card
                </>
              )}
            </button>

            {challengeUrl && (
              <div className="pt-4 border-t border-zinc-800 w-full">
                <p className="text-[10px] text-zinc-500 font-black uppercase mb-2 tracking-widest text-center">Share Battle Link</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={challengeUrl}
                    className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-400 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700 transition-all flex items-center justify-center"
                    title="Copy Link"
                  >
                    {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}
            
            {!auth.currentUser && (
              <p className="text-[10px] text-zinc-600 text-center italic">
                Sign in to generate challenge links for your friends.
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
