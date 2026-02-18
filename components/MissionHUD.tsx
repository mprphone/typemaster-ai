import React from 'react';
import { Flame, Gauge, ShieldCheck, Timer, Zap } from 'lucide-react';

interface MissionHUDProps {
  level: number;
  xp: number;
  streak: number;
  timeLimitSec?: number;
  elapsedSec: number;
  minAccuracy?: number;
  minWpm?: number;
  leftKeys: number;
  rightKeys: number;
}

const chip = 'inline-flex items-center gap-2 px-3 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest';

export default function MissionHUD({
  level,
  xp,
  streak,
  timeLimitSec,
  elapsedSec,
  minAccuracy,
  minWpm,
  leftKeys,
  rightKeys,
}: MissionHUDProps) {
  const remaining = timeLimitSec ? Math.max(0, timeLimitSec - elapsedSec) : null;
  const totalHand = leftKeys + rightKeys;
  const leftPct = totalHand ? Math.round((leftKeys / totalHand) * 100) : 50;
  const rightPct = 100 - leftPct;

  return (
    <div className="w-full bg-white/80 backdrop-blur-xl border border-sky-200/80 rounded-3xl p-5 md:p-6 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-100 to-fuchsia-100 border border-sky-200 flex items-center justify-center">
            <Zap className="text-sky-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.25em]">Perfil</span>
            <div className="flex items-center gap-3">
              <span className="text-xl font-black">LVL {level}</span>
              <span className="text-slate-400 font-black">•</span>
              <span className="text-sky-700 font-black">{xp} XP</span>
              <span className="text-slate-400 font-black">•</span>
              <span className="inline-flex items-center gap-2 text-orange-600 font-black">
                <Flame size={16} /> {streak} streak
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-start md:justify-end">
          {typeof remaining === 'number' && (
            <span className={`${chip} border-fuchsia-300 bg-fuchsia-100 text-fuchsia-700`}>
              <Timer size={14} /> {remaining}s
            </span>
          )}
          {minWpm ? (
            <span className={`${chip} border-sky-300 bg-sky-100 text-sky-700`}>
              <Gauge size={14} /> meta {minWpm} wpm
            </span>
          ) : null}
          {minAccuracy ? (
            <span className={`${chip} border-emerald-300 bg-emerald-100 text-emerald-700`}>
              <ShieldCheck size={14} /> meta {minAccuracy}%
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2">
          <span>Equilibrio das maos</span>
          <span className="text-slate-600">
            {leftPct}% esquerda • {rightPct}% direita
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-sky-50 border border-sky-100 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-sky-500 to-cyan-400" style={{ width: `${leftPct}%` }} />
        </div>
      </div>
    </div>
  );
}
