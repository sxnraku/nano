import { HttpsError } from "firebase-functions/https";

export type Rarity = "Common" | "Rare" | "Epic" | "Legendary";
export type WarriorStyle = "Default" | "Glitch" | "Neon" | "Cyber" | "Dark" | "Retro";

export interface FusionInput {
  name: string;
  class: string;
  element: string;
  description: string;
  visualPrompt: string;
}

export interface WarriorMetadata {
  name: string;
  class: string;
  element: string;
  rarity: Rarity;
  description: string;
  visualPrompt: string;
  originalObject?: string;
  stats: { hp: number; atk: number; def: number; spd: number };
}

export const SCAN_PROMPT = `
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

const clip = (v: unknown, max: number): string => String(v ?? "").slice(0, max);

export function buildFusionPrompt(w1: FusionInput, w2: FusionInput, isPremium: boolean): string {
  const d = (w: FusionInput) =>
    `${clip(w.name, 80)} (${clip(w.class, 80)}, ${clip(w.element, 40)}). Descrição: ${clip(w.description, 600)}. Visual: ${clip(w.visualPrompt, 1500)}`;
  return `
    FUSÃO DE GUERREIROS:
    Guerreiro 1: ${d(w1)}
    Guerreiro 2: ${d(w2)}

    Crie um NOVO guerreiro que seja uma FUSÃO destes dois.
    - O nome deve ser uma combinação criativa.
    - A classe deve ser híbrida.
    - O elemento deve ser uma mistura ou o mais forte dos dois.
    - A raridade deve ser a maior entre os dois, ou uma acima se forem iguais. (Valores permitidos: "Common", "Rare", "Epic", "Legendary")
    - A descrição deve explicar a fusão.
    - O visualPrompt deve combinar as características visuais de ambos.
    ${isPremium ? "- ESTA É UMA FUSÃO PREMIUM: Garanta que a raridade seja pelo menos EPIC ou LEGENDARY. Os stats devem ter um bônus maior (25-40%)." : ""}

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

    Para os stats, faça uma média ponderada dos dois guerreiros e adicione um bônus de ${isPremium ? "25-40%" : "10-20%"}.
  `;
}

const STYLE_PROMPTS: Record<WarriorStyle, string> = {
  Glitch: "Estilo GLITCH ART, distorção digital, datamosh, falhas visuais, cores RGB separadas, ruído estático.",
  Neon: "Estilo NEON NOIR, luzes brilhantes, contraste alto, ciano e magenta, brilho intenso, atmosfera noturna.",
  Cyber: "Estilo CYBERPUNK, circuitos, metal cromado, implantes tecnológicos, HUD futurista, fios e cabos.",
  Dark: "Estilo DARK FANTASY, sombras profundas, atmosfera gótica, cores desaturadas, visual ameaçador, fumaça.",
  Retro: "Estilo RETRO 80s ANIME, cores pastéis, granulado de filme, estética VHS, lo-fi.",
  Default:
    "Estilo MANGA CARTOON GACHA PUNK / GRAFFITI ART. Ilustração 2D pura. Traços pretos grossos (ink outlines). Sombras cel-shading duro. PROIBIDO FOTOREALISMO.",
};

export function buildImagePrompt(visualPrompt: string, style: WarriorStyle): string {
  return `[CRITICAL: DO NOT GENERATE PHOTOREALISM. MUST BE A 2D ILLUSTRATION ONLY] Transforme a foto original completamente num DESENHO. ${visualPrompt} ${STYLE_PROMPTS[style]} Cores vibrantes e saturadas de banda desenhada/anime. Desenhe o formato em estilo Cartoon 2D, substituindo texturas reais por tinta lisa. A imagem deve manter a forma mas parecer desenhada à mão!`;
}

const RARITIES: Rarity[] = ["Common", "Rare", "Epic", "Legendary"];
/** Upper bound for hp+atk+def+spd of a freshly scanned warrior, per rarity. */
const SCAN_STAT_CAP: Record<Rarity, number> = { Common: 230, Rare: 290, Epic: 350, Legendary: 440 };

/**
 * Validates and normalises what the model returned, so a misbehaving model
 * (or a prompt injection in a fused warrior's text) can't mint absurd stats.
 */
export function sanitizeWarrior(raw: any, opts: { fusion?: boolean; premium?: boolean } = {}): WarriorMetadata {
  if (!raw || typeof raw !== "object" || !raw.stats) {
    throw new HttpsError("internal", "AI response missing warrior fields.");
  }
  let rarity: Rarity = RARITIES.includes(raw.rarity) ? raw.rarity : "Common";
  if (opts.premium && RARITIES.indexOf(rarity) < RARITIES.indexOf("Epic")) rarity = "Epic";

  const num = (v: unknown) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(Math.max(n, 1), 400) : 50;
  };
  const stats = { hp: num(raw.stats.hp), atk: num(raw.stats.atk), def: num(raw.stats.def), spd: num(raw.stats.spd) };

  const bonus = opts.premium ? 1.45 : opts.fusion ? 1.25 : 1;
  const cap = Math.round(SCAN_STAT_CAP[rarity] * bonus);
  const total = stats.hp + stats.atk + stats.def + stats.spd;
  if (total > cap) {
    const k = cap / total;
    stats.hp = Math.max(1, Math.floor(stats.hp * k));
    stats.atk = Math.max(1, Math.floor(stats.atk * k));
    stats.def = Math.max(1, Math.floor(stats.def * k));
    stats.spd = Math.max(1, Math.floor(stats.spd * k));
  }

  return {
    name: clip(raw.name, 60) || "Nano Warrior",
    class: clip(raw.class, 80) || "Guerreiro",
    element: clip(raw.element, 40) || "Neutro",
    rarity,
    description: clip(raw.description, 800),
    visualPrompt: clip(raw.visualPrompt, 2000),
    originalObject: raw.originalObject ? clip(raw.originalObject, 80) : undefined,
    stats,
  };
}
