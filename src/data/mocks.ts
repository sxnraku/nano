import type { WarriorData } from '../services/gemini';

export const MOCK_OPPONENTS: WarriorData[] = [
  {
    id: 'mock-1',
    name: 'Glitch-Wolf',
    class: 'Digital Assassin',
    element: 'Electric',
    rarity: 'Rare',
    description: 'A system anomaly that took the form of a wolf.',
    visualPrompt: '',
    originalObject: 'Old Router',
    stats: { hp: 600, atk: 75, def: 40, spd: 85 },
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop', // Temporary real image
    passive: { id: 'voltage', name: 'Voltage', description: 'Chance to Stun', effect: 'stun_chance', value: 0.10 }
  },
  {
    id: 'mock-2',
    name: 'Iron-Fern',
    class: 'Steel Druid',
    element: 'Plant/Metal',
    rarity: 'Epic',
    description: 'A fern that grew through a motherboard.',
    visualPrompt: '',
    originalObject: 'Plant Pot',
    stats: { hp: 750, atk: 40, def: 90, spd: 30 },
    imageUrl: 'https://images.unsplash.com/photo-1512428559083-a436972c75a3?q=80&w=2070&auto=format&fit=crop',
    passive: { id: 'photosynthesis', name: 'Photosynthesis', description: 'Regenerates HP slowly', effect: 'regen', value: 0.01 }
  },
  {
    id: 'mock-3',
    name: 'Soda-Bot',
    class: 'Liquid Tank',
    element: 'Water/Acid',
    rarity: 'Common',
    description: 'Pressurized soda can with aggressive AI.',
    visualPrompt: '',
    originalObject: 'Soda Can',
    stats: { hp: 1000, atk: 55, def: 60, spd: 45 },
    imageUrl: 'https://images.unsplash.com/photo-1527960669566-f882ba85a4c6?q=80&w=2070&auto=format&fit=crop',
    passive: { id: 'iron_clad', name: 'Iron Skin', description: '-15% Damage Taken', effect: 'defense_boost', value: 0.15 }
  }
];
