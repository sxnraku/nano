import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Scanner } from './components/Scanner';
import { WarriorCard } from './components/WarriorCard';
import { analyzeAndCreateWarrior, generateWarriorImage, type WarriorData, type Weapon } from './services/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { Scan, Users, MapPin, Sparkles, Trash2, Sword, Swords, Trophy, XCircle, RefreshCw, X, Zap, Info, Target, Settings, Database, Skull, Share2, Dna, Shield, Flame, UserCircle } from 'lucide-react';
import { ToastContainer, type ToastMessage } from './components/Toast';
import { MOCK_OPPONENTS } from './data/mocks';
import { BattleArena } from './components/BattleArena';
import { LegalDocs } from './components/LegalDocs';
import { ProgressionSystem, INITIAL_STATS, type PlayerStats } from './components/ProgressionSystem';
import { WarriorDetails } from './components/WarriorDetails';
import { GameGuide } from './components/GameGuide';
import { BlackMarket } from './components/BlackMarket';
import { GangWarSelection } from './components/GangWarSelection';
import { Leaderboard } from './components/Leaderboard';
import { PremiumStore } from './components/PremiumStore';
import { GachiSticker } from './components/GachiSticker';
import { AdMock } from './components/AdMock';
import { ShareWarriorModal } from './components/ShareWarriorModal';
import { initializeAdMob, showRewardedAd } from './services/adService';
import { ChallengeHandler } from './components/ChallengeHandler';
import { Gangs } from './components/Gangs';
import { PvPLobby } from './components/PvPLobby';
import { updateChallengeStats, updateUserStats, cleanupPvPSession, auth, signIn, logout, syncCloudSave, getCloudSave, initAuth, signInWithEmail, signUpWithEmail, enterMatchmaking, cancelMatchmaking, listenForMatch, findMatch, createMatchFromEntry, attackRaidBoss, checkAndUnlockTrophies } from './services/firebase';
import type { User } from 'firebase/auth';
import { UsernamePromptModal } from './components/UsernamePromptModal';
import { translations, type Language } from './services/localizationService';

import { GachiIcon } from './components/GachiIcon';
import { saveCollection, loadCollection, clearAllData } from './services/storage';

import { FusionChamber } from './components/FusionChamber';
import { TROPHIES } from './data/trophies';
import { getRankByElo } from './data/ranks';
import { ParticleSystem, spawnParticles } from './components/ParticleSystem';

export default function App() {
  const [view, setView] = useState<'scan' | 'collection' | 'arena' | 'guilds' | 'settings' | 'profile'>('scan');
  const [isFusionOpen, setIsFusionOpen] = useState(false);

  // Arena State
  const [isSearching, setIsSearching] = useState(false);
  const [opponents, setOpponents] = useState<WarriorData[]>([]);
  const [activeBattle, setActiveBattle] = useState<{
    opponent: WarriorData,
    mode: 'classic' | 'survival' | 'blitz' | 'boss' | 'gang_war' | 'pvp',
    playerTeam?: WarriorData[],
    opponentTeam?: WarriorData[],
    challengeId?: string,
    isHardcore?: boolean,
    pvpSessionId?: string,
    isPvPHost?: boolean,
    guildId?: string
  } | null>(null);
  const [newlyUnlockedTrophies, setNewlyUnlockedTrophies] = useState<string[]>([]);

  const handleNavigate = (newView: 'scan' | 'collection' | 'arena' | 'guilds' | 'settings' | 'profile') => {
    setView(newView);
  };
  const [collection, setCollection] = useState<WarriorData[]>([]);

  const [currentWarriorId, setCurrentWarriorId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isLegalDocsOpen, setIsLegalDocsOpen] = useState(false);
  const [isProgressionOpen, setIsProgressionOpen] = useState(false);
  const [isWarriorDetailsOpen, setIsWarriorDetailsOpen] = useState(false);
  const [isGameGuideOpen, setIsGameGuideOpen] = useState(false);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [matchmakingEntryId, setMatchmakingEntryId] = useState<string | null>(null);
  const [isMatchFound, setIsMatchFound] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [isBlackMarketOpen, setIsBlackMarketOpen] = useState(false);
  const [isGangWarSelectionOpen, setIsGangWarSelectionOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isPremiumStoreOpen, setIsPremiumStoreOpen] = useState(false);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPvPLobbyOpen, setIsPvPLobbyOpen] = useState(false);
  const [warriorToShare, setWarriorToShare] = useState<WarriorData | null>(null);
  
  const [user, setUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('language') as Language) || 'en');
  const t = translations[language];
  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => {
    const savedStats = localStorage.getItem('nano-verse-stats');
    if (savedStats) {
      try {
        const stats = JSON.parse(savedStats);
        const today = new Date().toISOString().split('T')[0];
        let currentEnergy = stats.scanEnergy ?? 5;
        let lastDate = stats.lastEnergyDate;

        if (lastDate !== today) {
          currentEnergy = 5;
          lastDate = today;
        }

        return {
          ...INITIAL_STATS,
          ...stats,
          inventory: stats.inventory || [],
          consumables: stats.consumables || {},
          activeBuffs: stats.activeBuffs || [],
          scanEnergy: currentEnergy,
          lastEnergyDate: lastDate,
          elo: stats.elo || 1000
        };
      } catch (e) {
        console.error("Failed to parse saved stats", e);
      }
    }
    return INITIAL_STATS;
  });

  // Initialization and Auth logic
  useEffect(() => {
    initAuth().then(() => {
      setAuthInitialized(true);
      initializeAdMob(); // Initialize AdMob on mobile
    }).catch(err => {
      console.error("Auth init failed", err);
      setAuthError(err.message);
      setAuthInitialized(true);
    });

    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });

    return () => unsubscribe();
  }, []);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleCloudSave = async () => {
    if (!user) return;
    addToast(t.toast_syncing, "info");
    const saveData = JSON.stringify({
      stats: playerStats,
      collection: collection
    });
    const success = await syncCloudSave(user.uid, saveData);
    if (success) addToast(t.toast_sync_success, "success");
    else addToast(t.toast_sync_error, "error");
  };

  const handleCloudLoad = async () => {
    if (!user) return;
    if (!window.confirm(t.confirm_overwrite)) return;
    addToast(t.toast_loading_cloud, "info");
    const data = await getCloudSave(user.uid);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed.stats) setPlayerStats(parsed.stats);
        if (parsed.collection) setCollection(parsed.collection);
        addToast(t.toast_load_success, "success");
      } catch (e) {
        console.error(e);
        addToast(t.toast_load_error, "error");
      }
    } else {
      addToast(t.toast_no_record, "error");
    }
  };

  const handleAnonymousSignIn = async (username: string) => {
    setAuthError(null);
    try {
      await signIn(username);
      addToast(t.toast_welcome_matrix.replace('{name}', username), "success");
    } catch (e: any) {
      console.error(e);
      setAuthError(e.message || t.toast_auth_failed);
      addToast(t.toast_auth_failed, "error");
    }
  };

  const handleEmailLogin = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      await signInWithEmail(email, pass);
      addToast(t.toast_welcome_back, "success");
    } catch (e: any) {
      console.error(e);
      setAuthError(e.message || t.toast_login_failed);
      addToast(t.toast_login_failed, "error");
    }
  };

  const handleEmailSignUp = async (email: string, pass: string, username: string) => {
    setAuthError(null);
    try {
      await signUpWithEmail(email, pass, username);
      addToast(t.toast_account_created || "Account created!", "success");
    } catch (e: any) {
      console.error(e);
      setAuthError(e.message || t.toast_signup_failed);
      addToast(t.toast_signup_failed, "error");
    }
  };

  // Load collection on mount
  useEffect(() => {
    const initCollection = async () => {
      try {
        const loaded = await loadCollection();
        if (loaded && loaded.length > 0) {
          setCollection(loaded);
          if (!currentWarriorId) {
            setCurrentWarriorId(loaded[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load collection", err);
      }
    };
    initCollection();
  }, []);

  // Save collection when it changes
  useEffect(() => {
    if (collection.length > 0) {
      saveCollection(collection).catch(err => {
        console.error("Failed to save collection to IndexedDB", err);
        addToast(t.toast_storage_error, "error");
      });
    }
  }, [collection]);

  // Save stats when they change
  useEffect(() => {
    localStorage.setItem('nano-verse-stats', JSON.stringify(playerStats));
  }, [playerStats]);

  // Sync stats to Firebase and check trophies
  useEffect(() => {
    const syncAndCheck = async () => {
      if (auth.currentUser) {
        const statsToSync = {
          totalWins: playerStats.totalWins,
          collectionSize: collection.length,
          level: playerStats.level,
          scrap: playerStats.scrap,
          highestWave: playerStats.highestWave,
          highestBlitzScore: playerStats.highestBlitzScore,
          highestCombo: playerStats.highestCombo
        };
        
        await updateUserStats(auth.currentUser.uid, statsToSync);
        
        // Check for trophies
        const currentProfileLookalike = {
          ...statsToSync,
          uid: auth.currentUser.uid,
          displayName: auth.currentUser.displayName || 'Agent',
          trophies: playerStats.trophies || []
        } as any;
        
        const newTrophies = await checkAndUnlockTrophies(auth.currentUser.uid, currentProfileLookalike);
        if (newTrophies.length > 0) {
          setPlayerStats(prev => ({
            ...prev,
            trophies: [...(prev.trophies || []), ...newTrophies]
          }));
          
          setNewlyUnlockedTrophies(newTrophies);
          
          newTrophies.forEach(() => {
            addToast("🏆 TROPHY UNLOCKED!", "success");
          });
        }
      }
    };
    syncAndCheck();
  }, [playerStats.totalWins, collection.length, playerStats.level, playerStats.scrap, playerStats.highestWave, playerStats.highestBlitzScore, playerStats.highestCombo]);


  const updateStats = (type: 'scan' | 'battle_win' | 'collection_size', amount: number = 1) => {
    setPlayerStats(prev => {
      let newStats = { ...prev };

      // Update totals
      if (type === 'scan') newStats.totalScans += amount;
      if (type === 'battle_win') newStats.totalWins += amount;

      // Check Missions
      newStats.missions = newStats.missions.map(mission => {
        if (mission.completed) return mission;

        if (mission.type === type) {
          const newCurrent = type === 'collection_size' ? collection.length : mission.current + amount;

          if (newCurrent >= mission.target) {
            // Mission Complete!
            addToast(t.toast_mission_complete.replace('{title}', mission.title).replace('{xp}', mission.rewardXP.toString()), 'success');
            newStats.xp += mission.rewardXP;
            return { ...mission, current: newCurrent, completed: true };
          }
          return { ...mission, current: newCurrent };
        }
        return mission;
      });

      // Level Up Check
      if (newStats.xp >= newStats.maxXp) {
        newStats.level += 1;
        newStats.xp -= newStats.maxXp;
        newStats.maxXp = Math.round(newStats.maxXp * 1.5);
        addToast(`LEVEL UP! You reached level ${newStats.level}!`, 'success');
      }

      return newStats;
    });
  };

  const handleScan = async (imageData: string) => {
    if ((playerStats.scanEnergy || 0) <= 0) {
      addToast(t.toast_energy_depleted, "error");
      setIsScanModalOpen(false);
      return;
    }

    setIsProcessing(true);
    setProcessingStep(t.scan_step_extracting);

    // Deduct Energy
    setPlayerStats(prev => ({
      ...prev,
      scanEnergy: prev.scanEnergy - 1
    }));

    try {
      // Step 1: Analyze and Create Metadata
      const warriorData = await analyzeAndCreateWarrior(imageData);
      setProcessingStep(t.scan_step_generating);

      // Step 2: Generate Image
      const imageUrl = await generateWarriorImage(warriorData.visualPrompt, imageData);

      const finalWarrior = { ...warriorData, imageUrl };

      setCollection(prev => [finalWarrior, ...prev]);
      setCurrentWarriorId(finalWarrior.id);

      // Update Stats
      updateStats('scan');
      updateStats('collection_size'); // Check collection size missions too

      // Award Scrap for Scan
      const scrapReward = 10;
      const xpReward = 5;
      setPlayerStats(prev => ({
        ...prev,
        scrap: (prev.scrap || 0) + scrapReward,
        xp: (prev.xp || 0) + xpReward
      }));

      handleNavigate('collection'); // Go to view result
      setIsScanModalOpen(false); // Close modal
      addToast(t.toast_warrior_materialized.replace('{scrap}', scrapReward.toString()).replace('{xp}', xpReward.toString()), "success");

      // Trigger Particles
      spawnParticles('scrap', scrapReward, window.innerWidth / 2, window.innerHeight / 2);
      spawnParticles('xp', xpReward, window.innerWidth / 2, window.innerHeight / 2);
    } catch (error) {
      console.error("Failed to create warrior:", error);
      addToast(t.toast_gen_failed, "error");
      setIsScanModalOpen(false); // Always close modal on error so user is not stuck
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleBattleWin = (mode: string, performance?: any) => {
    let xpReward = 20;
    let scrapReward = 50;
    let eloReward = 0;

    if (mode === 'pvp') {
      xpReward = 50;
      scrapReward = 50;
      eloReward = 25;
      
      setPlayerStats(prev => ({
        ...prev,
        elo: (prev.elo || 1000) + eloReward
      }));
    } else {
      // Non-PvP wins grant 10 "Trophies" which is a property in the Rank logic 
      // but in the actual state it might be different. 
      // Wait, trophies in PlayerStats is string[] (IDs).
      // The user original request said "ranks different by quantity of trophies".
      // But in the new Elo system, PvP uses Elo. 
      // For classic, let's just use xp and scrap for now.
    }

    if (mode === 'boss') {
      xpReward = 100;
      scrapReward = 200;
    } else if (mode === 'gang_war') {
      xpReward = 150;
      scrapReward = 100;
    }

    setPlayerStats(prev => {
      const newXp = prev.xp + xpReward;
      let newLevel = prev.level;
      let newMaxXp = prev.maxXp;
      
      if (newXp >= newMaxXp) {
        newLevel += 1;
        newMaxXp = Math.round(newMaxXp * 1.5);
        addToast(`LEVEL UP! You reached level ${newLevel}!`, 'success');
      }

      return {
        ...prev,
        level: newLevel,
        xp: newXp >= prev.maxXp ? newXp - prev.maxXp : newXp,
        maxXp: newMaxXp,
        scrap: (prev.scrap || 0) + scrapReward,
        totalWins: prev.totalWins + 1,
        totalBattles: prev.totalBattles + 1
      };
    });

    return { xp: xpReward, scrap: scrapReward, elo: eloReward };
  };

  const doubleBattleRewards = (xp: number, scrap: number) => {
    setPlayerStats(prev => ({
      ...prev,
      xp: prev.xp + xp, // Add again to double
      scrap: (prev.scrap || 0) + scrap, // Add again to double
    }));
    addToast("REWARDS DOUBLED!", "success");
  };

  const handleDelete = (id: string) => {
    setCollection(prev => prev.filter(w => w.id !== id));
    if (currentWarriorId === id) {
      setCurrentWarriorId(null);
    }
    // Recycling bonus
    const scrapGain = 5;
    setPlayerStats(prev => ({ ...prev, scrap: (prev.scrap || 0) + scrapGain }));
    addToast(`Warrior recycled. +${scrapGain} Scrap.`, "info");

    // Trigger Particles
    spawnParticles('scrap', scrapGain, window.innerWidth / 2, window.innerHeight / 2);
  };

  const currentWarrior = collection.find(w => w.id === currentWarriorId) || collection[0];

  const handleUpgrade = (stat: 'hp' | 'atk' | 'def' | 'spd', cost: number) => {
    if (!currentWarrior || (playerStats.scrap || 0) < cost) return;

    // Deduct Scrap
    setPlayerStats(prev => ({ ...prev, scrap: (prev.scrap || 0) - cost }));

    // Update Warrior Stats
    setCollection(prev => prev.map(w => {
      if (w.id === currentWarrior.id) {
        return {
          ...w,
          stats: {
            ...w.stats,
            [stat]: w.stats[stat] + (stat === 'hp' ? 100 : 10) // Scaled up for the new larger HP/stat meta
          }
        };
      }
      return w;
    }));

    addToast(`${stat.toUpperCase()} upgraded!`, "success");
  };

  const handleEquipWeapon = (warriorId: string, weaponId: string | null) => {
    setCollection(prev => prev.map(w => {
      if (w.id === warriorId) {
        return { ...w, equippedWeaponId: weaponId || undefined };
      }
      return w;
    }));
    addToast(weaponId ? "Weapon equipped!" : "Weapon removed!", "success");
  };

  const handleBuyItem = (item: any) => {
    if ((playerStats.scrap || 0) < item.cost) return;

    setPlayerStats(prev => {
      let newStats = { ...prev, scrap: (prev.scrap || 0) - item.cost };

      if (item.type === 'permanent') {
        // Apply permanent bonus to current warrior if exists
        if (currentWarrior) {
          setCollection(coll => coll.map(w => {
            if (w.id === currentWarrior.id) {
              return {
                ...w,
                stats: {
                  ...w.stats,
                  [item.stat]: w.stats[item.stat] + item.value
                }
              };
            }
            return w;
          }));
        }
        addToast(`${item.name} acquired! Permanent bonus applied.`, 'success');
      } else if (item.type === 'weapon') {
        newStats.inventory = [...(prev.inventory || []), { ...item.weapon, id: item.weapon.id + '-' + Date.now() }];
        addToast(`${item.name} added to inventory!`, 'success');
      } else if (item.type === 'boost') {
        // Add to activeBuffs for next battle
        const buff = {
          id: item.id,
          name: item.name,
          description: item.description,
          stat: item.stat,
          value: item.value,
          effect: item.effect,
          duration: 1
        };
        newStats.activeBuffs = [...(prev.activeBuffs || []), buff];
        addToast(`${item.name} activated for the next battle!`, 'success');
      } else if (item.type === 'consumable') {
        // Add to consumables inventory
        const currentCount = prev.consumables?.[item.id] || 0;
        newStats.consumables = {
          ...(prev.consumables || {}),
          [item.id]: currentCount + 1
        };
        addToast(`${item.name} added to inventory!`, 'success');
      } else {
        addToast(`${item.name} acquired!`, 'success');
      }

      return newStats;
    });
  };

  const handleUseConsumable = (itemId: string) => {
    setPlayerStats(prev => {
      const count = prev.consumables?.[itemId] || 0;
      if (count <= 0) return prev;

      const newConsumables = { ...prev.consumables, [itemId]: count - 1 };
      let newBuffs = [...(prev.activeBuffs || [])];

      if (itemId === 'c1') { // Repair Kit
        newBuffs.push({ id: 'buff-repair-' + Date.now(), name: 'Nanite Repair', description: '+50% HP in the next battle', stat: 'hp', value: 0.5, duration: 1 });
        addToast("Nanites applied! +50% HP in the next battle.", "success");
      } else if (itemId === 'c2') { // Overclock Chip
        newBuffs.push({ id: 'buff-oc-' + Date.now(), name: 'Overclock', description: '+20% All Stats in the next battle', effect: 'buff_all', value: 0.2, duration: 1 });
        addToast("System Overclocked! Stats increased.", "success");
      }

      return { ...prev, consumables: newConsumables, activeBuffs: newBuffs };
    });
  };

  const handleStartGangWar = (team: WarriorData[], isHardcore: boolean) => {
    setIsGangWarSelectionOpen(false);
    setIsSearching(true);

    setTimeout(() => {
      setIsSearching(false);
      // Generate opponent team
      const opponentTeam = Array.from({ length: 3 }).map(() => {
        const random = MOCK_OPPONENTS[Math.floor(Math.random() * MOCK_OPPONENTS.length)];
        return { ...random, id: crypto.randomUUID() };
      });

      setNewlyUnlockedTrophies([]);
      setActiveBattle({
        opponent: opponentTeam[0],
        opponentTeam,
        playerTeam: team,
        mode: 'gang_war',
        isHardcore
      });
      addToast(t.toast_gang_war_started, "error");
    }, 1500);
  };

  const handleStartPvPBattle = (sessionId: string, opponent: WarriorData, isHost: boolean) => {
    setIsPvPLobbyOpen(false);
    setActiveBattle({
      opponent,
      mode: 'pvp',
      pvpSessionId: sessionId,
      isPvPHost: isHost
    });
    addToast(isHost ? "RIVAL FOUND! BATTLE START!" : "BATTLE JOINED!", "error");
  };

  const handleGangWarWin = (stolenWarriorId?: string) => {
    if (!activeBattle?.opponentTeam) {
      setActiveBattle(null);
      return;
    }

    if (activeBattle.isHardcore && stolenWarriorId) {
      const stolenWarrior = activeBattle.opponentTeam.find(w => w.id === stolenWarriorId);
      if (stolenWarrior) {
        const newWarrior = { ...stolenWarrior, id: crypto.randomUUID() };
        setCollection(prev => [...prev, newWarrior]);
        addToast(`${newWarrior.name} has been recruited to your gang!`, 'success');
      }
    } else {
      addToast("Gang War Victory!", "success");
    }

    handleBattleWin('gang_war');
    setActiveBattle(null);
  };

  const handleGangWarLoss = () => {
    if (!activeBattle?.playerTeam) {
      setActiveBattle(null);
      return;
    }

    if (activeBattle.isHardcore) {
      // Randomly lose one of the 3 warriors in the team
      const lostWarrior = activeBattle.playerTeam[Math.floor(Math.random() * activeBattle.playerTeam.length)];
      setCollection(prev => prev.filter(w => w.id !== lostWarrior.id));
      if (currentWarriorId === lostWarrior.id) setCurrentWarriorId(null);

      addToast(`You lost ${lostWarrior.name} in the conflict...`, 'error');
    } else {
      addToast("Gang War defeat. Try again!", "error");
    }

    setActiveBattle(null);
  };

  const handleEnterArena = (mode: 'classic' | 'survival' | 'blitz' | 'boss' | 'gang_war' | 'pvp') => {
    if (mode === 'pvp') {
      if (!user) {
        addToast(t.gang_login_required || "Login Required", "error");
        return;
      }
      if (!currentWarrior) {
        addToast("You need an active warrior for Real-time PvP!", "error");
        handleNavigate('scan');
        return;
      }
      handleStartMatchmaking(); // Start matchmaking directly
      return;
    }

    if (mode === 'gang_war') {
      if (collection.length < 3) {
        addToast("You need at least 3 warriors for a Gang War!", "error");
        return;
      }
      setIsGangWarSelectionOpen(true);
      return;
    }

    if (!currentWarrior) {
      addToast("You need a warrior to enter the arena!", "error");
      handleNavigate('scan');
      return;
    }

    setIsSearching(true);
    setOpponents([]);

    // Simulate search delay
    setTimeout(() => {
      setIsSearching(false);

      // For classic, we show a list of opponents to choose from
      if (mode === 'classic') {
        // Quality over Quantity: Show fewer but better opponents
        const count = Math.random() < 0.4 ? 1 : 2;
        const selected = [...MOCK_OPPONENTS].sort(() => 0.5 - Math.random()).slice(0, count);

        const scaled = selected.map(opp => {
          const isElite = Math.random() < 0.25;
          // Scale based on level + chance to be Elite
          const scalingFactor = 1.2 + (playerStats.level * 0.15) + (isElite ? 0.6 : 0);

          let threat: 'low' | 'medium' | 'high' | 'deadly' = 'low';
          if (scalingFactor > 2.5) threat = 'deadly';
          else if (scalingFactor > 1.8) threat = 'high';
          else if (scalingFactor > 1.4) threat = 'medium';

          return {
            ...opp,
            id: crypto.randomUUID(),
            name: isElite ? `${t.elite_prefix} ${opp.name}` : opp.name,
            isElite,
            threatLevel: threat,
            stats: {
              hp: Math.round(opp.stats.hp * scalingFactor),
              atk: Math.round(opp.stats.atk * scalingFactor),
              def: Math.round(opp.stats.def * scalingFactor),
              spd: Math.round(opp.stats.spd * scalingFactor),
            },
          };
        });

        setOpponents(scaled);
        addToast(t.toast_targets_located.replace('{count}', count.toString()), "success");
      } else if (mode === 'boss') {
        // Find the toughest mock opponent or just pick one and scale it
        const randomOpponent = MOCK_OPPONENTS[Math.floor(Math.random() * MOCK_OPPONENTS.length)];
        setNewlyUnlockedTrophies([]);
    setActiveBattle({ opponent: randomOpponent, mode: 'boss' });
        addToast(t.toast_boss_detected, "error");
      } else {
        // For Survival/Blitz, start immediately with a random opponent
        const randomOpponent = MOCK_OPPONENTS[Math.floor(Math.random() * MOCK_OPPONENTS.length)];
        setNewlyUnlockedTrophies([]);
    setActiveBattle({ opponent: randomOpponent, mode });
      }
    }, 1500);
  };

  const startBattle = (opponent: WarriorData) => {
    if (!currentWarrior) return;
    setNewlyUnlockedTrophies([]);
    setActiveBattle({ opponent, mode: 'classic' });
  };

  const handleShareWarrior = (warrior: WarriorData) => {
    setWarriorToShare(warrior);
    setIsShareModalOpen(true);
  };

  const handleAcceptChallenge = (opponent: WarriorData, challengeId: string) => {
    if (!currentWarrior) {
      addToast("You need a warrior to accept challenges!", "error");
      return;
    }
    setActiveBattle({ opponent, mode: 'classic', challengeId });
    addToast("Challenge accepted! Get ready!", "error");
  };

  const handleUpdateWarrior = (updatedWarrior: WarriorData, cost: number, naniteCost: number = 0) => {
    if ((playerStats.scrap || 0) < cost) return;
    if ((playerStats.nanites || 0) < naniteCost) return;

    setPlayerStats(prev => ({
      ...prev,
      scrap: (prev.scrap || 0) - cost,
      nanites: (prev.nanites || 0) - naniteCost
    }));

    setCollection(prev => prev.map(w => w.id === updatedWarrior.id ? updatedWarrior : w));

    setCollection(prev => prev.map(w => w.id === updatedWarrior.id ? updatedWarrior : w));

    if (naniteCost > 0) {
      addToast(t.toast_recalibrated, "success");
    } else {
      addToast(t.toast_warrior_updated, "success");
    }
  };

  const handlePurchaseNanites = (amount: number, price: string) => {
    setPlayerStats(prev => ({ ...prev, nanites: (prev.nanites || 0) + amount }));
    addToast(t.toast_nanites_purchased.replace('{amount}', amount.toString()), 'success');
  };

  const handlePurchaseScraps = (amount: number, cost: number) => {
    setPlayerStats(prev => ({
      ...prev,
      nanites: (prev.nanites || 0) - cost,
      scrap: (prev.scrap || 0) + amount
    }));
    addToast(t.toast_exchange_completed.replace('{amount}', amount.toString()), 'success');
  };

  const handlePurchaseEnergy = (amount: number, cost: number) => {
    setPlayerStats(prev => ({
      ...prev,
      nanites: (prev.nanites || 0) - cost,
      scanEnergy: Math.min(5, (prev.scanEnergy || 0) + amount)
    }));
    addToast(t.toast_cells_recharged.replace('{amount}', amount.toString()), 'success');
  };

  const handleAdFinished = (rewarded: boolean) => {
    setIsAdModalOpen(false);
    if (rewarded) {
      if (adCallback.current) {
        adCallback.current(true);
        adCallback.current = null;
      }
      setPlayerStats(prev => ({
        ...prev,
        scanEnergy: Math.min(5, (prev.scanEnergy || 0) + 1),
        nanites: (prev.nanites || 0) + 25
      }));
      addToast(t.toast_daily_bonus, "success");
    } else {
      if (adCallback.current) {
        adCallback.current(false);
        adCallback.current = null;
      }
      addToast(t.toast_video_interrupted, "error");
    }
  };

  const adCallback = useRef<((success: boolean) => void) | null>(null);

  const handleWatchAd = async (): Promise<boolean> => {
    return new Promise(async (resolve) => {
      adCallback.current = resolve;
      try {
        // Try real ad first
        const success = await showRewardedAd();
        if (success) {
          handleAdFinished(true);
        } else {
          // If AdMob fails or returns false (e.g. on web), show MockAd
          setIsAdModalOpen(true);
        }
      } catch (err) {
        console.error("Watch ad error:", err);
        setIsAdModalOpen(true); // Fallback to mock on crash
      }
    });
  };

  const handleDoubleRewards = async (): Promise<void> => {
    const success = await handleWatchAd();
    if (success) {
      // Logic for doubling rewards in App.tsx state is handled by re-granting the original reward
      // but the BattleVictory UI already shows doubled values.
      // Easiest way: the onWin callback in BattleArena already sent the data.
      // For persistent state, we need to know what the rewards were.
      // For now, let's assume the component that calls this manages the state or we add a specific doubled reward logic.
      // Wait, BattleArena calls handleBattleWin which returns the rewards.
      // If we double them, we should apply it here.
    } else {
      throw new Error("Ad not completed");
    }
  };

  const handleFuseWarriors = (newWarrior: WarriorData, parentIds: [string, string], scrapCost: number, naniteCost: number) => {
    // Deduct cost
    setPlayerStats(prev => ({
      ...prev,
      scrap: (prev.scrap || 0) - scrapCost,
      nanites: (prev.nanites || 0) - naniteCost
    }));

    // Remove parents and add new warrior
    setCollection(prev => {
      const filtered = prev.filter(w => !parentIds.includes(w.id));
      return [newWarrior, ...filtered];
    });

    setCurrentWarriorId(newWarrior.id);

    setCurrentWarriorId(newWarrior.id);

    if (naniteCost > 0) {
      addToast(t.toast_fusion_stabilized.replace('{name}', newWarrior.name), "success");
    } else {
      addToast(t.toast_fusion_success.replace('{name}', newWarrior.name), "success");
    }
  };

  const handleStartRaid = (bossLevel: number) => {
    if (!currentWarrior || !playerStats.guildId) return;
    
    // Choose a random tough opponent as visual representation
    const bossVisual = MOCK_OPPONENTS.find(o => o.stats.atk > 100) || MOCK_OPPONENTS[0];
    
    setActiveBattle({
      opponent: {
        ...bossVisual,
        id: 'RAID_BOSS',
        name: `RAID BOSS LV.${bossLevel}`,
        stats: {
          hp: 10000 * bossLevel, // Visual representation in BattleArena (clamped to real HP)
          atk: 50 + (bossLevel * 10),
          def: 40 + (bossLevel * 8),
          spd: 30 + (bossLevel * 5)
        }
      },
      mode: 'boss',
      guildId: playerStats.guildId
    });
    
    addToast("ENTERING RAID ZONE!", "error");
  };

  const handleRaidDamage = async (damage: number) => {
    if (activeBattle?.guildId) {
      await attackRaidBoss(activeBattle.guildId, damage);
    }
  };

  const handleConsumeBuffs = () => {
    setPlayerStats(prev => ({
      ...prev,
      activeBuffs: []
    }));
  };

  const handleStartMatchmaking = async () => {
    if (!currentWarrior || !user) return;
    
    setIsMatchmaking(true);
    setIsMatchFound(false);
    
    const tier = Math.floor(playerStats.level / 5);
    
    try {
      console.log("[Matchmaking] Starting search for tier:", tier);
      const match = await findMatch(tier, user.uid);
      
      if (match) {
        console.log("[Matchmaking] Found existing match entry:", match.id);
        setIsMatchFound(true);
        const sessionId = await createMatchFromEntry(match, user, currentWarrior);
        console.log("[Matchmaking] Created PvP session:", sessionId);
        setActiveBattle({
          opponent: JSON.parse(match.warriorData),
          mode: 'pvp',
          pvpSessionId: sessionId,
          isPvPHost: false
        });
        setIsMatchmaking(false);
        setIsMatchFound(false);
      } else {
        console.log("[Matchmaking] No immediate match, entering queue...");
        const entryId = await enterMatchmaking(user, currentWarrior, playerStats.level);
        console.log("[Matchmaking] Queue entry ID:", entryId);
        setMatchmakingEntryId(entryId);
      }
    } catch (e: any) {
      console.error("[Matchmaking] Error:", e);
      addToast(language === 'pt' ? `Erro PvP: ${e.message || 'Desconhecido'}` : `PvP Error: ${e.message || 'Unknown'}`, "error");
      setIsMatchmaking(false);
    }
  };

  const handleCancelMatchmaking = async () => {
    if (matchmakingEntryId) {
      await cancelMatchmaking(matchmakingEntryId);
      setMatchmakingEntryId(null);
    }
    setIsMatchmaking(false);
    setIsMatchFound(false);
  };

  useEffect(() => {
    if (matchmakingEntryId) {
      const unsubscribe = listenForMatch(matchmakingEntryId, async (sessionId) => {
        setIsMatchFound(true);
        console.log("[Matchmaking] Match notified! Session:", sessionId);
        
        // Fetch session data once to get the opponent data instead of showing a mock
        // BattleArena also listens to this session, but we need the opponent data NOW for the UI/props
        try {
          // We can use a small delay or just rely on BattleArena if it's fast enough,
          // but to avoid the "mock" flash, we could try to peek at the session.
          // For now, let's keep it simple: BattleArena will handle the actual sync.
          // However, we MUST NOT use MOCK_OPPONENTS[0] if we want to avoid the user seeing it.
          
          setActiveBattle({
            opponent: MOCK_OPPONENTS[0], // We still need a placeholder because BattleArena requires it,
            // but we'll mark it as 'pvp' so it shows "Syncing..." or similar.
            mode: 'pvp',
            pvpSessionId: sessionId,
            isPvPHost: true
          });
        } catch (e) {
          console.error("Error setting up match:", e);
        }
        
        // Cleanup matchmaking entry
        cancelMatchmaking(matchmakingEntryId);
        setMatchmakingEntryId(null);
        setIsMatchmaking(false);
        setIsMatchFound(false);
      });
      return () => unsubscribe();
    }
  }, [matchmakingEntryId]);

  if (authInitialized && !user) {
    return (
      <div className="h-[100dvh] w-full bg-[#0b0b0b] text-white font-sans selection:bg-yellow-400 selection:text-black relative overflow-hidden bg-noise flex flex-col">
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <UsernamePromptModal
          onSubmit={handleAnonymousSignIn}
          onEmailLogin={handleEmailLogin}
          onEmailSignUp={handleEmailSignUp}
          errorMessage={authError}
        />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-[#0b0b0b] text-white font-sans selection:bg-yellow-400 selection:text-black relative overflow-hidden bg-noise flex flex-col pt-safe pb-safe">
      <div className="scanlines" />
      <ParticleSystem />
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Global Background Effects - Gachi Style */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/10 via-transparent to-red-900/10" />
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/80 to-transparent" />
        <div className="absolute bottom-0 right-0 w-full h-64 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      {/* Battle Modal */}
      {activeBattle && currentWarrior && (
        <BattleArena
          player={activeBattle.playerTeam ? activeBattle.playerTeam[0] : currentWarrior}
          playerTeam={activeBattle.playerTeam}
          opponent={activeBattle.opponent}
          opponentTeam={activeBattle.opponentTeam}
          mode={activeBattle.mode}
          pvpSessionId={activeBattle.pvpSessionId}
          isHost={activeBattle.isPvPHost}
          userId={user?.uid}
          onClose={() => setActiveBattle(null)}
          totalTrophies={playerStats.elo || 1000}
          unlockedTrophies={playerStats.trophies}
          inventory={playerStats.inventory || []}
          activeBuffs={playerStats.activeBuffs || []}
          language={language}
          onRaidDamage={handleRaidDamage}
          onWatchAd={async () => {
            const success = await handleWatchAd();
            if (success) {
              // Determine current rewards to double them
              let xp = 20;
              let scrap = 50;
              if (activeBattle.mode === 'boss') { xp = 100; scrap = 200; }
              else if (activeBattle.mode === 'gang_war') { xp = 150; scrap = 100; }
              else if (activeBattle.mode === 'pvp') { xp = 50; scrap = 50; }
              
              doubleBattleRewards(xp, scrap);
            } else {
              throw new Error("Ad failed");
            }
          }}
          onWin={(performance) => {
            handleBattleWin(activeBattle.mode, performance);
            setActiveBattle(null);
          }}
          onLoss={() => {
            addToast(t.battle_defeat || "Defeat...", "error");
            setActiveBattle(null);
          }}
        />
      )}

      {/* Header - Mega Punk Style */}
      <header className="relative z-40 pt-safe flex-shrink-0 w-full">
        <div className="w-full max-w-md mx-auto px-4 mt-2 mb-2 flex flex-col gap-2">
          {/* Top Bar: Logo & Settings */}
          <div className="flex items-center justify-between w-full gap-1 sm:gap-2">
            <div className="flex items-center gap-2 group cursor-pointer transform active:scale-95 transition-transform min-w-0" onClick={() => handleNavigate('scan')}>
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-yellow-400 translate-x-[4px] translate-y-[4px] border-4 border-black rotate-6 shadow-sm" />
                <div className="relative w-14 h-14 bg-black border-4 border-white flex items-center justify-center overflow-hidden z-10 -rotate-3 group-hover:rotate-0 group-hover:scale-105 transition-transform shadow-[inset_0_0_15px_rgba(0,0,0,1)]">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-20" />
                  <img src="/app_icon.png" className="w-full h-full object-cover scale-110" alt="NanoVerse Logo" />
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <h1 className="font-marker text-[22px] xs:text-2xl sm:text-4xl text-white tracking-tighter drop-shadow-[2px_2px_0_#000] sm:drop-shadow-[4px_4px_0_#000] -rotate-3 text-stroke-sm sm:text-stroke whitespace-nowrap">
                  NANO<span className="text-yellow-400 text-stroke-sm sm:text-stroke">VERSE</span>
                </h1>
                <div className="flex items-center gap-1 -mt-2">
                  <div className="h-2 w-10 bg-yellow-400 border-[2px] border-black skew-x-12" />
                  <span className="text-[9px] font-black text-white bg-red-600 px-2 py-0.5 border-2 border-black shadow-[2px_2px_0_#000] uppercase tracking-[0.2em] transform rotate-1">V.2.0</span>
                </div>
              </div>
            </div>

            {/* Quick Actions (Trophy / Premium) */}
            <div className="flex gap-1.5 shrink-0">
              <button onClick={() => setIsPremiumStoreOpen(true)} className="relative group active:scale-95 transition-transform">
                <div className="absolute -inset-1 bg-cyan-400 opacity-20 group-hover:opacity-40 blur-sm transition-opacity rounded-sm" />
                <div className="relative w-11 h-11 bg-black border-4 border-cyan-400 rounded-sm flex flex-col items-center justify-center shadow-[4px_4px_0_#000] overflow-hidden">
                  <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10" />
                  <GachiSticker type="NANITE" className="w-6 h-6 z-10" />
                  <span className="text-[7px] font-black text-cyan-400 z-10 leading-none">{playerStats.nanites || 0}</span>
                </div>
              </button>
              <button onClick={() => setIsLeaderboardOpen(true)} className="w-10 h-10 sm:w-11 sm:h-11 bg-yellow-400 border-[3px] sm:border-4 border-black rounded-sm flex items-center justify-center shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all hover:bg-yellow-300 shrink-0">
                <img src="/icon_trophy.png" className="w-6 h-6 sm:w-7 sm:h-7 object-contain mix-blend-multiply contrast-125" alt="leaderboard" />
              </button>
            </div>
          </div>

          {/* Bottom Bar: Stats Badges */}
          <div className="flex items-center gap-1 sm:gap-2 mt-1 w-full justify-between">
            {/* Scrap Badge */}
            <button
              onClick={() => setIsBlackMarketOpen(true)}
              className="flex-1 min-w-0 bg-red-600 border-2 sm:border-[4px] border-black p-1 sm:p-1.5 flex items-center gap-1 sm:gap-2 shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all hover:bg-red-500 hover:scale-[1.02]"
            >
              <div className="w-5 h-5 sm:w-8 sm:h-8 shrink-0 bg-black border-2 border-red-400 flex items-center justify-center skew-x-[-10deg] overflow-hidden">
                <div className="w-full h-full bg-white flex items-center justify-center">
                  <img src="/icon_scrap.png" className="w-4 h-4 sm:w-7 sm:h-7 object-contain mix-blend-multiply contrast-125 grayscale" alt="scrap" />
                </div>
              </div>
              <div className="flex flex-col items-start leading-[1.1] min-w-0 overflow-hidden">
                <span className="text-[6px] sm:text-[8px] font-black text-red-200 uppercase tracking-tighter sm:tracking-wider whitespace-nowrap overflow-hidden text-ellipsis w-full text-left">Local Scrap</span>
                <span className="text-sm sm:text-xl font-black text-white font-mono tracking-tight">{playerStats.scrap || 0}</span>
              </div>
            </button>

            {/* Level Badge */}
            <button
              onClick={() => setIsProgressionOpen(true)}
              className="flex-1 min-w-0 bg-cyan-600 border-2 sm:border-[4px] border-black p-1 sm:p-1.5 flex items-center gap-1 sm:gap-2 shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all hover:bg-cyan-500 hover:scale-[1.02] z-10 relative"
            >
              <div className="w-5 h-5 sm:w-8 sm:h-8 shrink-0 bg-black border-2 border-cyan-400 flex items-center justify-center skew-x-[-10deg] overflow-hidden">
                <div className="w-full h-full bg-white flex items-center justify-center">
                  <img src="/icon_level.png" className="w-4 h-4 sm:w-7 sm:h-7 object-contain mix-blend-multiply contrast-125 grayscale" alt="level" />
                </div>
              </div>
              <div className="flex flex-col items-start leading-[1.1] min-w-0 overflow-hidden">
                <span className="text-[6px] sm:text-[8px] font-black text-cyan-200 uppercase tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis w-full text-left">Ranking</span>
                <span className="text-sm sm:text-xl font-black text-white font-mono">LVL {playerStats.level}</span>
              </div>
            </button>
            {/* Energy Badge */}
            {/* Energy Badge */}
            <button
              onClick={() => addToast("Scan batteries recharge automatically every day. Come back tomorrow for more!", "info")}
              className="flex-1 min-w-0 bg-green-600 border-2 sm:border-[4px] border-black p-1 sm:p-1.5 flex items-center gap-1 sm:gap-2 shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all hover:bg-green-500 hover:scale-[1.02] overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-20" />
              <div className="w-5 h-5 sm:w-8 sm:h-8 shrink-0 bg-black border-2 border-green-400 flex items-center justify-center skew-x-[-10deg] z-10">
                <Scan className="w-3 h-3 sm:w-5 sm:h-5 text-green-400" />
              </div>
              <div className="flex flex-col items-start leading-[1.1] min-w-0 overflow-hidden z-10">
                <span className="text-[6px] sm:text-[8px] font-black text-green-200 uppercase tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis w-full text-left">Energy</span>
                <span className="text-sm sm:text-xl font-black text-white font-mono">{playerStats.scanEnergy ?? 5}/5</span>
              </div>
            </button>
          </div>
        </div>
      </header>

      <LegalDocs isOpen={isLegalDocsOpen} onClose={() => setIsLegalDocsOpen(false)} language={language} />
      <GameGuide isOpen={isGameGuideOpen} onClose={() => setIsGameGuideOpen(false)} language={language} />

      <AnimatePresence>
        {isBlackMarketOpen && (
          <BlackMarket
            isOpen={isBlackMarketOpen}
            onClose={() => setIsBlackMarketOpen(false)}
            scrap={playerStats.scrap || 0}
            onBuy={handleBuyItem}
            language={language}
          />
        )}
        {isGangWarSelectionOpen && (
          <GangWarSelection
            collection={collection}
            isOpen={isGangWarSelectionOpen}
            onClose={() => setIsGangWarSelectionOpen(false)}
            onStart={handleStartGangWar}
          />
        )}
        {isProgressionOpen && (
          <ProgressionSystem stats={playerStats} isOpen={isProgressionOpen} onClose={() => setIsProgressionOpen(false)} language={language} />
        )}
        {isFusionOpen && (
          <FusionChamber
            collection={collection}
            isOpen={isFusionOpen}
            onClose={() => setIsFusionOpen(false)}
            onFuse={handleFuseWarriors}
            scrap={playerStats.scrap || 0}
            nanites={playerStats.nanites || 0}
            language={language}
          />
        )}
        {isWarriorDetailsOpen && currentWarrior && (
          <WarriorDetails
            warrior={currentWarrior}
            isOpen={isWarriorDetailsOpen}
            onClose={() => setIsWarriorDetailsOpen(false)}
            scrap={playerStats.scrap || 0}
            nanites={playerStats.nanites || 0}
            onUpgrade={handleUpgrade}
            inventory={playerStats.inventory || []}
            onEquipWeapon={handleEquipWeapon}
            onUpdateWarrior={handleUpdateWarrior}
            consumables={playerStats.consumables || {}}
            onUseConsumable={handleUseConsumable}
            onShare={handleShareWarrior}
            language={language}
          />
        )}
        {isLeaderboardOpen && (
          <Leaderboard onClose={() => setIsLeaderboardOpen(false)} language={language} />
        )}
        {isPremiumStoreOpen && (
          <PremiumStore
            isOpen={isPremiumStoreOpen}
            onClose={() => setIsPremiumStoreOpen(false)}
            nanites={playerStats.nanites || 0}
            scrap={playerStats.scrap || 0}
            scanEnergy={playerStats.scanEnergy || 0}
            onPurchaseNanites={handlePurchaseNanites}
            onPurchaseScraps={handlePurchaseScraps}
            onPurchaseEnergy={handlePurchaseEnergy}
            onWatchAd={handleWatchAd}
            language={language}
          />
        )}
        {isPvPLobbyOpen && (
          <PvPLobby
            user={user}
            currentWarrior={currentWarrior}
            onClose={() => setIsPvPLobbyOpen(false)}
            onStartBattle={handleStartPvPBattle}
            language={language}
          />
        )}
        {isAdModalOpen && (
          <AdMock
            isOpen={isAdModalOpen}
            onClose={handleAdFinished}
          />
        )}
        {isShareModalOpen && warriorToShare && (
          <ShareWarriorModal
            onClose={() => setIsShareModalOpen(false)}
            warrior={warriorToShare}
          />
        )}
      </AnimatePresence>

      <ChallengeHandler onAcceptChallenge={handleAcceptChallenge} />

      {/* Main Content */}
      <main className="relative z-10 px-4 w-full flex-1 flex flex-col justify-center max-w-md mx-auto min-h-0 overflow-y-auto hide-scrollbar">
        <AnimatePresence mode="wait">
          {view === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, scale: 0.95, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.95, rotate: 2 }}
              className="flex-1 flex flex-col min-h-0 w-full"
            >
              <div className="mb-6 relative">
                <div className="absolute -left-4 top-0 w-1 h-full bg-yellow-400" />
                <h2 className="text-4xl font-marker text-white mb-1 drop-shadow-[3px_3px_0_#000]">
                  GENERATIVE <br /><span className="text-cyan-400 text-stroke-sm">CAPTURE</span>
                </h2>
                <p className="text-sm text-zinc-400 font-bold bg-black/50 inline-block px-2">
                  // AIM TO MATERIALIZE
                </p>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center relative min-h-0 min-w-0 pb-12">

                {/* Main Scan Button */}
                <button
                  onClick={() => {
                    setIsScanModalOpen(true);
                  }}
                  className="group relative w-44 h-44 flex items-center justify-center shrink-0 z-10"
                >
                  <div className="absolute inset-0 bg-yellow-400 rotate-3 border-4 border-black shadow-[8px_8px_0_#000] transition-transform group-hover:rotate-6 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-white -rotate-3 border-4 border-black flex flex-col items-center justify-center transition-transform group-hover:-rotate-6 group-hover:scale-105">
                    <Scan className="w-16 h-16 text-black mb-2" />
                    <span className="font-marker text-2xl text-black">START SCAN</span>
                    <span className="text-[10px] font-bold bg-black text-white px-2 py-1 mt-1 rotate-2">CLICK TO START</span>
                  </div>
                </button>

                {/* Decorative Elements */}
                <div className="absolute top-1/2 left-4 md:left-2 -translate-y-1/2 w-16 h-24 border-t-8 border-l-8 border-b-8 border-yellow-400 opacity-80" />
                <div className="absolute top-1/2 right-4 md:right-2 -translate-y-1/2 w-16 h-24 border-t-8 border-r-8 border-b-8 border-yellow-400 opacity-80" />
              </div>
            </motion.div>
          )}

          {view === 'collection' && (
            <motion.div
              key="collection"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1 flex flex-col"
            >
              <div className="mb-4 flex items-center justify-between bg-white border-2 border-black p-3 shadow-[4px_4px_0_#000] -rotate-1">
                <div>
                  <h2 className="text-xl font-black text-black uppercase italic">Your Gang</h2>
                  <p className="text-[10px] font-bold text-zinc-600 bg-yellow-300 inline-block px-1">{collection.length} WARRIORS</p>
                </div>
                <button
                  onClick={() => handleNavigate('scan')}
                  className="px-3 py-1.5 bg-black text-white text-xs font-bold uppercase hover:bg-zinc-800 transition-colors border border-transparent hover:border-yellow-400"
                >
                  + SCAN
                </button>
              </div>

              {currentWarrior ? (
                <div className="flex flex-col gap-4">
                  <div className="transform scale-95 origin-top">
                    <WarriorCard warrior={currentWarrior} />
                  </div>

                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => setIsWarriorDetailsOpen(true)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-yellow-400 text-black border-2 border-black shadow-[4px_4px_0_#000] font-black uppercase text-sm tracking-wider active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                    >
                      <img src="/icon_upgrade.png" className="w-4 h-4 object-contain" alt="upgrade" />
                      Upgrade
                    </button>

                    <button
                      onClick={() => handleDelete(currentWarrior.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 text-white border-2 border-black shadow-[4px_4px_0_#000] font-black uppercase text-sm tracking-wider active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                    >
                      <img src="/icon_trash.png" className="w-4 h-4 object-contain" alt="trash" />
                      Release
                    </button>

                    <button
                      onClick={() => handleShareWarrior(currentWarrior)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-cyan-500 text-white border-2 border-black shadow-[4px_4px_0_#000] font-black uppercase text-sm tracking-wider active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>

                  {/* Thumbnail List - More prominent for mobile */}
                  {collection.length > 1 && (
                    <div className="mt-2 bg-black/40 p-3 border border-white/10 backdrop-blur-sm rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-[10px] font-marker text-yellow-400 uppercase tracking-widest">Your Collection</h3>
                        <span className="text-[8px] text-zinc-500 font-mono">SCROLL TO SEE MORE →</span>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar snap-x">
                        {collection.map(warrior => (
                          <button
                            key={warrior.id}
                            onClick={() => setCurrentWarriorId(warrior.id)}
                            className={`relative flex-shrink-0 w-16 h-16 border-2 transition-all snap-center ${currentWarrior.id === warrior.id ? 'border-yellow-400 scale-105 z-10 shadow-[0_0_10px_rgba(250,204,21,0.4)]' : 'border-zinc-700 opacity-50'
                              }`}
                          >
                            <img src={warrior.imageUrl} alt={warrior.name} className="w-full h-full object-cover" />
                            {currentWarrior.id === warrior.id && (
                              <div className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-black text-[8px] font-black px-1 border border-black">OK</div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-zinc-500 border-2 border-dashed border-zinc-700 bg-zinc-900/30 rounded-xl">
                  <Scan className="w-12 h-12 mb-3 text-zinc-800" />
                  <p className="font-marker text-lg text-zinc-700">EMPTY GANG</p>
                  <button
                    onClick={() => handleNavigate('scan')}
                    className="mt-4 gachi-button px-5 py-2.5 text-sm"
                  >
                    Start Capture
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {view === 'arena' && (
            <motion.div
              key="arena"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center"
            >
              {opponents.length > 0 ? (
                <div className="w-full">
                  <div className="flex items-center justify-between mb-6 bg-red-600 p-3 border-2 border-black shadow-[4px_4px_0_#000] rotate-1">
                    <h2 className="text-xl font-black text-white italic tracking-tighter uppercase flex items-center gap-2">
                      <GachiIcon type="ARENA" className="w-6 h-6" fallback={<Skull className="w-6 h-6 text-white" />} />
                      TARGETS IN AREA
                    </h2>
                    <button
                      onClick={() => setOpponents([])}
                      className="text-xs font-bold text-black bg-white px-2 py-1 border border-black hover:bg-zinc-200 uppercase"
                    >
                      Escape
                    </button>
                  </div>
                  <div className="grid gap-4">
                    {opponents.map((opp, index) => {
                      const playerPower = currentWarrior ? (currentWarrior.stats.hp + currentWarrior.stats.atk + currentWarrior.stats.def + currentWarrior.stats.spd) : 0;
                      const oppPower = opp.stats.hp + opp.stats.atk + opp.stats.def + opp.stats.spd;
                      const advantage = playerPower - oppPower;
                      const isStronger = advantage >= 0;

                      const diff = Math.abs(Math.round((advantage / oppPower) * 100));

                      return (
                        <motion.div
                          key={opp.id}
                          initial={{ opacity: 0, x: -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1, type: "spring" }}
                          className={`bg-zinc-900 border-2 ${opp.isElite ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'border-zinc-700'} group hover:border-red-500 hover:bg-zinc-800 transition-all cursor-pointer relative overflow-hidden`}
                          onClick={() => startBattle(opp)}
                        >
                          <div className={`absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] ${opp.isElite ? 'opacity-20' : 'opacity-10'}`} />
                          
                          {opp.isElite && (
                            <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400 animate-pulse z-20" />
                          )}

                          {/* Top Row: Image + Name + Fight Button */}
                          <div className="relative z-10 flex gap-3 items-center p-3">
                            <div className="relative shrink-0">
                              <img src={opp.imageUrl} className={`w-16 h-16 border-2 ${opp.isElite ? 'border-yellow-400' : 'border-white'} object-cover bg-zinc-800`} alt={opp.name} />
                              <div className={`absolute -top-2 -left-2 ${opp.isElite ? 'bg-yellow-400 text-black' : 'bg-red-600 text-white'} text-[9px] font-black px-1.5 py-0.5 border border-black -rotate-12`}>
                                {opp.isElite ? 'ELITE' : 'WANTED'}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-black text-lg ${opp.isElite ? 'text-yellow-400' : 'text-white'} uppercase italic truncate`}>{opp.name}</h3>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                <span className={`bg-cyan-900 ${opp.isElite ? 'text-yellow-200' : 'text-cyan-300'} text-[10px] font-bold px-1.5 py-0.5 border border-cyan-500/50 truncate max-w-[120px]`}>{opp.class}</span>
                                <span className="bg-purple-900 text-purple-300 text-[10px] font-bold px-1.5 py-0.5 border border-purple-500/50">{opp.element}</span>
                              </div>

                              {/* Power Comparison */}
                              <div className="mt-1.5 flex items-center gap-2">
                                <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${isStronger ? 'text-green-400' : 'text-red-400'}`}>
                                  {isStronger ? `+${diff}%` : `-${diff}%`}
                                </div>
                                <div className={`text-[9px] font-black px-1.5 py-0.5 border border-white/20 uppercase tracking-tighter ${
                                  opp.threatLevel === 'deadly' ? 'bg-red-600 text-white' : 
                                  opp.threatLevel === 'high' ? 'bg-orange-600 text-white' : 
                                  opp.threatLevel === 'medium' ? 'bg-yellow-600 text-white' : 
                                  'bg-green-600 text-white'
                                }`}>
                                  {opp.threatLevel === 'deadly' ? t.threat_deadly : 
                                   opp.threatLevel === 'high' ? t.threat_high : 
                                   opp.threatLevel === 'medium' ? t.threat_med : 
                                   t.threat_low}
                                </div>
                              </div>
                            </div>
                            <button className={`w-12 h-12 ${opp.isElite ? 'bg-red-600' : 'bg-yellow-400'} border-2 border-black text-black flex items-center justify-center group-hover:scale-110 transition-transform shadow-[2px_2px_0_#000] shrink-0`}>
                              <Sword className={`w-7 h-7 ${opp.isElite ? 'text-white' : 'text-black'}`} />
                            </button>
                          </div>

                          {/* Stats Row */}
                          <div className="relative z-10 grid grid-cols-4 border-t-2 border-zinc-700">
                            {[
                              { label: 'HP', value: opp.stats.hp, playerVal: currentWarrior?.stats.hp, color: 'text-green-400' },
                              { label: 'ATK', value: opp.stats.atk, playerVal: currentWarrior?.stats.atk, color: 'text-red-400' },
                              { label: 'DEF', value: opp.stats.def, playerVal: currentWarrior?.stats.def, color: 'text-blue-400' },
                              { label: 'SPD', value: opp.stats.spd, playerVal: currentWarrior?.stats.spd, color: 'text-yellow-400' },
                            ].map(stat => {
                              const ahead = stat.playerVal !== undefined && stat.playerVal > stat.value;
                              return (
                                <div key={stat.label} className="flex flex-col items-center py-2 border-r border-zinc-800 last:border-r-0">
                                  <span className="text-[9px] font-black text-zinc-500 uppercase">{stat.label}</span>
                                  <span className={`text-sm font-black ${stat.color}`}>{stat.value}</span>
                                  {stat.playerVal !== undefined && (
                                    <span className={`text-[9px] font-bold ${ahead ? 'text-green-500' : 'text-red-500'}`}>
                                      {ahead ? `▲${stat.playerVal}` : `▼${stat.playerVal}`}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-start text-center p-4 mt-6 sm:mt-10 mb-8 relative w-full max-w-sm">

                  <h2 className="text-6xl font-marker text-white mb-2 drop-shadow-[6px_6px_0_#000] -rotate-3 uppercase italic">
                    PUNK <span className="text-red-500">ARENA</span>
                  </h2>
                  <div className="bg-black border-2 border-white px-4 py-1 rotate-2 mb-10 shadow-[4px_4px_0_#000]">
                    <p className="text-white text-xs font-black uppercase tracking-[0.2em]">
                      Pick your poison
                    </p>
                  </div>

                  <div className="flex flex-col gap-4 w-full">
                    {/* Classic Mode */}
                    <button
                      onClick={() => handleEnterArena('classic')}
                      disabled={isSearching}
                      className="group relative bg-zinc-950 border-4 border-black p-4 transition-all text-left overflow-hidden shadow-[6px_6px_0_#000] hover:shadow-[10px_10px_0_#000] hover:-translate-y-1 active:translate-x-1 active:translate-y-1 active:shadow-none"
                    >
                      <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none" />
                      <div className="absolute top-0 right-0 bg-yellow-400 text-black text-[8px] font-black px-2 py-0.5 uppercase tracking-tighter border-l-2 border-b-2 border-black -skew-x-12">Duel</div>
                      <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 bg-yellow-400 border-2 border-black shadow-[4px_4px_0_#000] flex items-center justify-center group-hover:rotate-6 transition-transform">
                          <img src="/icon_sword.png" className="w-10 h-10 object-contain mix-blend-multiply contrast-125 grayscale" alt="duel" />
                        </div>
                        <div>
                          <h3 className="font-marker text-2xl text-white uppercase italic leading-none mb-1">1v1 Clash</h3>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Face a random rival in the streets.</p>
                        </div>
                      </div>
                    </button>

                    {/* Survival Mode */}
                    <button
                      onClick={() => handleEnterArena('survival')}
                      disabled={isSearching}
                      className="group relative bg-zinc-950 border-4 border-black p-4 transition-all text-left overflow-hidden shadow-[6px_6px_0_#000] hover:shadow-[10px_10px_0_#000] hover:-translate-y-1 active:translate-x-1 active:translate-y-1 active:shadow-none"
                    >
                      <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none" />
                      <div className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-black px-2 py-0.5 uppercase tracking-tighter border-l-2 border-b-2 border-black -skew-x-12">Wave</div>
                      <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 bg-red-600 border-2 border-black shadow-[4px_4px_0_#000] flex items-center justify-center group-hover:-rotate-6 transition-transform">
                          <img src="/icon_survival.png" className="w-10 h-10 object-contain mix-blend-multiply contrast-125 grayscale" alt="survival" />
                        </div>
                        <div>
                          <h3 className="font-marker text-2xl text-white uppercase italic leading-none mb-1">{t.mode_survival_title}</h3>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{t.mode_survival_desc}</p>
                        </div>
                      </div>
                    </button>

                    {/* Blitz Mode */}
                    <button
                      onClick={() => handleEnterArena('blitz')}
                      disabled={isSearching}
                      className="group relative bg-zinc-950 border-4 border-black p-4 transition-all text-left overflow-hidden shadow-[6px_6px_0_#000] hover:shadow-[10px_10px_0_#000] hover:-translate-y-1 active:translate-x-1 active:translate-y-1 active:shadow-none"
                    >
                      <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none" />
                      <div className="absolute top-0 right-0 bg-cyan-400 text-black text-[8px] font-black px-2 py-0.5 uppercase tracking-tighter border-l-2 border-b-2 border-black -skew-x-12">Blitz</div>
                      <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 bg-cyan-400 border-2 border-black shadow-[4px_4px_0_#000] flex items-center justify-center group-hover:scale-110 transition-transform">
                          <img src="/icon_blitz.png" className="w-10 h-10 object-contain mix-blend-multiply contrast-125 grayscale" alt="blitz" />
                        </div>
                        <div>
                          <h3 className="font-marker text-2xl text-white uppercase italic leading-none mb-1">{t.mode_blitz_title}</h3>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{t.mode_blitz_desc}</p>
                        </div>
                      </div>
                    </button>

                    {/* Boss Rush Mode */}
                    <button
                      onClick={() => handleEnterArena('boss')}
                      disabled={isSearching}
                      className="group relative bg-zinc-950 border-4 border-purple-600 p-4 transition-all text-left overflow-hidden shadow-[6px_6px_0_#9333ea] hover:shadow-[10px_10px_0_#9333ea] hover:-translate-y-1 active:translate-x-1 active:translate-y-1 active:shadow-none"
                    >
                      <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none" />
                      <div className="absolute top-0 right-0 bg-purple-600 text-white text-[8px] font-black px-2 py-0.5 uppercase tracking-tighter border-l-2 border-b-2 border-black -skew-x-12">Raid</div>
                      <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 bg-purple-600 border-2 border-black shadow-[4px_4px_0_#000] flex items-center justify-center group-hover:rotate-12 transition-transform">
                          <img src="/icon_boss.png" className="w-10 h-10 object-contain mix-blend-multiply contrast-125 grayscale" alt="boss" />
                        </div>
                        <div>
                          <h3 className="font-marker text-2xl text-purple-400 uppercase italic leading-none mb-1">{t.mode_boss_title}</h3>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{t.mode_boss_desc}</p>
                        </div>
                      </div>
                    </button>

                    {/* Gang War Mode */}
                    <button
                      onClick={() => handleEnterArena('gang_war')}
                      disabled={isSearching}
                      className="group relative bg-zinc-950 border-4 border-orange-600 p-4 transition-all text-left overflow-hidden shadow-[6px_6px_0_#ea580c] hover:shadow-[10px_10px_0_#ea580c] hover:-translate-y-1 active:translate-x-1 active:translate-y-1 active:shadow-none"
                    >
                      <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none" />
                      <div className="absolute top-0 right-0 bg-orange-600 text-white text-[8px] font-black px-2 py-0.5 uppercase tracking-tighter border-l-2 border-b-2 border-black -skew-x-12">War</div>
                      <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 bg-orange-600 border-2 border-black shadow-[4px_4px_0_#000] flex items-center justify-center group-hover:scale-110 transition-transform">
                          <img src="/icon_gangwar.png" className="w-10 h-10 object-contain mix-blend-multiply contrast-125 grayscale" alt="gang war" />
                        </div>
                        <div>
                          <h3 className="font-marker text-2xl text-orange-500 uppercase italic leading-none mb-1">{t.mode_gang_war_title}</h3>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{t.mode_gang_war_desc}</p>
                        </div>
                      </div>
                    </button>

                    {/* PvP Real-time Mode */}
                    <button
                      onClick={() => handleEnterArena('pvp')}
                      disabled={isSearching}
                      className="group relative bg-zinc-950 border-4 border-red-600 p-4 transition-all text-left overflow-hidden shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[10px_10px_0_#dc2626] hover:-translate-y-1 active:translate-x-1 active:translate-y-1 active:shadow-none col-span-1 sm:col-span-2"
                    >
                      <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none" />
                      <div className="absolute top-0 right-1 bg-red-600 text-white text-[8px] font-black px-2 py-0.5 uppercase tracking-tighter border-l-2 border-b-2 border-black -skew-x-12 z-20">Live Beta</div>
                      <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 bg-red-600 border-2 border-black shadow-[4px_4px_0_#000] flex items-center justify-center group-hover:scale-125 transition-transform">
                          <Swords className="w-10 h-10 text-black font-black" />
                        </div>
                        <div>
                          <h3 className="font-marker text-3xl text-red-500 uppercase italic leading-none mb-1">{t.mode_pvp_title}</h3>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">{t.mode_pvp_desc}</p>
                        </div>
                      </div>
                    </button>
                  </div>

                  {isMatchmaking && (
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-[100] p-6 text-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-cyan-400 blur-xl opacity-20 animate-pulse" />
                        <div className="w-24 h-24 border-8 border-cyan-400 border-t-transparent rounded-full animate-spin mb-8 relative z-10" />
                        <Swords className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-cyan-400 animate-bounce" />
                      </div>
                      
                      <h2 className="text-3xl font-marker text-white mb-2 uppercase drop-shadow-[4px_4px_0_#000]">
                        {isMatchFound ? t.arena_match_found : t.arena_searching_match}
                      </h2>
                      <div className="flex flex-col items-center gap-2 mb-8">
                        <div className="flex items-center gap-2">
                          <div className="h-1 w-12 bg-cyan-600" />
                          <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">Tier {Math.floor(playerStats.level / 5)}</div>
                          <div className="h-1 w-12 bg-cyan-600" />
                        </div>
                        {matchmakingEntryId && (
                          <div className="text-[8px] text-zinc-700 font-mono">ID: {matchmakingEntryId.slice(0, 8)}...</div>
                        )}
                      </div>

                      <button
                        onClick={handleCancelMatchmaking}
                        className="px-8 py-3 bg-red-600 text-white font-black uppercase tracking-widest border-4 border-black shadow-[4px_4px_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                      >
                        {t.arena_cancel_search}
                      </button>
                    </div>
                  )}

                  {isSearching && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                      <img src="/icon_refresh.png" className="w-12 h-12 object-contain animate-spin mb-4" alt="searching" />
                      <span className="font-marker text-2xl text-white animate-pulse">{t.searching}</span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {view === 'guilds' && (
            <motion.div
              key="guilds"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col h-full"
            >
              <Gangs
                user={user}
                onShowToast={addToast}
                onUpdateStats={() => setPlayerStats(prev => ({ ...prev }))}
                onStartRaid={handleStartRaid}
                language={language}
              />
            </motion.div>
          )}

          {view === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col pb-12"
            >
              <div className="mb-6 bg-white border-4 border-black p-4 shadow-[6px_6px_0_#000] rotate-1 gachi-skew">
                <h2 className="text-3xl font-marker text-black uppercase italic drop-shadow-[2px_2px_0_#fff]">{t.settings_title}</h2>
                <p className="text-[10px] font-black text-white bg-black inline-block px-2 uppercase tracking-widest">{t.settings_subtitle}</p>
              </div>

              <div className="space-y-4">

                <div className="bg-zinc-900 border-4 border-black p-6 shadow-[6px_6px_0_#000] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 -rotate-45 translate-x-16 -translate-y-16 pointer-events-none" />
                  <h3 className="text-purple-400 font-marker text-2xl mb-4 uppercase italic tracking-tighter">{t.settings_language}</h3>
                  <div className="flex gap-2">
                    {(['en', 'pt'] as Language[]).map(lang => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`flex-1 py-4 border-2 font-black uppercase transition-all tracking-widest text-xs relative overflow-hidden ${language === lang
                          ? 'bg-purple-600 border-black text-white shadow-[4px_4px_0_#000] scale-105 z-10'
                          : 'bg-zinc-800 border-black text-zinc-500 hover:text-white'
                          }`}
                      >
                        {language === lang && <div className="absolute top-0 left-0 w-full h-1 bg-white/30" />}
                        {lang === 'en' ? 'English' : 'Português'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-900 border-4 border-black p-6 shadow-[6px_6px_0_#000] relative">
                  <h3 className="text-red-500 font-marker text-2xl mb-4 uppercase italic tracking-tighter">{t.settings_danger_zone}</h3>
                  <p className="text-xs text-zinc-500 mb-4">{t.settings_danger_zone_desc}</p>
                  <button
                    onClick={async () => {
                      if (confirm(t.settings_reset_confirm)) {
                        localStorage.clear();
                        await clearAllData();
                        window.location.reload();
                      }
                    }}
                    className="w-full py-3 bg-red-600 text-white font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                  >
                    {t.settings_reset_button}
                  </button>
                </div>

                <div className="bg-zinc-900 border-4 border-black p-6 shadow-[6px_6px_0_#000]">
                  <h3 className="text-cyan-400 font-marker text-2xl mb-4 uppercase italic tracking-tighter">{t.settings_about}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {t.settings_about_desc}
                  </p>
                  <div className="mt-4 flex gap-4">
                    <button onClick={() => setIsLegalDocsOpen(true)} className="text-xs font-bold text-zinc-500 hover:text-white underline uppercase">{t.settings_terms_link}</button>
                    <button onClick={() => setIsGameGuideOpen(true)} className="text-xs font-bold text-zinc-500 hover:text-white underline uppercase">{t.settings_guide_link}</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex-1 flex flex-col gap-6 pb-12"
            >
              <div className="mb-4 relative px-2">
                <div className="absolute -left-2 top-0 w-1.5 h-full bg-yellow-400 shadow-[2px_2px_0_#000]" />
                <h2 className="text-5xl font-marker text-white mb-2 drop-shadow-[4px_4px_0_#000] italic leading-none">
                  AGENT <br /><span className="text-yellow-400 text-stroke-sm">PROFILE</span>
                </h2>
                <p className="text-[10px] text-zinc-400 font-black bg-black border border-zinc-800 inline-block px-3 py-1 uppercase tracking-widest">
                  // FRAGMENT_{user?.uid?.slice(0, 8)}
                </p>
              </div>

              <div className="bg-zinc-900 border-4 border-black p-6 shadow-[8px_8px_0_#000] relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-400/5 rotate-45 pointer-events-none" />
                <h3 className="text-yellow-400 font-marker text-2xl mb-6 uppercase italic tracking-tighter">{t.settings_player_data}</h3>
                <div className="space-y-4">
                  {user ? (
                    <>
                      {!user.isAnonymous ? (
                        <div className="space-y-3 border-b border-zinc-800 pb-4">
                          <div className="flex items-center gap-3">
                            <UserCircle className="w-10 h-10 text-yellow-400 opacity-50 shadow-[2px_2px_0_#000]" />
                            <div>
                              <div className="text-white font-bold uppercase tracking-tighter">{user.displayName || 'AGENT'}</div>
                              <div className="text-[10px] text-zinc-500 font-mono">{user.email}</div>
                            </div>
                          </div>
                          <button
                            onClick={handleCloudLoad}
                            className="w-full py-2.5 bg-zinc-800 text-cyan-400 hover:bg-zinc-700 font-black uppercase text-[10px] border-2 border-black shadow-[4px_4px_0_#000] mb-2 flex items-center justify-center gap-2"
                          >
                            <Database className="w-4 h-4" /> {t.settings_load_cloud}
                          </button>
                          <button
                            onClick={handleCloudSave}
                            className="w-full py-2.5 bg-zinc-800 text-yellow-500 hover:bg-zinc-700 font-black uppercase text-[10px] border-2 border-black shadow-[4px_4px_0_#000] flex items-center justify-center gap-2"
                          >
                            <Database className="w-4 h-4" /> {t.settings_save_cloud}
                          </button>
                          <button
                            onClick={logout}
                            className="w-full mt-4 py-2 bg-zinc-900 text-red-500 hover:text-white hover:bg-red-900 font-black uppercase text-[10px] border-2 border-black shadow-[4px_4px_0_#000] transition-colors"
                          >
                            {t.settings_logout}
                          </button>
                        </div>
                      ) : (
                        <div className="bg-zinc-900 border-2 border-zinc-800 p-4 mb-4 shadow-[4px_4px_0_#000]">
                          <p className="text-white text-[10px] font-black font-mono text-center uppercase mb-3">
                            {language === 'pt'
                              ? 'LIGADO COMO CONVIDADO (ANÓNIMO)'
                              : 'LOGGED IN AS GUEST (ANONYMOUS)'}
                          </p>
                          <button
                            onClick={logout}
                            className="w-full py-2 bg-red-600 text-white font-black uppercase text-[10px] border-2 border-black shadow-[4px_4px_0_#000] hover:bg-red-500 transition-colors"
                          >
                            {language === 'pt' ? 'SAIR PARA SINCRONIZAR' : 'LOGOUT TO SYNC CLOUD'}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-zinc-900 border-2 border-zinc-800 p-4 mb-4 shadow-[4px_4px_0_#000] text-center">
                      <p className="text-zinc-400 text-[10px] font-black uppercase mb-3">Not Authorized</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="w-full py-2 bg-yellow-400 text-black font-black uppercase text-[10px] border-2 border-black shadow-[4px_4px_0_#000]"
                      >
                        RETRY CONNECTION
                      </button>
                    </div>
                  )}

                  <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                    <span className="text-zinc-400 text-sm font-bold uppercase">{t.info_local_id}</span>
                    <span className="text-white font-mono text-xs">#GACHI-{playerStats.level}-{collection.length}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                    <span className="text-zinc-400 text-sm font-bold uppercase">{t.info_version}</span>
                    <span className="text-white font-mono text-xs">v2.0.0-stable</span>
                  </div>

                  {/* Rank Section */}
                  <div className="mt-8 bg-zinc-950 border-4 border-black p-4 shadow-[8px_8px_0_#000] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                      <Trophy className="w-16 h-16" />
                    </div>
                    <div className="relative z-10">
                      <h4 className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em] mb-1">{t.rank_title}</h4>
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">
                          {getRankByElo(playerStats.elo || 1000).icon}
                        </div>
                        <div>
                          <div className={`text-2xl font-marker italic text-stroke-sm ${getRankByElo(playerStats.elo || 1000).color}`}>
                            {getRankByElo(playerStats.elo || 1000).nameKey}
                          </div>
                          <div className="text-white font-black text-[9px] uppercase tracking-widest mt-1">
                            {playerStats.elo || 1000} ELO POINTS
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress bar to next rank */}
                    <div className="mt-4 h-1.5 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(((playerStats.elo || 1000) / 2500) * 100, 100)}%` }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-yellow-400"
                      />
                    </div>
                  </div>

                  {/* Trophies Section */}
                  <div className="mt-8">
                    <h4 className="text-yellow-400 font-marker text-xl mb-4 uppercase italic tracking-tighter">{t.trophies_title}</h4>
                    <div className="grid grid-cols-4 gap-3">
                      {TROPHIES.map(trophy => {
                        const isUnlocked = playerStats.trophies?.includes(trophy.id);
                        return (
                          <div 
                            key={trophy.id} 
                            className={`relative group flex flex-col items-center p-2 border-2 ${isUnlocked ? 'bg-zinc-800 border-yellow-500 shadow-[3px_3px_0_#000]' : 'bg-black border-zinc-900 opacity-30 grayscale'} transition-all`}
                          >
                            <span className={`text-2xl mb-1 ${isUnlocked ? 'drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]' : ''}`}>
                              {trophy.icon}
                            </span>
                            <span className="text-[7px] font-black text-white uppercase text-center leading-none">{trophy.name}</span>
                            
                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-black border border-white p-2 text-[8px] font-bold text-white z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity text-center shadow-xl">
                              <div className="text-yellow-400 mb-1">{trophy.name}</div>
                              {trophy.description}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scanner Modal - Moved outside main AnimatePresence */}
        <AnimatePresence>
          {isScanModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
            >
              <div className="w-full max-w-md h-[80vh] relative bg-black border-4 border-white shadow-[0_0_50px_rgba(255,255,255,0.2)] rounded-xl overflow-hidden">
                {/* Close Button — always above everything */}
                <button
                  onClick={() => { setIsScanModalOpen(false); setIsProcessing(false); }}
                  className="absolute top-4 right-4 z-[60] bg-red-600 text-white p-2 border-2 border-black shadow-[4px_4px_0_#000] hover:bg-red-500 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                <Scanner onScan={handleScan} isProcessing={isProcessing} onClose={() => setIsScanModalOpen(false)} />

                {isProcessing && (
                  <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-30 overflow-hidden">
                    <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none" />
                    <div className="scanlines z-10" />

                    <motion.div
                      className="text-cyan-400 font-marker text-5xl mb-6 relative z-20 text-center drop-shadow-[5px_5px_0_#000]"
                      animate={{ scale: [1, 1.05, 1], rotate: [-1, 1, -1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      {processingStep}
                    </motion.div>

                    <div className="w-72 h-8 bg-zinc-900 border-4 border-cyan-400 p-1 relative z-20 overflow-hidden shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-20" />
                      <motion.div
                        className="h-full bg-cyan-400"
                        initial={{ width: "0%" }}
                        animate={{ width: processingStep.includes('visual') ? "100%" : "30%" }}
                        transition={{ duration: 2, ease: "circInOut" }}
                      />
                    </div>

                    <div className="mt-8 text-cyan-200/50 text-[10px] font-mono whitespace-pre flex gap-4 text-center z-20">
                      <span>{">"} {t.scan_initiating}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main >

      {/* Bottom Navigation - Floating Island Gachi Style */}
      {(!activeBattle && !isScanModalOpen && !isShareModalOpen && !isPremiumStoreOpen) && (
        <nav className="relative z-50 flex-shrink-0 flex justify-center pb-safe mt-2 w-full px-2 max-w-[100vw]" >
          <div className="mb-4 bg-black border-[4px] border-white p-1.5 shadow-[8px_8px_0_#000] flex items-center justify-start gap-1 transform -rotate-1 w-[96vw] sm:w-auto origin-bottom transition-all overflow-x-auto hide-scrollbar snap-x snap-mandatory rounded-none pointer-events-auto relative">
            <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none" />
            <div className="relative z-10 flex items-center gap-1">
              <NavButton
                active={view === 'scan'}
                onClick={() => handleNavigate('scan')}
                icon={<div className="bg-white border border-black w-8 h-8 flex items-center justify-center rotate-3"><img src="/icon_scan.png" className="w-6 h-6 object-contain mix-blend-multiply contrast-125 grayscale" alt="scan" /></div>}
                label={t.nav_scan}
              />
              <div className="w-1.5 h-10 bg-zinc-800 mx-1 -skew-x-12 shrink-0 pointer-events-none" />
              <NavButton
                active={view === 'collection'}
                onClick={() => handleNavigate('collection')}
                icon={<div className="bg-white border border-black w-8 h-8 flex items-center justify-center -rotate-2"><img src="/icon_gangue.png" className="w-6 h-6 object-contain mix-blend-multiply contrast-125 grayscale" alt="gang" /></div>}
                label={t.nav_gang}
              />
              <div className="w-1.5 h-10 bg-zinc-800 mx-1 -skew-x-12 shrink-0 pointer-events-none" />
              <NavButton
                active={view === 'arena'}
                onClick={() => handleNavigate('arena')}
                icon={<div className="bg-white border border-black w-8 h-8 flex items-center justify-center rotate-1"><img src="/icon_briga.png" className="w-6 h-6 object-contain mix-blend-multiply contrast-125 grayscale" alt="arena" /></div>}
                label={t.nav_arena}
              />
              <div className="w-1.5 h-10 bg-zinc-800 mx-1 -skew-x-12 shrink-0 pointer-events-none" />
              <NavButton
                active={view === 'guilds'}
                onClick={() => handleNavigate('guilds')}
                icon={<div className="bg-white border border-black w-8 h-8 flex items-center justify-center -rotate-3"><img src="/icon_cla.png" className="w-6 h-6 object-contain mix-blend-multiply contrast-125 grayscale" alt="clan" /></div>}
                label={t.nav_clan}
              />
              <div className="w-1.5 h-10 bg-zinc-800 mx-1 -skew-x-12 shrink-0 pointer-events-none" />
              <NavButton
                active={view === 'profile'}
                onClick={() => handleNavigate('profile')}
                icon={<div className="bg-white border border-black w-8 h-8 flex items-center justify-center rotate-2"><UserCircle className="w-6 h-6 text-black" /></div>}
                label={t.nav_profile}
              />
              <div className="w-1.5 h-10 bg-zinc-800 mx-1 -skew-x-12 shrink-0 pointer-events-none" />
              <NavButton
                active={view === 'settings'}
                onClick={() => handleNavigate('settings')}
                icon={<div className="bg-white border border-black w-8 h-8 flex items-center justify-center -rotate-1"><img src="/icon_opcoes.png" className="w-6 h-6 object-contain mix-blend-multiply contrast-125 grayscale" alt="options" /></div>}
                label={t.nav_settings}
              />
            </div>
          </div>
        </nav>
      )}

      <AnimatePresence>
        {isGlobalLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none" />
            <div className="relative mb-12">
              <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-40 animate-pulse" />
              <div className="w-32 h-32 border-[16px] border-yellow-400 border-t-transparent shadow-[0_0_60px_rgba(234,179,8,0.4)] animate-spin relative z-10" />
              <img src="/app_icon.png" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 object-contain drop-shadow-[4px_4px_0_#000]" alt="loading" />
            </div>
            <h2 className="text-4xl font-marker text-white uppercase italic drop-shadow-[6px_6px_0_#000] -rotate-2">
              {t.loading_reality || 'STABILIZING REALITY...'}
            </h2>
            <div className="mt-8 flex gap-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-3 h-3 bg-yellow-400 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`snap-center shrink-0 relative flex items-center justify-center gap-2 px-3 py-2 transition-all duration-200 uppercase font-black tracking-tighter ${active
        ? 'bg-yellow-400 text-black border-[3px] sm:border-[4px] border-black shadow-[4px_4px_0_#000] -translate-y-2 rotate-2 scale-110 z-10'
        : 'text-zinc-500 hover:text-white hover:bg-zinc-800 hover:-translate-y-1'
        }`}
    >
      <div className={`relative z-10 shrink-0 ${active ? 'animate-pulse' : ''}`}>
        {icon}
      </div>
      {active && (
        <span className="text-sm">
          {label}
        </span>
      )}
    </button>
  );
}
