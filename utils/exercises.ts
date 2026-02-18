import { FINGER_MAP } from '../constants';

export type FingerId =
  | 'left-pinky'
  | 'left-ring'
  | 'left-middle'
  | 'left-index'
  | 'right-index'
  | 'right-middle'
  | 'right-ring'
  | 'right-pinky'
  | 'thumb';

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]) => arr[rand(0, arr.length - 1)];

export const FINGER_LABEL_PT: Record<FingerId, string> = {
  'left-pinky': 'Mindinho esquerdo',
  'left-ring': 'Anelar esquerdo',
  'left-middle': 'Médio esquerdo',
  'left-index': 'Indicador esquerdo',
  'right-index': 'Indicador direito',
  'right-middle': 'Médio direito',
  'right-ring': 'Anelar direito',
  'right-pinky': 'Mindinho direito',
  thumb: 'Polegares (espaço)'
};

export const COMMON_PT_WORDS = [
  'que', 'para', 'com', 'isso', 'mais', 'muito', 'hoje', 'amanha', 'onde', 'quando',
  'pratica', 'teclado', 'digitar', 'rapido', 'calma', 'foco', 'vamos', 'agora',
  'nivel', 'missao', 'combo', 'acerto', 'erro', 'tempo', 'pontos', 'progresso'
];

export const COMMON_PT_BIGRAMS = ['qu', 'de', 're', 'ra', 'es', 'as', 'os', 'ar', 'er', 'ir', 'ou', 'em', 'ao', 'ma', 'ta'];

export function keysForFinger(finger: FingerId): string[] {
  const keys = Object.entries(FINGER_MAP)
    .filter(([, v]) => v === finger)
    .map(([k]) => (k === 'Espaço' ? ' ' : k));

  if (finger !== 'thumb') {
    return keys.filter((k) => /^[a-z]$/.test(k));
  }
  return [' '];
}

export function inferFingerForChar(ch: string): FingerId | null {
  const key = ch === ' ' ? 'Espaço' : ch.toLowerCase();
  return (FINGER_MAP[key] as FingerId) || null;
}

function joinWithSpaces(tokens: string[], maxChars: number) {
  let out = '';
  while (out.length < maxChars) {
    out += (out ? ' ' : '') + pick(tokens);
  }
  return out.slice(0, maxChars).trim();
}

export function generateFingerDrill(finger: FingerId, maxChars = 160): string {
  const keys = keysForFinger(finger);
  const tokens: string[] = [];
  for (let i = 0; i < 40; i++) {
    const a = pick(keys);
    const b = pick(keys);
    tokens.push(a + b);
  }
  return joinWithSpaces(tokens, maxChars);
}

export function generateAlternatingHands(maxChars = 180): string {
  const left = ['a', 's', 'd', 'f', 'q', 'w', 'e', 'r', 'z', 'x', 'c', 'v'];
  const right = ['j', 'k', 'l', ';', 'u', 'i', 'o', 'p', 'm', ',', '.', '/'];
  const tokens: string[] = [];
  for (let i = 0; i < 80; i++) {
    tokens.push(pick(left) + pick(right));
  }
  return joinWithSpaces(tokens, maxChars);
}

export function generateWordMix(maxChars = 200): string {
  const tokens: string[] = [];
  for (let i = 0; i < 80; i++) {
    const w = pick(COMMON_PT_WORDS);
    const maybe = Math.random() < 0.25 ? w + pick(['.', '!', '?', ',']) : w;
    tokens.push(maybe);
  }
  return joinWithSpaces(tokens, maxChars);
}

export function generateAdaptiveText(
  mistakeMap: Record<string, number>,
  maxChars = 180
): { text: string; focusKeys: string[] } {
  const entries = Object.entries(mistakeMap)
    .filter(([k]) => k.length === 1 || k === ' ')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const focusKeys = entries.length
    ? entries.map(([k]) => k)
    : ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'].slice(0, 6);

  const tokens: string[] = [];
  for (let i = 0; i < 70; i++) {
    if (Math.random() < 0.55) {
      const a = pick(focusKeys);
      const b = pick(focusKeys);
      tokens.push(a + b);
    } else if (Math.random() < 0.75) {
      tokens.push(pick(COMMON_PT_BIGRAMS));
    } else {
      tokens.push(pick(COMMON_PT_WORDS));
    }
  }
  return { text: joinWithSpaces(tokens, maxChars), focusKeys };
}

export function calcLevelFromXp(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(xp / 120)) + 1);
}

export function xpForRun(wpm: number, accuracy: number, bonus = 0): number {
  const base = Math.round(wpm * 2.2 + accuracy * 0.8);
  return Math.max(10, base + bonus);
}
