import React from 'react';
import { Eye, Hand, Keyboard, PlayCircle, Sparkles, X } from 'lucide-react';
import { Lesson, LessonType } from '../types';

interface IntroContent {
  heading: string;
  checklist: string[];
  missionFocus: string;
  coachLine: string;
}

interface LessonIntroModalProps {
  lesson: Lesson | null;
  open: boolean;
  isPreparing: boolean;
  onClose: () => void;
  onStart: () => void;
}

const BASE_CHECKLIST = [
  'Senta com costas retas e ombros relaxados.',
  'Mantem os dedos guia em F e J antes de comecar.',
  'Olha para a tela, nao para o teclado.',
  'Prioriza precisao primeiro e velocidade depois.',
];

const INTRO_BY_TYPE: Partial<Record<LessonType, IntroContent>> = {
  [LessonType.HOME_ROW]: {
    heading: 'Base da digitacao',
    checklist: [...BASE_CHECKLIST, 'Treina somente a fileira central sem levantar os pulsos.'],
    missionFocus: 'Repeticao curta e limpa no centro do teclado.',
    coachLine: 'Hoje vamos construir memoria muscular no centro do teclado.',
  },
  [LessonType.TOP_ROW]: {
    heading: 'Fileira superior',
    checklist: [...BASE_CHECKLIST, 'Sobe para a fileira de cima e retorna para F/J apos cada tecla.'],
    missionFocus: 'Subir e voltar sem perder postura.',
    coachLine: 'Subiu para a fileira de cima? Volta sempre para a base.',
  },
  [LessonType.BOTTOM_ROW]: {
    heading: 'Fileira inferior',
    checklist: [...BASE_CHECKLIST, 'Desce para a fileira inferior sem travar o punho.'],
    missionFocus: 'Controle dos dedos na descida e volta para casa.',
    coachLine: 'Movimento curto e preciso para baixo, sem rigidez.',
  },
  [LessonType.FINGER_DRILL]: {
    heading: 'Treino de dedo especifico',
    checklist: [...BASE_CHECKLIST, 'Usa apenas o dedo alvo quando possivel.'],
    missionFocus: 'Memoria muscular de um dedo por vez.',
    coachLine: 'Isola o dedo alvo e controla o ritmo sem pressa.',
  },
  [LessonType.ALTERNATING]: {
    heading: 'Alternancia de maos',
    checklist: [...BASE_CHECKLIST, 'Alterna esquerda e direita no ritmo, sem acelerar cedo.'],
    missionFocus: 'Equilibrio das duas maos.',
    coachLine: 'Pensa em batida musical: esquerda, direita, esquerda, direita.',
  },
  [LessonType.SPRINT]: {
    heading: 'Sprint de velocidade',
    checklist: [...BASE_CHECKLIST, 'Respira fundo e mantem o ritmo por blocos de 10 segundos.'],
    missionFocus: 'Velocidade com minimo de erro.',
    coachLine: 'Comeca controlado e acelera quando entrar em fluxo.',
  },
  [LessonType.ADAPTIVE]: {
    heading: 'Treino adaptativo',
    checklist: [...BASE_CHECKLIST, 'Foca nas teclas que mais erras e reduz a forca na digitacao.'],
    missionFocus: 'Corrigir pontos fracos com repeticao inteligente.',
    coachLine: 'Hoje a missao e arrumar exatamente o que mais te atrapalha.',
  },
  [LessonType.AI_STORY]: {
    heading: 'Leitura + digitacao longa',
    checklist: [...BASE_CHECKLIST, 'Le frases curtas na tela antes de digitar para reduzir erros.'],
    missionFocus: 'Fluxo continuo em texto mais longo.',
    coachLine: 'Olhos na tela e ritmo continuo, como se fosse uma historia em fases.',
  },
};

function getIntro(lesson: Lesson): IntroContent {
  const intro = INTRO_BY_TYPE[lesson.type];
  if (intro) return intro;
  return {
    heading: 'Introducao da licao',
    checklist: BASE_CHECKLIST,
    missionFocus: 'Postura, precisao e ritmo constante.',
    coachLine: 'Postura boa + foco = melhoria real em cada sessao.',
  };
}

const LessonIntroModal: React.FC<LessonIntroModalProps> = ({ lesson, open, isPreparing, onClose, onStart }) => {
  if (!open || !lesson) return null;
  const intro = getIntro(lesson);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-100/60 backdrop-blur-md">
      <div className="w-full max-w-4xl rounded-[2rem] border border-sky-200 bg-white/90 shadow-[0_30px_80px_-20px_rgba(14,116,144,0.35)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100 bg-gradient-to-r from-sky-50 via-rose-50 to-emerald-50">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-sky-700">Aula rapida antes da missao</p>
            <h3 className="text-2xl font-black text-slate-900">{lesson.title}</h3>
            <p className="text-sm font-semibold text-slate-600">{intro.heading}</p>
          </div>

          <button
            onClick={onClose}
            disabled={isPreparing}
            className="w-10 h-10 rounded-xl border border-sky-200 bg-white text-sky-700 hover:bg-sky-50 disabled:opacity-50"
            aria-label="Fechar introducao"
          >
            <X className="mx-auto" size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-6">
          <div className="lg:col-span-3 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-fuchsia-50 p-5">
            <div className="flex flex-col md:flex-row items-center gap-5">
              <div className="relative tm-coach-bob shrink-0">
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-sky-300 via-fuchsia-300 to-emerald-300 blur-md opacity-45"></div>
                <div className="absolute inset-3 rounded-full bg-white border-2 border-sky-200 shadow-md">
                  <div className="absolute top-10 left-10 w-3 h-3 rounded-full bg-slate-700"></div>
                  <div className="absolute top-10 right-10 w-3 h-3 rounded-full bg-slate-700"></div>
                  <div className="absolute top-16 left-1/2 -translate-x-1/2 w-3 h-2 rounded-full bg-rose-300"></div>
                  <div className="absolute bottom-9 left-1/2 -translate-x-1/2 w-16 h-8 rounded-full border-2 border-sky-200 bg-sky-50"></div>
                </div>
              </div>

              <div className="flex-1 w-full">
                <div className="rounded-2xl border border-sky-200 bg-white/80 px-4 py-3 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-700 mb-2">Coach TypeMaster</p>
                  <p className="text-sm font-semibold text-slate-700">{intro.coachLine}</p>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-fuchsia-200 bg-fuchsia-50 px-3 py-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-fuchsia-700 mb-1 inline-flex items-center gap-1">
                      <Hand size={12} /> Maos
                    </p>
                    <p className="text-xs text-slate-700">Dedos em F/J e movimento curto.</p>
                  </div>
                  <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-sky-700 mb-1 inline-flex items-center gap-1">
                      <Eye size={12} /> Foco
                    </p>
                    <p className="text-xs text-slate-700">Olhos na tela, sem cacar tecla.</p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-1 inline-flex items-center gap-1">
                      <Keyboard size={12} /> Ritmo
                    </p>
                    <p className="text-xs text-slate-700">Constante, sem pressa no inicio.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-700 mb-3">Regras da licao</p>
            <ul className="space-y-2 text-sm text-slate-700">
              {intro.checklist.map((item) => (
                <li key={item} className="rounded-xl bg-white/80 px-3 py-2 border border-rose-100">
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-sky-700 inline-flex items-center gap-1">
                <Sparkles size={12} /> Foco desta missao
              </p>
              <p className="text-sm font-semibold text-slate-700">{intro.missionFocus}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-sky-100 bg-white flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={onClose}
            disabled={isPreparing}
            className="px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 font-black uppercase text-xs tracking-widest hover:bg-slate-50 disabled:opacity-50"
          >
            Fechar
          </button>
          <button
            onClick={onStart}
            disabled={isPreparing}
            className="px-6 py-3 rounded-xl border border-sky-300 bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-black uppercase text-xs tracking-widest inline-flex items-center justify-center gap-2 hover:from-sky-600 hover:to-cyan-600 disabled:opacity-60"
          >
            {isPreparing ? 'Preparando...' : 'Iniciar licao'}
            <PlayCircle size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonIntroModal;
