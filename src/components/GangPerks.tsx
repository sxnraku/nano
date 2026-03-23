import React from 'react';
import { motion } from 'motion/react';
import { Shield, Zap, TrendingUp, Lock, CheckCircle2, Star } from 'lucide-react';

interface Perk {
  id: string;
  name: string;
  level: number;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const PERKS: Perk[] = [
  { id: 'scrap', name: 'STREET SMARTS', level: 2, description: '+5% SCRAP FROM ALL SOURCES', icon: <TrendingUp className="w-5 h-5" />, color: 'cyan' },
  { id: 'hp', name: 'GANG SHIELD', level: 5, description: '+5% HP IN ALL BATTLES', icon: <Shield className="w-5 h-5" />, color: 'green' },
  { id: 'energy', name: 'FAST HANDS', level: 10, description: '+5% ENERGY GENERATION', icon: <Zap className="w-5 h-5" />, color: 'yellow' },
  { id: 'crit', name: 'STREET JUSTICE', level: 15, description: '+5% CRITICAL DAMAGE', icon: <Star className="w-5 h-5" />, color: 'red' },
  { id: 'recovery', name: 'ADRENALINE', level: 20, description: '10% HP RECOVERY AFTER WAVE', icon: <Zap className="w-5 h-5 text-purple-400" />, color: 'purple' },
];

interface GangPerksProps {
  currentLevel: number;
}

export function GangPerks({ currentLevel }: GangPerksProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
          <Star className="w-3 h-3 text-amber-500" /> DOMINION PERKS
        </h3>
        <span className="text-[8px] font-bold text-zinc-600 bg-black px-1.5 py-0.5 border border-zinc-800 rounded uppercase">Passive Bonuses</span>
      </div>

      <div className="grid gap-3">
        {PERKS.map((perk) => {
          const isUnlocked = currentLevel >= perk.level;
          
          return (
            <motion.div
              layout
              key={perk.id}
              className={`bg-zinc-950 border-2 p-3 shadow-[4px_4px_0_#000] relative overflow-hidden group transition-all ${
                isUnlocked ? `border-${perk.color}-500/50` : 'border-zinc-800 opacity-60 grayscale'
              }`}
            >
              {!isUnlocked && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-4 h-4 text-zinc-700" />
                </div>
              )}
              
              {isUnlocked && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className={`w-4 h-4 text-${perk.color}-500 animate-pulse`} />
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 flex items-center justify-center border-2 shadow-[2px_2px_0_#000] shrink-0 rotate-2 group-hover:rotate-0 transition-transform ${
                  isUnlocked ? `bg-${perk.color}-500/10 border-${perk.color}-500 text-${perk.color}-400` : 'bg-zinc-900 border-zinc-800 text-zinc-700'
                }`}>
                  {perk.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <h4 className={`text-sm font-black italic uppercase leading-tight ${isUnlocked ? 'text-white' : 'text-zinc-600'}`}>
                      {perk.name}
                    </h4>
                    {!isUnlocked && <span className="text-[8px] font-black text-zinc-500">LVL {perk.level}</span>}
                  </div>
                  <p className={`text-[10px] font-bold mt-1 ${isUnlocked ? `text-${perk.color}-500/70` : 'text-zinc-700'}`}>
                    {perk.description}
                  </p>
                </div>
              </div>

              {/* Progress connection for unlocked perks */}
              {isUnlocked && (
                <div className={`absolute bottom-0 left-0 h-[2px] bg-${perk.color}-500 animate-pulse`} style={{ width: '100%' }} />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
