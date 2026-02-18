import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Hand, Keyboard, Link2, PlayCircle, Sparkles, X } from 'lucide-react';
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

function normalizeHttpUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(normalized);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function isYouTubeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return host.includes('youtube.com') || host.includes('youtu.be');
  } catch {
    return false;
  }
}

function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname;

    if (host.includes('youtu.be')) {
      const id = path.replace(/^\/+/, '').split('/')[0];
      return id || null;
    }

    if (!host.includes('youtube.com')) return null;
    if (path === '/watch') return parsed.searchParams.get('v');
    if (path.startsWith('/embed/')) return path.split('/')[2] || null;
    if (path.startsWith('/shorts/')) return path.split('/')[2] || null;
    return null;
  } catch {
    return null;
  }
}

function buildYouTubeEmbedUrl(src: string, nonce?: number): string | null {
  const videoId = extractYouTubeVideoId(src);
  if (!videoId) return null;

  try {
    const embedUrl = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
    embedUrl.searchParams.set('autoplay', '1');
    embedUrl.searchParams.set('mute', '1');
    embedUrl.searchParams.set('playsinline', '1');
    embedUrl.searchParams.set('rel', '0');
    embedUrl.searchParams.set('modestbranding', '1');
    embedUrl.searchParams.set('iv_load_policy', '3');
    if (typeof nonce === 'number') {
      embedUrl.searchParams.set('t', String(nonce));
    }
    return embedUrl.toString();
  } catch {
    return null;
  }
}

function buildPlayerUrl(src: string, speed = '0.8', nonce?: number): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const wrapper = new URL('/video-player.html', window.location.origin);
    wrapper.searchParams.set('src', src);
    wrapper.searchParams.set('speed', speed);
    wrapper.searchParams.set('autoplay', '1');
    if (typeof nonce === 'number') {
      wrapper.searchParams.set('ts', String(nonce));
    }
    return wrapper.toString();
  } catch {
    return null;
  }
}

const LessonIntroModal: React.FC<LessonIntroModalProps> = ({ lesson, open, isPreparing, onClose, onStart }) => {
  const [resourceLinkInput, setResourceLinkInput] = useState('');
  const [playerNonce, setPlayerNonce] = useState(0);

  useEffect(() => {
    if (!open || !lesson) return;
    setResourceLinkInput(lesson.guideLink || '');
    setPlayerNonce((prev) => prev + 1);
  }, [open, lesson]);

  const normalizedResourceLink = useMemo(() => normalizeHttpUrl(resourceLinkInput), [resourceLinkInput]);
  const intro = useMemo(() => (lesson ? getIntro(lesson) : null), [lesson]);
  const hasInvalidResourceLink = resourceLinkInput.trim().length > 0 && !normalizedResourceLink;
  const youtubeLink = normalizedResourceLink ? isYouTubeUrl(normalizedResourceLink) : false;
  const inlinePlayerUrl = useMemo(() => {
    if (!normalizedResourceLink) return null;
    if (youtubeLink) return buildYouTubeEmbedUrl(normalizedResourceLink, playerNonce);
    return buildPlayerUrl(normalizedResourceLink, '0.8', playerNonce);
  }, [normalizedResourceLink, youtubeLink, playerNonce]);

  if (!open || !lesson || !intro) return null;

  const openResourceLink = () => {
    if (!normalizedResourceLink) return;
    if (youtubeLink) {
      const playerUrl = buildPlayerUrl(normalizedResourceLink, '0.8');
      if (playerUrl) window.open(playerUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    window.open(normalizedResourceLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-100/60 backdrop-blur-md">
      <div className="w-full max-w-6xl max-h-[94vh] overflow-y-auto rounded-[2rem] border border-sky-200 bg-white/90 shadow-[0_30px_80px_-20px_rgba(14,116,144,0.35)]">
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

                <div className="mt-4 rounded-xl border border-sky-200 bg-white/80 px-3 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-sky-700 mb-2 inline-flex items-center gap-1">
                    <Link2 size={12} /> Link de apoio (opcional)
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={resourceLinkInput}
                      onChange={(e) => setResourceLinkInput(e.target.value)}
                      placeholder="Cole um link aqui (ex: https://...)"
                      className="flex-1 rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-400"
                    />
                    <button
                      type="button"
                      onClick={openResourceLink}
                      disabled={!normalizedResourceLink}
                      className="rounded-xl border border-sky-300 bg-sky-500 text-white px-4 py-2 text-xs font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sky-600"
                    >
                      {youtubeLink ? 'Nova aba 0.8x' : 'Abrir link'}
                    </button>
                  </div>
                  {youtubeLink && (
                    <p className="mt-2 text-[11px] font-semibold text-sky-700">
                      O video toca abaixo no modal. Para velocidade fixa em 0.8x, usa Nova Aba.
                    </p>
                  )}
                  {hasInvalidResourceLink && (
                    <p className="mt-2 text-[11px] font-semibold text-rose-600">Link invalido. Usa formato http:// ou https://</p>
                  )}
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

          <div className="lg:col-span-5 rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-700">Video da aula</p>
              <p className="text-xs font-semibold text-slate-600">
                {youtubeLink ? 'Inline em autoplay (mudo). Usa Nova Aba para 0.8x fixo.' : 'Reproducao inline dentro do modal.'}
              </p>
            </div>
            {inlinePlayerUrl ? (
              <iframe
                title={`Video da ${lesson.title}`}
                src={inlinePlayerUrl}
                className="w-full h-[260px] sm:h-[340px] lg:h-[460px] rounded-xl border border-sky-200 bg-white"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <p className="text-sm text-slate-600">Cole um link valido para reproduzir aqui.</p>
            )}
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
