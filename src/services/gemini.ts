import { getAI, getGenerativeModel, GoogleAIBackend, ResponseModality } from "firebase/ai";
import { app } from "./firebase";
import { ImageManager } from "./ImageManager";
import { generateId } from "./utils";

// Gemini is called through Firebase AI Logic (Gemini Developer API backend).
// The API key is held by Firebase on the server side, so it is never shipped
// inside the app bundle. Per-user rate limits are configured in the Firebase
// console (AI Logic > Settings); App Check can be enforced there too.
const ai = getAI(app, { backend: new GoogleAIBackend() });

// gemini-2.5-flash is no longer offered to new AI Logic projects.
const textModel = getGenerativeModel(ai, {
  model: "gemini-3.5-flash",
  generationConfig: { responseMimeType: "application/json" },
});

// Image models have no free-tier quota: on the Spark plan this returns 429 and
// generateWarriorImage falls back to Pollinations.
const imageModel = getGenerativeModel(ai, {
  model: "gemini-2.5-flash-image",
  generationConfig: { responseModalities: [ResponseModality.TEXT, ResponseModality.IMAGE] },
});

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

const SCAN_PROMPT = `
    Analise esta imagem. Identifique o objeto principal, sua cor, material e utilidade.
    IMPORTANTE: Analise também a POSE e a EXPRESSÃO (ex: língua para fora, braços cruzados, sorrindo) do sujeito/objeto na foto.

    Com base nisso, crie um personagem guerreiro RPG "Nano Verse".
    
    Regras de Criação:
    - Se a imagem contiver violência explícita, material explícito adulto ou inapropriado para a loja de aplicações, RECUSE e retorne estritamente: { "error": "unsafe" }
    - Se for uma PESSOA -> Crie um Guerreiro Humanoide (Cyberpunk, Ninja, Mago, etc).
    - Se for um ANIMAL -> Crie uma Besta Mutante ou Mascote de Combate feroz.
    - Se for um OBJETO inanimado (ex: garrafa, teclado, maçã) -> Crie um Monstro Senciente, Mecha ou Golem inspirado na forma e utilidade do objeto. O objeto tem de ganhar vida!
    - Seja criativo com o nome e a classe.

    Regras de Raridade (baseado na complexidade/unicidade do objeto):
    - Common (60%): Objetos simples, cotidianos (caneta, garrafa, pedra). Stats totais ~200.
    - Rare (30%): Objetos com algum detalhe interessante ou marca. Stats totais ~250.
    - Epic (9%): Objetos complexos, eletrônicos, artísticos. Stats totais ~300.
    - Legendary (1%): Objetos muito únicos, raros ou com valor sentimental aparente. Stats totais ~380.
    
    Retorne APENAS um objeto JSON com a seguinte estrutura (sem markdown):
    {
      "name": "Nome do Guerreiro",
      "class": "Classe (ex: Tecnomago de Longo Alcance)",
      "element": "Elemento (ex: Elétrico, Fogo, Planta)",
      "rarity": "Common" | "Rare" | "Epic" | "Legendary",
      "description": "Uma breve descrição da personalidade e origem.",
      "visualPrompt": "Personagem estilo MANGA PUNK / GRAFFITI, traços grossos de nanquim, sombras duras. Se a foto original era de um OBJETO, este deve agora ser um monstro/robô vivo com braços, pernas ou rosto, mas cuja estrutura base lembre o objeto original! Se era uma PESSOA ou ANIMAL, mantenha a pose/posição, mas com roupagem/armadura Gachi agressiva.",
      "originalObject": "Nome do objeto identificado",
      "stats": {
        "hp": 100,
        "atk": 50,
        "def": 50,
        "spd": 50
      }
    }
  `;

type AIMetadata = Omit<WarriorData, 'id' | 'imageUrl' | 'passive'> & { error?: string };

/** Maps SDK errors to the error codes the UI already understands. */
function mapAIError(error: unknown): Error {
  const msg = String((error as Error)?.message ?? error);
  if (msg === 'UNSAFE_CONTENT') return new Error('UNSAFE_CONTENT');
  if (/429|RESOURCE_EXHAUSTED|quota/i.test(msg)) return new Error('AI_QUOTA_EXCEEDED');
  return error instanceof Error ? error : new Error(msg);
}

function parseJson(text: string): AIMetadata {
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
}

const RARITIES: WarriorData['rarity'][] = ['Common', 'Rare', 'Epic', 'Legendary'];
/** Upper bound for hp+atk+def+spd of a freshly scanned warrior, per rarity. */
const SCAN_STAT_CAP: Record<WarriorData['rarity'], number> = { Common: 230, Rare: 290, Epic: 350, Legendary: 440 };
const clip = (v: unknown, max: number) => String(v ?? '').slice(0, max);

/**
 * Normalises what the model returned so a misbehaving model (or a prompt
 * injection in a fused warrior's text) can't mint absurd stats or rarities.
 */
export function sanitizeWarrior(raw: AIMetadata, opts: { fusion?: boolean; premium?: boolean } = {}): AIMetadata {
  if (!raw || typeof raw !== 'object' || !raw.stats) throw new Error("AI response missing warrior fields");
  let rarity = RARITIES.includes(raw.rarity) ? raw.rarity : 'Common';
  if (opts.premium && RARITIES.indexOf(rarity) < RARITIES.indexOf('Epic')) rarity = 'Epic';

  const num = (v: unknown) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(Math.max(n, 1), 400) : 50;
  };
  const stats = { hp: num(raw.stats.hp), atk: num(raw.stats.atk), def: num(raw.stats.def), spd: num(raw.stats.spd) };
  const cap = Math.round(SCAN_STAT_CAP[rarity] * (opts.premium ? 1.45 : opts.fusion ? 1.25 : 1));
  const total = stats.hp + stats.atk + stats.def + stats.spd;
  if (total > cap) {
    const k = cap / total;
    stats.hp = Math.max(1, Math.floor(stats.hp * k));
    stats.atk = Math.max(1, Math.floor(stats.atk * k));
    stats.def = Math.max(1, Math.floor(stats.def * k));
    stats.spd = Math.max(1, Math.floor(stats.spd * k));
  }

  return {
    name: clip(raw.name, 60) || 'Nano Warrior',
    class: clip(raw.class, 80) || 'Guerreiro',
    element: clip(raw.element, 40) || 'Neutro',
    rarity,
    description: clip(raw.description, 800),
    visualPrompt: clip(raw.visualPrompt, 2000),
    originalObject: clip(raw.originalObject, 80),
    stats,
  };
}

/**
 * Analyzes an image and generates warrior metadata.
 */
export async function analyzeAndCreateWarrior(base64Image: string): Promise<WarriorData> {
  try {
    const result = await textModel.generateContent([
      { inlineData: { mimeType: "image/jpeg", data: base64Image } },
      { text: SCAN_PROMPT },
    ]);
    const raw = parseJson(result.response.text());
    if (raw.error === "unsafe") throw new Error("UNSAFE_CONTENT");
    const data = sanitizeWarrior(raw);

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
  let stylePrompt = "";
  switch(style) {
    case 'Glitch': stylePrompt = "Estilo GLITCH ART, distorção digital, datamosh, falhas visuais, cores RGB separadas, ruído estático."; break;
    case 'Neon': stylePrompt = "Estilo NEON NOIR, luzes brilhantes, contraste alto, ciano e magenta, brilho intenso, atmosfera noturna."; break;
    case 'Cyber': stylePrompt = "Estilo CYBERPUNK, circuitos, metal cromado, implantes tecnológicos, HUD futurista, fios e cabos."; break;
    case 'Dark': stylePrompt = "Estilo DARK FANTASY, sombras profundas, atmosfera gótica, cores desaturadas, visual ameaçador, fumaça."; break;
    case 'Retro': stylePrompt = "Estilo RETRO 80s ANIME, cores pastéis, granulado de filme, estética VHS, lo-fi."; break;
    default: stylePrompt = "Estilo MANGA CARTOON GACHA PUNK / GRAFFITI ART. Ilustração 2D pura. Traços pretos grossos (ink outlines). Sombras cel-shading duro. PROIBIDO FOTOREALISMO."; break;
  }

  try {
    const enhancedPrompt = `[CRITICAL: DO NOT GENERATE PHOTOREALISM. MUST BE A 2D ILLUSTRATION ONLY] Transforme a foto original completamente num DESENHO. ${visualPrompt} ${stylePrompt} Cores vibrantes e saturadas de banda desenhada/anime. Desenhe o formato em estilo Cartoon 2D, substituindo texturas reais por tinta lisa. A imagem deve manter a forma mas parecer desenhada à mão!`;

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [{ text: enhancedPrompt }];
    // If we have the original image, use it as a reference for the pose/structure
    if (base64Image) {
      parts.unshift({ inlineData: { mimeType: "image/jpeg", data: base64Image } });
    }

    const result = await imageModel.generateContent(parts);
    const image = result.response.inlineDataParts()?.find(p => p.inlineData?.data);
    if (!image) throw new Error("No image data found in response");

    const fullBase64 = `data:${image.inlineData.mimeType || 'image/png'};base64,${image.inlineData.data}`;
    try {
      return await ImageManager.optimizeForStorage(fullBase64);
    } catch (e) {
      console.warn("Optimization failed, returning original", e);
      return fullBase64;
    }
  } catch (error) {
    console.error("Error generating warrior image:", error);
    console.warn("Gemini Image generation failed, falling back to Pollinations for stability");
    const seed = Math.floor(Math.random() * 999999);
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(visualPrompt + " manga punk graffiti urban")}.png?width=512&height=512&nologo=true&seed=${seed}`;
  }
}

export async function fuseWarriors(w1: WarriorData, w2: WarriorData, isPremium: boolean = false): Promise<WarriorData> {
  const prompt = `
    FUSÃO DE GUERREIROS:
    Guerreiro 1: ${w1.name} (${w1.class}, ${w1.element}). Descrição: ${w1.description}. Visual: ${w1.visualPrompt}
    Guerreiro 2: ${w2.name} (${w2.class}, ${w2.element}). Descrição: ${w2.description}. Visual: ${w2.visualPrompt}
    
    Crie um NOVO guerreiro que seja uma FUSÃO destes dois.
    - O nome deve ser uma combinação criativa.
    - A classe deve ser híbrida.
    - O elemento deve ser uma mistura ou o mais forte dos dois.
    - A raridade deve ser a maior entre os dois, ou uma acima se forem iguais. (Valores permitidos: "Common", "Rare", "Epic", "Legendary")
    - A descrição deve explicar a fusão.
    - O visualPrompt deve combinar as características visuais de ambos.
    ${isPremium ? '- ESTA É UMA FUSÃO PREMIUM: Garanta que a raridade seja pelo menos EPIC ou LEGENDARY. Os stats devem ter um bônus maior (25-40%).' : ''}
    
    Retorne APENAS um objeto JSON com a seguinte estrutura (sem markdown):
    {
      "name": "Nome da Fusão",
      "class": "Classe Híbrida",
      "element": "Elemento Híbrido",
      "rarity": "Common" | "Rare" | "Epic" | "Legendary",
      "description": "Descrição",
      "visualPrompt": "Prompt visual combinado",
      "stats": { "hp": number, "atk": number, "def": number, "spd": number }
    }
    
    Para os stats, faça uma média ponderada dos dois guerreiros e adicione um bônus de ${isPremium ? '25-40%' : '10-20%'}.
  `;

  try {
    const result = await textModel.generateContent(prompt);
    const data = sanitizeWarrior(parseJson(result.response.text()), { fusion: true, premium: isPremium });

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
