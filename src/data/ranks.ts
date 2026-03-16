export interface Rank {
  id: number;
  nameKey: string;
  minTrophies: number;
  color: string;
  icon: string;
}

export const RANKS: Rank[] = [
  { id: 0, nameKey: 'Rookie', minTrophies: 0, color: '#94a3b8', icon: 'ROOKIE' },
  { id: 1, nameKey: 'Bronze', minTrophies: 1000, color: '#cd7f32', icon: 'BRONZE' },
  { id: 2, nameKey: 'Silver', minTrophies: 1200, color: '#c0c0c0', icon: 'SILVER' },
  { id: 3, nameKey: 'Gold', minTrophies: 1400, color: '#ffd700', icon: 'GOLD' },
  { id: 4, nameKey: 'Platinum', minTrophies: 1600, color: '#e5e4e2', icon: 'PLATINUM' },
  { id: 5, nameKey: 'Diamond', minTrophies: 1800, color: '#b9f2ff', icon: 'DIAMOND' },
  { id: 6, nameKey: 'Master', minTrophies: 2000, color: '#ff4500', icon: 'MASTER' },
  { id: 7, nameKey: 'Legend', minTrophies: 2500, color: '#ff00ff', icon: 'LEGEND' },
];

export function getRankByElo(elo: number): Rank {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (elo >= RANKS[i].minTrophies) { // Reusing minTrophies field for Elo
      return RANKS[i];
    }
  }
  return RANKS[0];
}
