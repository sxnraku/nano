export interface Rank {
  id: number;
  nameKey: string;
  minTrophies: number;
  color: string;
  icon: string;
}

export const RANKS: Rank[] = [
  { id: 0, nameKey: 'rank_0', minTrophies: 0, color: 'text-zinc-400', icon: '🥚' },
  { id: 1, nameKey: 'rank_1', minTrophies: 1, color: 'text-green-400', icon: '🗡️' },
  { id: 2, nameKey: 'rank_2', minTrophies: 2, color: 'text-cyan-400', icon: '🔫' },
  { id: 3, nameKey: 'rank_3', minTrophies: 3, color: 'text-blue-500', icon: '🚔' },
  { id: 4, nameKey: 'rank_4', minTrophies: 4, color: 'text-purple-500', icon: '⛓️' },
  { id: 5, nameKey: 'rank_5', minTrophies: 5, color: 'text-orange-500', icon: '🔥' },
  { id: 6, nameKey: 'rank_6', minTrophies: 6, color: 'text-red-500', icon: '💀' },
  { id: 7, nameKey: 'rank_7', minTrophies: 7, color: 'text-yellow-400', icon: '👑' },
];

export function getRankByTrophies(trophyCount: number): Rank {
  return [...RANKS].reverse().find(rank => trophyCount >= rank.minTrophies) || RANKS[0];
}
