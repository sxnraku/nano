import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, TrendingUp, TrendingDown, Zap, Award } from 'lucide-react';
import type { WarriorData } from '../services/gemini';
import { getRankByElo } from '../data/ranks';
import { translations, Language } from '../services/localizationService';
import { useAudio } from '../services/audioService';

interface PvPResultScreenProps {
  player: WarriorData;
  opponent: WarriorData;
  isWinner: boolean;
  eloChange: number;
  newElo: number;
  stats: {
    timeTaken: number;
    maxCombo: number;
    totalDamage: number;
  };
  language?: Language;
  onContinue: () => void;
}

export function PvPResultScreen({ 
  player, 
  opponent, 
  isWinner, 
  eloChange, 
  newElo,
  stats,
  language = 'en', 
  onContinue 
}: PvPResultScreenProps) {
  const t = translations[language];
  const { playSFX } = useAudio();
  const playerRank = getRankByElo(newElo);
  
  // Audio Feedback
  React.useEffect(() => {
    const timer = setTimeout(() => {
      playSFX(isWinner ? 'WIN' : 'LEVEL_UP'); // Use a generic success/fail sound
      if ('vibrate' in navigator) {
        navigator.vibrate(isWinner ? [100, 50, 100] : [200]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [isWinner, playSFX]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-[110] bg-black/98 flex flex-col items-center justify-start overflow-y-auto"
    >
      {/* Dynamic Background Glow */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-[60vh] opacity-20 blur-[120px] rounded-full ${isWinner ? 'bg-yellow-500' : 'bg-red-900'}`} />

      <div className="relative w-full max-w-md flex flex-col items-center px-4 pt-12 pb-12 gap-8">
        
        {/* Main Verdict Overlay */}
        <motion.div
          initial={{ scale: 2, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: -5 }}
          transition={{ type: 'spring', damping: 8, stiffness: 100 }}
          className="text-center z-10"
        >
          <h1 className={`text-7xl md:text-9xl font-marker italic drop-shadow-[15px_15px_0_#000] uppercase text-stroke-lg ${isWinner ? 'text-yellow-400' : 'text-red-700'}`}>
            {isWinner ? 'VICTORY' : 'DEFEAT'}
          </h1>
          <div className="bg-black border-4 border-white px-6 py-2 -rotate-3 -mt-4 relative shadow-[8px_8px_0_#000]">
            <p className="text-white font-black uppercase text-xs tracking-[0.3em]">
              {isWinner ? 'Rival Crushed' : 'Skill Issue Detected'}
            </p>
          </div>
        </motion.div>

        {/* VS Portraits */}
        <div className="flex items-center gap-4 w-full justify-center mt-4">
          {/* Winner/Player */}
          <motion.div 
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`relative p-1 border-4 ${isWinner ? 'border-yellow-400' : 'border-zinc-700 grayscale'} bg-black shadow-[8px_8px_0_#000] -rotate-2`}
          >
            <img src={player.imageUrl} className="w-28 h-28 md:w-32 md:h-32 object-cover" alt="Player" />
            <div className={`absolute -bottom-4 -right-2 px-3 py-1 text-black font-black text-[10px] uppercase italic ${isWinner ? 'bg-yellow-400' : 'bg-zinc-700'}`}>
              {isWinner ? 'MVP' : 'BYSTANDER'}
            </div>
          </motion.div>

          <div className="font-marker text-4xl text-zinc-600 italic -rotate-12 px-2 text-stroke-sm">VS</div>

          {/* Opponent */}
          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`relative p-1 border-4 ${!isWinner ? 'border-red-600' : 'border-zinc-700 grayscale'} bg-black shadow-[8px_8px_0_#000] rotate-2`}
          >
            <img src={opponent.imageUrl} className="w-28 h-28 md:w-32 md:h-32 object-cover" alt="Opponent" />
            <div className={`absolute -bottom-4 -left-2 px-3 py-1 text-black font-black text-[10px] uppercase italic ${!isWinner ? 'bg-red-600' : 'bg-zinc-700'}`}>
              {!isWinner ? 'DOMINANT' : 'VICTIM'}
            </div>
          </motion.div>
        </div>

        {/* Elo Rating Exchange */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="w-full bg-zinc-950 border-4 border-white p-6 shadow-[10px_10px_0_#000] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Award className="w-20 h-20 text-white" />
          </div>
          
          <div className="flex flex-col items-center gap-3">
             <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em]">Rank Rating Exchange</span>
             
             <div className="flex items-center gap-6">
                <div className="flex flex-col items-center">
                   <div className="text-4xl">{playerRank.icon}</div>
                   <div className={`font-marker text-xl italic ${playerRank.color}`}>
                      {(t as any)[playerRank.nameKey]}
                   </div>
                </div>

                <div className="h-16 w-[2px] bg-zinc-800" />

                <div className="flex flex-col items-center justify-center">
                   <div className={`text-5xl font-black italic flex items-center gap-2 ${eloChange >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                      {eloChange >= 0 ? <TrendingUp className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
                      {eloChange > 0 ? `+${eloChange}` : eloChange}
                   </div>
                   <div className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest mt-1">
                      Final Elo: {newElo}
                   </div>
                </div>
             </div>
          </div>
        </motion.div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 w-full">
           <div className="bg-black/50 border-2 border-zinc-800 p-3 flex flex-col items-center">
              <span className="text-[8px] text-zinc-500 font-black uppercase">FIGHT TIME</span>
              <span className="text-xl font-glitch text-white">{stats.timeTaken}s</span>
           </div>
           <div className="bg-black/50 border-2 border-zinc-800 p-3 flex flex-col items-center">
              <span className="text-[8px] text-zinc-500 font-black uppercase">MAX COMBO</span>
              <span className="text-xl font-glitch text-white">{stats.maxCombo}x</span>
           </div>
           <div className="bg-black/50 border-2 border-zinc-800 p-3 flex flex-col items-center">
              <span className="text-[8px] text-zinc-500 font-black uppercase">DANO CAUSADO</span>
              <span className="text-xl font-glitch text-white">{stats.totalDamage.toLocaleString()}</span>
           </div>
        </div>

        {/* Action Button */}
        <motion.button
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.0 }}
          onClick={onContinue}
          className="w-full py-6 bg-white text-black font-black text-2xl uppercase italic tracking-tighter border-4 border-black shadow-[10px_10px_0_#000] hover:bg-yellow-400 transition-all flex items-center justify-center gap-4 active:translate-y-1 active:shadow-[6px_6px_0_#000]"
        >
          RETURN TO LOBBY
          <Zap className="w-6 h-6 fill-black" />
        </motion.button>

      </div>
    </motion.div>
  );
}
