import React from 'react';
import { motion } from 'motion/react';
import { X, Zap, Coins, Battery, Tv, Sparkles, ShoppingBag } from 'lucide-react';
import { GachiIcon } from './GachiIcon';
import { GachiSticker } from './GachiSticker';
import { useAudio } from '../services/audioService';
import { translations, type Language } from '../services/localizationService';

interface PremiumStoreProps {
    isOpen: boolean;
    onClose: () => void;
    nanites: number;
    scrap: number;
    scanEnergy: number;
    onPurchaseNanites: (amount: number, price: string) => void;
    onPurchaseScraps: (scrapAmount: number, naniteCost: number) => void;
    onPurchaseEnergy: (energyAmount: number, naniteCost: number) => void;
    onWatchAd: () => void;
    language?: Language;
}

// Nanite packs are on hold for Alpha
// const NANITE_PACKS = [...];

// EXCHANGE_ITEMS moved inside the component for localization

export function PremiumStore({
    isOpen,
    onClose,
    nanites,
    scrap,
    scanEnergy,
    onPurchaseNanites,
    onPurchaseScraps,
    onPurchaseEnergy,
    onWatchAd,
    language = 'en'
}: PremiumStoreProps) {
    const t = translations[language];
    const { playSFX } = useAudio();

    const currentExchangeItems = [
        {
            id: 'e1',
            type: 'energy',
            amount: 3,
            cost: 300,
            label: language === 'pt' ? '3 Cápsulas de Scan' : '3 Scan Capsules',
            icon: <GachiSticker type="ENERGY" className="w-12 h-12" />
        },
        {
            id: 'e2',
            type: 'scrap',
            amount: 1000,
            cost: 500,
            label: language === 'pt' ? '1000 Sucatas' : '1000 Scraps',
            icon: <GachiSticker type="SCRAP_STACK" className="w-12 h-12" />
        },
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/95 backdrop-blur-xl"
                onClick={onClose}
            />

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 50 }}
                className="relative w-full max-w-md bg-zinc-950 border-4 border-cyan-400 shadow-[0_0_60px_rgba(34,211,238,0.2)] flex flex-col max-h-[90vh] overflow-hidden pointer-events-auto"
            >
                {/* Header - Crypto/Cyber Style */}
                <div className="bg-cyan-500 p-6 border-b-4 border-black relative overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-20" />

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-50 p-2 bg-black text-white border-2 border-white shadow-[4px_4px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="relative z-10">
                        <h2 className="text-4xl font-marker text-black uppercase -rotate-1">Neo-Z <span className="text-white">Exchange</span></h2>
                        <div className="flex gap-4 mt-3">
                            <div className="flex items-center gap-2 bg-black px-3 py-1 border-2 border-white rotate-1 shadow-[2px_2px_0_#000]">
                                <GachiSticker type="NANITE" className="w-6 h-6" />
                                <span className="text-xl font-black text-cyan-400 font-mono tracking-tighter">{nanites}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-black px-3 py-1 border-2 border-white -rotate-1 shadow-[2px_2px_0_#000]">
                                <div className="w-6 h-6 bg-white flex items-center justify-center rounded-sm overflow-hidden border border-black p-0.5">
                                    <img src="/icon_scrap.png" className="w-full h-full object-contain mix-blend-multiply" alt="scrap" />
                                </div>
                                <span className="text-xl font-black text-red-500 font-mono tracking-tighter">{scrap}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Store Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-8 bg-zinc-900/50 custom-scrollbar">

                    {/* Watch Ad Bonus */}
                    <section>
                        <h3 className="text-xs font-black text-cyan-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> Free Daily Bonus
                        </h3>
                        <button
                            onClick={() => { playSFX('CLICK'); onWatchAd(); }}
                            className="w-full p-4 bg-zinc-800 border-2 border-white border-dashed hover:border-solid hover:border-yellow-400 transition-all group flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <GachiSticker type="AD" className="w-14 h-14" />
                                <div className="text-left">
                                    <p className="font-black text-white uppercase italic">Watch Ad</p>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">REWARD: +1 Charge & +25 NTS</p>
                                </div>
                            </div>
                            <div className="px-3 py-1 bg-yellow-400 text-black text-xs font-black border-2 border-black -rotate-6">FREE</div>
                        </button>
                    </section>

                    {/* Alpha Message */}
                    <section className="p-4 bg-cyan-950/30 border-2 border-cyan-500/50 rounded-sm">
                        <p className="text-xs font-black text-white uppercase italic mb-1">Alpha Access</p>
                        <p className="text-[10px] text-zinc-400 uppercase leading-tight font-bold">
                            Direct Nanite purchases are disabled during the testing phase.
                            Earn Nanites by watching ads or through gang rewards!
                        </p>
                    </section>

                    {/* Nanite Exchange (Scan/Scrap) */}
                    <section>
                        <h3 className="text-xs font-black text-cyan-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4" /> {language === 'pt' ? 'Troca de Tecnologia' : 'Tech Exchange'}
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {currentExchangeItems.map(item => {
                                const canAfford = nanites >= item.cost;
                                return (
                                    <button
                                        key={item.id}
                                        disabled={!canAfford}
                                        onClick={() => {
                                            playSFX('PURCHASE');
                                            if (item.type === 'energy') onPurchaseEnergy(item.amount, item.cost);
                                            else onPurchaseScraps(item.amount, item.cost);
                                        }}
                                        className={`p-4 bg-zinc-950 border-2 ${canAfford ? 'border-zinc-700 hover:border-white' : 'border-zinc-800 opacity-50 grayscale'} flex justify-between items-center transition-all`}
                                    >
                                        <div className="flex items-center gap-4">
                                            {item.icon}
                                            <div className="text-left">
                                                <p className="text-sm font-black text-white uppercase">{item.label}</p>
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase">{language === 'pt' ? 'Materialização Instantânea' : 'Instant Materialization'}</p>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 flex items-center gap-2 font-black border-2 border-black ${canAfford ? 'bg-cyan-500 text-black -rotate-1' : 'bg-zinc-800 text-zinc-600'}`}>
                                            {item.cost} <GachiIcon type="NANITE" className="w-4 h-4" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                </div>

                {/* Footer */}
                <div className="p-4 bg-black border-t-2 border-zinc-800 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase font-bold max-w-xs mx-auto">
                        {language === 'pt'
                            ? 'Todas as transações no NanoVerse são criptografadas e finais. Neo-Z Exchange não é responsável por perdas em combate.'
                            : 'All transactions in the NanoVerse are encrypted and final. Neo-Z Exchange is not responsible for combat losses.'}
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
