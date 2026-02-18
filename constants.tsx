
import React from 'react';
import { Lesson, LessonType } from './types';

export const KEYBOARD_LAYOUT = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['Caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
  ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
  ['Espaço']
];

export const INITIAL_LESSONS: Lesson[] = [
  {
    id: '1',
    title: 'Base de Operações',
    description: 'Domine a fileira central (asdf jkl;). Onde tudo começa!',
    type: LessonType.HOME_ROW,
    level: 1,
    content: 'asdf jkl; asdf jkl; a s d f j k l ;'
  },
  {
    id: '2',
    title: 'Escalada de Dedos',
    description: 'Alcançando a fileira de cima (qwerty uiop). Suba de nível!',
    type: LessonType.TOP_ROW,
    level: 2,
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
    title: 'Combo: Alterna as Mãos',
    description: 'Jogo de ritmo: esquerda-direita, esquerda-direita. Sem olhar!',
    type: LessonType.ALTERNATING,
    level: 3,
    timeLimitSec: 35,
    minAccuracy: 90
  },
  {
    id: '7',
    title: 'Sprint 30s (Speedrun)',
    description: '30 segundos para fazer o máximo possível. Vai, vai, vai!',
    type: LessonType.SPRINT,
    level: 4,
    timeLimitSec: 30
  },
  {
    id: '8',
    title: 'Missão Inteligente',
    description: 'Treino adaptativo: foca nas teclas onde você mais erra.',
    type: LessonType.ADAPTIVE,
    level: 4,
    timeLimitSec: 40,
    minAccuracy: 92
  },
  {
    id: '4',
    title: 'Missão IA: Aventura',
    description: 'Prática dinâmica com histórias geradas por IA em tempo real.',
    type: LessonType.AI_STORY,
    level: 4
  }
];

export const FINGER_MAP: Record<string, string> = {
  'q': 'left-pinky', 'a': 'left-pinky', 'z': 'left-pinky', '1': 'left-pinky',
  'w': 'left-ring', 's': 'left-ring', 'x': 'left-ring', '2': 'left-ring',
  'e': 'left-middle', 'd': 'left-middle', 'c': 'left-middle', '3': 'left-middle',
  'r': 'left-index', 'f': 'left-index', 'v': 'left-index', '4': 'left-index', '5': 'left-index', 't': 'left-index', 'g': 'left-index', 'b': 'left-index',
  'y': 'right-index', 'h': 'right-index', 'n': 'right-index', '6': 'right-index', '7': 'right-index', 'u': 'right-index', 'j': 'right-index', 'm': 'right-index',
  'i': 'right-middle', 'k': 'right-middle', ',': 'right-middle', '8': 'right-middle',
  'o': 'right-ring', 'l': 'right-ring', '.': 'right-ring', '9': 'right-ring',
  'p': 'right-pinky', ';': 'right-pinky', '/': 'right-pinky', '0': 'right-pinky', '-': 'right-pinky', '=': 'right-pinky', '[': 'right-pinky', ']': 'right-pinky', "'": 'right-pinky',
  'Espaço': 'thumb'
};
