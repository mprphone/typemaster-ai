
import React from 'react';
import { Lesson, LessonType } from './types';

function hasMojibake(text: string): boolean {
  return /Ã.|Â|â[\u0080-\u00bf]|�/.test(text);
}

function repairMojibake(text: string): string {
  if (!text || !hasMojibake(text)) return text;
  try {
    const bytes = Uint8Array.from(Array.from(text).map((ch) => ch.charCodeAt(0) & 0xff));
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return text;
  }
}

function sanitizeLesson(lesson: Lesson): Lesson {
  return {
    ...lesson,
    title: repairMojibake(lesson.title),
    description: repairMojibake(lesson.description),
    content: lesson.content ? repairMojibake(lesson.content) : lesson.content,
  };
}

export const KEYBOARD_LAYOUT = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['Caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
  ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
  ['Espa\u00e7o']
];

const RAW_INITIAL_LESSONS: Lesson[] = [
  {
    id: '1',
    title: 'Base de Opera\u00e7\u00f5es',
    description: 'Domine a fileira central (asdf jkl;). Onde tudo come\u00e7a!',
    type: LessonType.HOME_ROW,
    level: 1,
    guideLink: 'https://youtu.be/eoL1bMXzKiE',
    content: 'asdf jkl; asdf jkl; a s d f j k l ;'
  },
  {
    id: '2',
    title: 'Escalada de Dedos',
    description: 'Alcan\u00e7ando a fileira de cima (qwerty uiop). Suba de n\u00edvel!',
    type: LessonType.TOP_ROW,
    level: 2,
    guideLink: 'https://youtu.be/aTul4pS9DM0',
    content: 'qwer uiop qwer uiop q w e r u i o p'
  },
  {
    id: '3',
    title: 'Mergulho Profundo',
    description: 'Dominando a fileira de baixo (zxcvb nm,./). Quase um pro!',
    type: LessonType.BOTTOM_ROW,
    level: 3,
    content: 'zxcv nm,. zxcv nm,. z x c v n m , .'
  },
  {
    id: '5',
    title: 'Treino: Indicadores',
    description: 'Pega ritmo usando os dedos indicadores (F/J e vizinhos).',
    type: LessonType.FINGER_DRILL,
    level: 2,
    focusFinger: 'left-index'
  },
  {
    id: '6',
    title: 'Combo: Alterna as M\u00e3os',
    description: 'Jogo de ritmo: esquerda-direita, esquerda-direita. Sem olhar!',
    type: LessonType.ALTERNATING,
    level: 3,
    timeLimitSec: 35,
    minAccuracy: 90
  },
  {
    id: '7',
    title: 'Sprint 30s (Speedrun)',
    description: '30 segundos para fazer o m\u00e1ximo poss\u00edvel. Vai, vai, vai!',
    type: LessonType.SPRINT,
    level: 4,
    timeLimitSec: 30
  },
  {
    id: '8',
    title: 'Miss\u00e3o Inteligente',
    description: 'Treino adaptativo: foca nas teclas onde voc\u00ea mais erra.',
    type: LessonType.ADAPTIVE,
    level: 4,
    timeLimitSec: 40,
    minAccuracy: 92
  },
  {
    id: '4',
    title: 'Miss\u00e3o IA: Aventura',
    description: 'Pr\u00e1tica din\u00e2mica com hist\u00f3rias geradas por IA em tempo real.',
    type: LessonType.AI_STORY,
    level: 4
  }
];

export const INITIAL_LESSONS: Lesson[] = RAW_INITIAL_LESSONS.map(sanitizeLesson);

export const FINGER_MAP: Record<string, string> = {
  'q': 'left-pinky', 'a': 'left-pinky', 'z': 'left-pinky', '1': 'left-pinky',
  'w': 'left-ring', 's': 'left-ring', 'x': 'left-ring', '2': 'left-ring',
  'e': 'left-middle', 'd': 'left-middle', 'c': 'left-middle', '3': 'left-middle',
  'r': 'left-index', 'f': 'left-index', 'v': 'left-index', '4': 'left-index', '5': 'left-index', 't': 'left-index', 'g': 'left-index', 'b': 'left-index',
  'y': 'right-index', 'h': 'right-index', 'n': 'right-index', '6': 'right-index', '7': 'right-index', 'u': 'right-index', 'j': 'right-index', 'm': 'right-index',
  'i': 'right-middle', 'k': 'right-middle', ',': 'right-middle', '8': 'right-middle',
  'o': 'right-ring', 'l': 'right-ring', '.': 'right-ring', '9': 'right-ring',
  'p': 'right-pinky', ';': 'right-pinky', '/': 'right-pinky', '0': 'right-pinky', '-': 'right-pinky', '=': 'right-pinky', '[': 'right-pinky', ']': 'right-pinky', "'": 'right-pinky',
  'Espa\u00e7o': 'thumb'
};

