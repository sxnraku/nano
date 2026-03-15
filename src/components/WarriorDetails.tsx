import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Shield, Sword, Zap, Heart, ArrowUp, Cpu, Star, RefreshCw, Palette, Share2 } from 'lucide-react';
import { GachiIcon } from './GachiIcon';
import { GachiSticker } from './GachiSticker';
import { WeaponCard } from './WeaponCard';
import { type WarriorData, type Weapon, type WarriorStyle, generateWarriorImage } from '../services/gemini';
import { useAudio } from '../services/audioService';
import { translations, type Language } from '../services/localizationService';

interface WarriorDetailsProps {
  warrior: WarriorData;
  isOpen: boolean;
  onClose: () => void;
  scrap: number;
  nanites: number;
  onUpgrade: (stat: 'hp' | 'atk' | 'def' | 'spd', cost: number) => void;
  inventory: Weapon[];
  onEquipWeapon: (warriorId: string, weaponId: string | null) => void;
  onUpdateWarrior: (updatedWarrior: WarriorData, cost: number, naniteCost?: number) => void;
  consumables?: { [itemId: string]: number };
  onUseConsumable?: (itemId: string) => void;
  onShare: (warrior: WarriorData) => void;
  language?: Language;
}

export function WarriorDetails({ warrior, isOpen, onClose, scrap, nanites, onUpgrade, inventory, onEquipWeapon, onUpdateWarrior, consumables, onUseConsumable, onShare, language = 'en' }: WarriorDetailsProps) {
  const t = translations[language];
  const { playSFX } = useAudio();
  const [isRerolling, setIsRerolling] = useState(false);
  const [isRerollingStats, setIsRerollingStats] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<WarriorStyle>('Default');

  if (!isOpen) return null;

  const equippedWeapon = inventory.find(w => w.id === warrior.equippedWeaponId);

  const getStatColor = (stat: string) => {
    switch (stat) {
      case 'hp': return 'text-green-500';
      case 'atk': return 'text-red-500';
      case 'def': return 'text-blue-500';
      case 'spd': return 'text-yellow-500';
      default: return 'text-white';
    }
  };

  const getUpgradeCost = (currentValue: number) => {
    // Simple cost formula: base 10 + (value * 0.5)
    return Math.floor(10 + (currentValue * 0.5));
  };

  const handleRerollVisual = async () => {
    const cost = 50;
    if (scrap < cost) return;

    setIsRerolling(true);
    playSFX('CLICK');

    try {
      const newImageUrl = await generateWarriorImage(warrior.visualPrompt, undefined, selectedStyle);
      onUpdateWarrior({ ...warrior, imageUrl: newImageUrl }, cost, 0);
      playSFX('PURCHASE');
    } catch (error: any) {
      console.error("Failed to reroll visual", error);
      alert(error.message?.includes('429') ? t.toast_ai_limit : t.toast_gen_error);
    } finally {
      setIsRerolling(false);
    }
  };

  const handleRerollStats = async () => {
    const naniteCost = 50;
    if (nanites < naniteCost) return;

    setIsRerollingStats(true);
    playSFX('SCAN');

    try {
      const boost = 1.15;
      const newStats = {
        hp: Math.floor(warrior.stats.hp * (0.9 + Math.random() * 0.4) * boost),
        atk: Math.floor(warrior.stats.atk * (0.9 + Math.random() * 0.4) * boost),
        def: Math.floor(warrior.stats.def * (0.9 + Math.random() * 0.4) * boost),
        spd: Math.floor(warrior.stats.spd * (0.9 + Math.random() * 0.4) * boost),
      };

      onUpdateWarrior({ ...warrior, stats: newStats }, 0, naniteCost);
      playSFX('WIN');
    } finally {
      setIsRerollingStats(false);
    }
  };

  const StatRow = ({ label, value, icon: Icon, statKey, iconType }: { label: string, value: number, icon: any, statKey: 'hp' | 'atk' | 'def' | 'spd', iconType: any }) => {
    const cost = getUpgradeCost(value);
    const canAfford = scrap >= cost;

    return (
      <div className="flex items-center justify-between bg-zinc-900 p-3 border border-zinc-700 mb-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-black border border-zinc-700 ${getStatColor(statKey)} flex items-center justify-center`}>
            <GachiIcon type={iconType} className="w-5 h-5" fallback={<Icon className="w-5 h-5" />} />
          </div>
          <div>
            <span className="text-xs text-zinc-500 uppercase font-bold block">{label}</span>
            <span className="text-xl font-mono font-black text-white">{value}</span>
          </div>
        </div>

        <button
          onClick={() => {
            playSFX('PURCHASE');
            onUpgrade(statKey, cost);
          }}
          disabled={!canAfford}
          className={`flex items-center gap-2 px-3 py-2 border-2 transition-all ${canAfford
            ? 'bg-yellow-400 border-black text-black hover:bg-yellow-300 shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
            : 'bg-zinc-800 border-zinc-600 text-zinc-500 cursor-not-allowed grayscale'
            }`}
        >
          <div className="flex flex-col items-end leading-none">
            <span className="text-[10px] font-black uppercase">{t.warrior_attributes_title.split(' ')[2] || 'UPGRADE'}</span>
            <span className="text-xs font-bold flex items-center gap-1">
              {cost} <Cpu className="w-3 h-3" />
            </span>
          </div>
          <ArrowUp className={`w-4 h-4 ${canAfford ? 'animate-bounce' : ''}`} />
        </button>
      </div>
    );
  };

  const getRarityColor = (rarity: string = 'Common') => {
    switch (rarity) {
      case 'Legendary': return 'bg-yellow-900 text-yellow-300 border-yellow-500/50';
      case 'Epic': return 'bg-purple-900 text-purple-300 border-purple-500/50';
      case 'Rare': return 'bg-blue-900 text-blue-300 border-blue-500/50';
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-600/50';
    }
  };

  const getRarityLabel = (rarity: string = 'Common') => {
    switch (rarity) {
      case 'Legendary': return t.common_legendary;
      case 'Epic': return t.common_epic;
      case 'Rare': return t.common_rare;
      default: return t.common_common;
    }
  };

  const rarity = warrior.rarity || 'Common';
  const styles: WarriorStyle[] = ['Default', 'Glitch', 'Neon', 'Cyber', 'Dark', 'Retro'];

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
        className="relative w-full max-w-md bg-zinc-950 border-4 border-white shadow-[0_0_50px_rgba(255,255,255,0.1)] flex flex-col max-h-[92dvh] overflow-hidden pointer-events-auto rounded-xl"
      >
        {/* Header Image */}
        <div className="relative h-48 bg-zinc-900 shrink-0">
          <img src={warrior.imageUrl} className="w-full h-full object-cover opacity-50" alt="Background" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />

          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
            <div className="relative">
              {isRerolling ? (
                <div className="w-32 h-32 border-4 border-white shadow-[0_0_20px_rgba(0,0,0,0.5)] bg-zinc-800 flex items-center justify-center rotate-3">
                  <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
                </div>
              ) : (
                <img
                  src={warrior.imageUrl}
                  className="w-32 h-32 border-4 border-white shadow-[0_0_20px_rgba(0,0,0,0.5)] bg-zinc-800 object-cover rotate-3"
                  alt={warrior.name}
                />
              )}
              <div className="absolute -top-3 -right-3 bg-black text-white text-xs font-black px-2 py-1 border border-white -rotate-6 shadow-[2px_2px_0_#000]">
                LVL 1
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 bg-black text-white hover:bg-zinc-800 border-2 border-white shadow-[4px_4px_0_#000]"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-12 custom-scrollbar pb-safe">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-marker text-white uppercase tracking-wide">{warrior.name}</h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className={`px-2 py-0.5 text-xs font-bold border uppercase ${getRarityColor(rarity)}`}>
                {getRarityLabel(rarity)}
              </span>
              <span className="bg-cyan-900 text-cyan-300 px-2 py-0.5 text-xs font-bold border border-cyan-500/50 uppercase">{warrior.class}</span>
              <span className="bg-purple-900 text-purple-300 px-2 py-0.5 text-xs font-bold border border-purple-500/50 uppercase">{warrior.element}</span>
            </div>
            <p className="text-zinc-400 text-sm mt-4 italic border-l-2 border-yellow-400 pl-3 text-left bg-zinc-900/50 p-2">
              "{warrior.description}"
            </p>
          </div>

          {/* Stats Re-roll Section (Premium Purpose) */}
          <div className="mb-6 p-4 bg-cyan-950/20 border-2 border-cyan-500/30 rounded-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <GachiSticker type="NANITE" className="w-20 h-20 rotate-12" />
            </div>
            <h3 className="text-sm font-black text-cyan-400 uppercase mb-3 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> {t.warrior_stats_reroll_title}
            </h3>
            <p className="text-[10px] text-cyan-200/60 uppercase font-bold mb-4">{t.warrior_stats_reroll_desc}</p>

            <button
              onClick={handleRerollStats}
              disabled={nanites < 50 || isRerollingStats}
              className={`w-full flex items-center justify-center gap-2 py-3 border-2 uppercase font-black text-sm transition-all ${nanites >= 50 && !isRerollingStats
                ? 'bg-cyan-600 border-black text-white hover:bg-cyan-500 shadow-[4px_4px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                : 'bg-zinc-800 border-zinc-600 text-zinc-500 cursor-not-allowed'
                }`}
            >
              {isRerollingStats ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> {language === 'pt' ? 'Calibrando...' : 'Calibrating...'}
                </>
              ) : (
                <>
                  <GachiSticker type="NANITE" className="w-5 h-5" /> {t.warrior_stats_reroll_button}
                </>
              )}
            </button>
          </div>

          {/* Visual Re-roll Section */}
          <div className="mb-6 p-4 bg-zinc-900/50 border border-zinc-700 rounded-lg">
            <h3 className="text-sm font-black text-purple-400 uppercase mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4" /> {t.warrior_visual_reroll_title}
            </h3>

            <div className="flex gap-2 overflow-x-auto pb-2 mb-3 hide-scrollbar">
              {styles.map(style => (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className={`px-3 py-1 text-xs font-bold uppercase border whitespace-nowrap transition-all ${selectedStyle === style
                    ? 'bg-purple-500 text-white border-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                    : 'bg-black text-zinc-500 border-zinc-700 hover:border-zinc-500'
                    }`}
                >
                  {style}
                </button>
              ))}
            </div>

            <button
              onClick={handleRerollVisual}
              disabled={scrap < 50 || isRerolling}
              className={`w-full flex items-center justify-center gap-2 py-2 border-2 uppercase font-black text-sm transition-all ${scrap >= 50 && !isRerolling
                ? 'bg-purple-600 border-black text-white hover:bg-purple-500 shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                : 'bg-zinc-800 border-zinc-600 text-zinc-500 cursor-not-allowed'
                }`}
            >
              {isRerolling ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> {language === 'pt' ? 'Gerando...' : 'Generating...'}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" /> {t.warrior_visual_reroll_button}
                </>
              )}
            </button>
          </div>

          {/* Share Button Block */}
          <div className="mb-6">
            <button
              onClick={() => {
                playSFX('CLICK');
                onShare(warrior);
              }}
              className="w-full bg-blue-600 border-2 border-black text-white hover:bg-blue-500 shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all py-3 flex justify-center items-center gap-2 font-black uppercase tracking-wider"
            >
              <Share2 className="w-5 h-5" />
              {t.warrior_share_button}
            </button>
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-black text-yellow-400 uppercase mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" /> {t.warrior_attributes_title}
            </h3>

            <StatRow label="Health (HP)" value={warrior.stats.hp} icon={Heart} statKey="hp" iconType="HP" />
            <StatRow label="Attack (ATK)" value={warrior.stats.atk} icon={Sword} statKey="atk" iconType="ATK" />
            <StatRow label="Defense (DEF)" value={warrior.stats.def} icon={Shield} statKey="def" iconType="DEF" />
            <StatRow label="Speed (SPD)" value={warrior.stats.spd} icon={Zap} statKey="spd" iconType="SPD" />
          </div>


          {/* Weapon Section */}
          <div className="mt-8">
            <h3 className="text-sm font-black text-cyan-400 uppercase mb-3 flex items-center gap-2">
              <Sword className="w-4 h-4" /> {t.warrior_equipment_title}
            </h3>

            {equippedWeapon ? (
              <div className="mb-4">
                <span className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Equipped Weapon</span>
                <WeaponCard
                  weapon={equippedWeapon}
                  isEquipped={true}
                  onUnequip={() => onEquipWeapon(warrior.id, null)}
                />
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-zinc-800 bg-zinc-900/30 text-center mb-4">
                <p className="text-xs text-zinc-600 uppercase font-black">{t.warrior_no_weapon}</p>
              </div>
            )}

            <div className="space-y-2">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">{t.warrior_change_weapon}</span>
              <div className="grid grid-cols-1 gap-3">
                {inventory.length === 0 ? (
                  <p className="text-[10px] text-zinc-600 italic">{t.warrior_empty_inventory}</p>
                ) : (
                  inventory
                    .filter(w => w.id !== warrior.equippedWeaponId)
                    .map(weapon => (
                      <WeaponCard
                        key={weapon.id}
                        weapon={weapon}
                        onEquip={() => onEquipWeapon(warrior.id, weapon.id)}
                      />
                    ))
                )}
              </div>
            </div>
          </div>

          {/* Consumables Section */}
          {consumables && Object.keys(consumables).length > 0 && (
            <div className="mt-8 border-t border-zinc-800 pt-6">
              <h3 className="text-sm font-black text-green-400 uppercase mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4" /> {t.warrior_consumables_title}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(consumables).map(([itemId, count]) => {
                  if (count <= 0) return null;
                  const item = itemId === 'c1'
                    ? {
                      name: t.item_repair_name,
                      desc: t.item_repair_desc
                    }
                    : {
                      name: t.item_overclock_name,
                      desc: t.item_overclock_desc
                    };

                  return (
                    <div key={itemId} className="bg-zinc-900 border border-zinc-700 p-3 flex flex-col justify-between gap-2">
                      <div>
                        <div className="text-xs font-black text-white uppercase mb-1">{item.name}</div>
                        <div className="text-[10px] text-zinc-500 leading-tight">{item.desc}</div>
                      </div>
                      <div className="flex items-center justify-between mt-1 pt-2 border-t border-zinc-800">
                        <span className="text-xs font-mono text-white font-bold">x{count}</span>
                        <button
                          onClick={() => {
                            playSFX('CLICK');
                            onUseConsumable?.(itemId);
                          }}
                          className="px-3 py-1 bg-green-600 text-black text-[10px] font-black uppercase hover:bg-green-500 shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                        >
                          {t.warrior_use_button}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-zinc-900 border border-zinc-800 text-center">
            <span className="text-xs text-zinc-500 uppercase block mb-1">{t.warrior_scrap_available}</span>
            <span className="text-3xl font-black text-white flex items-center justify-center gap-2">
              <GachiIcon type="SCRAP" className="w-6 h-6" fallback={<Cpu className="w-6 h-6" />} /> {scrap}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
