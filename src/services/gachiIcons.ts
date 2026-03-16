import { loadIcon } from "./storage";

// Emoji fallbacks - no API calls needed
const EMOJI_ICONS: Record<string, string> = {
  SCRAP: '⚙️',
  HP: '❤️',
  ATK: '⚔️',
  DEF: '🛡️',
  SPD: '⚡',
  LEVEL: '⭐',
  SCAN: '👁️',
  ARENA: '💀',
  RANK: '🏅',
  NANITE: '💎',
};

const LOCAL_ICONS: Partial<Record<string, string>> = {
  HP: '/icons/HP.png',
  ATK: '/icons/ATK.png',
  DEF: '/icons/DEF.png',
  SPD: '/icons/SPD.png',
};

export const GACHI_ICON_PROMPTS = {
  SCRAP: "a rusty scrap metal gear with jagged edges, gachiakuta style ink sketch, high contrast black and white",
  HP: "a mechanical cybernetic heart with glowing red wires, trash-punk aesthetic, messy ink outlines",
  ATK: "two crossed jagged metal blades made of scrap, aggressive ink lines, urban street art style",
  DEF: "a hexagonal riot shield with graffiti and dents, technical drawing style from gachiakuta manga",
  SPD: "a jagged bolt of electricity with motion lines and ink splatter, high energy trash-punk style",
  LEVEL: "a glowing neon spray-can star, messy paint drips, urban punk aesthetic",
  SCAN: "a high-tech cyber-eye lens with mechanical aperture, gachiakuta style cross-hatching",
  ARENA: "a cracked skull with a crown of thorns and rubble, dark urban punk style",
  RANK: "a dented military medal with a torn ribbon, scrap-punk aesthetic",
  NANITE: "a futuristic cyan crystal shard glowing with energy, cyberpunk style",
};

export async function getGachiIcon(type: keyof typeof GACHI_ICON_PROMPTS): Promise<string> {
  // Check local files first
  if (LOCAL_ICONS[type]) return LOCAL_ICONS[type]!;

  // Check cache (Generated via AI during session)
  const cached = await loadIcon(type);
  if (cached) return cached;

  return "";
}
