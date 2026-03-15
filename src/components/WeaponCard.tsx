import React from 'react';
import { motion } from 'motion/react';
import { Sword, Shield, Zap, Heart, Star } from 'lucide-react';
import type { Weapon } from '../services/gemini';

interface WeaponCardProps {
  weapon: Weapon;
  onEquip?: () => void;
  onUnequip?: () => void;
  isEquipped?: boolean;
  disabled?: boolean;
}

export function WeaponCard({ weapon, onEquip, onUnequip, isEquipped, disabled }: WeaponCardProps) {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return 'border-yellow-400 text-yellow-400 bg-yellow-400/10';
      case 'Epic': return 'border-purple-500 text-purple-500 bg-purple-500/10';
      case 'Rare': return 'border-blue-500 text-blue-500 bg-blue-500/10';
      default: return 'border-zinc-500 text-zinc-500 bg-zinc-500/10';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3 border-2 bg-black flex flex-col gap-2 relative group ${getRarityColor(weapon.rarity)}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <Sword className="w-4 h-4" />
          <h4 className="font-black uppercase text-xs truncate max-w-[120px]">{weapon.name}</h4>
        </div>
        <span className="text-[8px] font-black uppercase px-1 border border-current">
          {weapon.rarity}
        </span>
      </div>

      <p className="text-[10px] text-zinc-400 leading-tight italic">"{weapon.description}"</p>

      <div className="grid grid-cols-2 gap-1">
        {weapon.stats.hp && (
          <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold">
            <Heart className="w-3 h-3" /> +{weapon.stats.hp}
          </div>
        )}
        {weapon.stats.atk && (
          <div className="flex items-center gap-1 text-[10px] text-red-500 font-bold">
            <Sword className="w-3 h-3" /> +{weapon.stats.atk}
          </div>
        )}
        {weapon.stats.def && (
          <div className="flex items-center gap-1 text-[10px] text-blue-500 font-bold">
            <Shield className="w-3 h-3" /> +{weapon.stats.def}
          </div>
        )}
        {weapon.stats.spd && (
          <div className="flex items-center gap-1 text-[10px] text-yellow-500 font-bold">
            <Zap className="w-3 h-3" /> +{weapon.stats.spd}
          </div>
        )}
      </div>

      {weapon.ability && (
        <div className="mt-1 p-1 bg-zinc-900 border border-zinc-800">
          <div className="flex items-center gap-1 text-[8px] font-black text-purple-400 uppercase">
            <Star className="w-2 h-2 fill-current" /> {weapon.ability.name}
          </div>
          <p className="text-[8px] text-zinc-500 leading-none mt-0.5">{weapon.ability.description}</p>
        </div>
      )}

      <div className="mt-2">
        {isEquipped ? (
          <button
            onClick={(e) => { e.stopPropagation(); onUnequip?.(); }}
            className="w-full py-1 bg-red-600 text-white text-[10px] font-black uppercase border border-black shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            Unequip
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onEquip?.(); }}
            disabled={disabled}
            className={`w-full py-1 text-[10px] font-black uppercase border border-black shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${disabled ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed grayscale' : 'bg-yellow-400 text-black hover:bg-yellow-300'
              }`}
          >
            Equip
          </button>
        )}
      </div>
    </motion.div>
  );
}
