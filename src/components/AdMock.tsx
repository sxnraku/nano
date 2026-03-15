import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Volume2, VolumeX, SkipForward, CheckCircle2 } from 'lucide-react';
import { useAudio } from '../services/audioService';

interface AdMockProps {
    isOpen: boolean;
    onClose: (rewarded: boolean) => void;
}

export function AdMock({ isOpen, onClose }: AdMockProps) {
    const { playSFX } = useAudio();
    const [timeLeft, setTimeLeft] = useState(15);
    const [isMuted, setIsMuted] = useState(false);
    const [canSkip, setCanSkip] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        // Reset state when ad opens
        setTimeLeft(15);
        setCanSkip(false);
        setIsFinished(false);

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setIsFinished(true);
                    return 0;
                }
                if (prev === 10) setCanSkip(true); // Allow skip after 5 seconds
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4">
            {/* Top Bar */}
            <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-2 bg-black/40 border border-white/20 rounded-full"
                    >
                        {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                    </button>
                    <div className="px-3 py-1 bg-black/40 border border-white/20 rounded-full text-white text-xs font-mono">
                        {timeLeft}s
                    </div>
                </div>

                {isFinished ? (
                    <button
                        onClick={() => { playSFX('CLICK'); onClose(true); }}
                        className="p-2 bg-green-500 text-black border-2 border-white rounded-sm shadow-[2px_2px_0_#000]"
                    >
                        <X className="w-6 h-6" />
                    </button>
                ) : canSkip ? (
                    <button
                        onClick={() => { playSFX('CLICK'); onClose(false); }}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white text-xs font-black uppercase border border-white/40 italic"
                    >
                        Skip Video <SkipForward className="w-4 h-4" />
                    </button>
                ) : null}
            </div>

            {/* Ad Content Interface */}
            <div className="w-full max-w-sm space-y-6 text-center">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="aspect-square bg-zinc-900 border-4 border-yellow-400 p-8 flex flex-col items-center justify-center relative shadow-[0_0_40px_rgba(250,204,21,0.2)]"
                >
                    <div className="absolute top-0 left-0 bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5">ADVERTISEMENT</div>
                    <div className="w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
                        <Play className="w-10 h-10 text-yellow-400 fill-yellow-400" />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase italic leading-tight">Win Nanites in<br /><span className="text-yellow-400">Gachi Arena 2</span></h3>
                    <p className="text-zinc-500 text-xs mt-4 uppercase font-bold tracking-widest">REWARD: +25 NTS</p>

                    <div className="mt-8 flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-3 h-3 bg-yellow-400 rounded-full" />)}
                    </div>
                </motion.div>

                <div className="space-y-4">
                    <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-tighter">
                        {isFinished ? "Video finished. Reward unlocked!" : "Watch until the end to receive your energy and nanites."}
                    </p>

                    <AnimatePresence>
                        {isFinished && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="flex items-center justify-center gap-2 text-green-400 font-marker text-2xl"
                            >
                                <CheckCircle2 className="w-8 h-8" /> REWARD READY!
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Call to Action */}
            <div className="absolute bottom-8 inset-x-4">
                <button className="w-full max-w-sm mx-auto py-4 bg-yellow-400 text-black font-marker text-2xl uppercase shadow-[6px_6px_0_#FFF] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                    DOWNLOAD NOW
                </button>
            </div>

            {/* Background Aesthetic */}
            <div className="absolute inset-0 -z-10 opacity-30">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#fbbf24_0%,_transparent_70%)] blur-3xl" />
            </div>
        </div>
    );
}
