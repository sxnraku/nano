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
  deleteDoc
} from 'firebase/firestore';
import type { WarriorData } from './gemini';
import { compressImage } from './imageUtils';

// Import the Firebase configuration
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
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
}

export interface Guild {
  id?: string;
  name: string;
  leaderId: string;
  leaderName: string;
  members: number;
  totalTrophies: number;
  createdAt: Timestamp;
  raidBoss?: {
    hp: number;
    maxHp: number;
    level: number;
    lastDefeat?: Timestamp;
  };
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
  status: 'waiting' | 'starting' | 'active' | 'finished';
  hostHp: number;
  guestHp: number;
  hostMaxHp: number;
  guestMaxHp: number;
  winnerId?: string;
  lastUpdate: Timestamp;
}

export interface MatchmakingEntry {
  id: string;
  uid: string;
  displayName: string;
  warriorData: string;
  tier: number;
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
      }
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
      createdAt: Timestamp.now()
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
    
    if (newRole === 'leader') {
      // Transfer leadership
      const guildRef = doc(db, 'guilds', guildId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data() as UserProfile;
      
      const guildSnap = await getDoc(guildRef);
      const oldLeaderId = guildSnap.data()?.leaderId;
      
      await updateDoc(guildRef, {
        leaderId: targetUid,
        leaderName: userData.displayName
      });
      
      // Downgrade old leader
      if (oldLeaderId) {
        await updateDoc(doc(db, 'users', oldLeaderId), { guildRole: 'coleader' });
      }
    }
    
    await updateDoc(userRef, { guildRole: newRole });
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
    lastUpdate: Timestamp.now()
  };

  const docRef = await addDoc(collection(db, 'pvp_battles'), sessionData);
  return docRef.id;
};

export const findPvPSessions = async (): Promise<PVPSession[]> => {
  const q = query(
    collection(db, 'pvp_battles'), 
    where('status', '==', 'waiting'), 
    orderBy('lastUpdate', 'desc'), 
    limit(10)
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PVPSession));
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
    status: 'starting',
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

export const cleanupPvPSession = async (sessionId: string) => {
  try {
    const sessionRef = doc(db, 'pvp_battles', sessionId);
    await updateDoc(sessionRef, { status: 'finished' });
  } catch (e) {
    console.error("Cleanup PvP error:", e);
  }
};

// Matchmaking Functions
export const enterMatchmaking = async (user: User, warrior: WarriorData, level: number): Promise<string> => {
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
  const q = query(
    collection(db, 'matchmaking'),
    where('tier', '==', tier),
    limit(20) // Get a pool of potential matches
  );
  
  const snap = await getDocs(q);
  if (snap.empty) return null;
  
  // Convert to array and filter/sort in memory
  const entries = snap.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as MatchmakingEntry))
    .filter(entry => entry.uid !== excludeUid)
    .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis()); // Oldest first
  
  if (entries.length === 0) return null;
  return entries[0];
};

export const createMatchFromEntry = async (entry: MatchmakingEntry, guest: User, guestWarrior: WarriorData): Promise<string> => {
  // 1. Create PVP Session
  const sessionId = await createPvPSession(guest, guestWarrior);
  
  // 2. Join the session as host (using the entry data)
  const sessionRef = doc(db, 'pvp_battles', sessionId);
  await updateDoc(sessionRef, {
    guestId: entry.uid,
    guestName: entry.displayName,
    guestWarrior: entry.warriorData,
    guestHp: JSON.parse(entry.warriorData).stats.hp,
    guestMaxHp: JSON.parse(entry.warriorData).stats.hp,
    status: 'starting'
  });

  // 3. Notify the original host
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
