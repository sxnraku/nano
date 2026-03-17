import { useState, useEffect } from 'react';
import { INITIAL_STATS, type PlayerStats } from '../components/ProgressionSystem';
import { auth, updateUserStats, checkAndUnlockTrophies } from '../services/firebase';
import { WarriorData } from '../services/gemini';
import { translations, type Language } from '../services/localizationService';

export const usePlayerStats = (collection: WarriorData[], addToast: (msg: string, type?: 'success' | 'error' | 'info') => void, language: Language) => {
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

  const [newlyUnlockedTrophies, setNewlyUnlockedTrophies] = useState<string[]>([]);

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
            addToast(t.toast_mission_complete?.replace('{title}', mission.title).replace('{xp}', mission.rewardXP.toString()) || `MISSION COMPLETE: ${mission.title}! +${mission.rewardXP} XP`, 'success');
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
        addToast(t.toast_level_up?.replace('{level}', String(newStats.level)) || `LEVEL UP! You reached level ${newStats.level}!`, 'success');
      }

      return newStats;
    });
  };

  return {
    playerStats,
    setPlayerStats,
    newlyUnlockedTrophies,
    setNewlyUnlockedTrophies,
    updateStats
  };
};
