import React from 'react';
import { motion } from 'motion/react';
import { X, ShoppingCart, Zap, Shield, Sword, Heart, Database } from 'lucide-react';
import { GachiIcon } from './GachiIcon';
import { useAudio } from '../services/audioService';
import type { Weapon } from '../services/gemini';
import { translations, type Language } from '../services/localizationService';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'boost' | 'permanent' | 'weapon' | 'consumable';
  stat?: 'hp' | 'atk' | 'def' | 'spd';
  value?: number;
  effect?: string;
  weapon?: Weapon;
}

const SHOP_ITEMS: ShopItem[] = [
  { id: 'c1', name: 'Repair Kit', description: 'Recover 50% HP out of battle.', cost: 30, type: 'consumable', effect: 'heal', value: 0.5 },
  { id: 'c2', name: 'Overclock Chip', description: '+20% All Stats for the next battle.', cost: 80, type: 'consumable', effect: 'buff_all', value: 1.2 },
  { id: 'b1', name: 'Engine Oil', description: 'Temporary 20% ATK boost for the next battle.', cost: 50, type: 'boost', stat: 'atk', value: 1.2 },
  { id: 'b2', name: 'Scrap Armor', description: 'Temporary 20% DEF boost for the next battle.', cost: 50, type: 'boost', stat: 'def', value: 1.2 },
  { id: 'p1', name: 'Power Core', description: 'Permanently increases Max HP by 50.', cost: 200, type: 'permanent', stat: 'hp', value: 50 },
  { id: 'p2', name: 'Overclock Chip (Perm)', description: 'Permanently increases SPD by 10.', cost: 150, type: 'permanent', stat: 'spd', value: 10 },
  {
    id: 'w1',
    name: 'Rusty Knife',
    description: 'A jagged and oxidized blade. Causes tetanus (bleeding).',
    cost: 100,
    type: 'weapon',
    weapon: {
      id: 'w1-' + Date.now(),
      name: 'Rusty Knife',
      description: 'Dangerous and oxidized blade.',
      rarity: 'Common',
      stats: { atk: 15 },
      ability: { name: 'Tetanus', description: 'Causes continuous damage.', effect: 'bleed' }
    }
  },
  {
    id: 'w2',
    name: 'Electrified Pipe',
    description: 'A copper pipe with exposed wiring. Chance of paralysis.',
    cost: 250,
    type: 'weapon',
    weapon: {
      id: 'w2-' + Date.now(),
      name: 'Electrified Pipe',
      description: 'Pipe with high voltage.',
      rarity: 'Rare',
      stats: { atk: 25, spd: 5 },
      ability: { name: 'Short Circuit', description: 'Chance to stun.', effect: 'stun' }
    }
  },
  {
    id: 'w3',
    name: 'Manhole Shield',
    description: 'A manhole cover reinforced with graphite.',
    cost: 300,
    type: 'weapon',
    weapon: {
      id: 'w3-' + Date.now(),
      name: 'Manhole Shield',
      description: 'Heavy urban defense.',
      rarity: 'Rare',
      stats: { def: 40, hp: 20 },
      ability: { name: 'Urban Wall', description: 'Reduces damage taken.', effect: 'block' }
    }
  },
  {
    id: 'w4',
    name: 'Neon Katana',
    description: 'A plasma blade that glows in cyan. Surgical cut.',
    cost: 600,
    type: 'weapon',
    weapon: {
      id: 'w4-' + Date.now(),
      name: 'Neon Katana',
      description: 'High-tech blade.',
      rarity: 'Epic',
      stats: { atk: 60, spd: 15 },
      ability: { name: 'Neon Slice', description: 'Ignores part of defense.', effect: 'pierce' }
    }
  },
];

interface BlackMarketProps {
  isOpen: boolean;
  onClose: () => void;
  scrap: number;
  onBuy: (item: ShopItem) => void;
  language?: Language;
}

export function BlackMarket({ isOpen, onClose, scrap, onBuy, language = 'en' }: BlackMarketProps) {
  const t = translations[language];
  const { playSFX } = useAudio();
  if (!isOpen) return null;

  const handleBuy = (item: ShopItem) => {
    playSFX('PURCHASE');
    onBuy(item);
  };

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
        initial={{ scale: 0.9, opacity: 0, x: 50 }}
        animate={{ scale: 1, opacity: 1, x: 0 }}
        exit={{ scale: 0.9, opacity: 0, x: 50 }}
        className="relative w-full max-w-md bg-zinc-950 border-4 border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.2)] flex flex-col max-h-[85vh] overflow-hidden pointer-events-auto"
      >
        {/* Header */}
        <div className="bg-yellow-400 p-6 border-b-4 border-black relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-20" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 bg-black text-white border-2 border-white shadow-[4px_4px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative z-10">
            <h2 className="text-4xl font-marker text-black uppercase -rotate-1">{t.market_title}</h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-10 h-10 bg-black border-2 border-black flex items-center justify-center skew-x-[-10deg] overflow-hidden">
                <div className="w-full h-full bg-white flex items-center justify-center">
                  <img src="/icon_scrap.png" className="w-8 h-8 object-contain mix-blend-multiply contrast-125 grayscale" alt="scrap" />
                </div>
              </div>
              <span className="text-3xl font-black text-black font-mono">{scrap}</span>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-900/50">
          {SHOP_ITEMS.map((item) => {
            const canAfford = scrap >= item.cost;
            return (
              <div
                key={item.id}
                className={`p-4 border-2 ${canAfford ? 'border-zinc-700 bg-black' : 'border-zinc-800 bg-zinc-900/50 opacity-60'} transition-all flex justify-between items-center group`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-black px-1 border border-black ${item.type === 'permanent' ? 'bg-purple-600 text-white' :
                      item.type === 'weapon' ? 'bg-yellow-400 text-black' :
                        'bg-cyan-500 text-black'
                      }`}>
                      {item.type === 'permanent' ? t.market_permanent : item.type === 'weapon' ? t.market_weapon : t.market_boost}
                    </span>
                    <h4 className="font-black text-white uppercase tracking-tighter">{item.name}</h4>
                  </div>
                  <p className="text-xs text-zinc-500 leading-tight">{item.description}</p>
                </div>

                <button
                  onClick={() => handleBuy(item)}
                  disabled={!canAfford}
                  className={`ml-4 px-4 py-2 border-2 font-black text-sm transition-all flex flex-col items-center ${canAfford
                    ? 'bg-yellow-400 border-black text-black shadow-[4px_4px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-500 grayscale'
                    }`}
                >
                  <span className="text-[10px] opacity-70">{t.market_buy_button}</span>
                  <div className="flex items-center gap-1">
                    {item.cost}
                    <div className="w-5 h-5 bg-white flex items-center justify-center rounded-sm overflow-hidden">
                      <img src="/icon_scrap.png" className="w-4 h-4 object-contain mix-blend-multiply" alt="scrap" />
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-black border-t-2 border-zinc-800 text-center">
          <p className="text-[10px] text-zinc-500 uppercase font-bold">{t.market_footer}</p>
        </div>
      </motion.div>
    </div>
  );
}
