import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Zap } from 'lucide-react';

interface Particle {
  id: string;
  type: 'scrap' | 'xp';
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

export const spawnParticles = (type: 'scrap' | 'xp', amount: number, startX: number, startY: number) => {
  const event = new CustomEvent('spawn-particles', {
    detail: { type, amount, startX, startY }
  });
  window.dispatchEvent(event);
};

export function ParticleSystem() {
  const [particles, setParticles] = useState<Particle[]>([]);
  
  // Target coordinates (approximate based on header layout)
  // We can also use refs if we passed them down, but hardcoded % or px is easier for now
  // Scrap is roughly top right-ish (right side of left group? no, it's in the header)
  // Let's look at the header layout in App.tsx:
  // Left: Logo
  // Right: Mute, Scrap, Rank, Fusion, Leaderboard
  // Scrap is the 2nd item from left in the right group.
  
  // We can use element.getBoundingClientRect() if we tag the elements with IDs.
  
  useEffect(() => {
    const handleSpawn = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const { type, amount, startX, startY } = detail;
      
      // Determine target based on type
      let targetX = window.innerWidth - 120; // Default fallback
      let targetY = 40;

      const scrapEl = document.getElementById('scrap-counter');
      const rankEl = document.getElementById('rank-counter');

      if (type === 'scrap' && scrapEl) {
        const rect = scrapEl.getBoundingClientRect();
        targetX = rect.left + rect.width / 2;
        targetY = rect.top + rect.height / 2;
      } else if (type === 'xp' && rankEl) {
        const rect = rankEl.getBoundingClientRect();
        targetX = rect.left + rect.width / 2;
        targetY = rect.top + rect.height / 2;
      }

      // Limit particles to avoid lag
      const particleCount = Math.min(amount, 10); 
      const newParticles: Particle[] = [];

      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: crypto.randomUUID(),
          type,
          x: startX + (Math.random() * 40 - 20),
          y: startY + (Math.random() * 40 - 20),
          targetX: targetX,
          targetY: targetY
        });
      }

      setParticles(prev => [...prev, ...newParticles]);
    };

    window.addEventListener('spawn-particles', handleSpawn);
    return () => window.removeEventListener('spawn-particles', handleSpawn);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      <AnimatePresence>
        {particles.map((p) => (
          <ParticleItem key={p.id} particle={p} onComplete={() => setParticles(prev => prev.filter(i => i.id !== p.id))} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ParticleItem({ particle, onComplete }: { particle: Particle, onComplete: () => void }) {
  return (
    <motion.div
      initial={{ x: particle.x, y: particle.y, scale: 0, opacity: 1 }}
      animate={{ 
        x: particle.targetX, 
        y: particle.targetY, 
        scale: 0.5,
        opacity: 0
      }}
      transition={{ 
        duration: 0.8, 
        ease: "easeInOut",
        // Add some randomness to the path?
      }}
      onAnimationComplete={onComplete}
      className="absolute"
    >
      {particle.type === 'scrap' ? (
        <Database className="w-4 h-4 text-yellow-400 fill-yellow-400" />
      ) : (
        <div className="w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
      )}
    </motion.div>
  );
}
