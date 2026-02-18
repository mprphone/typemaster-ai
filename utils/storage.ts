export type StoredProfile = {
  version: number;
  xp: number;
  streak: number;
  lastPracticeDate: string | null;
  completedLessons: string[];
  wpmHistory: number[];
  accuracyHistory: number[];
  totalKeys: number;
  keyMistakes: Record<string, number>;
  theme: string;
  sound: boolean;
};

const KEY = 'typemaster.profile.v2';

export function loadProfile(): StoredProfile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) throw new Error('empty');
    const parsed = JSON.parse(raw) as StoredProfile;
    if (!parsed.version) throw new Error('bad');
    return {
      version: 2,
      xp: parsed.xp ?? 0,
      streak: parsed.streak ?? 0,
      lastPracticeDate: parsed.lastPracticeDate ?? null,
      completedLessons: parsed.completedLessons ?? [],
      wpmHistory: parsed.wpmHistory ?? [],
      accuracyHistory: parsed.accuracyHistory ?? [],
      totalKeys: parsed.totalKeys ?? 0,
      keyMistakes: parsed.keyMistakes ?? {},
      theme: parsed.theme ?? 'cyberpunk futurista',
      sound: parsed.sound ?? false,
    };
  } catch {
    return {
      version: 2,
      xp: 0,
      streak: 0,
      lastPracticeDate: null,
      completedLessons: [],
      wpmHistory: [],
      accuracyHistory: [],
      totalKeys: 0,
      keyMistakes: {},
      theme: 'cyberpunk futurista',
      sound: false,
    };
  }
}

export function saveProfile(profile: StoredProfile) {
  localStorage.setItem(KEY, JSON.stringify(profile));
}

export function isoLocalDate(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function diffDays(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split('-').map(Number);
  const [ty, tm, td] = toIso.split('-').map(Number);
  const a = new Date(fy, fm - 1, fd).getTime();
  const b = new Date(ty, tm - 1, td).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}
