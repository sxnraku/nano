// Firestore security rules tests. Run with: npm run test:rules
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment, assertSucceeds, assertFails,
} from '@firebase/rules-unit-testing';
import {
  doc, setDoc, updateDoc, deleteDoc, addDoc, collection, getDoc, increment, Timestamp,
} from 'firebase/firestore';

let env;
const db = (uid) => env.authenticatedContext(uid).firestore();

const freshUser = (uid, extra = {}) => ({
  uid, displayName: uid, photoURL: '', totalWins: 0, highestCombo: 0, collectionSize: 0,
  level: 1, scrap: 0, highestWave: 0, highestBlitzScore: 0, lastActive: Timestamp.now(),
  guildId: null, elo: 1000, friends: [], ...extra,
});

async function seed(fn) {
  await env.withSecurityRulesDisabled(async (ctx) => fn(ctx.firestore()));
}

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-nanoverse',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});
after(async () => env.cleanup());
beforeEach(async () => env.clearFirestore());

// ---------------------------------------------------------------- users

test('new profile must start from zero', async () => {
  await assertSucceeds(setDoc(doc(db('alice'), 'users/alice'), freshUser('alice')));
  await assertFails(setDoc(doc(db('bob'), 'users/bob'), freshUser('bob', { totalWins: 999 })));
  await assertFails(setDoc(doc(db('bob'), 'users/bob'), freshUser('bob', { elo: 3000 })));
  await assertFails(setDoc(doc(db('bob'), 'users/alice'), freshUser('alice')));
});

test('own stats sync works, but wins and ELO move by plausible steps', async () => {
  await seed((d) => setDoc(doc(d, 'users/alice'), freshUser('alice', { totalWins: 5, trophies: ['t1'] })));
  const a = db('alice');
  await assertSucceeds(updateDoc(doc(a, 'users/alice'), { totalWins: 6, level: 4, scrap: 500, collectionSize: 3, highestWave: 30, lastActive: Timestamp.now() }));
  await assertFails(updateDoc(doc(a, 'users/alice'), { totalWins: 100 }));
  await assertSucceeds(updateDoc(doc(a, 'users/alice'), { elo: increment(25) }));
  await assertSucceeds(updateDoc(doc(a, 'users/alice'), { elo: increment(-30) }));
  await assertFails(updateDoc(doc(a, 'users/alice'), { elo: increment(500) }));
  await assertSucceeds(updateDoc(doc(a, 'users/alice'), { trophies: ['t1', 't2'] }));
  await assertFails(updateDoc(doc(a, 'users/alice'), { trophies: ['t2'] }));
  await assertFails(updateDoc(doc(a, 'users/alice'), { uid: 'mallory' }));
});

test('cloud save fits; strangers cannot touch my stats', async () => {
  await seed((d) => setDoc(doc(d, 'users/alice'), freshUser('alice')));
  await assertSucceeds(updateDoc(doc(db('alice'), 'users/alice'), { cloudSaveData: 'x'.repeat(1000) }));
  await assertFails(updateDoc(doc(db('mallory'), 'users/alice'), { scrap: 0 }));
  await assertFails(updateDoc(doc(db('mallory'), 'users/alice'), { elo: increment(-30) }));
});

test('friend invite: the other player only adds themselves', async () => {
  await seed(async (d) => {
    await setDoc(doc(d, 'users/alice'), freshUser('alice', { friends: ['carol'] }));
    await setDoc(doc(d, 'users/bob'), freshUser('bob'));
  });
  await assertSucceeds(updateDoc(doc(db('bob'), 'users/alice'), { friends: ['carol', 'bob'] }));
  await assertFails(updateDoc(doc(db('bob'), 'users/alice'), { friends: ['bob'] }));
  await assertFails(updateDoc(doc(db('mallory'), 'users/alice'), { friends: ['carol', 'bob', 'mallory', 'x'] }));
});

// ---------------------------------------------------------------- guilds

const guild = (leaderId, extra = {}) => ({
  name: 'Gang', leaderId, leaderName: leaderId, members: 1, totalTrophies: 0,
  createdAt: Timestamp.now(), level: 1, xp: 0, xpToNextLevel: 1000, ...extra,
});

test('create guild then become its leader', async () => {
  await seed((d) => setDoc(doc(d, 'users/alice'), freshUser('alice')));
  const a = db('alice');
  const ref = await assertSucceeds(addDoc(collection(a, 'guilds'), guild('alice')));
  await assertSucceeds(updateDoc(doc(a, 'users/alice'), { guildId: ref.id, guildRole: 'leader' }));
  await assertFails(addDoc(collection(a, 'guilds'), guild('alice', { members: 50 })));
  await assertFails(addDoc(collection(a, 'guilds'), guild('bob')));
});

test('cannot claim leadership of someone else\'s guild', async () => {
  await seed(async (d) => {
    await setDoc(doc(d, 'guilds/g1'), guild('alice'));
    await setDoc(doc(d, 'users/bob'), freshUser('bob'));
  });
  await assertFails(updateDoc(doc(db('bob'), 'users/bob'), { guildId: 'g1', guildRole: 'leader' }));
  await assertFails(updateDoc(doc(db('bob'), 'users/bob'), { guildId: 'g1', guildRole: 'coleader' }));
  await assertFails(updateDoc(doc(db('bob'), 'guilds/g1'), { leaderId: 'bob', leaderName: 'bob' }));
});

test('join, leave, chat, contribute, raid', async () => {
  await seed(async (d) => {
    await setDoc(doc(d, 'guilds/g1'), guild('alice'));
    await setDoc(doc(d, 'users/alice'), freshUser('alice', { guildId: 'g1', guildRole: 'leader' }));
    await setDoc(doc(d, 'users/bob'), freshUser('bob', { scrap: 100 }));
  });
  const b = db('bob');
  // join
  await assertSucceeds(updateDoc(doc(b, 'guilds/g1'), { members: increment(1) }));
  await assertSucceeds(updateDoc(doc(b, 'users/bob'), { guildId: 'g1', guildRole: 'member' }));
  await assertFails(updateDoc(doc(b, 'guilds/g1'), { members: increment(10) }));
  // chat
  await assertSucceeds(addDoc(collection(b, 'guilds/g1/messages'), { senderId: 'bob', senderName: 'bob', content: 'oi', type: 'user' }));
  await assertSucceeds(addDoc(collection(b, 'guilds/g1/messages'), { senderId: 'system', senderName: 'SYSTEM', content: 'x', type: 'system' }));
  await assertFails(addDoc(collection(b, 'guilds/g1/messages'), { senderId: 'alice', senderName: 'alice', content: 'fake', type: 'user' }));
  await assertFails(addDoc(collection(db('mallory'), 'guilds/g1/messages'), { senderId: 'mallory', content: 'spam', type: 'user' }));
  await assertSucceeds(getDoc(doc(b, 'guilds/g1')));
  // contribute
  await assertSucceeds(updateDoc(doc(b, 'guilds/g1'), { xp: 200, level: 1, xpToNextLevel: 1000 }));
  await assertSucceeds(updateDoc(doc(b, 'users/bob'), { scrap: increment(-100) }));
  await assertFails(updateDoc(doc(b, 'guilds/g1'), { level: 99 }));
  await assertFails(updateDoc(doc(db('mallory'), 'guilds/g1'), { xp: 999 }));
  // raid
  await assertSucceeds(updateDoc(doc(b, 'guilds/g1'), { raidBoss: { hp: 10000, maxHp: 10000, level: 1, lastDefeat: null } }));
  await assertSucceeds(updateDoc(doc(b, 'guilds/g1'), { 'raidBoss.hp': increment(-500) }));
  await assertFails(updateDoc(doc(b, 'guilds/g1'), { 'raidBoss.hp': increment(500) }));
  await assertFails(updateDoc(doc(b, 'guilds/g1'), { raidBoss: { hp: 1, maxHp: 1, level: 1, lastDefeat: null } }));
  // leave
  await assertSucceeds(updateDoc(doc(b, 'guilds/g1'), { members: increment(-1) }));
  await assertSucceeds(updateDoc(doc(b, 'users/bob'), { guildId: null, guildRole: null }));
});

test('leader promotes, hands over leadership, and kicks', async () => {
  await seed(async (d) => {
    await setDoc(doc(d, 'guilds/g1'), guild('alice', { members: 3 }));
    await setDoc(doc(d, 'users/alice'), freshUser('alice', { guildId: 'g1', guildRole: 'leader' }));
    await setDoc(doc(d, 'users/bob'), freshUser('bob', { guildId: 'g1', guildRole: 'member' }));
    await setDoc(doc(d, 'users/carol'), freshUser('carol', { guildId: 'g1', guildRole: 'member' }));
  });
  const a = db('alice');
  // member cannot promote
  await assertFails(updateDoc(doc(db('carol'), 'users/bob'), { guildRole: 'coleader' }));
  // promote to co-leader
  await assertSucceeds(updateDoc(doc(a, 'users/bob'), { guildRole: 'coleader' }));
  // co-leader cannot crown anyone
  await assertFails(updateDoc(doc(db('bob'), 'users/carol'), { guildRole: 'leader' }));
  // kick (promoteMember/leaveGuild order used by the app)
  await assertSucceeds(updateDoc(doc(a, 'guilds/g1'), { members: increment(-1) }));
  await assertSucceeds(updateDoc(doc(a, 'users/carol'), { guildId: null, guildRole: null }));
  // hand over leadership: target first, then guild, then step down
  await assertSucceeds(updateDoc(doc(a, 'users/bob'), { guildRole: 'leader' }));
  await assertSucceeds(updateDoc(doc(a, 'guilds/g1'), { leaderId: 'bob', leaderName: 'bob' }));
  await assertSucceeds(updateDoc(doc(a, 'users/alice'), { guildRole: 'coleader' }));
  // co-leader cannot kick the leader
  await assertFails(updateDoc(doc(a, 'users/bob'), { guildId: null, guildRole: null }));
});

test('leader leaves: next leader promoted, last one deletes guild', async () => {
  await seed(async (d) => {
    await setDoc(doc(d, 'guilds/g1'), guild('alice', { members: 2 }));
    await setDoc(doc(d, 'users/alice'), freshUser('alice', { guildId: 'g1', guildRole: 'leader' }));
    await setDoc(doc(d, 'users/bob'), freshUser('bob', { guildId: 'g1', guildRole: 'member' }));
    await setDoc(doc(d, 'guilds/g2'), guild('carol'));
    await setDoc(doc(d, 'users/carol'), freshUser('carol', { guildId: 'g2', guildRole: 'leader' }));
  });
  const a = db('alice');
  await assertSucceeds(updateDoc(doc(a, 'guilds/g1'), { leaderId: 'bob', leaderName: 'bob', members: increment(-1) }));
  await assertSucceeds(updateDoc(doc(a, 'users/bob'), { guildRole: 'leader' }));
  await assertSucceeds(updateDoc(doc(a, 'users/alice'), { guildId: null, guildRole: null }));
  await assertFails(deleteDoc(doc(db('bob'), 'guilds/g2')));
  await assertSucceeds(deleteDoc(doc(db('carol'), 'guilds/g2')));
});

// ---------------------------------------------------------------- pvp

const session = (hostId, extra = {}) => ({
  hostId, hostName: hostId, hostWarrior: '{"w":1}', status: 'waiting', hostHp: 100, guestHp: 0,
  hostMaxHp: 100, guestMaxHp: 0, hostReady: false, guestReady: false, hostShields: 2, guestShields: 2,
  isCharging: null, lastUpdate: Timestamp.now(), ...extra,
});

test('pvp lobby: create, join, play; outsiders locked out', async () => {
  const ref = await assertSucceeds(addDoc(collection(db('alice'), 'pvp_battles'), session('alice')));
  await assertFails(addDoc(collection(db('alice'), 'pvp_battles'), session('bob')));
  const b = db('bob');
  await assertSucceeds(updateDoc(doc(b, 'pvp_battles', ref.id), {
    guestId: 'bob', guestName: 'bob', guestWarrior: '{"w":2}', guestHp: 90, guestMaxHp: 90, guestReady: false, status: 'syncing', lastUpdate: Timestamp.now(),
  }));
  await assertSucceeds(updateDoc(doc(b, 'pvp_battles', ref.id), { hostHp: increment(-10), guestReady: true }));
  await assertSucceeds(updateDoc(doc(db('alice'), 'pvp_battles', ref.id), { guestHp: increment(-10), status: 'finished' }));
  await assertFails(updateDoc(doc(db('mallory'), 'pvp_battles', ref.id), { hostHp: 0 }));
  await assertFails(updateDoc(doc(b, 'pvp_battles', ref.id), { hostWarrior: '{"hacked":1}' }));
  await assertFails(deleteDoc(doc(db('mallory'), 'pvp_battles', ref.id)));
});

test('matchmaking: only the matched guest can claim an entry', async () => {
  const entry = await assertSucceeds(addDoc(collection(db('alice'), 'matchmaking'), {
    uid: 'alice', displayName: 'alice', warriorData: '{}', tier: 0, elo: 1000, timestamp: Timestamp.now(),
  }));
  await assertFails(addDoc(collection(db('alice'), 'matchmaking'), { uid: 'bob', tier: 0 }));
  const b = db('bob');
  const battle = await assertSucceeds(addDoc(collection(b, 'pvp_battles'), session('alice', { guestId: 'bob', status: 'starting' })));
  await assertSucceeds(updateDoc(doc(b, 'matchmaking', entry.id), { matchFound: battle.id }));
  await assertFails(updateDoc(doc(db('mallory'), 'matchmaking', entry.id), { matchFound: 'x' }));
  await assertFails(deleteDoc(doc(b, 'matchmaking', entry.id)));
  await assertSucceeds(deleteDoc(doc(db('alice'), 'matchmaking', entry.id)));
});

// ---------------------------------------------------------------- challenges

test('challenges: record wins/losses one at a time', async () => {
  const ref = await assertSucceeds(addDoc(collection(db('alice'), 'challenges'), {
    creatorId: 'alice', warriorData: '{}', createdAt: Timestamp.now(), wins: 0, losses: 0,
  }));
  await assertSucceeds(updateDoc(doc(db('bob'), 'challenges', ref.id), { wins: increment(1) }));
  await assertFails(updateDoc(doc(db('bob'), 'challenges', ref.id), { wins: increment(50) }));
  await assertFails(updateDoc(doc(db('bob'), 'challenges', ref.id), { warriorData: '{"x":1}' }));
  await assertFails(deleteDoc(doc(db('bob'), 'challenges', ref.id)));
});

test('anyone can sweep stale matchmaking entries and battles, not fresh ones', async () => {
  const old = Timestamp.fromMillis(Date.now() - 60 * 60 * 1000);
  await seed(async (d) => {
    await setDoc(doc(d, 'matchmaking/old'), { uid: 'alice', tier: 0, timestamp: old });
    await setDoc(doc(d, 'matchmaking/new'), { uid: 'alice', tier: 0, timestamp: Timestamp.now() });
    await setDoc(doc(d, 'pvp_battles/old'), session('alice', { lastUpdate: old }));
    await setDoc(doc(d, 'pvp_battles/new'), session('alice'));
  });
  const m = db('mallory');
  await assertSucceeds(deleteDoc(doc(m, 'matchmaking/old')));
  await assertFails(deleteDoc(doc(m, 'matchmaking/new')));
  await assertSucceeds(deleteDoc(doc(m, 'pvp_battles/old')));
  await assertFails(deleteDoc(doc(m, 'pvp_battles/new')));
});
