import React from 'react';
import { motion } from 'motion/react';

type StickerType = 'NANITE' | 'ENERGY' | 'AD' | 'SCRAP_STACK' | 'MEGA_PACK';

interface GachiStickerProps {
    type: StickerType;
    className?: string;
    glow?: boolean;
}

export function GachiSticker({ type, className = "w-12 h-12", glow = false }: GachiStickerProps) {
    const getStickerContent = () => {
        switch (type) {
            case 'NANITE':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                        {/* Outline Offset (Shadow) */}
                        <path d="M50 10 L85 40 L70 90 L30 90 L15 40 Z" fill="black" transform="translate(4, 4)" />
                        {/* Main White Border */}
                        <path d="M50 10 L85 40 L70 90 L30 90 L15 40 Z" fill="white" stroke="black" strokeWidth="6" />
                        {/* Crystal Body */}
                        <path d="M50 20 L75 42 L63 80 L37 80 L25 42 Z" fill="#22d3ee" stroke="black" strokeWidth="3" />
                        {/* Facets / Shine */}
                        <path d="M50 20 L50 80" stroke="black" strokeWidth="2" strokeDasharray="4 2" />
                        <path d="M50 20 L25 42" stroke="black" strokeWidth="2" />
                        <path d="M50 20 L75 42" stroke="black" strokeWidth="2" />
                        <circle cx="40" cy="35" r="3" fill="white" opacity="0.8" />
                    </svg>
                );
            case 'ENERGY':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                        {/* Shadow */}
                        <path d="M30 15 L70 15 L75 85 L25 85 Z" fill="black" transform="translate(4, 4)" />
                        {/* Main Border */}
                        <path d="M30 15 L70 15 L75 85 L25 85 Z" fill="white" stroke="black" strokeWidth="6" />
                        {/* Battery Body */}
                        <rect x="35" y="25" width="30" height="50" fill="#4ade80" stroke="black" strokeWidth="3" />
                        {/* Charge Lines */}
                        <rect x="40" y="32" width="20" height="6" fill="black" opacity="0.3" />
                        <rect x="40" y="44" width="20" height="6" fill="black" opacity="0.3" />
                        <rect x="40" y="56" width="20" height="6" fill="black" opacity="0.3" />
                        {/* Bolt */}
                        <path d="M50 25 L40 50 L50 50 L45 75 L60 45 L50 45 L55 25 Z" fill="white" stroke="black" strokeWidth="2" />
                    </svg>
                );
            case 'AD':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                        <rect x="15" y="25" width="70" height="50" fill="black" transform="translate(4, 4)" />
                        <rect x="15" y="25" width="70" height="50" fill="white" stroke="black" strokeWidth="6" />
                        <rect x="22" y="32" width="56" height="36" fill="#facc15" stroke="black" strokeWidth="3" />
                        {/* Play triangle */}
                        <path d="M42 40 L62 50 L42 60 Z" fill="black" />
                        <path d="M20 20 L30 20" stroke="black" strokeWidth="6" />
                        <path d="M70 80 L80 80" stroke="black" strokeWidth="6" />
                    </svg>
                );
            case 'SCRAP_STACK':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                        <circle cx="50" cy="50" r="40" fill="black" transform="translate(4, 4)" />
                        <circle cx="50" cy="50" r="40" fill="white" stroke="black" strokeWidth="6" />
                        <path d="M30 50 L70 50 M50 30 L50 70 M35 35 L65 65 M35 65 L65 35" stroke="black" strokeWidth="8" strokeLinecap="round" />
                        <circle cx="50" cy="50" r="15" fill="#ef4444" stroke="black" strokeWidth="4" />
                    </svg>
                );
            case 'MEGA_PACK':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                        <rect x="20" y="20" width="60" height="60" fill="black" transform="translate(5, 5) rotate(5)" />
                        <rect x="20" y="20" width="60" height="60" fill="white" stroke="black" strokeWidth="6" />
                        <rect x="28" y="28" width="44" height="44" fill="#a855f7" stroke="black" strokeWidth="4" />
                        <path d="M50 35 L50 65 M35 50 L65 50" stroke="white" strokeWidth="8" strokeLinecap="round" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <div className={`relative ${className} flex items-center justify-center`}>
            {glow && (
                <motion.div
                    animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full"
                />
            )}
            <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                className="w-full h-full"
            >
                {getStickerContent()}
            </motion.div>
        </div>
    );
}
