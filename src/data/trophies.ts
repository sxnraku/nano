export interface Trophy {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: {
    type: 'wins' | 'level' | 'combo' | 'collection' | 'wave';
    value: number;
  };
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}

export const TROPHIES: Trophy[] = [
  {
    id: 'first_win',
    name: 'Primeiro Conflito',
    description: 'Vença sua primeira batalha.',
    icon: '🏆',
    requirement: { type: 'wins', value: 1 },
    rarity: 'Common'
  },
  {
    id: 'ten_wins',
    name: 'Lutador de Rua',
    description: 'Vença 10 batalhas.',
    icon: '🥊',
    requirement: { type: 'wins', value: 10 },
    rarity: 'Common'
  },
  {
    id: 'fifty_wins',
    name: 'Veterano das Sombras',
    description: 'Vença 50 batalhas.',
    icon: '⚔️',
    requirement: { type: 'wins', value: 50 },
    rarity: 'Rare'
  },
  {
    id: 'hundred_wins',
    name: 'Lenda do NanoVerse',
    description: 'Vença 100 batalhas.',
    icon: '🥇',
    requirement: { type: 'wins', value: 100 },
    rarity: 'Epic'
  },
  {
    id: 'high_combo',
    name: 'Velocidade Terminal',
    description: 'Alcance um combo de 30.',
    icon: '⚡',
    requirement: { type: 'combo', value: 30 },
    rarity: 'Rare'
  },
  {
    id: 'survivor_10',
    name: 'Sobrevivente Urbano',
    description: 'Alcance a onda 10 no modo Survival.',
    icon: '🛡️',
    requirement: { type: 'wave', value: 10 },
    rarity: 'Rare'
  },
  {
    id: 'collector_5',
    name: 'Mestre do Lixo',
    description: 'Tenha 5 guerreiros na sua coleção.',
    icon: '📦',
    requirement: { type: 'collection', value: 5 },
    rarity: 'Common'
  }
];
