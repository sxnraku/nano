import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { Shield, Sword, Zap, Heart, RefreshCw, X, Hand, Trophy, Flame, ZapOff, ShieldOff, Wind, Plus, Activity } from 'lucide-react';
import type { WarriorData, Weapon } from '../services/gemini';
import { useAudio } from '../services/audioService';
import { BattleVictory } from './BattleVictory';
import { translations, type Language } from '../services/localizationService';

import { MOCK_OPPONENTS } from '../data/mocks';
import { Haptics } from '@capacitor/haptics';
import { subscribeToPvPSession, updatePvPStats, type PVPSession } from '../services/firebase';
import { generateId } from '../services/utils';

// Haptic Feedback Utility
const vibrate = async (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
  try {
    await Haptics.vibrate();
  } catch (e) { }
};

interface BattleArenaProps {
  player: WarriorData;
  playerTeam?: WarriorData[];
  opponent: WarriorData;
  opponentTeam?: WarriorData[];
  mode: 'classic' | 'survival' | 'blitz' | 'boss' | 'gang_war' | 'pvp';
  pvpSessionId?: string;
  isHost?: boolean;
  onClose: () => void;
  onWin?: (data?: string | number | { wave?: number, score?: number, combo?: number, damageDealt?: number }) => void;
  onLoss?: () => void;
  inventory: Weapon[];
  activeBuffs?: Array<{
    id: string;
    name: string;
    stat?: string;
    value: number;
    effect?: string;
  }>;
  onConsumeBuffs?: () => void;
  language?: Language;
  onRaidDamage?: (damage: number) => void;
  userId?: string;
  unlockedTrophies?: string[];
  totalTrophies?: number;
  onWatchAd?: () => Promise<void>;
}

interface DamageNumber {
  id: string;
  value: number;
  target: 'player' | 'opponent';
  isCrit: boolean;
  x: number;
  y: number;
  text?: string;
  element?: string;
}

const StatusEffectBadge = ({ type, duration, t }: { type: string, duration: number, t: any }) => {
  let icon = null;
  let color = '';
  let label = '';

  switch (type) {
    case 'burn':
      icon = <Flame className="w-3 h-3" />;
      color = 'bg-orange-500 text-white';
      label = t.battle_status_burn;
      break;
    case 'stun':
      icon = <ZapOff className="w-3 h-3" />;
      color = 'bg-yellow-400 text-black';
      label = t.battle_status_stun;
      break;
    case 'def_break':
      icon = <ShieldOff className="w-3 h-3" />;
      color = 'bg-slate-500 text-white';
      label = t.battle_status_break;
      break;
    default: return null;
  }

  return (
    <motion.div
      initial={{ scale: 0, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, rotate: 10 }}
      className={`flex items-center gap-1.5 px-2 py-0.5 font-black border-2 border-black shadow-[3px_3px_0_#000] gachi-skew ${color}`}
    >
      <div className="shrink-0">{icon}</div>
      <span className="uppercase text-[10px] tracking-tighter italic">{label} {duration}s</span>
    </motion.div>
  );
};

const PassiveIndicator = ({ passive }: { passive?: WarriorData['passive'] }) => {
  if (!passive) return null;

  let icon = <Activity className="w-3 h-3" />;
  let color = 'bg-zinc-700 text-white';

  switch (passive.effect) {
    case 'lifesteal':
    case 'regen':
      icon = <Heart className="w-3 h-3" />;
      color = 'bg-rose-500 text-white';
      break;
    case 'defense_boost':
      icon = <Shield className="w-3 h-3" />;
      color = 'bg-blue-500 text-white';
      break;
    case 'damage_boost_low_hp':
    case 'crit_boost':
      icon = <Sword className="w-3 h-3" />;
      color = 'bg-red-500 text-white';
      break;
    case 'energy_boost':
      icon = <Zap className="w-3 h-3" />;
      color = 'bg-yellow-500 text-black';
      break;
    case 'dodge_chance':
      icon = <Wind className="w-3 h-3" />;
      color = 'bg-sky-400 text-black';
      break;
    case 'burn_chance':
      icon = <Flame className="w-3 h-3" />;
      color = 'bg-orange-500 text-white';
      break;
    case 'stun_chance':
      icon = <ZapOff className="w-3 h-3" />;
      color = 'bg-purple-500 text-white';
      break;
  }

  return (
    <div 
      className={`flex items-center gap-1.5 px-2 py-0.5 font-black border-2 border-black shadow-[2px_2px_0_#000] -skew-x-6 ${color}`} 
      title={passive.description}
    >
      <div className="shrink-0">{icon}</div>
      <span className="uppercase text-[9px] truncate max-w-[90px] italic tracking-tight">{passive.name}</span>
    </div>
  );
};

export function BattleArena({
  player: initialPlayer,
  playerTeam: initialPlayerTeam,
  opponent: initialOpponent,
  opponentTeam: initialOpponentTeam,
  mode,
  onClose,
  onWin,
  onLoss,
  inventory,
  activeBuffs,
  pvpSessionId,
  isHost = false,
  onConsumeBuffs,
  language = 'en',
  onRaidDamage,
  userId,
  unlockedTrophies,
  totalTrophies,
  onWatchAd
}: BattleArenaProps) {
  const t = translations[language];
  const { playSFX } = useAudio();
  const controls = useAnimation(); // For camera shake

  // Consume buffs on mount
  useEffect(() => {
    if (onConsumeBuffs) {
      onConsumeBuffs();
    }
  }, []);

  // Gang War State
  const [playerTeam, setPlayerTeam] = useState<WarriorData[]>(initialPlayerTeam || [initialPlayer]);
  const [opponentTeam, setOpponentTeam] = useState<WarriorData[]>(initialOpponentTeam || [initialOpponent]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [currentOpponentIdx, setCurrentOpponentIdx] = useState(0);

  const player = playerTeam[currentPlayerIdx];
  const currentOpponent = opponentTeam[currentOpponentIdx];

  // Weapon Logic
  const playerWeapon = inventory.find(w => w.id === player.equippedWeaponId);
  const getEffectiveStats = (warrior: WarriorData, weapon?: Weapon, buffs?: any[]) => {
    let stats = {
      hp: warrior.stats.hp + (weapon?.stats.hp || 0),
      atk: warrior.stats.atk + (weapon?.stats.atk || 0),
      def: warrior.stats.def + (weapon?.stats.def || 0),
      spd: warrior.stats.spd + (weapon?.stats.spd || 0),
    };

    if (buffs) {
      buffs.forEach(buff => {
        if (buff.effect === 'buff_all') {
          stats.hp = Math.floor(stats.hp * buff.value);
          stats.atk = Math.floor(stats.atk * buff.value);
          stats.def = Math.floor(stats.def * buff.value);
          stats.spd = Math.floor(stats.spd * buff.value);
        } else if (buff.stat) {
          stats[buff.stat as keyof typeof stats] = Math.floor(stats[buff.stat as keyof typeof stats] * buff.value);
        }
      });
    }
    return stats;
  };

  const effectivePlayerStats = useMemo(() => 
    getEffectiveStats(player, playerWeapon, activeBuffs),
  [player, playerWeapon, activeBuffs]);

  // Game State
  // Game State
  const [playerHp, setPlayerHp] = useState(effectivePlayerStats.hp * 5);
  const [opponentHp, setOpponentHp] = useState(currentOpponent.stats.hp * 5); 
  const [playerEnergy, setPlayerEnergy] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gameStatus, setGameStatus] = useState<'active' | 'won' | 'lost'>('active');
  const [countdown, setCountdown] = useState<number | 'GO' | null>(3);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const hasTriggeredWin = useRef(false);
  const [comboTimerKey, setComboTimerKey] = useState(0);
  const [koText, setKoText] = useState('');

  // Status Effects State
  const [playerEffects, setPlayerEffects] = useState<{ type: 'burn' | 'stun' | 'def_break', duration: number }[]>([]);
  const [opponentEffects, setOpponentEffects] = useState<{ type: 'burn' | 'stun' | 'def_break', duration: number }[]>([]);

  // Performance Tracking
  const [maxCombo, setMaxCombo] = useState(0);
  const [totalDamageDealt, setTotalDamageDealt] = useState(0);
  const startTime = useRef<number>(Date.now());
  const [finalStats, setFinalStats] = useState<{
    timeTaken: number;
    maxCombo: number;
    hpRemaining: number;
    totalDamage: number;
  } | null>(null);

  // Mode Specific State
  const [wave, setWave] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);

  // Visual State
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [isPlayerHit, setIsPlayerHit] = useState(false);
  const [isOpponentHit, setIsOpponentHit] = useState(false);
  const [isSpecialActive, setIsSpecialActive] = useState(false);
  const [isHitStopping, setIsHitStopping] = useState(false);
  const [isFlashActive, setIsFlashActive] = useState(false);

  // Refs for game loop logic
  const lastTapTime = useRef<number>(0);
  const opponentAttackTimer = useRef<any>(null);
  const comboTimer = useRef<any>(null);
  const gameTimer = useRef<any>(null);
  const effectsTimer = useRef<any>(null);
  const pvpSyncTimer = useRef<any>(null);
  const raidSyncTimer = useRef<any>(null);
  const countdownTimer = useRef<any>(null);
  const isPvP = mode === 'pvp';

  const MAX_ENERGY = 100;
  const SPECIAL_COST = 100;

  // Helper for Shake - Reduced intensity as requested
  const triggerShake = async (intensity: number = 3, duration: number = 0.15) => {
    await controls.start({
      x: [0, -intensity, intensity, -intensity, intensity, 0],
      y: [0, -intensity, intensity, -intensity, intensity, 0],
      transition: { duration }
    });
  };

  // Elemental Logic
  const getElement = (w: WarriorData) => w.element.toLowerCase();
  const getElementalMultiplier = (attacker: WarriorData, defender: WarriorData) => {
    const a = getElement(attacker);
    const d = getElement(defender);

    if (a.includes('fire') && d.includes('plant')) return 1.5;
    if (a.includes('plant') && d.includes('water')) return 1.5;
    if (a.includes('water') && d.includes('fire')) return 1.5;
    if (a.includes('electric') && d.includes('water')) return 1.5;
    if (a.includes('water') && d.includes('electric')) return 0.8;

    if (d.includes('fire') && a.includes('plant')) return 0.5;
    if (d.includes('plant') && a.includes('water')) return 0.5;
    if (d.includes('water') && a.includes('fire')) return 0.5;

    return 1.0;
  };

  // Team Synergy Calculation
  const getTeamSynergyBonus = (team: WarriorData[], currentIndex: number) => {
    // If not gang war, no synergy
    if (mode !== 'gang_war' || !team) return { def: 0, atk: 0, regen: 0 };

    let bonus = { def: 0, atk: 0, regen: 0 };

    // Check teammates (excluding self)
    team.forEach((member, idx) => {
      if (idx === currentIndex) return; // Skip self

      // Tank in team gives DEF to everyone
      if (member.passive?.effect === 'defense_boost') bonus.def += 0.05;
      // Support (Regen) in team gives Regen
      if (member.passive?.effect === 'regen') bonus.regen += 0.005;
      // Berserker in team gives ATK
      if (member.passive?.effect === 'damage_boost_low_hp') bonus.atk += 0.05;
    });

    return bonus;
  };

  const teamSynergy = useMemo(() => 
    getTeamSynergyBonus(playerTeam, currentPlayerIdx),
  [playerTeam, currentPlayerIdx, mode]);

  const spawnDamageNumber = (value: number, target: 'player' | 'opponent', isCrit: boolean, x?: number, y?: number, text?: string, element?: string) => {
    const id = crypto.randomUUID();
    // Randomize position slightly if not provided
    const finalX = x || (target === 'opponent' ? 50 + (Math.random() * 40 - 20) : 50 + (Math.random() * 40 - 20));
    const finalY = y || (target === 'opponent' ? 40 + (Math.random() * 10 - 5) : 60 + (Math.random() * 10 - 5));

    setDamageNumbers(prev => [...prev, { id, value, target, isCrit, x: finalX, y: finalY, text, element }]);
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(dn => dn.id !== id));
    }, 800);
  };

  // PvP Real-time Sync
  useEffect(() => {
    if (!isPvP || !pvpSessionId) return;

    const unsubscribe = subscribeToPvPSession(pvpSessionId, (session) => {
      if (isHost) {
        setPlayerHp(session.hostHp * 5);
        setOpponentHp(session.guestHp * 5);
      } else {
        setPlayerHp(session.guestHp * 5);
        setOpponentHp(session.hostHp * 5);
      }
      
      if (session.status === 'finished' && gameStatus === 'active') {
        const iWon = session.winnerId === userId;
        setGameStatus(iWon ? 'won' : 'lost');
      }
    });

    return () => unsubscribe();
  }, [isPvP, pvpSessionId, isHost, gameStatus]);

  // Status Effects Loop (Burn, Regen)
  useEffect(() => {
    if (gameStatus !== 'active') return;

    effectsTimer.current = setInterval(() => {
      // Player Effects
      let playerBurnDamage = 0;
      playerEffects.forEach(effect => {
        if (effect.type === 'burn') playerBurnDamage += Math.round(effectivePlayerStats.hp * 0.02);
      });

      // Player Regen (Passive + Synergy)
      let playerRegen = 0;
      if (player.passive?.effect === 'regen') playerRegen += Math.round(effectivePlayerStats.hp * player.passive.value);
      if (teamSynergy.regen > 0) playerRegen += Math.round(effectivePlayerStats.hp * teamSynergy.regen);

      if (playerBurnDamage > 0) {
        setPlayerHp(prev => Math.max(0, prev - playerBurnDamage));
        spawnDamageNumber(playerBurnDamage, 'player', false, undefined, undefined, t.battle_burn_status);
      }
      if (playerRegen > 0 && playerHp < effectivePlayerStats.hp * 5) {
        setPlayerHp(prev => Math.min(effectivePlayerStats.hp * 5, prev + playerRegen));
        // spawnDamageNumber(playerRegen, 'player', false, undefined, undefined, 'HEAL'); // Too spammy?
      }

      // Opponent Effects
      let opponentBurnDamage = 0;
      opponentEffects.forEach(effect => {
        if (effect.type === 'burn') opponentBurnDamage += Math.round(currentOpponent.stats.hp * 0.02);
      });

      if (opponentBurnDamage > 0) {
        setOpponentHp(prev => Math.max(0, prev - opponentBurnDamage));
        spawnDamageNumber(opponentBurnDamage, 'opponent', false, undefined, undefined, t.battle_burned);
      }

      // Decrement Durations
      setPlayerEffects(prev => prev.map(e => ({ ...e, duration: e.duration - 1 })).filter(e => e.duration > 0));
      setOpponentEffects(prev => prev.map(e => ({ ...e, duration: e.duration - 1 })).filter(e => e.duration > 0));

    }, 1000);

    return () => {
      if (effectsTimer.current) clearInterval(effectsTimer.current);
    };
  }, [gameStatus]); // Only depend on gameStatus to start/stop the loop

  // Helper to get next random opponent
  const getNextOpponent = () => {
    const random = MOCK_OPPONENTS[Math.floor(Math.random() * MOCK_OPPONENTS.length)];
    // Ensure we don't get the same one immediately if possible, but for mocks it's fine
    return { ...random,    id: generateId(),
 }; // New ID to trigger animations
  };

  // Next Wave / Opponent Logic
  const handleNextOpponent = () => {
    const next = getNextOpponent();

    // Scale stats based on wave/score - Increased intensity
    let scalingFactor = 1 + (mode === 'survival' ? wave * 0.25 : mode === 'blitz' ? score * 0.1 : 0);
    if (mode === 'boss') scalingFactor = 4; // Bosses are now even tougher

    const scaledOpponent = {
      ...next,
      name: mode === 'boss' ? `BOSS: ${next.name}` : mode === 'survival' ? `[W${wave}] ${next.name}` : next.name,
      isElite: mode === 'boss' || (mode === 'survival' && wave % 5 === 0),
      stats: {
        ...next.stats,
        hp: Math.round(next.stats.hp * scalingFactor),
        atk: Math.round(next.stats.atk * (mode === 'boss' ? 2 : scalingFactor)),
        def: Math.round(next.stats.def * (scalingFactor * 0.8)),
        spd: Math.round(next.stats.spd * (scalingFactor * 0.5)),
      }
    };

    setOpponentTeam([scaledOpponent]);
    setCurrentOpponentIdx(0);
    setOpponentHp(scaledOpponent.stats.hp * 5);
    setOpponentEffects([]); // Clear effects on new opponent
    setIsFlashActive(false); // Reset flash

    if (mode === 'survival') {
      setWave(w => w + 1);
      // No automatic healing - pure survival
    } else if (mode === 'blitz') {
      setScore(s => s + 1);
      // No longer adding time - Keep it pure blitz speed
    }

    setGameStatus('active');
  };

  // Countdown Effect
  useEffect(() => {
    if (countdown === null) return;

    countdownTimer.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === 3) return 2;
        if (prev === 2) return 1;
        if (prev === 1) {
          return 'GO';
        }
        if (prev === 'GO') {
          clearInterval(countdownTimer.current);
          return null;
        }
        return prev;
      });
    }, 800); // Slightly faster for punchier feel

    return () => clearInterval(countdownTimer.current);
  }, [countdown]);

  // Player Attack (Tap) - works with both mouse and touch
  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (gameStatus !== 'active' || countdown !== null) return;

    // Prevent default to stop zooming/scrolling on fast taps (critical for mobile!)
    e.preventDefault();
    e.stopPropagation();

    // Check Stun
    if (playerEffects.some(eff => eff.type === 'stun')) {
      spawnDamageNumber(0, 'player', false, undefined, undefined, t.battle_stunned);
      vibrate(50);
      return;
    }

    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime.current;
    lastTapTime.current = now;

    // Combo Logic
    if (timeSinceLastTap < 500) {
      setCombo(c => {
        const next = Math.min(c + 1, 50);
        if (next > maxCombo) setMaxCombo(next);
        return next;
      });
    } else {
      setCombo(1);
      if (maxCombo < 1) setMaxCombo(1);
    }

    // Reset combo timer
    if (comboTimer.current) clearTimeout(comboTimer.current);
    comboTimer.current = setTimeout(() => setCombo(0), 1000);
    setComboTimerKey(prev => prev + 1);

    // Calculate Damage
    const baseDmg = Math.max(10, Math.round(effectivePlayerStats.atk * 0.25)); // Balanced for fast combat
    const comboMultiplier = 1 + (combo * 0.05);
    const elementMultiplier = getElementalMultiplier(player, currentOpponent);

    // Passive: Adrenaline (Berserker)
    let passiveMultiplier = 1;
    if (player.passive?.effect === 'damage_boost_low_hp' && playerHp < (effectivePlayerStats.hp * 5) * 0.4) {
      passiveMultiplier += player.passive.value;
    }
    passiveMultiplier += teamSynergy.atk;

    // Passive: Precision (Crit Chance)
    let critChance = 0.1 + (combo * 0.005);
    if (player.passive?.effect === 'crit_boost') critChance += player.passive.value;

    const isCrit = Math.random() < critChance;
    let damage = baseDmg * comboMultiplier * elementMultiplier * passiveMultiplier;
    if (isCrit) damage *= 2;

    // Status Effect: Defense Break (Opponent)
    if (opponentEffects.some(eff => eff.type === 'def_break')) {
      damage *= 1.3;
    }

    damage = Math.round(damage);
    setTotalDamageDealt(prev => prev + damage);

    // Apply Damage
    if (isCrit) {
      vibrate([50, 30, 50]);
      triggerShake(8, 0.2);
    } else {
      vibrate(30);
      triggerShake(4, 0.1);
    }

    const newOppHp = Math.max(0, opponentHp - damage);
    
    // Hit Stop on final blow
    if (newOppHp === 0 && !isHitStopping) {
      setIsHitStopping(true);
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 500]);
      triggerShake(15, 0.5);
      setTimeout(() => setIsHitStopping(false), 500);
    }

    setOpponentHp(newOppHp);

    // PvP Real-time Sync
    if (isPvP && pvpSessionId) {
      const targetHPField = isHost ? 'guestHp' : 'hostHp';
      updatePvPStats(pvpSessionId, { [targetHPField]: Math.floor(newOppHp / 5) });
      
      if (newOppHp <= 0) {
        updatePvPStats(pvpSessionId, { 
          status: 'finished', 
          winnerId: userId 
        });
      }
    }

    // Energy Gain
    let energyGain = 1; // Reduced to balance the higher amount of taps
    if (player.passive?.effect === 'energy_boost') energyGain = Math.round(energyGain * (1 + player.passive.value));
    setPlayerEnergy(prev => Math.min(MAX_ENERGY, prev + energyGain));

    // Passive: Lifesteal
    if (player.passive?.effect === 'lifesteal') {
      const heal = Math.round(damage * player.passive.value);
      if (heal > 0) setPlayerHp(prev => Math.min(effectivePlayerStats.hp * 5, prev + heal));
    }

    // Apply Status Effects (Chance)
    if (player.passive?.effect === 'burn_chance' && Math.random() < player.passive.value) {
      setOpponentEffects(prev => [...prev, { type: 'burn', duration: 3 }]);
      spawnDamageNumber(0, 'opponent', false, undefined, undefined, t.battle_burned);
    }
    if (player.passive?.effect === 'stun_chance' && Math.random() < player.passive.value) {
      setOpponentEffects(prev => [...prev, { type: 'stun', duration: 2 }]);
      spawnDamageNumber(0, 'opponent', false, undefined, undefined, t.battle_stunned);
    }

    // Visuals
    setIsOpponentHit(true);
    setTimeout(() => setIsOpponentHit(false), 100);

    // Minor Hit Flash
    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 50);

    spawnDamageNumber(damage, 'opponent', isCrit, undefined, undefined, undefined, getElement(player));
  }, [gameStatus, playerEffects, combo, maxCombo, effectivePlayerStats, player, currentOpponent, opponentEffects, teamSynergy, isHitStopping]);

  // Special Attack
  const handleSpecial = (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger tap
    if (gameStatus !== 'active' || countdown !== null || playerEffects.some(eff => eff.type === 'stun')) return;

    playSFX('CRITICAL');
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 200, 50, 300]); // Heavier rumble
    triggerShake(25); // Massive shake

    setIsSpecialActive(true);
    setTimeout(() => setIsSpecialActive(false), 2000);

    const damage = Math.round(effectivePlayerStats.atk * 5 * getElementalMultiplier(player, currentOpponent));
    setTotalDamageDealt(prev => prev + damage);

    // Delay damage slightly to match visual impact
    setTimeout(() => {
      setOpponentHp(prev => Math.max(0, prev - damage));
      spawnDamageNumber(damage, 'opponent', true);
      
      triggerShake(20, 0.3);

      // Special always breaks defense
      setOpponentEffects(prev => [...prev, { type: 'def_break', duration: 5 }]);
      spawnDamageNumber(0, 'opponent', false, undefined, undefined, t.battle_broken);
    }, 400);

    setPlayerEnergy(0);
  };

  // Opponent AI Loop
  // Refs for stable attack loop
  const playerRef = useRef(player);
  const opponentRef = useRef(currentOpponent);
  const playerStatsRef = useRef(effectivePlayerStats);
  const synergyRef = useRef(teamSynergy);
  const playerEffectsRef = useRef(playerEffects);
  const opponentEffectsRef = useRef(opponentEffects);

  useEffect(() => {
    playerRef.current = player;
    opponentRef.current = currentOpponent;
    playerStatsRef.current = effectivePlayerStats;
    synergyRef.current = teamSynergy;
    playerEffectsRef.current = playerEffects;
    opponentEffectsRef.current = opponentEffects;
  }, [player, currentOpponent, effectivePlayerStats, teamSynergy, playerEffects, opponentEffects]);

  useEffect(() => {
    if (gameStatus !== 'active' || isPvP || countdown !== null || isFinalizing) return; // No bot attacks in PvP or during countdown/finalizing

    const attackInterval = Math.max(800, 2000 - (opponentRef.current.stats.spd * 15)); // Slower but steadier interval

    opponentAttackTimer.current = setInterval(() => {
      // Check Stun
      if (opponentEffectsRef.current.some(e => e.type === 'stun')) {
        return; 
      }

      const currentOpp = opponentRef.current;
      const currentPlayer = playerRef.current;
      const stats = playerStatsRef.current;
      const synergy = synergyRef.current;
      const pEffects = playerEffectsRef.current;

      // Opponent damage - Balanced for fast combat
      const baseDmg = Math.max(15, Math.round(currentOpp.stats.atk * 0.22)); 
      const elementMultiplier = getElementalMultiplier(currentOpp, currentPlayer);
      let damage = Math.round(baseDmg * elementMultiplier);

      // Defense reduction
      let def = stats.def;
      if (currentPlayer.passive?.effect === 'defense_boost') def *= (1 + currentPlayer.passive.value);
      def *= (1 + synergy.def);

      if (pEffects.some(e => e.type === 'def_break')) def *= 0.5;

      const defenseReduction = def * 0.05; // Reduced defense impact
      damage = Math.max(5, damage - defenseReduction);
      damage = Math.round(damage * (0.8 + Math.random() * 0.4));

      if (currentPlayer.passive?.effect === 'dodge_chance' && Math.random() < currentPlayer.passive.value) {
        spawnDamageNumber(0, 'player', false, undefined, undefined, t.battle_dodge);
        return;
      }

      setPlayerHp(prev => Math.max(0, prev - damage));
      setIsPlayerHit(true);
      if ('vibrate' in navigator) navigator.vibrate(30); // Lighter vibration
      triggerShake(6); // Lighter shake
      setTimeout(() => setIsPlayerHit(false), 120);
      spawnDamageNumber(damage, 'player', false, 50, 60);
      console.log(`Opponent attacked for ${damage} damage. HP remaining: ${playerHp - damage}`);

    }, attackInterval);

    return () => {
      if (opponentAttackTimer.current) clearInterval(opponentAttackTimer.current);
    };
  }, [gameStatus, currentOpponent.id, countdown, isFinalizing]); // Added countdown and isFinalizing to dependencies

  // Blitz Timer
  useEffect(() => {
    if (mode === 'blitz' && gameStatus === 'active') {
      gameTimer.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Stop attack timer
            if (opponentAttackTimer.current) clearInterval(opponentAttackTimer.current);
            
            setGameStatus('won'); // Final result
            hasTriggeredWin.current = true;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (gameTimer.current) clearInterval(gameTimer.current);
    };
  }, [mode, gameStatus]);

  // Win/Loss Check — with dramatic KO delay and reward reveal
  useEffect(() => {
    if (hasTriggeredWin.current || gameStatus !== 'active') return; 

    if (playerHp <= 0) {
      if (mode === 'gang_war' && currentPlayerIdx < playerTeam.length - 1) {
        const nextIdx = currentPlayerIdx + 1;
        setCurrentPlayerIdx(nextIdx);
        const nextPlayer = playerTeam[nextIdx];
        const nextWeapon = inventory.find(w => w.id === nextPlayer.equippedWeaponId);
        const nextStats = getEffectiveStats(nextPlayer, nextWeapon);
        setPlayerHp(nextStats.hp * 5);
        setPlayerEnergy(0);
        playSFX('HIT');
        vibrate(200);
        spawnDamageNumber(0, 'player', false, 50, 50);
      } else {
        hasTriggeredWin.current = true;
        // Stop all timers immediately
        if (opponentAttackTimer.current) clearInterval(opponentAttackTimer.current);
        if (gameTimer.current) clearInterval(gameTimer.current);

        // Instant loss result
        setIsFinalizing(true);
        playSFX('LOSS');
        vibrate([100, 50, 100]); // Reduced
        triggerShake(15); // Reduced

        setTimeout(() => {
          setGameStatus('lost');
          setIsFinalizing(false);
          setShowSummary(true);
          if (onLoss) onLoss();
        }, 2000);
      }
    } else if (opponentHp <= 0) {
      if (mode === 'gang_war' && currentOpponentIdx < opponentTeam.length - 1) {
        const nextIdx = currentOpponentIdx + 1;
        setCurrentOpponentIdx(nextIdx);
        const nextOpponent = opponentTeam[nextIdx];
        setOpponentHp(nextOpponent.stats.hp * 5);
        playSFX('HIT');
        vibrate(100);
        spawnDamageNumber(0, 'opponent', false, 50, 50);
      } else if (mode === 'classic' || mode === 'boss' || mode === 'gang_war') {
        hasTriggeredWin.current = true;
        // Stop all timers immediately
        if (opponentAttackTimer.current) clearInterval(opponentAttackTimer.current);

        const timeTaken = Math.round((Date.now() - startTime.current) / 1000);
        setFinalStats({
          timeTaken,
          maxCombo,
          hpRemaining: playerHp,
          totalDamage: totalDamageDealt
        });

        setIsFinalizing(true);
        playSFX('WIN');
        vibrate([100, 50, 200]); // Reduced
        triggerShake(12); // Reduced

        setTimeout(() => {
          setGameStatus('won');
          setIsFinalizing(false);
          setShowSummary(true);
        }, 2000);
      } else if (mode === 'survival') {
        hasTriggeredWin.current = true;
        if (opponentAttackTimer.current) clearInterval(opponentAttackTimer.current);

        playSFX('WIN');
        vibrate(100);
        handleNextOpponent(); // Progress to next wave
      } else if (mode === 'blitz') {
        handleNextOpponent(); // Next opponent in blitz
        playSFX('HIT');
      }
    }
  }, [playerHp, opponentHp]);

  // Reset win trigger on new opponent
  useEffect(() => {
    hasTriggeredWin.current = false;
  }, [currentOpponent.id]);

  // Initial Start
  useEffect(() => {
    if (mode === 'boss') {
      const scalingFactor = 3;
      const boss = {
        ...initialOpponent,
        name: `BOSS: ${initialOpponent.name}`,
        stats: {
          ...initialOpponent.stats,
          hp: Math.round(initialOpponent.stats.hp * scalingFactor),
          atk: Math.round(initialOpponent.stats.atk * 1.5),
        }
      };
      setOpponentTeam([boss]);
      setCurrentOpponentIdx(0);
      setOpponentHp(boss.stats.hp * 5); // Consistent multiplier
    }
    // setGameStatus('active'); - redundant, already active by default
    if (mode === 'boss' && onRaidDamage) {
      raidSyncTimer.current = setInterval(() => {
        // Report incremental damage if needed, or total so far
        // For simplicity, let's just report at the end unless it's a huge boss
      }, 5000);
    }

    return () => {
      if (opponentAttackTimer.current) clearInterval(opponentAttackTimer.current);
      if (comboTimer.current) clearTimeout(comboTimer.current);
      if (gameTimer.current) clearInterval(gameTimer.current);
      if (raidSyncTimer.current) clearInterval(raidSyncTimer.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] scale-150" />
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/40 via-transparent to-cyan-900/40" />
      </div>
      {/* Main Tap Area — uses onTouchStart for instant mobile response + onClick for desktop */}
      <div
        className="absolute inset-0 z-0 cursor-crosshair active:bg-red-500/5 transition-colors select-none"
        onTouchStart={handleTap}
        onClick={handleTap}
        style={{ touchAction: 'none', WebkitTapHighlightColor: 'transparent', WebkitUserSelect: 'none', userSelect: 'none' }}
      />

      <motion.div
        animate={controls}
        className="w-full max-w-lg h-full max-h-screen flex flex-col relative pointer-events-none"
      >
        {/* HUD */}

        {/* Header / HUD */}
        <div className="p-4 pt-safe z-20 pointer-events-auto">
          <div className="flex justify-between items-start">
            <button onClick={onClose} className="p-2 bg-black text-white border-2 border-white rounded-full">
              <X className="w-6 h-6" />
            </button>

            {/* Mode Specific HUD */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
              {mode === 'gang_war' && (
                <>
                  <div className="bg-orange-600 text-white px-6 py-1.5 border-4 border-black font-black uppercase text-2xl shadow-[6px_6px_0_#000] rotate-2 mb-2 gachi-skew italic">
                    GANG WAR
                  </div>
                  {/* Synergy Indicators */}
                  {(teamSynergy.atk > 0 || teamSynergy.def > 0 || teamSynergy.regen > 0) && (
                    <div className="flex gap-2 scale-75 origin-top">
                      {teamSynergy.atk > 0 && (
                        <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 border border-black shadow-[2px_2px_0_#000]">
                          <Sword className="w-3 h-3" />
                          <span className="text-xs font-bold">+{Math.round(teamSynergy.atk * 100)}%</span>
                        </div>
                      )}
                      {teamSynergy.def > 0 && (
                        <div className="flex items-center gap-1 bg-blue-500 text-white px-2 py-0.5 border border-black shadow-[2px_2px_0_#000]">
                          <Shield className="w-3 h-3" />
                          <span className="text-xs font-bold">+{Math.round(teamSynergy.def * 100)}%</span>
                        </div>
                      )}
                      {teamSynergy.regen > 0 && (
                        <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-0.5 border border-black shadow-[2px_2px_0_#000]">
                          <Heart className="w-3 h-3" />
                          <span className="text-xs font-bold">REGEN</span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
              {mode === 'survival' && (
                <div className="bg-red-600 text-white px-6 py-1.5 border-4 border-black font-black uppercase text-2xl shadow-[6px_6px_0_#000] -rotate-1 gachi-skew italic">
                  WAVE {wave}
                </div>
              )}
              {mode === 'blitz' && (
                <div className={`px-6 py-1.5 border-4 border-black font-black uppercase text-2xl shadow-[6px_6px_0_#000] rotate-1 gachi-skew italic ${timeLeft < 10 ? 'bg-red-600 text-white animate-pulse' : 'bg-yellow-400 text-black'}`}>
                  {timeLeft}S
                </div>
              )}
              {mode === 'blitz' && (
                <div className="mt-1 text-xs font-black text-white bg-black px-2">
                  KILLS: {score}
                </div>
              )}
              {mode === 'boss' && (
                <div className="bg-purple-600 text-white px-6 py-2 border-4 border-black font-black uppercase text-2xl shadow-[6px_6px_0_#000] -rotate-2 animate-pulse">
                  BOSS BATTLE
                </div>
              )}
            </div>

            {/* Combo Counter */}
            <AnimatePresence>
              {combo > 1 && (
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1.5, rotate: 0 }}
                  exit={{ scale: 0 }}
                  key="combo"
                  className="relative flex flex-col items-center justify-center w-20 h-20"
                >
                  <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none overflow-visible" viewBox="0 0 100 100" style={{ width: '120%', height: '120%', left: '-10%', top: '-10%' }}>
                    <motion.circle
                      key={comboTimerKey}
                      cx="50" cy="50" r="45"
                      fill="none"
                      stroke="#FACC15"
                      strokeWidth="6"
                      initial={{ pathLength: 1 }}
                      animate={{ pathLength: 0 }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </svg>
                  <span className="text-6xl font-glitch text-yellow-400 italic drop-shadow-[6px_6px_0_#000] text-stroke relative z-10 uppercase">
                    {combo}x
                  </span>
                  <span className="text-xs font-black text-white bg-red-600 px-3 py-0.5 border-2 border-black uppercase relative z-10 -rotate-6 shadow-[3px_3px_0_#000]">Combo!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Battle Area */}
        <div className="flex-1 flex flex-col justify-between p-6 relative">

          {/* Opponent (Top) */}
          <div className="flex flex-col items-center relative z-10">
            {mode === 'gang_war' && (
              <div className="flex gap-1 mb-2">
                {opponentTeam.map((w, idx) => (
                  <div
                    key={w.id}
                    className={`w-3 h-3 border border-black ${idx < currentOpponentIdx ? 'bg-zinc-800' : idx === currentOpponentIdx ? 'bg-red-500 animate-pulse' : 'bg-zinc-400'}`}
                  />
                ))}
              </div>
            )}
            <motion.div
              key={currentOpponent.id}
              animate={
                isOpponentHit ? 
                  { opacity: 1, scale: 1.05, x: [0, -5, 5, -5, 5, 0], filter: 'brightness(1.5)' } : 
                  { opacity: 1, scale: 1, y: [0, -5, 0] }
              }
              transition={isOpponentHit ? 
                { duration: 0.1, ease: "easeOut" } : 
                { duration: 3, repeat: Infinity, ease: "easeInOut" }
              }
              className="relative"
            >
              <div className="relative p-2 bg-zinc-800 border-4 border-black shadow-[10px_10px_0_#000] rotate-2">
                <img
                  src={currentOpponent.imageUrl}
                  className="w-56 h-56 object-contain bg-zinc-900/50"
                  alt={currentOpponent.name}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop';
                  }}
                />
                <div className="absolute inset-0 border-4 border-black/40 pointer-events-none" />
              </div>

              {/* Enhanced Elite/Boss Frame */}
              {(currentOpponent.isElite || mode === 'boss') && (
                <div className="absolute -inset-2 border-4 border-yellow-400 rotate-1 animate-pulse pointer-events-none" />
              )}

              {/* Rarity Badge */}
              <div className={`absolute -top-3 -right-3 px-2 py-0.5 border border-black text-[10px] font-black uppercase shadow-[2px_2px_0_#000] rotate-6 z-20 ${currentOpponent.rarity === 'Legendary' ? 'bg-yellow-400 text-black' :
                currentOpponent.rarity === 'Epic' ? 'bg-purple-600 text-white' :
                  currentOpponent.rarity === 'Rare' ? 'bg-blue-600 text-white' :
                    'bg-zinc-400 text-black'
                }`}>
                {currentOpponent.rarity === 'Legendary' ? 'LEGENDARY' :
                  currentOpponent.rarity === 'Epic' ? 'EPIC' :
                    currentOpponent.rarity === 'Rare' ? 'RARE' :
                      'COMMON'}
              </div>

              {/* HP Bar - Brutalist Style */}
              <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black border-[4px] border-white ${mode === 'boss' ? 'w-80 h-12' : 'w-64 h-10'} rotate-2 shadow-[8px_8px_0_#000]`}>
                <div className="absolute inset-0 bg-noise opacity-30" />
                <motion.div
                  className={`h-full ${mode === 'boss' ? 'bg-purple-600' : 'bg-red-600'} relative`}
                  initial={{ width: '100%' }}
                   animate={{ width: `${(opponentHp / (currentOpponent.stats.hp * 5)) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
                </motion.div>
                <span className={`absolute inset-0 flex items-center justify-center font-glitch text-white italic drop-shadow-[4px_4px_0_#000] tracking-tighter uppercase ${mode === 'boss' ? 'text-xl' : 'text-base'}`}>
                  {currentOpponent.name}
                </span>
              </div>

              {/* Status Effects & Passive (Opponent) */}
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 w-full">
                <div className="flex flex-wrap justify-center gap-1">
                  <AnimatePresence>
                    {opponentEffects.map((effect, idx) => (
                      <StatusEffectBadge key={`${effect.type}-${idx}`} type={effect.type} duration={effect.duration} t={t} />
                    ))}
                  </AnimatePresence>
                </div>
                {currentOpponent.passive && (
                  <div className="opacity-90 scale-90">
                    <PassiveIndicator passive={currentOpponent.passive} />
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* VS / Tap Indicator */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none flex flex-col items-center opacity-30">
            <Hand className="w-72 h-72 text-white/40 animate-pulse" />
            <motion.div 
               animate={{ y: [0, -5, 0], scale: [1, 1.05, 1] }}
               transition={{ duration: 1.5, repeat: Infinity }}
               className="text-2xl font-black text-yellow-400 italic tracking-tighter mt-[-20px] drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] bg-black/60 px-6 py-1 border-2 border-yellow-400/30 z-20 uppercase"
            >
              Tap to Strike!
            </motion.div>
          </div>

          {/* Player (Bottom) */}
          <div className="flex flex-col items-center relative z-10 pb-10">
            {mode === 'gang_war' && (
              <div className="flex gap-1 mb-2">
                {playerTeam.map((w, idx) => (
                  <div
                    key={w.id}
                    className={`w-3 h-3 border border-black ${idx < currentPlayerIdx ? 'bg-zinc-800' : idx === currentPlayerIdx ? 'bg-cyan-500 animate-pulse' : 'bg-cyan-200'}`}
                  />
                ))}
              </div>
            )}
            <motion.div
              animate={
                isPlayerHit ? { x: [-5, 5, -5, 5, 0], filter: 'brightness(1.3)' } : {}
              }
              className="relative"
            >
              {/* Special Button (Overlay on Player or nearby) */}
              <button
                onClick={handleSpecial}
                disabled={playerEnergy < MAX_ENERGY}
                className={`absolute -top-24 left-1/2 -translate-x-1/2 pointer-events-auto transition-all transform ${playerEnergy >= MAX_ENERGY
                  ? 'scale-125 hover:scale-150 cursor-pointer z-50'
                  : 'scale-90 opacity-40 grayscale'
                  }`}
              >
                <div className={`w-24 h-24 rounded-none border-[6px] border-black flex items-center justify-center shadow-[6px_6px_0_#000] rotate-3 ${playerEnergy >= MAX_ENERGY ? 'bg-yellow-400 animate-pulse' : 'bg-zinc-800'
                  }`}>
                  <Zap className={`w-12 h-12 ${playerEnergy >= MAX_ENERGY ? 'text-black fill-black' : 'text-zinc-600'}`} />
                </div>
                {playerEnergy >= MAX_ENERGY && (
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-black px-4 py-1 border-2 border-black whitespace-nowrap -rotate-6 shadow-[3px_3px_0_#000] z-20">
                    ULTIMATE READY!!
                  </div>
                )}
              </button>

              <div className="relative p-2 bg-zinc-800 border-4 border-black shadow-[-10px_10px_0_#000] -rotate-2">
                <img
                  src={player.imageUrl}
                  className="w-48 h-48 object-cover"
                  alt={player.name}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1549488344-1f9b009695be?q=80&w=2070&auto=format&fit=crop';
                  }}
                />
                <div className="absolute inset-0 border-4 border-black/40 pointer-events-none" />
              </div>

              {/* HP Bar - Player */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-72 h-12 bg-black border-[4px] border-white -rotate-2 shadow-[-8px_8px_0_#000]">
                <div className="absolute inset-0 bg-noise opacity-30" />
                <motion.div
                  className="h-full bg-cyan-500 relative"
                  initial={{ width: '100%' }}
                   animate={{ width: `${(playerHp / (effectivePlayerStats.hp * 5)) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
                </motion.div>
                <span className="absolute inset-0 flex items-center justify-center text-xl font-glitch text-white italic drop-shadow-[4px_4px_0_#000] tracking-tighter">
                  HP: {playerHp}
                </span>
              </div>

              {/* Status Effects & Passive (Player) */}
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 w-full">
                <div className="flex flex-wrap justify-center gap-1">
                  <AnimatePresence>
                    {playerEffects.map((effect, idx) => (
                      <StatusEffectBadge key={`${effect.type}-${idx}`} type={effect.type} duration={effect.duration} t={t} />
                    ))}
                  </AnimatePresence>
                </div>
                {player.passive && (
                  <div className="opacity-90 scale-90">
                    <PassiveIndicator passive={player.passive} />
                  </div>
                )}
              </div>

              {/* Equipped Weapon Icon Indicator */}
              {playerWeapon && (
                <div className="absolute -top-4 -right-4 bg-yellow-400 p-1 border-2 border-black rotate-12 shadow-[2px_2px_0_#000]">
                  <Sword className="w-4 h-4 text-black" />
                </div>
              )}

              {/* Energy Bar */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-40 h-2 bg-zinc-900 border border-zinc-600">
                <motion.div
                  className="h-full bg-yellow-400"
                  animate={{ width: `${(playerEnergy / MAX_ENERGY) * 100}%` }}
                />
              </div>
            </motion.div>
          </div>

          {/* Floating Damage Numbers & Effects */}
          <AnimatePresence>
            {damageNumbers.map((dn) => (
              <motion.div
                key={dn.id}
                initial={{ opacity: 1, y: 0, scale: 0.5, rotate: Math.random() * 20 - 10 }}
                animate={{ opacity: 0, y: -100, scale: dn.isCrit ? 2 : 1.5 }}
                exit={{ opacity: 0 }}
                className={`absolute pointer-events-none flex flex-col items-center justify-center font-glitch text-stroke uppercase italic ${dn.target === 'opponent'
                  ? (dn.isCrit ? 'text-yellow-400 text-7xl z-50' : 'text-white text-5xl z-40')
                  : 'text-red-600 text-5xl z-50'
                  }`}
                style={{
                  left: `${dn.x}%`,
                  top: `${dn.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {/* Visual Hit Particles Based on Element */}
                {dn.element && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center -z-10 bg-transparent">
                    {dn.element.includes('fire') && (
                      <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 2.5, opacity: 0 }} transition={{ duration: 0.3 }} className="w-16 h-16 rounded-full border-8 border-orange-500 shadow-[0_0_20px_#ef4444]" />
                    )}
                    {dn.element.includes('water') && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 3, opacity: 0 }} transition={{ duration: 0.4 }} className="w-16 h-16 border-[12px] border-cyan-400 rounded-full scale-y-50" />
                    )}
                    {dn.element.includes('plant') && (
                      <motion.div initial={{ scale: 0, rotate: 180 }} animate={{ scale: 2, rotate: 0, opacity: 0 }} transition={{ duration: 0.4 }} className="w-20 h-20 border-[6px] border-green-500 clip-path-polygon-[50%_0%,61%_35%,98%_35%,68%_57%,79%_91%,50%_70%,21%_91%,32%_57%,2%_35%,39%_35%]" />
                    )}
                    {dn.element.includes('electric') && (
                      <motion.div initial={{ scale: 0, skewX: 45 }} animate={{ scale: 3, skewX: -45, opacity: 0 }} transition={{ duration: 0.2 }} className="w-20 h-4 bg-yellow-400 shadow-[0_0_15px_#facc15] rotate-[25deg]" />
                    )}
                    {['fire', 'water', 'plant', 'electric'].some(e => dn.element?.includes(e)) ? null : (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 2.5, opacity: 0 }} transition={{ duration: 0.2 }} className="w-20 h-2 bg-white rotate-45 flex items-center justify-center"><div className="w-20 h-2 bg-white -rotate-90"></div></motion.div>
                    )}
                  </div>
                )}
                <span className="relative z-10 drop-shadow-[4px_4px_0_#000]">{dn.text || dn.value}</span>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Countdown Overlay */}
          <AnimatePresence>
            {countdown !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-none"
              >
                <motion.div
                  key={countdown}
                  initial={{ scale: 0, opacity: 0, rotate: -45, filter: 'blur(10px)' }}
                  animate={{ scale: 1.5, opacity: 1, rotate: 0, filter: 'blur(0px)' }}
                  exit={{ scale: 3, opacity: 0, filter: 'blur(20px)' }}
                  transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                  className="font-marker text-[12rem] text-white italic drop-shadow-[15px_15px_0_#000] text-stroke-lg"
                >
                  {countdown}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dramatic Win/Loss Banner */}
          <AnimatePresence>
            {isFinalizing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md pointer-events-none"
              >
                <motion.div
                  initial={{ scale: 0.5, y: 100, opacity: 0, rotate: -10 }}
                  animate={{ scale: 1, y: 0, opacity: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 8, stiffness: 150 }}
                  className="relative"
                >
                   <div className="absolute inset-1 bg-white blur-xl opacity-20" />
                   <h2 className={`text-9xl font-marker italic uppercase drop-shadow-[15px_15px_0_#000] text-stroke-lg ${playerHp > 0 ? 'text-yellow-400' : 'text-red-600'}`}>
                     {playerHp > 0 ? 'VICTORY' : 'DEFEAT'}
                   </h2>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Finalizing Overlay */}
          <AnimatePresence>
            {isFinalizing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center pointer-events-auto"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full mb-4"
                />
                <h3 className="text-white font-marker text-3xl italic uppercase drop-shadow-md">
                  Calculating Rewards...
                </h3>
                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mt-2 animate-pulse">
                  Securing loot drops
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Game Over Overlay */}
        {showSummary && (
          <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center pointer-events-auto p-6">
            {gameStatus === 'won' && (mode === 'classic' || mode === 'boss' || mode === 'gang_war') && finalStats ? (
              <BattleVictory
                player={player}
                opponent={currentOpponent}
                mode={mode}
                stats={finalStats}
                rewards={{
                  xp: mode === 'boss' ? 100 : mode === 'gang_war' ? 150 : 20,
                  scrap: mode === 'boss' ? 200 : mode === 'gang_war' ? 100 : 50
                }}
                unlockedTrophies={unlockedTrophies}
                totalTrophies={totalTrophies}
                language={language}
                onWatchAd={onWatchAd}
                onContinue={() => {
                  if (onWin) {
                    if (mode === 'gang_war') {
                      const randomOpponent = opponentTeam[Math.floor(Math.random() * opponentTeam.length)];
                      onWin(randomOpponent.id);
                    } else {
                      onWin({ 
                         wave: (mode as any) === 'survival' ? wave : 1, 
                         score: (mode as any) === 'blitz' ? score : 0,
                         combo: maxCombo,
                         damageDealt: totalDamageDealt
                      });
                    }
                  } else {
                    onClose();
                  }
                }}
              />
            ) : (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white border-4 border-black p-8 shadow-[8px_8px_0_#000] text-center rotate-2 max-w-sm w-full"
              >
                <h2 className={`text-5xl font-marker mb-4 ${gameStatus === 'won'
                  ? (mode === 'boss' ? 'text-purple-600' : 'text-green-600')
                  : 'text-red-600'
                  }`}>
                  {mode === 'survival' && gameStatus === 'won' ? 'WAVE CLEAR!' :
                    (gameStatus === 'won' ?
                      (mode === 'blitz' ? 'TIME UP!' :
                        (mode === 'boss' ? 'BOSS DEFEATED!' :
                          (mode === 'gang_war' ? 'GANG VICTORIOUS!' : 'VICTORY!'))) :
                      'DEFEAT...')}
                </h2>

                {mode === 'gang_war' && gameStatus === 'lost' && (
                  <p className="text-black font-black mb-4 uppercase">You lost a member of your gang...</p>
                )}

                {mode === 'blitz' && gameStatus === 'won' && (
                  <div className="mb-4">
                    <p className="text-xl font-black text-black">TOTAL KILLS</p>
                    <p className="text-6xl font-marker text-red-600">{score}</p>
                  </div>
                )}

                {mode === 'survival' && gameStatus === 'lost' && (
                  <div className="mb-4">
                    <p className="text-xl font-black text-black">WAVES SURVIVED</p>
                    <p className="text-6xl font-marker text-red-600">{wave - 1}</p>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {mode === 'survival' && gameStatus === 'won' ? (
                    <button
                      onClick={() => {
                        playSFX('CLICK');
                        handleNextOpponent();
                      }}
                      className="w-full py-4 bg-green-500 text-white font-black uppercase border-2 border-black shadow-[4px_4px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                      <Sword className="w-5 h-5" />
                      Next Wave
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        playSFX('CLICK');
                        // Reset Game
                        setPlayerHp(effectivePlayerStats.hp * 5);
                        setOpponentTeam(initialOpponentTeam || [initialOpponent]);
                        setCurrentOpponentIdx(0);
                        setCurrentPlayerIdx(0);
                        setOpponentHp((initialOpponentTeam ? initialOpponentTeam[0] : initialOpponent).stats.hp * 5);
                        setPlayerEnergy(0);
                        setCombo(0);
                        setWave(1);
                        setScore(0);
                        setTimeLeft(60);
                        setGameStatus('active');
                        setCountdown(3);
                        setShowSummary(false);
                        setIsFinalizing(false);
                        hasTriggeredWin.current = false;
                        startTime.current = Date.now();
                        setMaxCombo(0);
                        setTotalDamageDealt(0);
                      }}
                      className="w-full py-4 bg-yellow-400 text-black font-black uppercase border-2 border-black shadow-[4px_4px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Try Again
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (gameStatus === 'lost' && ((mode as any) === 'survival' || (mode as any) === 'blitz')) {
                        // In Survival/Blitz, leaving after "loss" still grants rewards based on performance
                        const performance = {
                          wave: (mode as any) === 'survival' ? Math.max(1, wave - 1) : 1,
                          score: (mode as any) === 'blitz' ? score : 0,
                          combo: maxCombo
                        };
                        if (onWin) onWin(performance);
                        else onClose();
                      } else if (onLoss) {
                        onLoss();
                      } else {
                        onClose();
                      }
                    }}
                    className="w-full py-4 bg-black text-white font-black uppercase border-2 border-black shadow-[4px_4px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                  >
                    Leave Arena
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Tap Hint */}
        {gameStatus === 'active' && combo === 0 && (
          <div className="absolute bottom-32 left-0 right-0 text-center pointer-events-none">
            <p className="text-white font-black text-xl animate-bounce drop-shadow-md">
              TAP FAST TO ATTACK!
            </p>
          </div>
        )}

        {/* Special Attack Effect */}
        <AnimatePresence>
          {isSpecialActive && <SpecialAttackEffect />}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function SpecialAttackEffect() {
  return (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden flex items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-yellow-400 mix-blend-hard-light"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.8, 0] }}
        transition={{ duration: 0.2, times: [0, 0.1, 1] }}
      />
      <motion.div
        className="absolute w-[150vmax] h-[150vmax] rounded-full border-[50px] border-yellow-400"
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 1, opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1.5, rotate: 0 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 15,
          mass: 1
        }}
        className="relative z-10 flex flex-col items-center"
      >
        <Zap className="w-48 h-48 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.8)]" />
        <span
          className="font-black text-6xl text-white italic drop-shadow-[4px_4px_0_#000]"
          style={{ WebkitTextStroke: '2px black' }}
        >
          ULTIMATE!!
        </span>
      </motion.div>
    </div>
  );
}

