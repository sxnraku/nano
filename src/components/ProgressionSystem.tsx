import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Target, Star, CheckCircle, Lock, X, ArrowLeft, Database } from 'lucide-react';
import { GachiIcon } from './GachiIcon';
import type { Weapon } from '../services/gemini';
import { translations, type Language } from '../services/localizationService';

export interface Mission {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  rewardXP: number;
  completed: boolean;
  type: 'scan' | 'battle_win' | 'collection_size';
}

export interface Buff {
  id: string;
  name: string;
  description: string;
  stat?: 'hp' | 'atk' | 'def' | 'spd';
  value: number;
  effect?: string;
  duration?: number;
}

export interface PlayerStats {
  level: number;
  xp: number;
  maxXp: number;
  scrap: number;
  totalBattles: number;
  totalWins: number;
  totalScans: number;
  missions: Mission[];
  inventory: Weapon[];
  consumables: { [itemId: string]: number };
  activeBuffs: Buff[];
  scanEnergy: number;
  lastEnergyDate: string;
  nanites: number;
  highestWave: number;
  highestBlitzScore: number;
  highestCombo: number;
  guildId?: string | null;
}

export const INITIAL_STATS: PlayerStats = {
  level: 1,
  xp: 0,
  maxXp: 100,
  scrap: 0,
  totalBattles: 0,
  totalWins: 0,
  totalScans: 0,
  missions: [
    {
      id: 'm1',
      title: 'First Contact',
      description: 'Scan your first object.',
      target: 1,
      current: 0,
      rewardXP: 50,
      completed: false,
      type: 'scan'
    },
    {
      id: 'm2',
      title: 'Street Fighter',
      description: 'Win 3 battles in the Arena.',
      target: 3,
      current: 0,
      rewardXP: 100,
      completed: false,
      type: 'battle_win'
    },
    {
      id: 'm3',
      title: 'Collector',
      description: 'Have 5 warriors in your gang.',
      target: 5,
      current: 0,
      rewardXP: 150,
      completed: false,
      type: 'collection_size'
    }
  ],
  inventory: [],
  consumables: {},
  activeBuffs: [],
  scanEnergy: 5,
  lastEnergyDate: new Date().toISOString().split('T')[0],
  nanites: 0,
  highestWave: 0,
  highestBlitzScore: 0,
  highestCombo: 0,
  guildId: null
};

interface ProgressionSystemProps {
  stats: PlayerStats;
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

export function ProgressionSystem({ stats, isOpen, onClose, language = 'en' }: ProgressionSystemProps) {
  const t = translations[language];
  const progressPercentage = (stats.xp / stats.maxXp) * 100;

  const getLocalizedMission = (mission: Mission) => {
    if (language === 'en') return mission;
    // Basic mapping for initial missions
    if (mission.id === 'm1') return { ...mission, title: 'Primeiro Contato', description: 'Escaneie seu primeiro objeto.' };
    if (mission.id === 'm2') return { ...mission, title: 'Lutador de Rua', description: 'Vença 3 batalhas na Arena.' };
    if (mission.id === 'm3') return { ...mission, title: 'Colecionador', description: 'Tenha 5 guerreiros na sua gangue.' };
    return mission;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Content */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md mx-4 bg-zinc-900 border-4 border-white shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh] pointer-events-auto"
      >
        {/* Header */}
        <div className="bg-yellow-400 p-6 border-b-4 border-black relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-20" />

          {/* Back Button */}
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="absolute top-4 right-4 z-50 p-2 bg-black text-white hover:bg-zinc-800 transition-all border-2 border-white shadow-[4px_4px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative z-10 pr-12">
            <h2 className="text-4xl font-marker text-black uppercase -rotate-2">{t.prog_street_cred}</h2>
            <div className="flex items-end justify-between mt-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-black border-2 border-white rounded-lg flex items-center justify-center shadow-[4px_4px_0_#000] rotate-3">
                  <GachiIcon type="RANK" className="w-12 h-12" fallback={<span className="text-3xl font-glitch text-white">{stats.level}</span>} />
                </div>
                <div>
                  <span className="text-xs font-black text-black uppercase block">{t.prog_level}</span>
                  <span className="text-4xl font-glitch text-black leading-none">{stats.level}</span>
                </div>
              </div>
              <div className="text-center">
                <span className="text-xs font-black text-black uppercase block">{t.prog_scrap}</span>
                <span className="text-2xl font-black text-black flex items-center justify-center gap-1">
                  <GachiIcon type="SCRAP" className="w-5 h-5" fallback={<Database className="w-5 h-5" />} /> {stats.scrap || 0}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-black uppercase block">{t.prog_xp}</span>
                <span className="text-xl font-mono font-bold text-black">{stats.xp} / {stats.maxXp}</span>
              </div>
            </div>

            {/* XP Bar */}
            <div className="mt-2 w-full h-4 bg-black border-2 border-black relative">
              <motion.div
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            </div>
          </div>
        </div>

        {/* Missions List */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-zinc-900">
          <h3 className="text-xl font-black text-white uppercase mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-cyan-400" />
            {t.prog_missions_title}
          </h3>

          <div className="space-y-4">
            {stats.missions.map((mission) => (
              <div
                key={mission.id}
                className={`relative p-4 border-2 ${mission.completed ? 'bg-zinc-800 border-green-500 opacity-60' : 'bg-black border-zinc-700'} transition-all`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className={`font-black uppercase ${mission.completed ? 'text-green-500 line-through' : 'text-white'}`}>
                    {getLocalizedMission(mission).title}
                  </h4>
                  <span className="text-xs font-bold bg-yellow-400 text-black px-1">
                    +{mission.rewardXP} XP
                  </span>
                </div>

                <p className="text-xs text-zinc-400 mb-3">{getLocalizedMission(mission).description}</p>

                {/* Progress Bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${mission.completed ? 'bg-green-500' : 'bg-cyan-400'}`}
                      style={{ width: `${Math.min((mission.current / mission.target) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {mission.current}/{mission.target}
                  </span>
                </div>

                {mission.completed && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Stats Summary */}
          <div className="mt-8 grid grid-cols-2 gap-2">
            <div className="bg-zinc-800 p-3 border border-zinc-700 text-center">
              <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
              <span className="text-2xl font-black text-white block">{stats.totalWins}</span>
              <span className="text-[10px] text-zinc-500 uppercase">{t.prog_wins}</span>
            </div>
            <div className="bg-zinc-800 p-3 border border-zinc-700 text-center">
              <Star className="w-6 h-6 text-purple-400 mx-auto mb-1" />
              <span className="text-2xl font-black text-white block">{stats.totalScans}</span>
              <span className="text-[10px] text-zinc-500 uppercase">{t.prog_scans}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
