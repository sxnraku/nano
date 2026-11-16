import { httpsCallable, FunctionsError } from "firebase/functions";
import { functions } from "./firebase";
import { ImageManager } from "./ImageManager";
import { generateId } from "./utils";

// All Gemini calls go through Cloud Functions (see /functions). The API key
// lives only on the server, so it is never shipped inside the app bundle.

export interface WarriorStats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
}

export interface Weapon {
  id: string;
  name: string;
  description: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  stats: Partial<WarriorStats>;
  ability?: {
    name: string;
    description: string;
    effect: string;
  };
  imageUrl?: string;
}

export interface PassiveAbility {
  id: string;
  name: string;
  description: string;
  effect: 'defense_boost' | 'damage_boost_low_hp' | 'energy_boost' | 'regen' | 'stun_chance' | 'dodge_chance' | 'burn_chance' | 'lifesteal' | 'crit_boost';
  value: number; // The magnitude of the effect (e.g., 0.15 for 15%)
}

export interface WarriorData {
  id: string;
  name: string;
  class: string;
  element: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  description: string;
  visualPrompt: string;
  stats: WarriorStats;
  imageUrl?: string;
  originalObject: string;
  equippedWeaponId?: string;
  passive: PassiveAbility;
  isElite?: boolean;
  threatLevel?: 'low' | 'medium' | 'high' | 'deadly';
}

const PASSIVES: Record<string, PassiveAbility> = {
  IRON_CLAD: { id: 'iron_clad', name: 'Pele de Ferro', description: '-15% Dano Recebido', effect: 'defense_boost', value: 0.15 },
  ADRENALINE: { id: 'adrenaline', name: 'Adrenalina', description: '+30% Dano com HP Baixo', effect: 'damage_boost_low_hp', value: 0.30 },
  OVERCLOCK: { id: 'overclock', name: 'Overclock', description: '+20% Ganho de Energia', effect: 'energy_boost', value: 0.20 },
  PHOTOSYNTHESIS: { id: 'photosynthesis', name: 'Fotossíntese', description: 'Regenera HP lentamente', effect: 'regen', value: 0.01 },
  VOLTAGE: { id: 'voltage', name: 'Voltagem', description: 'Chance de Atordoar', effect: 'stun_chance', value: 0.10 },
  FLOW: { id: 'flow', name: 'Fluxo', description: 'Chance de Esquiva', effect: 'dodge_chance', value: 0.15 },
  INFERNO: { id: 'inferno', name: 'Inferno', description: 'Chance de Queimar', effect: 'burn_chance', value: 0.15 },
  VAMPIRE: { id: 'vampire', name: 'Vampirismo', description: 'Cura ao atacar', effect: 'lifesteal', value: 0.10 },
  PRECISION: { id: 'precision', name: 'Precisão', description: '+Chance Crítica', effect: 'crit_boost', value: 0.15 },
};

export function assignPassive(warriorClass: string, element: string): PassiveAbility {
  const cls = (warriorClass || '').toLowerCase();
  const elm = (element || '').toLowerCase();

  // Element priorities
  if (elm.includes('fogo') || elm.includes('magma') || elm.includes('brasa')) return PASSIVES.INFERNO;
  if (elm.includes('elétrico') || elm.includes('raio') || elm.includes('trovão') || elm.includes('energia')) return PASSIVES.VOLTAGE;
  if (elm.includes('planta') || elm.includes('terra') || elm.includes('natureza') || elm.includes('floresta')) return PASSIVES.PHOTOSYNTHESIS;
  if (elm.includes('água') || elm.includes('gelo') || elm.includes('mar') || elm.includes('rio')) return PASSIVES.FLOW;
  
  // Class priorities
  if (cls.includes('tanque') || cls.includes('escudo') || cls.includes('construtor') || cls.includes('defensor') || cls.includes('robusto')) return PASSIVES.IRON_CLAD;
  if (cls.includes('berserker') || cls.includes('lâmina') || cls.includes('guerreiro') || cls.includes('lutador') || cls.includes('bárbaro')) return PASSIVES.ADRENALINE;
  if (cls.includes('tecnomago') || cls.includes('hacker') || cls.includes('cyber') || cls.includes('mago') || cls.includes('suporte')) return PASSIVES.OVERCLOCK;
  if (cls.includes('assassino') || cls.includes('ninja') || cls.includes('sniper') || cls.includes('furtivo') || cls.includes('rápido')) return PASSIVES.PRECISION;
  if (cls.includes('vampiro') || cls.includes('sombrio') || cls.includes('trevas') || cls.includes('noturno')) return PASSIVES.VAMPIRE;

  // Default fallback based on stats if available, otherwise generic
  return PASSIVES.PRECISION;
}

type AIMetadata = Omit<WarriorData, 'id' | 'imageUrl' | 'passive'>;

const scanWarriorFn = httpsCallable<{ image: string }, AIMetadata>(functions, 'scanWarrior');
const fuseWarriorsFn = httpsCallable<{ w1: unknown; w2: unknown; isPremium: boolean }, AIMetadata>(functions, 'fuseWarriors');
const generateImageFn = httpsCallable<{ visualPrompt: string; image?: string; style: WarriorStyle }, { imageUrl: string }>(functions, 'generateWarriorImage');

/** Maps server errors to the error codes the UI already understands. */
function mapAIError(error: unknown): Error {
  const code = (error as FunctionsError)?.code;
  const message = (error as Error)?.message;
  if (code === 'functions/failed-precondition' && message === 'UNSAFE_CONTENT') return new Error('UNSAFE_CONTENT');
  if (code === 'functions/resource-exhausted') return new Error('AI_QUOTA_EXCEEDED');
  return error instanceof Error ? error : new Error(String(error));
}

const fusionInput = (w: WarriorData) => ({
  name: w.name,
  class: w.class,
  element: w.element,
  description: w.description,
  visualPrompt: w.visualPrompt,
});

/**
 * Analyzes an image and generates warrior metadata.
 */
export async function analyzeAndCreateWarrior(base64Image: string): Promise<WarriorData> {
  try {
    const { data } = await scanWarriorFn({ image: base64Image });
    return {
      ...data,
      id: generateId(),
      passive: assignPassive(data.class, data.element),
      originalObject: data.originalObject || "Scan Object"
    };
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw mapAIError(error);
  }
}

export type WarriorStyle = 'Default' | 'Glitch' | 'Neon' | 'Cyber' | 'Dark' | 'Retro';

/**
 * Generates the visual avatar for the warrior.
 */
export async function generateWarriorImage(visualPrompt: string, base64Image?: string, style: WarriorStyle = 'Default'): Promise<string> {
  try {
    const { data } = await generateImageFn({ visualPrompt, image: base64Image, style });
    try {
      return await ImageManager.optimizeForStorage(data.imageUrl);
    } catch (e) {
      console.warn("Optimization failed, returning original", e);
      return data.imageUrl;
    }
  } catch (error) {
    console.error("Error generating warrior image:", error);
    console.warn("Gemini Image generation failed, falling back to Pollinations for stability");
    const seed = Math.floor(Math.random() * 999999);
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(visualPrompt + " manga punk graffiti urban")}.png?width=512&height=512&nologo=true&seed=${seed}`;
  }
}

export async function fuseWarriors(w1: WarriorData, w2: WarriorData, isPremium: boolean = false): Promise<WarriorData> {
  try {
    const { data } = await fuseWarriorsFn({ w1: fusionInput(w1), w2: fusionInput(w2), isPremium });
    return {
      ...data,
      id: generateId(),
      originalObject: `Fusão: ${w1.name} + ${w2.name}`,
      passive: assignPassive(data.class, data.element)
    };
  } catch (error) {
    console.error("Error fusing warriors:", error);
    throw mapAIError(error);
  }
}
