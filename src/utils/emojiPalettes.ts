export interface Palette {
  bg: string;
  accent: string;
  text: string;
  emojis?: string[];
}

const palettes: Record<string, Palette> = {
  warm: {
    emojis: ["🤠", "🌵", "🔥", "🌶", "🏜", "🌻", "🦁", "🐯", "🍊", "⭐", "🌟", "🤙", "🫶"],
    bg: "#1a0f00",
    accent: "#c97d2a",
    text: "#f5e6c8",
  },
  cold: {
    emojis: ["😭", "😢", "🌊", "❄️", "🫐", "💙", "🌧", "🫠", "🫣", "⚫", "🩶", "🌑", "😶‍🌫️"],
    bg: "#000d1a",
    accent: "#2a6cb0",
    text: "#cde0f5",
  },
  rose: {
    emojis: ["❤️", "🌹", "💋", "😍", "🥰", "💕", "💞", "💗", "💓", "🫀", "🌸", "🩷", "💍", "😘"],
    bg: "#1a000a",
    accent: "#c42c6e",
    text: "#fce4ef",
  },
  cosmic: {
    emojis: ["💎", "✨", "⚡", "🔮", "🌙", "💜", "🟣", "🌌", "🦋", "🪄", "🌀", "🛸", "🫧"],
    bg: "#08001a",
    accent: "#7b2fc9",
    text: "#e8d5ff",
  },
  edge: {
    emojis: ["😈", "💀", "🖤", "❌", "🚫", "⚠️", "🦇", "🕷", "🤬", "👿", "💣", "😤", "🗡️"],
    bg: "#0a0a0a",
    accent: "#cc2222",
    text: "#e8e8e8",
  },
  default: {
    bg: "#0a0a0f",
    accent: "#8888aa",
    text: "#e0e0e8",
  },
};

export function getPalette(rulingEmoji: string): Palette {
  for (const [key, palette] of Object.entries(palettes)) {
    if (key === "default") continue;
    if (palette.emojis?.includes(rulingEmoji)) return palette;
  }
  return palettes.default;
}
