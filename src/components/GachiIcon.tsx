import React, { useEffect, useState } from 'react';
import { getGachiIcon, GACHI_ICON_PROMPTS } from '../services/gachiIcons';
import { loadIcon } from '../services/storage';
import { motion } from 'motion/react';

interface GachiIconProps {
  type: keyof typeof GACHI_ICON_PROMPTS;
  className?: string;
  fallback?: React.ReactNode;
}

// Built-in emoji fallbacks so we never need to call the API just for icons
const EMOJI_FALLBACKS: Record<string, string> = {
  SCRAP: '⚙️',
  HP: '❤️',
  ATK: '⚔️',
  DEF: '🛡️',
  SPD: '⚡',
  LEVEL: '⭐',
  SCAN: '👁️',
  ARENA: '💀',
  RANK: '🏅',
  NANITE: '💎',
};

export function GachiIcon({ type, className = "w-6 h-6", fallback }: GachiIconProps) {
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchIcon = async () => {
      setIsLoading(true);
      // Only load from cache (IndexedDB/localStorage), never call the API for icons
      // This prevents wasting image generation quota on small icons
      const cached = await loadIcon(type);
      if (isMounted) {
        setIconUrl(cached || null);
        setIsLoading(false);
      }
    };
    fetchIcon();
    return () => { isMounted = false; };
  }, [type]);

  if (isLoading) {
    return (
      <div className={`${className} bg-zinc-800 animate-pulse rounded-sm border border-zinc-700`} />
    );
  }

  // If we have a cached AI-generated icon, show it
  if (iconUrl) {
    return (
      <motion.img
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        src={iconUrl}
        alt={type}
        className={`${className} object-contain invert grayscale brightness-200 contrast-200`}
        referrerPolicy="no-referrer"
      />
    );
  }

  // Fallback: use emoji or provided fallback
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <span className={`${className} flex items-center justify-center text-base`}>
      {EMOJI_FALLBACKS[type] || '🔹'}
    </span>
  );
}
