import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signOut,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  Timestamp,
  increment,
  updateDoc,
  addDoc,
  where,
  onSnapshot,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

export { Timestamp, increment, serverTimestamp };
import type { WarriorData } from './gemini';
import { compressImage } from './imageUtils';
import { initAppCheck } from './appCheck';

// Import the Firebase configuration
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase SDK
export const app = initializeApp(firebaseConfig);
void initAppCheck(app);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Types
export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  totalWins: number;
  highestCombo: number;
  collectionSize: number;
  level: number;
  scrap: number;
  highestWave: number;
  highestBlitzScore: number;
  lastActive: Timestamp;
  cloudSaveData?: string;
  guildId?: string | null;
  quests?: {
    scansToday: number;
    gangWarWinsToday: number;
    lastQuestDate: string; // "YYYY-MM-DD"
  };
  guildRole?: 'leader' | 'coleader' | 'member' | null;
  trophies?: string[];
  elo: number;
  friends?: string[];
}

export interface Guild {
  id?: string;
  name: string;
  leaderId: string;
  leaderName: string;
  members: number;
  totalTrophies: number;
  createdAt: Timestamp;
  level: number;
  xp: number;
  xpToNextLevel: number;
  raidBoss?: {
    hp: number;
    maxHp: number;
    level: number;
    lastDefeat?: Timestamp;
  };
}

export interface GuildMessage {
  id?: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Timestamp;
  type: 'chat' | 'system';
}

export interface Challenge {
  id?: string;
  creatorId: string;
  creatorName: string;
  warriorData: string; // JSON string
  createdAt: Timestamp;
  wins: number;
  losses: number;
}

export interface PVPSession {
  id: string;
  hostId: string;
  hostName: string;
  hostWarrior: string; // JSON string
  guestId?: string;
  guestName?: string;
  guestWarrior?: string; // JSON string
  status: 'waiting' | 'starting' | 'active' | 'finished' | 'syncing';
  hostHp: number;
  guestHp: number;
  hostMaxHp: number;
  guestMaxHp: number;
  hostAttacking?: boolean;
  guestAttacking?: boolean;
  hostSpecial?: boolean;
  guestSpecial?: boolean;
  hostReady?: boolean;
  guestReady?: boolean;
  hostShields: number;
  guestShields: number;
  isCharging?: 'host' | 'guest' | null;
  chargeType?: string;
  lastChargeTime?: Timestamp | null;
  hostLastAttack?: Timestamp | null;
  guestLastAttack?: Timestamp | null;
  winnerId?: string;
  hostElo?: number;
  guestElo?: number;
  lastUpdate: Timestamp;
}

export interface MatchmakingEntry {
  id: string;
  uid: string;
  displayName: string;
  warriorData: string;
  tier: number;
  elo: number;
  timestamp: Timestamp;
  matchFound?: string; // sessionId
}

const ensureUserProfile = async (user: User, username?: string) => {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      displayName: username || user.displayName || 'Anonymous Warrior',
      photoURL: user.photoURL || '',
      totalWins: 0,
      highestCombo: 0,
      collectionSize: 0,
      level: 1,
      scrap: 0,
      highestWave: 0,
      highestBlitzScore: 0,
      lastActive: Timestamp.now(),
      guildId: null,
      quests: {
        scansToday: 0,
        gangWarWinsToday: 0,
        lastQuestDate: new Date().toISOString().split('T')[0]
      },
      elo: 1000,
      friends: []
    });
  } else {
    const updates: any = { lastActive: Timestamp.now() };
    if (username && userSnap.data().displayName === 'Anonymous Warrior') {
      updates.displayName = username;
    }
    if (user.photoURL && !userSnap.data().photoURL) {
      updates.photoURL = user.photoURL;
    }
    await updateDoc(userRef, updates);
  }
};

export const initAuth = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (error) {
    console.error("Error setting auth persistence:", error);
  }

  try {
    const redirectResult = await getRedirectResult(auth);
    if (redirectResult?.user) {
      await ensureUserProfile(redirectResult.user);
    }
  } catch (error) {
    console.error("Error processing redirect result:", error);
  }
};

// Auth Functions
export const signIn = async (username?: string) => {
  try {
    const result = await signInAnonymously(auth);
    await ensureUserProfile(result.user, username);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in:", error);
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error("ANONYMOUS AUTH IS DISABLED. Go to Firebase Console > Auth > Sign-in method > Enable Anonymous.");
    }
    throw error;
  }
};

export const signUpWithEmail = async (email: string, pass: string, username: string): Promise<User> => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(result.user, { displayName: username });
    await ensureUserProfile(result.user);
    return result.user;
  } catch (error: any) {
    console.error("Sign Up Error:", error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, pass: string): Promise<User> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    await ensureUserProfile(result.user);
    return result.user;
  } catch (error: any) {
    console.error("Sign In Error:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const updateUserElo = async (userId: string, eloDelta: number) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    elo: increment(eloDelta)
  });
};

// Leaderboard Functions
export const getLeaderboard = async (limitCount = 10): Promise<UserProfile[]> => {
  try {
    const q = query(collection(db, 'users'), orderBy('totalWins', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as UserProfile);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
};

export const subscribeToLeaderboard = (callback: (users: UserProfile[]) => void, limitCount = 10) => {
  const q = query(collection(db, 'users'), orderBy('totalWins', 'desc'), limit(limitCount));
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => doc.data() as UserProfile);
    callback(users);
  }, (error) => {
    console.error("Leaderboard subscription error:", error);
  });
};

export const updateUserStats = async (uid: string, stats: Partial<UserProfile>) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...stats,
      lastActive: Timestamp.now()
    });
  } catch (error) {
    console.error("Error updating user stats:", error);
  }
};

export const subscribeToUserProfile = (uid: string, callback: (stats: Partial<UserProfile>) => void) => {
  const userRef = doc(db, 'users', uid);
  return onSnapshot(userRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as UserProfile);
    }
  }, (error) => {
    console.error("User profile subscription error:", error);
  });
};

export const syncCloudSave = async (uid: string, saveData: string) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      cloudSaveData: saveData,
      lastActive: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error("Error saving to cloud:", error);
    return false;
  }
};

export const getCloudSave = async (uid: string): Promise<string | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists() && snap.data().cloudSaveData) {
      return snap.data().cloudSaveData;
    }
    return null;
  } catch (error) {
    console.error("Error reading from cloud:", error);
    return null;
  }
};

// Challenge Functions
export const createChallenge = async (warrior: WarriorData, user: User): Promise<string> => {
  try {
    const challengeData: Omit<Challenge, 'id'> = {
      creatorId: user.uid,
      creatorName: user.displayName || 'Anonymous',
      warriorData: JSON.stringify(warrior),
      createdAt: Timestamp.now(),
      wins: 0,
      losses: 0
    };

    const docRef = await addDoc(collection(db, 'challenges'), challengeData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating challenge:", error);
    throw error;
  }
};

export const getChallenge = async (challengeId: string): Promise<Challenge | null> => {
  try {
    const docRef = doc(db, 'challenges', challengeId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Challenge;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching challenge:", error);
    return null;
  }
};

export const updateChallengeStats = async (challengeId: string, win: boolean) => {
  try {
    const challengeRef = doc(db, 'challenges', challengeId);
    await updateDoc(challengeRef, {
      [win ? 'wins' : 'losses']: increment(1)
    });
  } catch (error) {
    console.error("Error updating challenge stats:", error);
  }
};

// Guild Functions
export const createGuild = async (name: string, user: User): Promise<string> => {
  try {
    const guildData: Omit<Guild, 'id'> = {
      name,
      leaderId: user.uid,
      leaderName: user.displayName || 'Anonymous',
      members: 1,
      totalTrophies: 0,
      createdAt: Timestamp.now(),
      level: 1,
      xp: 0,
      xpToNextLevel: 1000
    };

    // Create guild doc
    const docRef = await addDoc(collection(db, 'guilds'), guildData);

    // Update user to belong to this guild
    await updateUserStats(user.uid, { guildId: docRef.id, guildRole: 'leader' });

    return docRef.id;
  } catch (error) {
    console.error("Error creating guild:", error);
    throw error;
  }
};

export const joinGuild = async (guildId: string, user: User): Promise<boolean> => {
  try {
    const guildRef = doc(db, 'guilds', guildId);
    await updateDoc(guildRef, {
      members: increment(1)
    });

    await updateUserStats(user.uid, { guildId: guildId, guildRole: 'member' });
    return true;
  } catch (error) {
    console.error("Error joining guild:", error);
    return false;
  }
};

export const getGuilds = async (limitCount = 20): Promise<Guild[]> => {
  try {
    const q = query(collection(db, 'guilds'), orderBy('totalTrophies', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Guild));
  } catch (error) {
    console.error("Error fetching guilds:", error);
    return [];
  }
};

export const getGuildMembers = async (guildId: string): Promise<UserProfile[]> => {
  try {
    const q = query(collection(db, 'users'), where('guildId', '==', guildId));
    const querySnapshot = await getDocs(q);
    const members = querySnapshot.docs.map(doc => doc.data() as UserProfile);
    // Sort array locally by totalWins (Descending) to bypass Firebase Index requirement
    return members.sort((a, b) => b.totalWins - a.totalWins);
  } catch (error) {
    console.error("Error fetching guild members:", error);
    return [];
  }
};

export const leaveGuild = async (uid: string, guildId: string): Promise<boolean> => {
  try {
    const guildRef = doc(db, 'guilds', guildId);
    const userRef = doc(db, 'users', uid);
    
    // Check if user is leader
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data() as UserProfile;
    const guildSnap = await getDoc(guildRef);
    const guildData = guildSnap.data() as Guild;

    if (guildData.leaderId === uid) {
      // Leader leaving: if other members exist, promote the one with most trophies
      const members = await getGuildMembers(guildId);
      const others = members.filter(m => m.uid !== uid);
      
      if (others.length > 0) {
        const nextLeader = others[0]; // Already sorted by wins
        await updateDoc(guildRef, {
          leaderId: nextLeader.uid,
          leaderName: nextLeader.displayName,
          members: increment(-1)
        });
        await updateDoc(doc(db, 'users', nextLeader.uid), { guildRole: 'leader' });
      } else {
        // Last member is leader, delete guild
        await deleteDoc(guildRef);
      }
    } else {
      await updateDoc(guildRef, {
        members: increment(-1)
      });
    }

    await updateDoc(userRef, {
      guildId: null,
      guildRole: null
    });
    
    return true;
  } catch (error) {
    console.error("Error leaving guild:", error);
    return false;
  }
};

export const promoteMember = async (targetUid: string, guildId: string, currentRole: string): Promise<boolean> => {
  try {
    const newRole = currentRole === 'member' ? 'coleader' : 'leader';
    const userRef = doc(db, 'users', targetUid);

    // Order matters for the security rules: the target's role is changed while
    // the caller is still the leader, then the guild, then the caller steps down.
    await updateDoc(userRef, { guildRole: newRole });

    if (newRole === 'leader') {
      const guildRef = doc(db, 'guilds', guildId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data() as UserProfile;

      const guildSnap = await getDoc(guildRef);
      const oldLeaderId = guildSnap.data()?.leaderId;

      await updateDoc(guildRef, {
        leaderId: targetUid,
        leaderName: userData.displayName
      });

      // Downgrade old leader (the caller)
      if (oldLeaderId) {
        await updateDoc(doc(db, 'users', oldLeaderId), { guildRole: 'coleader' });
      }
    }

    return true;
  } catch (error) {
    console.error("Error promoting member:", error);
    return false;
  }
};

export const kickMember = async (targetUid: string, guildId: string): Promise<boolean> => {
  return leaveGuild(targetUid, guildId);
};
// PvP Functions
export const createPvPSession = async (user: User, warrior: WarriorData): Promise<string> => {
  // Compress image to stay under 1MB
  let compressedWarrior = { ...warrior };
  if (warrior.imageUrl && warrior.imageUrl.length > 500000) {
    try {
      compressedWarrior.imageUrl = await compressImage(warrior.imageUrl, 400, 0.6);
    } catch (e) {
      console.warn("Failed to compress for pvp session", e);
    }
  }

  const sessionData: Omit<PVPSession, 'id'> = {
    hostId: user.uid,
    hostName: user.displayName || 'Warrior',
    hostWarrior: JSON.stringify(compressedWarrior),
    status: 'waiting',
    hostHp: warrior.stats.hp,
    guestHp: 0,
    hostMaxHp: warrior.stats.hp,
    guestMaxHp: 0,
    hostReady: false,
    guestReady: false,
    hostShields: 2,
    guestShields: 2,
    isCharging: null,
    lastUpdate: Timestamp.now()
  };

  const docRef = await addDoc(collection(db, 'pvp_battles'), sessionData);
  return docRef.id;
};

export const findPvPSessions = async (): Promise<PVPSession[]> => {
  const q = query(
    collection(db, 'pvp_battles'), 
    where('status', '==', 'waiting'), 
    limit(50)
  );
  const snap = await getDocs(q);
  // Sort in-memory to avoid needing a composite index (status + lastUpdate)
  return snap.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as PVPSession))
    .sort((a, b) => b.lastUpdate.toMillis() - a.lastUpdate.toMillis());
};

export const joinPvPSession = async (sessionId: string, user: User, warrior: WarriorData) => {
  // Compress image to stay under 1MB
  let compressedWarrior = { ...warrior };
  if (warrior.imageUrl && warrior.imageUrl.length > 500000) {
    try {
      compressedWarrior.imageUrl = await compressImage(warrior.imageUrl, 400, 0.6);
    } catch (e) {
      console.warn("Failed to compress for joining session", e);
    }
  }

  const sessionRef = doc(db, 'pvp_battles', sessionId);
  await updateDoc(sessionRef, {
    guestId: user.uid,
    guestName: user.displayName || 'Challenger',
    guestWarrior: JSON.stringify(compressedWarrior),
    guestHp: warrior.stats.hp,
    guestMaxHp: warrior.stats.hp,
    guestReady: false,
    status: 'syncing',
    lastUpdate: Timestamp.now()
  });
};

export const updatePvPStats = async (sessionId: string, updates: Partial<PVPSession>) => {
  const sessionRef = doc(db, 'pvp_battles', sessionId);
  await updateDoc(sessionRef, {
    ...updates,
    lastUpdate: Timestamp.now()
  });
};

export const subscribeToPvPSession = (sessionId: string, callback: (session: PVPSession) => void) => {
  const sessionRef = doc(db, 'pvp_battles', sessionId);
  return onSnapshot(sessionRef, (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() } as PVPSession);
    }
  });
};

export const getPvPSession = async (sessionId: string): Promise<PVPSession | null> => {
  const sessionRef = doc(db, 'pvp_battles', sessionId);
  const snap = await getDoc(sessionRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as PVPSession;
  }
  return null;
};

export const cleanupPvPSession = async (sessionId: string) => {
  try {
    const sessionRef = doc(db, 'pvp_battles', sessionId);
    await updateDoc(sessionRef, { status: 'finished' });
  } catch (e) {
    console.error("Cleanup PvP error:", e);
  }
};

// Matchmaking Functions
export const enterMatchmaking = async (user: User, warrior: WarriorData, level: number, elo: number = 1000): Promise<string> => {
  const tier = Math.floor(level / 5); // Match players every 5 levels
  
  // Compress image right before matchmaking to stay under 1MB
  let compressedWarrior = { ...warrior };
  if (warrior.imageUrl) {
    try {
      compressedWarrior.imageUrl = await compressImage(warrior.imageUrl, 400, 0.6);
    } catch (e) {
      console.warn("Failed to compress for matchmaking", e);
    }
  }

  const entryData: Omit<MatchmakingEntry, 'id'> = {
    uid: user.uid,
    displayName: user.displayName || 'Warrior',
    warriorData: JSON.stringify(compressedWarrior),
    tier,
    elo,
    timestamp: Timestamp.now()
  };

  const docRef = await addDoc(collection(db, 'matchmaking'), entryData);
  return docRef.id;
};

export const cancelMatchmaking = async (entryId: string) => {
  try {
    await deleteDoc(doc(db, 'matchmaking', entryId));
  } catch (e) {
    console.error("Cancel matchmaking error:", e);
  }
};

export const listenForMatch = (entryId: string, callback: (sessionId: string) => void) => {
  return onSnapshot(doc(db, 'matchmaking', entryId), (snap) => {
    if (snap.exists() && snap.data().matchFound) {
      callback(snap.data().matchFound);
    }
  });
};

export const findMatch = async (tier: number, excludeUid: string): Promise<MatchmakingEntry | null> => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const q = query(
    collection(db, 'matchmaking'),
    where('tier', '==', tier),
    limit(100) // Get a larger pool to filter in-memory
  );
  
  const snap = await getDocs(q);
  if (snap.empty) return null;
  
  // Convert to array and filter/sort in memory to avoid needing a composite index (tier + timestamp)
  const entries = snap.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as MatchmakingEntry))
    .filter(entry => {
      const isNotSelf = entry.uid !== excludeUid;
      const isNotMatched = !entry.matchFound;
      const isRecent = entry.timestamp.toMillis() >= fiveMinutesAgo.getTime();
      return isNotSelf && isNotMatched && isRecent;
    })
    .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis()); // Oldest first
  
  if (entries.length === 0) return null;
  return entries[0];
};

export const findDirectMatch = async (targetUid: string): Promise<MatchmakingEntry | null> => {
  const q = query(
    collection(db, 'matchmaking'),
    where('uid', '==', targetUid)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as MatchmakingEntry;
};

export const createMatchFromEntry = async (entry: MatchmakingEntry, finder: User, finderWarrior: WarriorData, finderElo: number = 1000): Promise<string> => {
  // The entry owner (who was waiting in the queue) is the Firestore "host".
  // The finder (who picked them up) is the Firestore "guest".
  // This is critical: the entry owner's listener reads session.hostWarrior as the opponent,
  // so hostWarrior must be the FINDER's warrior (the opponent from the entry owner's perspective).

  // Compress finder's warrior image
  let compressedFinderWarrior = { ...finderWarrior };
  if (finderWarrior.imageUrl && finderWarrior.imageUrl.length > 500000) {
    try {
      compressedFinderWarrior.imageUrl = await compressImage(finderWarrior.imageUrl, 400, 0.6);
    } catch (e) {
      console.warn("Failed to compress finder warrior for match", e);
    }
  }

  // 1. Build session: entry owner = host fields, finder = guest fields
  const entryWarriorData = JSON.parse(entry.warriorData);
  const sessionData: Omit<PVPSession, 'id'> = {
    // Host = entry owner (was waiting)
    hostId: entry.uid,
    hostName: entry.displayName,
    hostWarrior: entry.warriorData,
    hostHp: entryWarriorData.stats.hp,
    hostMaxHp: entryWarriorData.stats.hp,
    hostReady: false,
    hostShields: 2,
    hostElo: entry.elo || 1000,
    // Guest = finder (joined)
    guestId: finder.uid,
    guestName: finder.displayName || 'Warrior',
    guestWarrior: JSON.stringify(compressedFinderWarrior),
    guestHp: finderWarrior.stats.hp,
    guestMaxHp: finderWarrior.stats.hp,
    guestReady: false,
    guestShields: 2,
    guestElo: finderElo, 
    status: 'starting',
    isCharging: null,
    lastUpdate: Timestamp.now()
  };

  const docRef = await addDoc(collection(db, 'pvp_battles'), sessionData);
  const sessionId = docRef.id;

  // 2. Notify the entry owner with the session ID
  await updateDoc(doc(db, 'matchmaking', entry.id), {
    matchFound: sessionId
  });

  return sessionId;
};

// Gang Raid Functions
export const attackRaidBoss = async (guildId: string, damage: number) => {
  const guildRef = doc(db, 'guilds', guildId);
  await updateDoc(guildRef, {
    'raidBoss.hp': increment(-damage)
  });
};

export const initRaidBoss = async (guildId: string, level: number) => {
  const hp = 10000 * level;
  await updateDoc(doc(db, 'guilds', guildId), {
    raidBoss: {
      hp,
      maxHp: hp,
      level,
      lastDefeat: null
    }
  });
};

// Trophy System Logic
export async function checkAndUnlockTrophies(userId: string, currentProfile: UserProfile): Promise<string[]> {
  try {
    const { TROPHIES } = await import('../data/trophies');
    const unlockedTrophies = currentProfile.trophies || [];
    const newUnlocks: string[] = [];

    TROPHIES.forEach(trophy => {
      if (unlockedTrophies.includes(trophy.id)) return;

      let met = false;
      const { type, value } = trophy.requirement;

      switch (type) {
        case 'wins': met = currentProfile.totalWins >= value; break;
        case 'level': met = currentProfile.level >= value; break;
        case 'combo': met = currentProfile.highestCombo >= value; break;
        case 'collection': met = currentProfile.collectionSize >= value; break;
        case 'wave': met = currentProfile.highestWave >= value; break;
      }

      if (met) {
        newUnlocks.push(trophy.id);
      }
    });

    if (newUnlocks.length > 0) {
      const updatedTrophies = [...unlockedTrophies, ...newUnlocks];
      await updateDoc(doc(db, 'users', userId), {
        trophies: updatedTrophies
      });
      return newUnlocks;
    }

    return [];
  } catch (error) {
    console.error('Error checking trophies:', error);
    return [];
  }
}
// Friend Functions
export const addFriend = async (uid: string, friendUid: string) => {
  if (uid === friendUid) return;
  try {
    const userRef = doc(db, 'users', uid);
    const friendRef = doc(db, 'users', friendUid);

    // Update current user
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const currentFriends = userSnap.data().friends || [];
      if (!currentFriends.includes(friendUid)) {
        await updateDoc(userRef, {
          friends: [...currentFriends, friendUid]
        });
      }
    }

    // Update friend (reciprocal)
    const friendSnap = await getDoc(friendRef);
    if (friendSnap.exists()) {
      const friendFriends = friendSnap.data().friends || [];
      if (!friendFriends.includes(uid)) {
        await updateDoc(friendRef, {
          friends: [...friendFriends, uid]
        });
      }
    }
    return true;
  } catch (error) {
    console.error("Error adding friend:", error);
    return false;
  }
};

// Gang Progression & Social Functions
export const contributeToGuild = async (guildId: string, uid: string, scrapAmount: number) => {
  try {
    const guildRef = doc(db, 'guilds', guildId);
    const userRef = doc(db, 'users', uid);
    
    // 1 Scrap = 2 XP for the Gang
    const xpGained = scrapAmount * 2;
    
    const guildSnap = await getDoc(guildRef);
    if (!guildSnap.exists()) return;
    
    const guildData = guildSnap.data() as Guild;
    let newXp = (guildData.xp || 0) + xpGained;
    let newLevel = guildData.level || 1;
    let newXpToNext = guildData.xpToNextLevel || 1000;
    
    // Level up logic
    while (newXp >= newXpToNext) {
      newXp -= newXpToNext;
      newLevel++;
      newXpToNext = Math.floor(newXpToNext * 1.5);
    }
    
    await updateDoc(guildRef, {
      xp: newXp,
      level: newLevel,
      xpToNextLevel: newXpToNext
    });
    
    await updateDoc(userRef, {
      scrap: increment(-scrapAmount)
    });

    // Add a system message for contribution
    await sendGuildMessage(guildId, {
      senderId: 'system',
      senderName: 'SYSTEM',
      content: `Someone contributed ${scrapAmount} scrap! Gang gained ${xpGained} XP.`,
      timestamp: Timestamp.now(),
      type: 'system'
    });
    
    return true;
  } catch (error) {
    console.error("Error contributing to guild:", error);
    return false;
  }
};

export const awardGuildXp = async (guildId: string, xpAmount: number) => {
  try {
    const guildRef = doc(db, 'guilds', guildId);
    const guildSnap = await getDoc(guildRef);
    if (!guildSnap.exists()) return;
    
    const guildData = guildSnap.data() as Guild;
    let newXp = (guildData.xp || 0) + xpAmount;
    let newLevel = guildData.level || 1;
    let newXpToNext = guildData.xpToNextLevel || 1000;
    
    while (newXp >= newXpToNext) {
      newXp -= newXpToNext;
      newLevel++;
      newXpToNext = Math.floor(newXpToNext * 1.5);
    }
    
    await updateDoc(guildRef, {
      xp: newXp,
      level: newLevel,
      xpToNextLevel: newXpToNext
    });
  } catch (error) {
    console.error("Error awarding guild XP:", error);
  }
};

export const sendGuildMessage = async (guildId: string, message: Omit<GuildMessage, 'id'>) => {
  try {
    const messagesRef = collection(db, 'guilds', guildId, 'messages');
    await addDoc(messagesRef, {
      ...message,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Error sending guild message:", error);
  }
};

export const subscribeToGuildMessages = (guildId: string, callback: (messages: GuildMessage[]) => void) => {
  const q = query(
    collection(db, 'guilds', guildId, 'messages'),
    orderBy('timestamp', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as GuildMessage));
    callback(messages.reverse());
  });
};
