declare const __EMOUJIA_FALLBACK__: boolean;
declare module '*.svg?raw' { const s: string; export default s; }
declare module '*/flags.mjs' { export function fallbackOn(mode: string): boolean; }
