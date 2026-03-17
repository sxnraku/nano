import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, Sword, Shield, Zap, Heart, AlertTriangle, CheckCircle2, Terminal, Activity } from 'lucide-react';
import type { WarriorData } from '../services/gemini';
import { useAudio } from '../services/audioService';
import { translations, type Language } from '../services/localizationService';

interface GangWarSelectionProps {
  collection: WarriorData[];
  isOpen: boolean;
  onClose: () => void;
  onStart: (team: WarriorData[], isHardcore: boolean) => void;
  language?: Language;
}

export function GangWarSelection({ collection, isOpen, onClose, onStart, language = 'en' }: GangWarSelectionProps) {
  const t = translations[language];
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isHardcore, setIsHardcore] = useState(false);
  const { playSFX } = useAudio();

  if (!isOpen) return null;

  const toggleWarrior = (id: string) => {
    playSFX('CLICK');
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length < 3) {
        return [...prev, id];
      }
      return prev;
    });
  };

  const selectedWarriors = collection.filter(w => selectedIds.includes(w.id));
  const canStart = selectedIds.length === 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 50 }}
        className="relative w-full max-w-2xl bg-zinc-950 border-4 border-orange-600 shadow-[0_0_50px_rgba(234,88,12,0.2)] flex flex-col max-h-[90vh] overflow-hidden pointer-events-auto"
      >
        {/* Header */}
        <div className="bg-orange-600 p-6 border-b-4 border-black relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-20" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 bg-black text-white border-2 border-white shadow-[4px_4px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative z-10">
            <h2 className="text-4xl font-marker text-white uppercase -rotate-1">Gang War</h2>
            <p className="text-orange-200 text-xs font-black uppercase mt-1">Select 3 warriors for the final battle</p>
          </div>
        </div>

        {/* Selection Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-900/50">

          {/* Mode Toggle */}
          <div className="mb-6 p-4 bg-zinc-900 border-2 border-zinc-700 flex items-center justify-between">
            <div>
              <h4 className={`font-black uppercase text-sm ${isHardcore ? 'text-red-500' : 'text-white'}`}>
                {isHardcore ? 'Hardcore Mode (Permadeath)' : 'Normal Mode'}
              </h4>
              <p className="text-xs text-zinc-400 leading-tight mt-1">
                {isHardcore
                  ? 'Risk: Lose warrior. Reward: Steal enemy warrior.'
                  : 'No risk of losing warriors. Reward: Scrap/XP only.'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isHardcore}
                onChange={(e) => {
                  playSFX('CLICK');
                  setIsHardcore(e.target.checked);
                }}
              />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>

          {/* Warning Box (Only visible in Hardcore) */}
          {isHardcore && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-red-950/40 border-l-8 border-red-600 flex items-start gap-4 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-red-600/5 animate-pulse pointer-events-none" />
              <AlertTriangle className="w-8 h-8 text-red-500 shrink-0" />
              <div>
                <h4 className="text-red-500 font-black uppercase text-sm italic tracking-widest">{t.gang_raid_threat || 'CRITICAL RISK WARNING'}</h4>
                <p className="text-[10px] text-red-200/70 leading-tight mt-1 font-mono">
                  FAILURE DETECTED. IF DEFEATED, ONE RANDOMLY SELECTED OPERATIVE WILL BE <span className="text-red-500 font-black underline">PERMANENTLY DELETED</span> FROM THE MAINFRAME.
                </p>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {collection.map((warrior) => {
              const isSelected = selectedIds.includes(warrior.id);
              return (
                <div
                  key={warrior.id}
                  onClick={() => toggleWarrior(warrior.id)}
                  className={`relative cursor-pointer border-4 transition-all group overflow-hidden ${isSelected ? 'border-orange-500 bg-orange-500/10' : 'border-black bg-zinc-900/50 hover:border-zinc-700'
                    }`}
                >
                  <div className="absolute inset-0 bg-noise opacity-10 pointer-events-none" />
                  <img src={warrior.imageUrl} alt={warrior.name} className={`w-full aspect-square object-cover transition-all duration-500 ${isSelected ? 'grayscale-0 scale-110' : 'grayscale group-hover:grayscale-0'}`} />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-2 z-10">
                    <h5 className="text-[9px] font-black text-white uppercase truncate flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-orange-500 animate-pulse' : 'bg-zinc-700'}`} />
                      {warrior.name}
                    </h5>
                    <div className="flex justify-between mt-1 items-center">
                      <div className="flex items-center gap-1 text-[8px] text-zinc-400 font-bold bg-black/50 px-1 rounded">
                        <Activity className="w-2 h-2" /> {warrior.stats.atk + warrior.stats.def}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 bg-orange-600 text-white p-1 rounded-full shadow-[0_0_15px_rgba(234,88,12,0.5)] z-20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </motion.div>
                  )}

                  <div className="absolute top-2 left-2 bg-black/80 px-1.5 py-0.5 border border-white/20 text-[7px] font-black text-white italic z-20">
                    {warrior.rarity.toUpperCase()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-black border-t-4 border-orange-600 flex flex-col items-center gap-4">
          <div className="flex gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className={`w-12 h-12 border-2 ${selectedWarriors[i] ? 'border-orange-500' : 'border-zinc-800 border-dashed'} flex items-center justify-center overflow-hidden bg-zinc-900`}>
                {selectedWarriors[i] ? (
                  <img src={selectedWarriors[i].imageUrl} className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-6 h-6 text-zinc-800" />
                )}
              </div>
            ))}
          </div>

          <button
            disabled={!canStart}
            onClick={() => {
              playSFX('CLICK');
              onStart(selectedWarriors, isHardcore);
            }}
            className={`w-full py-4 font-marker text-2xl uppercase border-4 border-black shadow-[8px_8px_0_#000] transition-all ${canStart
              ? 'bg-orange-600 text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
          >
            {canStart ? (isHardcore ? 'START (HARDCORE)' : 'START CONFLICT') : `SELECT ${3 - selectedIds.length} MORE`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
