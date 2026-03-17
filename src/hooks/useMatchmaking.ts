import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { WarriorData } from '../services/gemini';
import { 
  findMatch, 
  createMatchFromEntry, 
  enterMatchmaking, 
  cancelMatchmaking, 
  listenForMatch,
  getPvPSession
} from '../services/firebase';
import { MOCK_OPPONENTS } from '../data/mocks';

interface PlayerStats {
  level: number;
}

export const useMatchmaking = (
  user: User | null, 
  currentWarrior: WarriorData | null, 
  playerStats: PlayerStats,
  setActiveBattle: (battle: any) => void,
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void,
  language: 'en' | 'pt' = 'en'
) => {
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [matchmakingEntryId, setMatchmakingEntryId] = useState<string | null>(null);
  const [isMatchFound, setIsMatchFound] = useState(false);

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
          isPvPHost: true // The finder (guest in entry) becomes the session Host
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
        
        try {
          // Fetch session data to get the real opponent data
          const session = await getPvPSession(sessionId);
          
          if (session) {
            const rivalData = JSON.parse(session.hostWarrior); // Matchmaker is Host in the entry data
            setActiveBattle({
              opponent: rivalData,
              mode: 'pvp',
              pvpSessionId: sessionId,
              isPvPHost: false // The waiter (host in entry) becomes the session Guest
            });
          } else {
            // Fallback
            setActiveBattle({
              opponent: MOCK_OPPONENTS[0],
              mode: 'pvp',
              pvpSessionId: sessionId,
              isPvPHost: false
            });
          }
        } catch (e) {
          console.error("Error setting up match from listener:", e);
        }
        
        // Cleanup matchmaking entry
        cancelMatchmaking(matchmakingEntryId);
        setMatchmakingEntryId(null);
        setIsMatchmaking(false);
        setIsMatchFound(false);
      });
      return () => unsubscribe();
    }
  }, [matchmakingEntryId, setActiveBattle]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (matchmakingEntryId) {
        cancelMatchmaking(matchmakingEntryId).catch(console.error);
      }
    };
  }, [matchmakingEntryId]);

  // Initial cleanup: remove any leftover matchmaking entries for this user
  useEffect(() => {
    if (user && !isMatchmaking) {
      const runCleanup = async () => {
        try {
          const { db } = await import('../services/firebase');
          const { collection, query, where, getDocs, deleteDoc } = await import('firebase/firestore');
          
          const q = query(
            collection(db, 'matchmaking'),
            where('userId', '==', user.uid)
          );
          
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            console.log(`[Matchmaking] Found ${snapshot.size} leftover entries. Cleaning up...`);
            const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
            console.log("[Matchmaking] Cleanup complete.");
          }
        } catch (e) {
          console.warn("[Matchmaking] Failed to run initial cleanup:", e);
        }
      };
      runCleanup();
    }
  }, [user]); // Run only when user becomes available

  return {
    isMatchmaking,
    isMatchFound,
    handleStartMatchmaking,
    handleCancelMatchmaking
  };
};
