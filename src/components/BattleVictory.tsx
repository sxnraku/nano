import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, Zap } from 'lucide-react';
import type { WarriorData } from '../services/gemini';
import { TROPHIES } from '../data/trophies';
import { getRankByElo } from '../data/ranks';
import { translations, Language } from '../services/localizationService';
import { useAudio } from '../services/audioService';

interface BattleVictoryProps {
  player: WarriorData;
  opponent: WarriorData;
  mode: string;
  stats: {
    timeTaken: number;
    maxCombo: number;
    hpRemaining: number;
    totalDamage: number;
    score?: number;
  };
  rewards: {
    xp: number;
    scrap: number;
  };
  unlockedTrophies?: string[];
  totalTrophies?: number;
  eloChange?: number;
  language?: Language;
  onContinue: () => void;
  onWatchAd?: () => Promise<void>;
}

function getRank(stats: BattleVictoryProps['stats'], player: WarriorData) {
  let score = 0;
  if (stats.maxCombo >= 20) score += 3;
  else if (stats.maxCombo >= 10) score += 2;
  else if (stats.maxCombo >= 5) score += 1;

  const hpPct = stats.hpRemaining / player.stats.hp;
  if (hpPct > 0.8) score += 3;
  else if (hpPct > 0.5) score += 2;
  else if (hpPct > 0.2) score += 1;

  if (stats.timeTaken < 30) score += 2;
  else if (stats.timeTaken < 60) score += 1;

  if (score >= 7) return { letter: 'S', color: 'text-yellow-400', bg: 'bg-yellow-400', border: 'border-yellow-400', shadow: 'shadow-[0_0_30px_#facc15]' };
  if (score >= 5) return { letter: 'A', color: 'text-cyan-400', bg: 'bg-cyan-500', border: 'border-cyan-400', shadow: 'shadow-[0_0_20px_#22d3ee]' };
  if (score >= 3) return { letter: 'B', color: 'text-green-400', bg: 'bg-green-500', border: 'border-green-400', shadow: '' };
  return { letter: 'C', color: 'text-zinc-400', bg: 'bg-zinc-600', border: 'border-zinc-400', shadow: '' };
}

export function BattleVictory({ player, opponent, mode, stats, rewards, unlockedTrophies, totalTrophies, eloChange, language = 'en', onContinue, onWatchAd }: BattleVictoryProps) {
  const [isDoubled, setIsDoubled] = React.useState(false);
  const [isWatching, setIsWatching] = React.useState(false);
  const rank = getRank(stats, player);
  const playerRank = getRankByElo(totalTrophies || 1000); // Trophies passed is actually Elo in PvP context
  const t = translations[language];
  const { playSFX } = useAudio();

  React.useEffect(() => {
    // Play sound and vibrate on rank appearance
    const timer = setTimeout(() => {
      playSFX('WIN');
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
    }, 500);
    return () => clearTimeout(timer);
  }, [playSFX]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-[100] bg-black/97 flex flex-col items-center justify-start overflow-y-auto"
    >
      {/* Background glow based on rank */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 3, opacity: 0.07 }}
        transition={{ duration: 0.8 }}
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[80px] ${rank.bg}`}
      />

      <div className="relative w-full max-w-md flex flex-col items-center px-4 pt-8 pb-10 gap-6">

        {/* Victory Title */}
        <motion.div
          initial={{ y: -60, opacity: 0, scale: 0.5 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 10, stiffness: 120 }}
          className="text-center"
        >
          <h1 className="text-8xl font-marker text-white italic drop-shadow-[8px_8px_0_#000] -rotate-3 uppercase"
            style={{ WebkitTextStroke: '2px black' }}
          >
            {mode === 'gang_war' ? 'DOMINION!' : mode === 'boss' ? 'BOSS DOWN!' : 'VICTORY!'}
          </h1>
          <div className="inline-block mt-2 bg-red-600 text-white px-6 py-1.5 border-4 border-black font-black uppercase text-[10px] tracking-[0.3em] rotate-2 shadow-[4px_4px_0_#000] gachi-skew">
            {mode === 'boss' ? 'CHAMPION DEFEATED' : mode === 'gang_war' ? 'RIVAL GANG CRUSHED' : 'STREETS CLEANED'}
          </div>

          {/* New: Player Street Rank Display */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="mt-4 flex flex-col items-center gap-1"
          >
            <span className="text-zinc-500 font-bold uppercase text-[8px] tracking-[0.2em]">{t.rank_title}</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{playerRank.icon}</span>
              <span className={`font-marker text-xl italic ${playerRank.color} text-stroke-sm`}>
                {(t as any)[playerRank.nameKey]}
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Rank Badge + VS */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: 'spring', damping: 12, stiffness: 100 }}
          className="flex items-center gap-6"
        >
          <div className="relative">
            <img src={player.imageUrl} className="w-20 h-20 border-4 border-white object-cover bg-zinc-900 shadow-[6px_6px_0_#000] -rotate-3" alt="Player" />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-cyan-500 border-2 border-black flex items-center justify-center">
              <Star className="w-4 h-4 text-white fill-white" />
            </div>
          </div>

          {/* Rank Circle */}
          <div className={`relative w-24 h-24 border-[6px] ${rank.border} bg-black flex items-center justify-center ${rank.shadow} rotate-6 shadow-[6px_6px_0_#000] gachi-inner-shadow`}>
            <div className={`absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.2em] ${rank.color}`}>RANK</div>
            <span className={`font-marker text-6xl italic ${rank.color} drop-shadow-[4px_4px_0_#000]`}>{rank.letter}</span>
          </div>

          <div className="relative grayscale opacity-40">
            <img src={opponent.imageUrl} className="w-20 h-20 border-4 border-zinc-700 object-cover bg-zinc-900 shadow-[6px_6px_0_#000] rotate-3" alt="Opponent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-1 bg-red-600 rotate-45 border border-black opacity-80" />
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-2">
          <StatBox
            icon={<StatIcon src="/icon_stat_tempo.png" alt="time" />}
            label="TIME"
            value={`${stats.timeTaken}s`}
            color="border-cyan-800"
            delay={0.4}
          />
          <StatBox
            icon={<StatIcon src="/icon_stat_combo.png" alt="combo" />}
            label="MAX COMBO"
            value={`${stats.maxCombo}x`}
            color="border-red-900"
            delay={0.5}
          />
          <StatBox
            icon={<StatIcon src="/icon_stat_dano.png" alt="damage" />}
            label="TOTAL DAMAGE"
            value={stats.totalDamage.toLocaleString()}
            color="border-orange-900"
            delay={0.6}
          />
          <StatBox
            icon={<StatIcon src="/icon_stat_hp.png" alt="hp" />}
            label="REMAINING HP"
            value={`${Math.round((stats.hpRemaining / player.stats.hp) * 100)}%`}
            color="border-green-900"
            delay={0.7}
          />
        </div>

        {/* Rewards */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="w-full"
        >
          <div className="bg-zinc-950 border-4 border-white shadow-[8px_8px_0_#000] overflow-hidden">
            {/* Header stripe */}
            <div className="bg-white text-black text-xs font-black uppercase tracking-[0.2em] px-4 py-2 flex items-center gap-2 border-b-4 border-black italic">
              <Trophy className="w-4 h-4 fill-black" />
              Loot Extracted
            </div>

            <div className="flex divide-x divide-zinc-800">
              {/* XP */}
              <div className="flex-1 flex flex-col items-center gap-2 py-5 px-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.0, type: 'spring' }}
                  className="w-14 h-14 bg-black border-[3px] border-cyan-500 flex items-center justify-center skew-x-[-8deg] shadow-[4px_4px_0_rgba(6,182,212,0.4)] overflow-hidden"
                >
                  <div className="w-full h-full bg-white flex items-center justify-center">
                    <img src="/icon_level.png" className="w-10 h-10 object-contain mix-blend-multiply contrast-125 grayscale" alt="xp" />
                  </div>
                </motion.div>
                <div className="text-center">
                  <div className="text-[10px] text-zinc-500 font-bold uppercase">Experience</div>
                  <motion.div 
                    animate={isDoubled ? { scale: [1, 1.2, 1], color: '#22d3ee' } : {}}
                    className="text-3xl font-black text-cyan-400"
                  >
                    +{isDoubled ? rewards.xp * 2 : rewards.xp}
                  </motion.div>
                  <div className="text-xs text-white font-bold">XP</div>
                </div>
              </div>

              {/* Scrap */}
              <div className="flex-1 flex flex-col items-center gap-2 py-5 px-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.2, type: 'spring' }}
                  className="w-14 h-14 bg-black border-[3px] border-red-500 flex items-center justify-center skew-x-[-8deg] shadow-[4px_4px_0_rgba(239,68,68,0.4)] overflow-hidden"
                >
                  <div className="w-full h-full bg-white flex items-center justify-center">
                    <img src="/icon_scrap.png" className="w-10 h-10 object-contain mix-blend-multiply contrast-125 grayscale" alt="scrap" />
                  </div>
                </motion.div>
                <div className="text-center">
                  <div className="text-[10px] text-zinc-500 font-bold uppercase">Scrap</div>
                  <motion.div 
                    animate={isDoubled ? { scale: [1, 1.2, 1], color: '#f87171' } : {}}
                    className="text-3xl font-black text-red-400"
                  >
                    +{isDoubled ? rewards.scrap * 2 : rewards.scrap}
                  </motion.div>
                  <div className="text-xs text-white font-bold">SCRAP</div>
                </div>
              </div>

              {/* Elo (PvP Only) */}
              {(mode === 'pvp' || eloChange) && (
                <div className="flex-1 flex flex-col items-center gap-2 py-5 px-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.4, type: 'spring' }}
                    className="w-14 h-14 bg-black border-[3px] border-yellow-500 flex items-center justify-center skew-x-[-8deg] shadow-[4px_4px_0_rgba(234,179,8,0.4)] overflow-hidden"
                  >
                    <div className="w-full h-full bg-white flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                    </div>
                  </motion.div>
                  <div className="text-center">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase">Elo</div>
                    <div className="text-3xl font-black text-yellow-400">+{eloChange || 25}</div>
                    <div className="text-xs text-white font-bold">POINTS</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Unlocked Trophies Overlay */}
        <AnimatePresence>
          {unlockedTrophies && unlockedTrophies.length > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              className="w-full bg-yellow-400 border-4 border-black p-4 shadow-[10px_10px_0_#000] rotate-1 z-50"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-black p-2">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-black font-black uppercase text-xl italic leading-none">TROPHIES UNLOCKED!</h3>
                  <p className="text-black text-[10px] font-bold uppercase">Legacy Recorded in the Hall of Fame</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {unlockedTrophies.map(tId => {
                  const trophy = TROPHIES.find(t => t.id === tId);
                  if (!trophy) return null;
                  return (
                    <div key={tId} className="bg-black text-white px-3 py-2 border-2 border-black flex items-center gap-2 group relative">
                      <span className="text-2xl">{trophy.icon}</span>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase leading-none">{trophy.name}</span>
                        <span className="text-[7px] font-bold text-zinc-500 uppercase">{trophy.rarity}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Double Rewards Ad Button */}
        {!isDoubled && onWatchAd && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5 }}
            className="w-full"
          >
            <button
              onClick={async () => {
                setIsWatching(true);
                playSFX('CLICK');
                try {
                  await onWatchAd();
                  setIsDoubled(true);
                } catch (e) {
                  console.error("Ad failed", e);
                } finally {
                  setIsWatching(false);
                }
              }}
              disabled={isWatching}
              className="w-full py-3 bg-indigo-600 text-white font-black uppercase italic border-4 border-black shadow-[4px_4px_0_#000] flex items-center justify-center gap-2 hover:bg-indigo-500 disabled:opacity-50 transition-all"
            >
              <Zap className={`w-5 h-5 ${isWatching ? 'animate-spin' : 'fill-white'}`} />
              {isWatching ? 'Preparing Video...' : 'DOUBLE REWARDS (WATCH AD)'}
            </button>
          </motion.div>
        )}

        {isDoubled && (
           <motion.div
             initial={{ scale: 0 }}
             animate={{ scale: 1 }}
             className="w-full py-2 bg-green-500 text-black font-black text-center border-4 border-black uppercase italic shadow-[4px_4px_0_#000]"
           >
             REWARDS DOUBLED! ⚡⚡
           </motion.div>
        )}

        {/* Continue Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2, type: 'spring' }}
          onClick={onContinue}
          className={`w-full py-5 font-black text-2xl uppercase italic tracking-tight border-4 border-black shadow-[8px_8px_0_#000] active:translate-x-2 active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-3 ${mode === 'gang_war' ? 'bg-orange-600 text-white' : 'bg-yellow-400 text-black'
            }`}
        >
          {mode === 'gang_war' ? 'CLAIM PRIZE' : 'CONTINUE JOURNEY'}
          <Zap className="w-6 h-6 fill-current" />
        </motion.button>
      </div>
    </motion.div>
  );
}

function StatIcon({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="w-7 h-7 bg-white flex items-center justify-center overflow-hidden shrink-0">
      <img src={src} className="w-6 h-6 object-contain mix-blend-multiply contrast-125 grayscale" alt={alt} />
    </div>
  );
}

function StatBox({ icon, label, value, color, delay }: { icon: React.ReactNode; label: string; value: string; color: string; delay: number }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay }}
      className={`bg-zinc-950 border-2 ${color} p-3 flex items-center gap-3`}
    >
      <div className="flex-shrink-0 w-8 h-8 bg-black border border-zinc-700 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">{label}</span>
        <span className="text-2xl font-glitch text-white leading-tight uppercase">{value}</span>
      </div>
    </motion.div>
  );
}
