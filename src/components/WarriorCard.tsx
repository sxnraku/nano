import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Sword, Zap, Activity, RotateCcw, Calendar, Box } from 'lucide-react';
import { GachiIcon } from './GachiIcon';
import type { WarriorData } from '../services/gemini';

interface WarriorCardProps {
  warrior: WarriorData;
}

export function WarriorCard({ warrior }: WarriorCardProps) {

  const getElementColor = (element: string) => {
    const el = element.toLowerCase();
    if (el.includes('fire')) return 'bg-orange-600';
    if (el.includes('water')) return 'bg-blue-600';
    if (el.includes('plant')) return 'bg-green-600';
    if (el.includes('electric')) return 'bg-yellow-500';
    return 'bg-purple-600';
  };

  const getRarityColor = (rarity: string = 'Common') => {
    switch (rarity) {
      case 'Legendary': return 'text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]';
      case 'Epic': return 'text-purple-500 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]';
      case 'Rare': return 'text-blue-500 drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]';
      default: return 'text-zinc-500';
    }
  };

  const getRarityLabel = (rarity: string = 'Common') => {
    switch (rarity) {
      case 'Legendary': return 'LEGENDARY';
      case 'Epic': return 'EPIC';
      case 'Rare': return 'RARE';
      default: return 'COMMON';
    }
  };

  const elementColor = getElementColor(warrior.element);
  const rarity = warrior.rarity || 'Common';

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[3/4] perspective-1000 group">
      <div className="w-full h-full relative">
        {/* FRONT FACE */}
        <div className="absolute inset-0 backface-hidden bg-white border-4 border-black shadow-[8px_8px_0_#000] overflow-hidden flex flex-col">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-50 z-0" />

          {/* Image Container */}
          <div className="relative h-[55%] border-b-4 border-black bg-black overflow-hidden z-10">
            {warrior.imageUrl ? (
              <img
                src={warrior.imageUrl}
                alt={warrior.name}
                className="w-full h-full object-contain mix-blend-normal"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-marker animate-pulse text-2xl">
                LOADING...
              </div>
            )}

            {/* Element Badge */}
            <div className={`absolute top-0 right-0 ${elementColor} text-white font-black px-3 py-1 border-l-2 border-b-2 border-black text-sm uppercase tracking-widest`}>
              {warrior.element}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-4 z-20 flex flex-col justify-between bg-white">
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="inline-block bg-black text-white text-[10px] font-bold px-1 mb-1 -rotate-2">
                  CLASS: {warrior.class.toUpperCase()}
                </div>
                <h2 className="text-3xl font-marker text-black leading-none -rotate-1 drop-shadow-[2px_2px_0_rgba(0,0,0,0.2)] line-clamp-1">
                  {warrior.name}
                </h2>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-glitch font-black uppercase ${getRarityColor(rarity)}`}>
                  {getRarityLabel(rarity)}
                </div>
              </div>
            </div>

            {/* Description Preview */}
            <div className="relative mb-2 flex-1">
              <p className="text-xs font-mono text-zinc-600 leading-tight line-clamp-3">
                {warrior.description || "Data corrupted. Description unavailable."}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 mt-auto">
              <StatBox label="HP" value={warrior.stats.hp} color="bg-green-500" iconType="HP" />
              <StatBox label="ATK" value={warrior.stats.atk} color="bg-red-500" iconType="ATK" />
              <StatBox label="DEF" value={warrior.stats.def} color="bg-blue-500" iconType="DEF" />
              <StatBox label="SPD" value={warrior.stats.spd} color="bg-yellow-400" iconType="SPD" />
            </div>
          </div>

          {/* Decorative Tape */}
          <div className="absolute top-6 -left-8 w-32 h-8 bg-yellow-400 border-y-2 border-black rotate-[-45deg] flex items-center justify-center z-30 shadow-md pointer-events-none">
            <span className="text-xs font-black text-black tracking-widest">DANGER</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color, iconType }: { label: string, value: number, color: string, iconType: any }) {
  return (
    <div className="flex flex-col items-center relative group/stat">
      {/* Background Shape */}
      <div className="absolute inset-0 bg-black skew-x-[-12deg] translate-x-1 translate-y-1 z-0" />
      <div className="relative z-10 w-full bg-white border-2 border-black p-1 flex flex-col items-center skew-x-[-12deg] hover:translate-x-0.5 hover:translate-y-0.5 transition-transform">
        <div className={`w-full h-5 ${color} mb-1 border border-black flex items-center justify-center overflow-hidden relative`}>
          <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
          <GachiIcon type={iconType} className="w-5 h-5 relative z-10" />
        </div>
        <div className="flex flex-col items-center -skew-x-[-12deg]">
          <span className="text-[8px] font-black uppercase text-zinc-500 leading-none mb-0.5 tracking-tighter">{label}</span>
          <span className="text-xl font-black font-mono leading-none text-black drop-shadow-[1px_1px_0_rgba(0,0,0,0.1)]">{value}</span>
        </div>
      </div>
    </div>
  );
}
