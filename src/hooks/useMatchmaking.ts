import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { WarriorData } from '../services/gemini';
import { 
  findMatch, 
  findDirectMatch,
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

  const handleStartMatchmaking = async (tier?: number, targetUid?: string) => {
    if (!currentWarrior || !user) return;
    
    setIsMatchmaking(true);
    setIsMatchFound(false);
    
    try {
      let match = null;
      if (targetUid) {
        console.log("[Matchmaking] Attempting direct match with:", targetUid);
        match = await findDirectMatch(targetUid);
      } else {
        const searchTier = tier || Math.floor(playerStats.level / 5);
        console.log("[Matchmaking] Starting search for tier:", searchTier);
        match = await findMatch(searchTier, user.uid);
      }
      
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
        // Wait a small random jitter to avoid race conditions with another player clicking at the exact same ms
        await new Promise(r => setTimeout(r, Math.random() * 500));
        
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
            const rivalData = JSON.parse(session.hostWarrior); 
            setActiveBattle({
              opponent: rivalData,
              mode: 'pvp',
              pvpSessionId: sessionId,
              isPvPHost: false,
              rivalName: session.hostName
            });
          } else {
            console.warn("[Matchmaking] Session not found for ID:", sessionId);
            // Don't show a bot, show a clear error or wait
            addToast(language === 'pt' ? "Erro ao carregar sessão PvP" : "Error loading PvP session", "error");
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

  // Initial cleanup: remove any leftover matchmaking entries for this user AND old stale entries
  useEffect(() => {
    if (user && !isMatchmaking) {
      const runCleanup = async () => {
        try {
          const { db } = await import('../services/firebase');
          const { collection, query, where, getDocs, deleteDoc, Timestamp } = await import('firebase/firestore');
          
          // 1. Cleanup current user's entries (personal maintenance)
          const qUser = query(
            collection(db, 'matchmaking'),
            where('uid', '==', user.uid)
          );
          
          // 2. Cleanup ANY matchmaking entry older than 10 minutes (global maintenance)
          const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
          const qStaleMatch = query(
            collection(db, 'matchmaking'),
            where('timestamp', '<', Timestamp.fromDate(tenMinutesAgo))
          );
          
          // 3. Cleanup ANY pvp_battle older than 30 minutes (session maintenance)
          const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
          const qStaleBattles = query(
            collection(db, 'pvp_battles'),
            where('lastUpdate', '<', Timestamp.fromDate(thirtyMinutesAgo))
          );

          const [snapUser, snapStale, snapBattles] = await Promise.all([
            getDocs(qUser), 
            getDocs(qStaleMatch),
            getDocs(qStaleBattles)
          ]);
          
          const docsToDelete = [...snapUser.docs, ...snapStale.docs, ...snapBattles.docs].filter((doc, index, self) => 
            self.findIndex(d => d.id === doc.id) === index
          );

          if (docsToDelete.length > 0) {
            console.log(`[Matchmaking] Maintenance: attempting to clean ${docsToDelete.length} stale/personal entries...`);
            // Use allSettled to avoid failing if some deletes are denied by rules
            await Promise.allSettled(docsToDelete.map(doc => deleteDoc(doc.ref)));
            console.log("[Matchmaking] Maintenance cycle complete.");
          }
        } catch (e) {
          console.warn("[Matchmaking] Failed to run global cleanup:", e);
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
