import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import { compressImage } from "./imageUtils";
import { generateId } from "./utils";

// Lazy initialize the client to prevent startup crashes if the key is missing
let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (aiInstance) return aiInstance;
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing. Safe Mode (Mock) active.");
    return null; // Return null so callers can handle safe mode
  }
  
  aiInstance = new GoogleGenAI({ apiKey });
  return aiInstance;
}

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
  IRON_CLAD: { id: 'iron_clad', name: 'Iron Clad', description: '-15% Damage Received', effect: 'defense_boost', value: 0.15 },
  ADRENALINE: { id: 'adrenaline', name: 'Adrenaline', description: '+30% Damage with Low HP', effect: 'damage_boost_low_hp', value: 0.30 },
  OVERCLOCK: { id: 'overclock', name: 'Overclock', description: '+20% Energy Gain', effect: 'energy_boost', value: 0.20 },
  PHOTOSYNTHESIS: { id: 'photosynthesis', name: 'Photosynthesis', description: 'Slowly regenerates HP', effect: 'regen', value: 0.01 },
  VOLTAGE: { id: 'voltage', name: 'Voltage', description: 'Chance to Stun', effect: 'stun_chance', value: 0.10 },
  FLOW: { id: 'flow', name: 'Flow', description: 'Dodge Chance', effect: 'dodge_chance', value: 0.15 },
  INFERNO: { id: 'inferno', name: 'Inferno', description: 'Burn Chance', effect: 'burn_chance', value: 0.15 },
  VAMPIRE: { id: 'vampire', name: 'Vampirism', description: 'Heals when attacking', effect: 'lifesteal', value: 0.10 },
  PRECISION: { id: 'precision', name: 'Precision', description: '+Critical Chance', effect: 'crit_boost', value: 0.15 },
};

export function assignPassive(warriorClass: string, element: string): PassiveAbility {
  const cls = (warriorClass || '').toLowerCase();
  const elm = (element || '').toLowerCase();

  // Element priorities
  if (elm.includes('fire') || elm.includes('magma') || elm.includes('lava')) return PASSIVES.INFERNO;
  if (elm.includes('electric') || elm.includes('bolt') || elm.includes('thunder') || elm.includes('energy')) return PASSIVES.VOLTAGE;
  if (elm.includes('plant') || elm.includes('earth') || elm.includes('nature') || elm.includes('forest')) return PASSIVES.PHOTOSYNTHESIS;
  if (elm.includes('water') || elm.includes('ice') || elm.includes('ocean') || elm.includes('sea')) return PASSIVES.FLOW;

  // Class priorities
  if (cls.includes('tank') || cls.includes('shield') || cls.includes('builder') || cls.includes('defender') || cls.includes('brute')) return PASSIVES.IRON_CLAD;
  if (cls.includes('berserker') || cls.includes('blade') || cls.includes('warrior') || cls.includes('fighter') || cls.includes('barbarian')) return PASSIVES.ADRENALINE;
  if (cls.includes('technomage') || cls.includes('hacker') || cls.includes('cyber') || cls.includes('mage') || cls.includes('support')) return PASSIVES.OVERCLOCK;
  if (cls.includes('assassin') || cls.includes('ninja') || cls.includes('sniper') || cls.includes('stealth') || cls.includes('fast')) return PASSIVES.PRECISION;
  if (cls.includes('vampire') || cls.includes('dark') || cls.includes('shadow') || cls.includes('night')) return PASSIVES.VAMPIRE;

  // Default fallback based on stats if available, otherwise generic
  return PASSIVES.PRECISION;
}

/**
 * Analyzes an image and generates warrior metadata.
 */
export async function analyzeAndCreateWarrior(base64Image: string): Promise<WarriorData> {
  const model = "gemini-2.5-flash"; // Flash 2.5 is used for analysis as requested

  const prompt = `
    Analyze this image. Identify the main object, its color, material, and utility.
    IMPORTANT: Also analyze the POSE and EXPRESSION (e.g., tongue out, arms crossed, smiling) of the subject/object in the photo.

    Based on this, create an RPG character "Nano Verse".
    
    Creation Rules:
    - If it's a PERSON -> Transform MUST BE TOTAL. Create an unrecognizable fictional character (Cyborg, Elemental, masked Ninja, or Robotic Warrior).
    - PRIVACY & RIGHTS: DO NOT create a realistic human likeness. Replace real faces with helmets, masks, holographic visors, or stylized non-human facial features.
    - CONFIDENTIALITY: If real-world logos, documents, or private objects are detected, REPLACE them with "NanoVerse" symbols, fictional tech, or glowing power cores.
    - If it's an electronic object -> Technomage or Cyber-Warrior.
    - If it's plant/natural -> Elemental or Druid.
    - If it's a tool -> Berserker or Builder.
    - Be creative with the name and class.
    - IMPORTANT: RESPOND EVERYTHING IN ENGLISH.

    Rarity Rules (based on complexity/uniqueness):
    - Common (60%): Simple, everyday objects (pen, bottle, stone). Total stats ~800, HP around 500.
    - Rare (30%): Objects with some interesting detail or brand. Total stats ~1200, HP around 750.
    - Epic (9%): Complex, electronic, artistic objects. Total stats ~1600, HP around 1000.
    - Legendary (1%): Very unique, rare or apparent sentimental value objects. Total stats ~2500, HP around 1500.
    
    Return ONLY a JSON object with the following structure:
    {
      "name": "Warrior Name",
      "class": "Class (e.g., Long Range Technomage)",
      "element": "Element (e.g., Electric, Fire, Plant)",
      "rarity": "Common" | "Rare" | "Epic" | "Legendary",
      "description": "A brief description of personality and origin.",
      "visualPrompt": "Character in GACHIAKUTA MANGA STYLE (by Kei Urana). VERY AGGRESSIVE, THICK, UNEVEN INK OUTLINES. Heavy TRASH-PUNK and urban aesthetic. High contrast cel-shading with gritty cross-hatching details. The character MUST BE A FICTIONAL ENTITY (no real humans). If original was a person, replace face with a complex scrap-metal mask, a gas mask, or a full-head hood inspired by Gachiakuta's 'Cleaners'. The character MUST BE IN THE SAME POSE AND HAVE THE SAME FACIAL EXPRESSION AS THE ORIGINAL PHOTO (e.g., [describe the identified pose/expression]). Saturated but dirty neon colors. Abstract background with urban debris or messy graffiti. ABSOLUTELY NO REAL LIKENESS OR REAL-WORLD LOGOS.",
      "originalObject": "Identified object name",
      "stats": {
        "hp": 500,
        "atk": 100,
        "def": 100,
        "spd": 100
      }
    }
  `;

  const genAI = getAI();

  if (!genAI) {
    // Safe Mode: Return a high-quality "Anomaly" warrior
    console.log("Safe Mode: Generating Anomaly warrior (No API Key)");
    return {
      id: generateId(),
      name: "ANOMALY-X",
      class: "System Phantom",
      element: "Void",
      rarity: "Rare",
      description: "A warrior materialized from raw system data because the primary uplink (API Key) was offline.",
      visualPrompt: "Gritty urban warrior with glitch effects",
      originalObject: "Missing Link",
      stats: { hp: 800, atk: 70, def: 60, spd: 90 },
      imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop",
      passive: { id: 'flow', name: 'System Ghost', description: 'Unstable data makes them hard to hit.', effect: 'dodge_chance', value: 0.15 }
    };
  }

  try {
    const response = await genAI.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    // Clean up markdown code blocks if present
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();

    const data = JSON.parse(cleanText) as Omit<WarriorData, 'id' | 'imageUrl' | 'passive'>;

    // Assign passive based on class/element
    const passive = assignPassive(data.class, data.element);

    return {
      ...data,
      id: generateId(),
      passive,
      originalObject: data.originalObject || "Scan Object"
    };
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
}

export type WarriorStyle = 'Default' | 'Glitch' | 'Neon' | 'Cyber' | 'Dark' | 'Retro';

/**
 * Generates the visual avatar for the warrior.
 */
export async function generateWarriorImage(visualPrompt: string, base64Image?: string, style: WarriorStyle = 'Default'): Promise<string> {
  // Use the correct Gemini 1.5 Flash model
  const model = "gemini-1.5-flash"; 

  let stylePrompt = "";
  switch (style) {
    case 'Glitch': stylePrompt = "GLITCH ART style, digital distortion, datamosh, visual glitches, separated RGB colors, static noise."; break;
    case 'Neon': stylePrompt = "NEON NOIR style, bright lights, high contrast, cyan and magenta, intense glow, night atmosphere."; break;
    case 'Cyber': stylePrompt = "CYBERPUNK style, circuits, chrome metal, tech implants, futuristic HUD, wires and cables."; break;
    case 'Dark': stylePrompt = "DARK FANTASY style, deep shadows, gothic atmosphere, desaturated colors, menacing look, smoke."; break;
    case 'Retro': stylePrompt = "RETRO 80s ANIME style, pastel colors, film grain, VHS aesthetic, lo-fi."; break;
    default: stylePrompt = "Urban punk manga style. VERY AGGRESSIVE THICK INK OUTLINES. Heavy grit and trash-punk aesthetic like Kei Urana's art. High contrast cel-shaded with messy cross-hatching and dirty textures. TRASH-PUNK REUSE/RECYCLE theme."; break;
  }

  const genAI = getAI();
  if (!genAI) {
    console.log("Safe Mode: Using fallback image URL (No API Key)");
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(visualPrompt + " gachiakuta style, thick lines, punk anime")}.png?width=512&height=512&nologo=true`;
  }

  try {
    const enhancedPrompt = `TRANSFORM the provided image into a FICTIONAL stylized warrior. 
    STYLE: ${stylePrompt}.
    MANDATORY: 
    1. KEEP THE EXACT POSE, COMPOSITION, AND CAMERA ANGLE of the original photo.
    2. KEEP THE FACIAL EXPRESSION of the original person/object.
    3. REPLACE the person with a fictional character: Use a mask, mechanical parts, or stylized features. 
    4. NO REAL PHOTOGRAPHIC ELEMENTS. Everything must look hand-drawn.
    5. The character is inspired by ${visualPrompt}. 
    6. Background should be abstract urban debris and neon graffiti.
    7. No real people or brands.`;

    const parts: any[] = [{ text: enhancedPrompt }];

    // If we have the original image, use it as a reference for the pose/structure
    if (base64Image) {
      parts.unshift({ inlineData: { mimeType: "image/jpeg", data: base64Image } });
    }

    const response = await genAI.models.generateContent({
      model: model,
      contents: {
        parts: parts
      },
      config: {
        // responseMimeType is not supported for image generation models in this SDK version usually,
        // but we just need the image output.
      }
    });

    // Extract image
    // The response structure for image generation usually contains inlineData in the parts
    const responseParts = response.candidates?.[0]?.content?.parts;
    if (!responseParts) throw new Error("No image generated");

    for (const part of responseParts) {
      if (part.inlineData && part.inlineData.data) {
        const fullBase64 = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        // Attempt to compress before returning to stay under Firestore limits
        try {
          return await compressImage(fullBase64, 512, 0.7);
        } catch (e) {
          console.warn("Compression failed, returning original", e);
          return fullBase64;
        }
      }
    }

    throw new Error("No image data found in response");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (base64Image) {
      // Fallback to Pollinations.ai for better visual coherence if Gemini fails or is restricted
      const seed = Math.floor(Math.random() * 999999);
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(visualPrompt + " gachiakuta style, thick lines, punk anime, urban, ink")}.png?width=512&height=512&nologo=true&seed=${seed}`;
      return pollinationsUrl;
    }
    throw error;
  }
}

export async function fuseWarriors(w1: WarriorData, w2: WarriorData, isPremium: boolean = false): Promise<WarriorData> {
  const model = "gemini-2.5-flash";

  const prompt = `
    WARRIOR FUSION:
    Warrior 1: ${w1.name} (${w1.class}, ${w1.element}). Description: ${w1.description}. Visual: ${w1.visualPrompt}
    Warrior 2: ${w2.name} (${w2.class}, ${w2.element}). Description: ${w2.description}. Visual: ${w2.visualPrompt}
    
    MODE: ${isPremium ? 'STABILIZED (PREMIUM)' : 'NORMAL'}
    
    Create a NEW warrior that is a FUSION of these two.
    - The name should be a creative combination.
    - The class should be hybrid.
    - The element should be a mix or the strongest of the two.
    - The rarity should be the highest of the two, or one above if they are the same. (Allowed values: "Common", "Rare", "Epic", "Legendary")
    ${isPremium ? '- PREMIUM GUARANTEE: The rarity MUST BE AT LEAST "Epic" or "Legendary".' : ''}
    - The description should explain the fusion.
    - The visualPrompt should combine visual characteristics of both.
    - IMPORTANT: RESPOND EVERYTHING IN ENGLISH.
    
    Return ONLY a JSON object with the following structure (no markdown):
    {
      "name": "Fusion Name",
      "class": "Hybrid Class",
      "element": "Hybrid Element",
      "rarity": "Common" | "Rare" | "Epic" | "Legendary",
      "description": "Description",
      "visualPrompt": "Combined visual prompt",
      "stats": { "hp": number, "atk": number, "def": number, "spd": number }
    }
    
    For stats, perform a weighted average of the two warriors and add a bonus of ${isPremium ? '60-100%' : '30-50%'}.
  `;

  const genAI = getAI();
  if (!genAI) {
    return {
      ...w1,
      id: generateId(),
      name: `${w1.name}-${w2.name.substring(0, 3)}`,
      description: `Emergency Fusion of ${w1.name} and ${w2.name}.`,
      originalObject: "Fusion Anomaly"
    };
  }

  try {
    const response = await genAI.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
    const data = JSON.parse(cleanText) as Omit<WarriorData, 'id' | 'imageUrl' | 'passive'>;

    // Assign passive based on class/element
    const passive = assignPassive(data.class, data.element);

    return {
      ...data,
      id: generateId(),
      originalObject: `Fusion: ${w1.name} + ${w2.name}`,
      passive
    };
  } catch (error) {
    console.error("Error fusing warriors:", error);
    throw error;
  }
}

