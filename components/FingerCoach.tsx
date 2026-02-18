import React from 'react';
import { inferFingerForChar, FINGER_LABEL_PT, FingerId } from '../utils/exercises';
import { Hand, KeyRound } from 'lucide-react';

interface FingerCoachProps {
  nextChar: string;
  focusKeys?: string[];
}

const chipClass = 'px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border';

export default function FingerCoach({ nextChar, focusKeys = [] }: FingerCoachProps) {
  const finger = inferFingerForChar(nextChar) as FingerId | null;

  const label = finger ? FINGER_LABEL_PT[finger] : 'Qualquer dedo';
  const keyLabel = nextChar === ' ' ? 'Espaco' : nextChar;

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white/75 backdrop-blur-xl border border-fuchsia-200 rounded-3xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-100 to-fuchsia-100 border border-rose-200 flex items-center justify-center">
          <Hand className="text-fuchsia-600" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.25em]">Use o dedo</span>
          <span className="text-lg font-black text-slate-900">{label}</span>
        </div>
      </div>

      <div className="bg-white/75 backdrop-blur-xl border border-sky-200 rounded-3xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-100 to-sky-100 border border-cyan-200 flex items-center justify-center">
          <KeyRound className="text-sky-600" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.25em]">Proxima tecla</span>
          <span className="text-lg font-black text-slate-900">
            <span className="inline-flex items-center justify-center min-w-[44px] px-3 py-1 rounded-2xl bg-white border border-sky-200 font-mono">
              {keyLabel}
            </span>
          </span>
        </div>
      </div>

      <div className="bg-white/75 backdrop-blur-xl border border-amber-200 rounded-3xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.25em]">Foco do treino</span>
          {focusKeys.length > 0 && <span className={`${chipClass} border-amber-300 text-amber-700 bg-amber-100`}>adaptativo</span>}
        </div>
        {focusKeys.length ? (
          <div className="flex flex-wrap gap-2">
            {focusKeys.slice(0, 6).map((k) => (
              <span key={k} className="px-3 py-1.5 rounded-2xl bg-white border border-sky-200 text-slate-800 font-mono font-black">
                {k === ' ' ? '[]' : k}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-slate-600 text-sm leading-relaxed">
            Dica rapida: mantenha os indicadores em <span className="font-mono text-slate-900">F</span> e{' '}
            <span className="font-mono text-slate-900">J</span>.
          </p>
        )}
      </div>
    </div>
  );
}
