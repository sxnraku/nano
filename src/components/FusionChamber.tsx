import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Plus, ArrowRight, Dna, AlertTriangle, Cpu } from 'lucide-react';
import { type WarriorData, fuseWarriors, generateWarriorImage } from '../services/gemini';
import { GachiIcon } from './GachiIcon';
import { GachiSticker } from './GachiSticker';
import { translations, type Language } from '../services/localizationService';

interface FusionChamberProps {
  collection: WarriorData[];
  isOpen: boolean;
  onClose: () => void;
  onFuse: (newWarrior: WarriorData, parents: [string, string], scrapCost: number, naniteCost: number) => void;
  scrap: number;
  nanites: number;
  language?: Language;
}

export function FusionChamber({ collection, isOpen, onClose, onFuse, scrap, nanites, language = 'en' }: FusionChamberProps) {
  const t = translations[language];
  const [selectedWarriors, setSelectedWarriors] = useState<[WarriorData | null, WarriorData | null]>([null, null]);
  const [isFusing, setIsFusing] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [fusionStep, setFusionStep] = useState<string>('');

  if (!isOpen) return null;

  const handleSelect = (warrior: WarriorData) => {
    if (selectedWarriors[0]?.id === warrior.id) {
      setSelectedWarriors([null, selectedWarriors[1]]);
    } else if (selectedWarriors[1]?.id === warrior.id) {
      setSelectedWarriors([selectedWarriors[0], null]);
    } else if (!selectedWarriors[0]) {
      setSelectedWarriors([warrior, selectedWarriors[1]]);
    } else if (!selectedWarriors[1]) {
      setSelectedWarriors([selectedWarriors[0], warrior]);
    }
  };

  const handleFuse = async () => {
    const [w1, w2] = selectedWarriors;
    const scrapCost = isPremium ? 0 : 100;
    const naniteCost = isPremium ? 150 : 0;

    if (!w1 || w2 === null) return;
    if (!isPremium && scrap < scrapCost) return;
    if (isPremium && nanites < naniteCost) return;

    setIsFusing(true);

    try {
      setFusionStep(isPremium ? t.fusion_step_stabilizing : t.fusion_step_analyzing);
      const fusedData = await fuseWarriors(w1, w2, isPremium);

      setFusionStep(t.fusion_step_synthesizing);
      const imageUrl = await generateWarriorImage(fusedData.visualPrompt);

      const finalWarrior = { ...fusedData, imageUrl };

      onFuse(finalWarrior, [w1.id, w2.id], scrapCost, naniteCost);
      onClose();
    } catch (error) {
      console.error("Fusion failed:", error);
      setFusionStep(t.fusion_error);
      setTimeout(() => setIsFusing(false), 2000);
    }
  };

  const cost = 100;
  const canFuse = selectedWarriors[0] && selectedWarriors[1] && scrap >= cost;

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
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-2xl bg-zinc-950 border-4 border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.2)] flex flex-col max-h-[90vh] overflow-hidden pointer-events-auto rounded-xl"
      >
        {/* Header */}
        <div className="bg-purple-900/20 p-4 border-b border-purple-500/30 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Dna className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-marker text-white uppercase tracking-wide">{t.fusion_title}</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

          {/* Fusion Stage */}
          <div className="flex items-center justify-center gap-4 py-8 relative">
            {/* Slot 1 */}
            <div className={`relative w-32 h-32 border-4 ${selectedWarriors[0] ? 'border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'border-dashed border-zinc-700'} bg-zinc-900 flex items-center justify-center rounded-lg overflow-hidden transition-all`}>
              {selectedWarriors[0] ? (
                <>
                  <img src={selectedWarriors[0].imageUrl} className="w-full h-full object-cover" alt="" />
                  <button
                    onClick={() => setSelectedWarriors([null, selectedWarriors[1]])}
                    className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[10px] text-center py-1 font-bold text-white truncate px-1">
                    {selectedWarriors[0].name}
                  </div>
                </>
              ) : (
                <Plus className="w-8 h-8 text-zinc-700" />
              )}
            </div>

            {/* Fusion Icon */}
            <div className="flex flex-col items-center justify-center z-10">
              <div className={`w-12 h-12 rounded-full bg-zinc-900 border-2 border-purple-500 flex items-center justify-center ${isFusing ? 'animate-spin' : ''}`}>
                <Dna className={`w-6 h-6 text-purple-400 ${canFuse ? 'animate-pulse' : ''}`} />
              </div>
              {canFuse && !isFusing && (
                <ArrowRight className="w-6 h-6 text-purple-500 mt-2 animate-bounce" />
              )}
            </div>

            {/* Slot 2 */}
            <div className={`relative w-32 h-32 border-4 ${selectedWarriors[1] ? 'border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'border-dashed border-zinc-700'} bg-zinc-900 flex items-center justify-center rounded-lg overflow-hidden transition-all`}>
              {selectedWarriors[1] ? (
                <>
                  <img src={selectedWarriors[1].imageUrl} className="w-full h-full object-cover" alt="" />
                  <button
                    onClick={() => setSelectedWarriors([selectedWarriors[0], null])}
                    className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[10px] text-center py-1 font-bold text-white truncate px-1">
                    {selectedWarriors[1].name}
                  </div>
                </>
              ) : (
                <Plus className="w-8 h-8 text-zinc-700" />
              )}
            </div>
          </div>

          {/* Nanite Stabilizer Toggle */}
          <div className="bg-zinc-900 border-2 border-cyan-500/50 p-4 rounded-xl flex items-center justify-between group hover:border-cyan-400 transition-all">
            <div className="flex items-center gap-4">
              <GachiSticker type="NANITE" className="w-10 h-10" glow={isPremium} />
              <div>
                <p className="font-black text-cyan-400 uppercase italic">{t.fusion_stabilizer_title}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">{t.fusion_stabilizer_desc}</p>
              </div>
            </div>
            <button
              onClick={() => { setIsPremium(!isPremium); }}
              className={`w-14 h-8 border-2 border-black rounded-sm relative transition-colors ${isPremium ? 'bg-cyan-500' : 'bg-zinc-800'}`}
            >
              <motion.div
                animate={{ x: isPremium ? 28 : 4 }}
                className="w-5 h-5 bg-white border border-black shadow-[1px_1px_0_#000] mt-0.5"
              />
            </button>
          </div>

          {/* Info / Warning */}
          <div className="bg-yellow-900/20 border border-yellow-700/50 p-3 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-200/80">
              <p className="font-bold text-yellow-400 mb-1">{t.fusion_warning_title}</p>
              <p>{t.fusion_warning_desc}</p>
            </div>
          </div>

          {/* Selection Grid */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <h3 className="text-sm font-bold text-zinc-400 uppercase mb-2">{t.fusion_select_two}</h3>
            <div className="flex-1 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-2 pr-2 custom-scrollbar">
              {collection.map(warrior => {
                const isSelected = selectedWarriors.some(w => w?.id === warrior.id);
                return (
                  <button
                    key={warrior.id}
                    onClick={() => handleSelect(warrior)}
                    disabled={isSelected}
                    className={`relative aspect-square border-2 rounded-lg overflow-hidden transition-all ${isSelected
                      ? 'border-purple-500 opacity-50 grayscale'
                      : 'border-zinc-700 hover:border-white'
                      }`}
                  >
                    <img src={warrior.imageUrl} className="w-full h-full object-cover" alt={warrior.name} />
                    <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-center py-0.5 text-white truncate px-1">
                      {warrior.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleFuse}
            disabled={!canFuse || isFusing}
            className={`w-full py-4 border-2 uppercase font-black text-lg tracking-wider transition-all flex items-center justify-center gap-2 ${canFuse && !isFusing
              ? isPremium ? 'bg-cyan-600 border-black text-white hover:bg-cyan-500 shadow-[4px_4px_0_#000]' : 'bg-purple-600 border-black text-white hover:bg-purple-500 shadow-[4px_4px_0_#000]'
              : 'bg-zinc-800 border-zinc-600 text-zinc-500 cursor-not-allowed'
              } ${canFuse && !isFusing && 'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'}`}
          >
            {isFusing ? (
              <>
                <Dna className="w-6 h-6 animate-spin" /> {fusionStep}
              </>
            ) : (
              <>
                {isPremium ? (
                  <>{t.fusion_stabilizer_button}</>
                ) : (
                  <>{t.fusion_start_button}</>
                )}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
