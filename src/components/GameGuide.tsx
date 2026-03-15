import React from 'react';
import { motion } from 'motion/react';
import { X, Info, Star, Zap, Shield, Sword, Heart } from 'lucide-react';
import { translations, type Language } from '../services/localizationService';

interface GameGuideProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

export function GameGuide({ isOpen, onClose, language = 'en' }: GameGuideProps) {
  const t = translations[language];
  if (!isOpen) return null;

  const rarities = [
    { name: t.common_common, color: 'text-zinc-400', border: 'border-zinc-400', bg: 'bg-zinc-900', chance: '60%', stats: '~200', icon: '⚪' },
    { name: t.common_rare, color: 'text-blue-400', border: 'border-blue-400', bg: 'bg-blue-900/20', chance: '30%', stats: '~250', icon: '🔵' },
    { name: t.common_epic, color: 'text-purple-400', border: 'border-purple-400', bg: 'bg-purple-900/20', chance: '9%', stats: '~300', icon: '🟣' },
    { name: t.common_legendary, color: 'text-yellow-400', border: 'border-yellow-400', bg: 'bg-yellow-900/20', chance: '1%', stats: '~380', icon: '🟡' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-md bg-zinc-950 border-4 border-white shadow-[0_0_50px_rgba(255,255,255,0.1)] flex flex-col max-h-[90vh] overflow-hidden pointer-events-auto"
      >
        <div className="flex items-center justify-between p-4 border-b-2 border-zinc-800 bg-zinc-900">
          <h2 className="text-2xl font-marker text-white uppercase flex items-center gap-2">
            <Info className="w-6 h-6 text-cyan-400" />
            {t.guide_title}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">

          {/* Rarity Section */}
          <section>
            <h3 className="text-xl font-black text-white uppercase mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              {t.guide_rarity_title}
            </h3>
            <p className="text-zinc-400 text-sm mb-4">
              {t.guide_rarity_desc}
            </p>
            <div className="space-y-3">
              {rarities.map((rarity) => (
                <div key={rarity.name} className={`p-3 border-l-4 ${rarity.border} ${rarity.bg} flex items-center justify-between`}>
                  <div>
                    <span className={`font-black uppercase ${rarity.color} block`}>{rarity.icon} {rarity.name}</span>
                    <span className="text-xs text-zinc-500 font-bold">{t.guide_chance}: {rarity.chance}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-500 uppercase block">{t.guide_base_stats}</span>
                    <span className={`font-mono font-bold ${rarity.color}`}>{rarity.stats}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Stats Section */}
          <section>
            <h3 className="text-xl font-black text-white uppercase mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              {t.guide_combat_title}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-900 p-3 border border-zinc-800">
                <div className="flex items-center gap-2 mb-1 text-green-500 font-bold uppercase text-xs">
                  <Heart className="w-4 h-4" /> {t.guide_hp_name}
                </div>
                <p className="text-zinc-500 text-[10px]">{t.guide_hp_desc}</p>
              </div>
              <div className="bg-zinc-900 p-3 border border-zinc-800">
                <div className="flex items-center gap-2 mb-1 text-red-500 font-bold uppercase text-xs">
                  <Sword className="w-4 h-4" /> {t.guide_atk_name}
                </div>
                <p className="text-zinc-500 text-[10px]">{t.guide_atk_desc}</p>
              </div>
              <div className="bg-zinc-900 p-3 border border-zinc-800">
                <div className="flex items-center gap-2 mb-1 text-blue-500 font-bold uppercase text-xs">
                  <Shield className="w-4 h-4" /> {t.guide_def_name}
                </div>
                <p className="text-zinc-500 text-[10px]">{t.guide_def_desc}</p>
              </div>
              <div className="bg-zinc-900 p-3 border border-zinc-800">
                <div className="flex items-center gap-2 mb-1 text-yellow-500 font-bold uppercase text-xs">
                  <Zap className="w-4 h-4" /> {t.guide_spd_name}
                </div>
                <p className="text-zinc-500 text-[10px]">{t.guide_spd_desc}</p>
              </div>
            </div>
          </section>

          {/* Economy Section */}
          <section>
            <h3 className="text-xl font-black text-white uppercase mb-4 flex items-center gap-2">
              <span className="text-xl">⚙️</span>
              {t.guide_economy_title}
            </h3>
            <div className="bg-zinc-900 border border-zinc-800 p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <span className="text-zinc-400 text-sm">{t.guide_new_scan}</span>
                <span className="text-yellow-400 font-mono font-bold">+10 ⚙️</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <span className="text-zinc-400 text-sm">{t.guide_arena_victory}</span>
                <span className="text-yellow-400 font-mono font-bold">+50 ⚙️</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm">{t.guide_recycle}</span>
                <span className="text-yellow-400 font-mono font-bold">+5 ⚙️</span>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-2 italic">
              {t.guide_footer}
            </p>
          </section>

        </div>
      </motion.div>
    </div>
  );
}
