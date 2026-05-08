export interface Palette {
  bg: string;
  accent: string;
  text: string;
  emojis?: string[];
}

const palettes: Record<string, Palette> = {
  warm: {
    emojis: ["🤠", "🌵", "🔥", "🌶", "🏜", "🌻", "🦁", "🐯", "🍊", "⭐", "🌟", "🤙", "🫶", "☀️", "🌅", "💛", "🧡"],
    bg: "#1a0f00",
    accent: "#c97d2a",
    text: "#f5e6c8",
  },
  cold: {
    emojis: ["😭", "😢", "🌊", "❄️", "🫐", "💙", "🌧", "🫠", "🫣", "⚫", "🩶", "🌑", "😶‍🌫️", "🧊", "🌪", "💧"],
    bg: "#000d1a",
    accent: "#2a6cb0",
    text: "#cde0f5",
  },
  rose: {
    emojis: ["❤️", "🌹", "💋", "😍", "🥰", "💕", "💞", "💗", "💓", "🫀", "🌸", "🩷", "💍", "😘", "💅", "🫦", "🍭"],
    bg: "#1c0010",
    accent: "#d43d8a",
    text: "#ffeaf2",
  },
  cosmic: {
    emojis: ["💎", "✨", "⚡", "🔮", "🌙", "💜", "🟣", "🌌", "🦋", "🪄", "🌀", "🛸", "🫧", "👾", "🧪", "🪬"],
    bg: "#0d001f",
    accent: "#8e44ad",
    text: "#f3e5f5",
  },
  nature: {
    emojis: ["🍃", "🌱", "🌿", "🪴", "🌳", "🌲", "🍀", "🍏", "🍐", "🥑", "🥦", "🦜", "🐌", "🍄"],
    bg: "#0b1a0d",
    accent: "#3d994c",
    text: "#e8f5e9",
  },
  edge: {
    emojis: ["😈", "💀", "🖤", "❌", "🚫", "⚠️", "蝙", "🕷", "🤬", "👿", "💣", "😤", "🗡️", "🔞", "⛓️", "⛓", "🚬"],
    bg: "#0a0a0a",
    accent: "#cc2222",
    text: "#e8e8e8",
  },
  default: {
    bg: "#0a0a0f",
    accent: "#7b2fc9",
    text: "#ffffff",
  },
};

export function getPalette(rulingEmoji: string): Palette {
  if (!rulingEmoji) return palettes.default;

  for (const [, palette] of Object.entries(palettes)) {
    if (palette.emojis?.includes(rulingEmoji)) return palette;
  }
  
  // Deterministic fallback based on char code if no specific match
  const charCode = rulingEmoji.codePointAt(0) || 0;
  const keys = Object.keys(palettes).filter(k => k !== "default");
  return palettes[keys[charCode % keys.length]];
}
