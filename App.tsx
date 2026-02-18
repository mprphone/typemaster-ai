import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Lesson, LessonType, TypingSession } from './types';
import { FINGER_MAP, INITIAL_LESSONS } from './constants';
import { geminiService } from './geminiService';

import Keyboard from './components/Keyboard';
import LessonCard from './components/LessonCard';
import LessonIntroModal from './components/LessonIntroModal';
import StatsBoard from './components/StatsBoard';
import MissionHUD from './components/MissionHUD';
import FingerCoach from './components/FingerCoach';

import {
  calcLevelFromXp,
  generateAdaptiveText,
  generateAlternatingHands,
  generateFingerDrill,
  generateWordMix,
  xpForRun,
  type FingerId,
} from './utils/exercises';
import { diffDays, isoLocalDate, loadProfile, saveProfile } from './utils/storage';

import {
  ArrowLeft,
  BrainCircuit,
  Flame,
  Loader2,
  RefreshCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';

const THEMES = [
  'cyberpunk futurista',
  'mistério na escola',
  'aventura no espaço',
  'gamer e eSports',
  'moda e estilo',
];

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'lesson'>('home');
  const [lessons] = useState<Lesson[]>(INITIAL_LESSONS);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);

  const [profile, setProfile] = useState(() => loadProfile());
  useEffect(() => saveProfile(profile), [profile]);

  const [session, setSession] = useState<TypingSession>({
    targetText: '',
    userInput: '',
    startTime: null,
    endTime: null,
    errors: 0,
    isFinished: false,
    timeLimitSec: undefined,
    leftKeys: 0,
    rightKeys: 0,
    leftErrors: 0,
    rightErrors: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');
  const [aiNotice, setAiNotice] = useState('');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [focusKeys, setFocusKeys] = useState<string[]>([]);
  const [floatingXp, setFloatingXp] = useState<number | null>(null);
  const [runResult, setRunResult] = useState<{ wpm: number; accuracy: number; xp: number; success: boolean } | null>(null);
  const [introLesson, setIntroLesson] = useState<Lesson | null>(null);
  const [isPreparingLesson, setIsPreparingLesson] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const sessionRef = useRef(session);
  const runMistakesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const level = useMemo(() => calcLevelFromXp(profile.xp), [profile.xp]);

  const stats = useMemo(
    () => ({
      wpm: profile.wpmHistory,
      accuracy: profile.accuracyHistory,
      totalKeys: profile.totalKeys,
      completedLessons: profile.completedLessons,
    }),
    [profile]
  );

  const playSound = useCallback(
    (type: 'ok' | 'err' | 'finish') => {
      if (!profile.sound) return;
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.value = type === 'ok' ? 720 : type === 'err' ? 210 : 520;
        g.gain.value = 0.04;
        o.start();
        setTimeout(() => {
          o.stop();
          ctx.close();
        }, type === 'finish' ? 170 : 70);
      } catch {
        // ignore
      }
    },
    [profile.sound]
  );

  const finalizeRun = useCallback(
    async (finalInput: string, finalErrors: number, finalStart: number, endTime: number) => {
      if (!currentLesson) return;

      const timeInMinutes = (endTime - finalStart) / 1000 / 60;
      const wordsTyped = finalInput.length / 5;
      const wpm = Math.round(wordsTyped / timeInMinutes) || 0;
      const accuracy = finalInput.length
        ? Math.round(((finalInput.length - finalErrors) / finalInput.length) * 100)
        : 100;

      const success =
        (!currentLesson.minAccuracy || accuracy >= currentLesson.minAccuracy) &&
        (!currentLesson.minWpm || wpm >= currentLesson.minWpm);

      const bonus = success ? 35 : 0;
      const xp = xpForRun(wpm, accuracy, bonus);
      setRunResult({ wpm, accuracy, xp, success });

      const today = isoLocalDate();

      setProfile((p) => {
        let streak = p.streak || 0;
        if (!p.lastPracticeDate) streak = 1;
        else {
          const d = diffDays(p.lastPracticeDate, today);
          if (d === 0) {
            // keep
          } else if (d === 1) {
            streak += 1;
          } else {
            streak = 1;
          }
        }

        const mergedMistakes: Record<string, number> = { ...(p.keyMistakes || {}) };
        for (const [k, v] of Object.entries(runMistakesRef.current)) {
          mergedMistakes[k] = (mergedMistakes[k] || 0) + v;
        }

        return {
          ...p,
          xp: (p.xp || 0) + xp,
          streak,
          lastPracticeDate: today,
          wpmHistory: [...(p.wpmHistory || []), wpm].slice(-40),
          accuracyHistory: [...(p.accuracyHistory || []), accuracy].slice(-40),
          totalKeys: (p.totalKeys || 0) + finalInput.length,
          completedLessons: success
            ? Array.from(new Set([...(p.completedLessons || []), currentLesson.id]))
            : (p.completedLessons || []),
          keyMistakes: mergedMistakes,
        };
      });

      setFloatingXp(xp);
      setTimeout(() => setFloatingXp(null), 900);

      playSound('finish');
      const allowAIFeedback = currentLesson.type === LessonType.AI_STORY;
      geminiService.getFeedback(wpm, accuracy, { allowAI: allowAIFeedback }).then(setAiFeedback);
    },
    [currentLesson, playSound]
  );

  const launchLesson = useCallback(
    async (lesson: Lesson) => {
      setIsLoading(true);
      setFocusKeys([]);
      runMistakesRef.current = {};
      setRunResult(null);
      setElapsedSec(0);
      setAiFeedback('');
      setAiNotice('');

      let content = lesson.content || '';

      if (lesson.type === LessonType.AI_STORY) {
        const aiResult = await geminiService.generatePracticeText(profile.theme || 'cyberpunk futurista', 520);
        content = aiResult.text;
        if (aiResult.source === 'local') {
          setAiNotice(aiResult.note || 'Modo local ativo para economizar cota da IA.');
        }
      } else if (lesson.type === LessonType.FINGER_DRILL) {
        const finger = (lesson.focusFinger || 'left-index') as FingerId;
        content = generateFingerDrill(finger);
      } else if (lesson.type === LessonType.ALTERNATING) {
        content = generateAlternatingHands(220);
      } else if (lesson.type === LessonType.SPRINT) {
        content = generateWordMix(360);
      } else if (lesson.type === LessonType.ADAPTIVE) {
        const res = generateAdaptiveText(profile.keyMistakes || {}, 260);
        content = res.text;
        setFocusKeys(res.focusKeys);
      }

      setSession({
        targetText: content,
        userInput: '',
        startTime: null,
        endTime: null,
        errors: 0,
        isFinished: false,
        timeLimitSec: lesson.timeLimitSec,
        leftKeys: 0,
        rightKeys: 0,
        leftErrors: 0,
        rightErrors: 0,
      });

      setCurrentLesson(lesson);
      setView('lesson');
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 60);
    },
    [profile.theme, profile.keyMistakes]
  );

  const openLessonIntro = useCallback((lesson: Lesson) => {
    setIntroLesson(lesson);
  }, []);

  const closeLessonIntro = useCallback(() => {
    if (isPreparingLesson) return;
    setIntroLesson(null);
  }, [isPreparingLesson]);

  const beginLessonFromIntro = useCallback(async () => {
    if (!introLesson) return;
    try {
      setIsPreparingLesson(true);
      await launchLesson(introLesson);
      setIntroLesson(null);
    } finally {
      setIsPreparingLesson(false);
    }
  }, [introLesson, launchLesson]);

  const confetti = useMemo(() => {
    if (!runResult?.success) return [] as Array<{ left: number; delay: number; hue: number }>;
    return Array.from({ length: 18 }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.22,
      hue: Math.floor(Math.random() * 360),
    }));
  }, [runResult?.success]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (view !== 'lesson' || sessionRef.current.isFinished || isLoading) return;
      if (e.key.length > 1 && e.key !== 'Backspace' && e.key !== ' ') return;
      e.preventDefault();

      setSession((prev) => {
        if (prev.isFinished) return prev;

        let start = prev.startTime;
        if (!start) start = Date.now();

        if (e.key === 'Backspace') {
          return { ...prev, userInput: prev.userInput.slice(0, -1) };
        }

        const nextIdx = prev.userInput.length;
        const expected = prev.targetText[nextIdx] ?? '';
        if (!expected) return prev;

        let typed = e.key === ' ' ? ' ' : e.key;
        // If expected is lowercase, don't punish Shift.
        if (/[a-z]/.test(expected)) typed = typed.toLowerCase();

        const newUserInput = prev.userInput + typed;
        const isCorrect = typed === expected;
        const newErrors = isCorrect ? prev.errors : prev.errors + 1;

        const pressedLower = typed === ' ' ? ' ' : typed.toLowerCase();
        const mapKey = pressedLower === ' ' ? 'Espaço' : pressedLower;
        const finger = FINGER_MAP[mapKey];
        const side = typeof finger === 'string' && finger.startsWith('left') ? 'left' : typeof finger === 'string' && finger.startsWith('right') ? 'right' : null;

        let leftKeys = prev.leftKeys;
        let rightKeys = prev.rightKeys;
        let leftErrors = prev.leftErrors;
        let rightErrors = prev.rightErrors;

        if (side === 'left') leftKeys += 1;
        if (side === 'right') rightKeys += 1;

        if (!isCorrect) {
          if (side === 'left') leftErrors += 1;
          if (side === 'right') rightErrors += 1;
          runMistakesRef.current[pressedLower] = (runMistakesRef.current[pressedLower] || 0) + 1;
          playSound('err');
        } else {
          playSound('ok');
        }

        const finishedByLength = newUserInput.length >= prev.targetText.length;
        let end = prev.endTime;
        let isFinished = prev.isFinished;
        if (finishedByLength) {
          isFinished = true;
          end = Date.now();
          setTimeout(() => finalizeRun(newUserInput, newErrors, start as number, end as number), 0);
        }

        return {
          ...prev,
          startTime: start,
          endTime: end,
          userInput: newUserInput,
          errors: newErrors,
          isFinished,
          leftKeys,
          rightKeys,
          leftErrors,
          rightErrors,
        };
      });
    },
    [finalizeRun, isLoading, playSound, view]
  );

  // Time-limited missions
  useEffect(() => {
    if (view !== 'lesson') return;
    const s = sessionRef.current;
    if (!s.startTime || s.isFinished || !s.timeLimitSec) return;

    const id = window.setInterval(() => {
      const cur = sessionRef.current;
      if (!cur.startTime || cur.isFinished || !cur.timeLimitSec) return;
      const elapsed = Math.floor((Date.now() - cur.startTime) / 1000);
      setElapsedSec(elapsed);
      if (elapsed >= cur.timeLimitSec) {
        const end = Date.now();
        setSession((p) => ({ ...p, isFinished: true, endTime: end }));
        finalizeRun(cur.userInput, cur.errors, cur.startTime, end);
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [finalizeRun, view, session.startTime, session.isFinished, session.timeLimitSec]);

  useEffect(() => {
    if (view === 'lesson') {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [view, currentLesson]);

  const calculateWPM = () => {
    if (!session.startTime) return 0;
    const end = session.endTime || Date.now();
    const timeInMinutes = (end - session.startTime) / 1000 / 60;
    const wordsTyped = session.userInput.length / 5;
    return Math.round(wordsTyped / timeInMinutes) || 0;
  };

  const calculateAccuracy = () => {
    if (session.userInput.length === 0) return 100;
    const correct = session.userInput.split('').filter((ch, i) => ch === session.targetText[i]).length;
    return Math.round((correct / session.userInput.length) * 100);
  };

  const bestWpm = stats.wpm.length ? Math.max(...stats.wpm) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-rose-50 to-emerald-100 text-slate-900 p-4 md:p-8 flex flex-col items-center selection:bg-cyan-300/50">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-300/30 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-300/30 blur-[120px] rounded-full"></div>
        <div className="absolute top-[20%] right-[-20%] w-[35%] h-[35%] bg-emerald-300/25 blur-[140px] rounded-full"></div>
      </div>

      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center mb-12 z-10">
        <div className="flex items-center gap-4 group cursor-default">
          <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.35)] group-hover:scale-110 transition-transform">
            <Zap className="text-white fill-white" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic">
              Type<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-fuchsia-500">Master</span>
              <span className="ml-1 text-sky-700 text-sm align-top">AI</span>
            </h1>
            <div className="hidden sm:flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mt-1">
              <span className="inline-flex items-center gap-2">
                <Sparkles size={14} className="text-fuchsia-500" /> LVL {level}
              </span>
              <span>•</span>
              <span className="text-sky-700">{profile.xp} XP</span>
              <span>•</span>
              <span className="inline-flex items-center gap-2 text-orange-600">
                <Flame size={14} /> {profile.streak} streak
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Recorde</span>
            <span className="text-2xl font-black text-sky-700">{bestWpm} <span className="text-xs">WPM</span></span>
          </div>

          <button
            onClick={() => setProfile((p) => ({ ...p, sound: !p.sound }))}
            className="hidden sm:flex items-center gap-3 bg-white/70 backdrop-blur-md border border-sky-200 px-4 py-3 rounded-2xl shadow-lg hover:bg-white transition"
            title="Som"
          >
            {profile.sound ? <Volume2 className="text-sky-600" size={20} /> : <VolumeX className="text-slate-500" size={20} />}
            <span className="text-xs font-black uppercase tracking-widest text-slate-600">Som</span>
          </button>

          <div className="flex items-center gap-3 bg-white/75 backdrop-blur-md border border-amber-200 px-6 py-3 rounded-2xl shadow-lg">
            <Trophy className="text-amber-500" size={24} />
            <span className="font-black text-xl">{stats.completedLessons.length}</span>
          </div>
        </div>
      </header>

      {view === 'home' ? (
        <main className="w-full max-w-6xl space-y-12 z-10">
          {/* Welcome */}
          <section className="text-center space-y-6 py-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-sky-200 text-sky-700 text-xs font-black uppercase tracking-widest mb-4">
              <Sparkles size={14} /> Missões rápidas • Treino de dedos • Jogos
            </div>
            <h2 className="text-5xl md:text-7xl font-black max-w-4xl mx-auto leading-[1.1] tracking-tight">
              Digite com as <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-fuchsia-500 to-emerald-500 animate-gradient">2 mãos</span>
            </h2>
            <p className="text-slate-600 text-xl max-w-2xl mx-auto font-medium">
              Sessões curtinhas, metas claras e treino inteligente que foca exatamente no que você precisa.
            </p>

            {/* Theme picker */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {THEMES.map((t) => {
                const active = profile.theme === t;
                return (
                  <button
                    key={t}
                    onClick={() => setProfile((p) => ({ ...p, theme: t }))}
                    className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition
                      ${active ? 'bg-fuchsia-100 border-fuchsia-300 text-fuchsia-700' : 'bg-white/70 border-sky-200 text-slate-600 hover:text-slate-900 hover:border-sky-400'}`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Lessons Grid */}
          <section>
            <div className="flex items-center gap-4 mb-10">
              <div className="h-px flex-grow bg-sky-200"></div>
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Selecione sua Missão</h3>
              <div className="h-px flex-grow bg-sky-200"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {lessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  isCompleted={stats.completedLessons.includes(lesson.id)}
                  onSelect={openLessonIntro}
                />
              ))}
            </div>
          </section>

          {/* Stats */}
          {stats.wpm.length > 0 && (
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <StatsBoard wpmHistory={stats.wpm} />
              </div>
              <div className="bg-gradient-to-br from-indigo-100/80 to-white p-10 rounded-[2.5rem] border border-indigo-200 shadow-xl flex flex-col justify-center items-center text-center group">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <BrainCircuit className="text-indigo-600 w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black mb-4">Treino Inteligente</h3>
                <p className="text-slate-600 text-lg leading-relaxed">
                  O modo <span className="text-amber-600 font-black">Missão Inteligente</span> aprende com seus erros e cria exercícios sob medida.
                </p>
              </div>
            </section>
          )}
        </main>
      ) : (
        <main className="w-full max-w-5xl flex flex-col items-center z-10 animate-in fade-in zoom-in-95 duration-300">
          {/* Hidden input = foco e compatibilidade */}
          <input
            ref={inputRef}
            className="sr-only tm-focus-ring"
            value=""
            onChange={() => null}
            onKeyDown={handleKeyDown}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />

          {/* Top bar */}
          <div className="w-full flex justify-between items-center mb-6">
            <button
              onClick={() => setView('home')}
              className="flex items-center gap-3 text-slate-600 hover:text-slate-900 transition-all font-black text-xs uppercase tracking-widest group"
            >
              <div className="p-2 rounded-xl bg-white group-hover:bg-sky-50 border border-sky-200">
                <ArrowLeft size={18} />
              </div>
              Sair
            </button>

            <div className="flex gap-6">
              <div className="bg-white/75 px-6 py-3 rounded-2xl border border-sky-200 flex flex-col items-center min-w-[100px] shadow-sm">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Velocidade</span>
                <span className="text-3xl font-mono font-black text-sky-700">{calculateWPM()}</span>
              </div>
              <div className="bg-white/75 px-6 py-3 rounded-2xl border border-emerald-200 flex flex-col items-center min-w-[100px] shadow-sm">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Precisão</span>
                <span className="text-3xl font-mono font-black text-emerald-600">{calculateAccuracy()}%</span>
              </div>
            </div>
          </div>

          {/* HUD */}
          <div className="w-full mb-6">
            <MissionHUD
              level={level}
              xp={profile.xp}
              streak={profile.streak}
              timeLimitSec={session.timeLimitSec}
              elapsedSec={elapsedSec}
              minAccuracy={currentLesson?.minAccuracy}
              minWpm={currentLesson?.minWpm}
              leftKeys={session.leftKeys}
              rightKeys={session.rightKeys}
            />
          </div>

          {/* Coach */}
          {!session.isFinished && (
            <div className="w-full mb-6" onClick={() => inputRef.current?.focus()}>
              <FingerCoach nextChar={session.targetText[session.userInput.length] || ''} focusKeys={focusKeys} />
            </div>
          )}

          {aiNotice && (
            <div className="w-full mb-6 rounded-2xl border border-amber-300/60 bg-amber-100/80 px-5 py-3 text-center text-xs font-black uppercase tracking-wider text-amber-800">
              {aiNotice}
            </div>
          )}

          {/* Typing Area */}
          <div
            className={`w-full bg-white/80 backdrop-blur-2xl rounded-[3rem] p-8 md:p-14 mb-10 border border-sky-200/80 shadow-[0_30px_100px_-20px_rgba(14,116,144,0.2)] relative overflow-hidden group cursor-text ${!session.isFinished ? 'tm-glow' : ''}`}
            onClick={() => inputRef.current?.focus()}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-50"></div>

            {floatingXp !== null && (
                <div className="absolute right-6 top-6 tm-float text-2xl font-black text-amber-600 drop-shadow-[0_0_15px_rgba(251,191,36,0.35)]">
                  +{floatingXp} XP
                </div>
              )}

              {isLoading && (
                <div className="absolute inset-0 bg-white/85 flex items-center justify-center z-20 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                      <Loader2 className="w-16 h-16 text-sky-500 animate-spin" />
                      <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-fuchsia-500" size={24} />
                    </div>
                    <span className="font-black text-xl text-sky-600 tracking-widest uppercase animate-pulse">Gerando Desafio...</span>
                  </div>
                </div>
              )}

            <div className="font-mono text-3xl md:text-4xl leading-relaxed tracking-wider text-slate-500 outline-none select-none text-center">
              {session.targetText.split('').map((char, i) => {
                let cls = 'text-slate-400';
                let deco = '';
                if (i < session.userInput.length) {
                  cls = session.userInput[i] === char ? 'text-slate-900' : 'text-rose-700 bg-rose-200/60 rounded px-1';
                } else if (i === session.userInput.length) {
                  cls = 'text-sky-700';
                  deco = 'border-b-4 border-sky-500 shadow-[0_4px_15px_rgba(14,165,233,0.35)]';
                }
                return (
                  <span key={i} className={`${cls} ${deco} transition-all duration-75`}>
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                );
              })}
            </div>

            {session.isFinished && runResult && (
              <div className="mt-10 pt-10 border-t border-sky-100 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-500 relative">
                {confetti.map((c, idx) => (
                  <div
                    key={idx}
                    className="tm-confetti"
                    style={{
                      left: `${c.left}%`,
                      animationDelay: `${c.delay}s`,
                      background: `hsl(${c.hue} 90% 60%)`,
                    }}
                  />
                ))}

                <div className="p-8 bg-gradient-to-br from-sky-100/80 to-fuchsia-100/70 border-2 border-sky-300/60 rounded-[2rem] max-w-xl w-full text-center shadow-xl">
                  <p className="text-sky-700 font-black uppercase tracking-[0.3em] text-xs mb-3">
                    {runResult.success ? 'MISSÃO CONCLUÍDA' : 'QUASE! TENTA DE NOVO'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 mb-5">
                    <span className="px-4 py-2 rounded-full bg-white/85 border border-sky-200 text-slate-800 font-black">{runResult.wpm} WPM</span>
                    <span className="px-4 py-2 rounded-full bg-white/85 border border-emerald-200 text-slate-800 font-black">{runResult.accuracy}%</span>
                    <span className="px-4 py-2 rounded-full bg-amber-100/80 border border-amber-300 text-amber-700 font-black">+{runResult.xp} XP</span>
                  </div>

                  <p className="text-2xl font-bold italic text-slate-800 leading-snug">"{aiFeedback || 'Buscando conselhos...'}"</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    onClick={() => openLessonIntro(currentLesson!)}
                    className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-10 py-4 rounded-2xl font-black text-lg transition-all transform hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(37,99,235,0.4)]"
                  >
                    <RefreshCcw size={22} /> Repetir
                  </button>

                  <button
                    onClick={() => {
                      const adaptive = lessons.find((l) => l.type === LessonType.ADAPTIVE);
                      if (adaptive) openLessonIntro(adaptive);
                    }}
                    className="flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white px-10 py-4 rounded-2xl font-black text-lg transition-all transform hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(249,115,22,0.35)]"
                  >
                    <Sparkles size={22} /> Próxima (Inteligente)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Keyboard helper */}
          {!session.isFinished && (
            <div className="w-full animate-in fade-in slide-in-from-bottom-12 duration-700">
              <Keyboard activeKey={session.targetText[session.userInput.length] || ''} />
            </div>
          )}
        </main>
      )}

      <LessonIntroModal
        lesson={introLesson}
        open={Boolean(introLesson)}
        isPreparing={isPreparingLesson}
        onClose={closeLessonIntro}
        onStart={beginLessonFromIntro}
      />

      <footer className="mt-auto py-12 text-slate-600 text-[10px] font-black uppercase tracking-[0.5em]">
        &copy; 2024 TypeMaster AI • Missões & Treino de Dedos
      </footer>
    </div>
  );
};

export default App;


