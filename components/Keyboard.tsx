import React from 'react';
import { KEYBOARD_LAYOUT, FINGER_MAP } from '../constants';

interface KeyboardProps {
  activeKey: string;
}

const Keyboard: React.FC<KeyboardProps> = ({ activeKey }) => {
  const getFingerStyle = (key: string) => {
    const finger = FINGER_MAP[key === ' ' ? 'Espaço' : key.toLowerCase()];
    if (!finger) return 'border-slate-200 text-slate-400';

    if (finger.includes('pinky')) return 'border-rose-300 text-rose-500';
    if (finger.includes('ring')) return 'border-cyan-300 text-cyan-600';
    if (finger.includes('middle')) return 'border-emerald-300 text-emerald-600';
    if (finger.includes('index')) return 'border-amber-300 text-amber-600';
    if (finger.includes('thumb')) return 'border-fuchsia-300 text-fuchsia-600';
    return 'border-slate-200 text-slate-400';
  };

  const getActiveStyle = (key: string) => {
    const finger = FINGER_MAP[key === ' ' ? 'Espaço' : key.toLowerCase()];
    if (finger?.includes('pinky')) return 'bg-rose-400 shadow-[0_0_16px_rgba(251,113,133,0.45)]';
    if (finger?.includes('ring')) return 'bg-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.45)]';
    if (finger?.includes('middle')) return 'bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.45)]';
    if (finger?.includes('index')) return 'bg-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.45)]';
    if (finger?.includes('thumb')) return 'bg-fuchsia-400 shadow-[0_0_16px_rgba(232,121,249,0.45)]';
    return 'bg-sky-500 shadow-[0_0_16px_rgba(14,165,233,0.45)]';
  };

  return (
    <div className="flex flex-col gap-2.5 p-8 bg-white/75 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_50px_rgba(14,116,144,0.2)] border border-sky-200/70">
      {KEYBOARD_LAYOUT.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-2">
          {row.map((key, keyIndex) => {
            const isPressed = activeKey.toLowerCase() === key.toLowerCase() || (activeKey === ' ' && key === 'Espaço');

            return (
              <div
                key={keyIndex}
                className={`
                  flex items-center justify-center rounded-xl font-mono text-sm font-bold transition-all duration-100
                  ${key === 'Espaço' ? 'w-72 h-14' : 'w-12 h-14'}
                  ${
                    isPressed
                      ? `${getActiveStyle(key)} text-white scale-90`
                      : `bg-white ${getFingerStyle(key)} border-b-4 border-sky-100 hover:bg-sky-50`
                  }
                  border-2
                `}
              >
                {key === 'Espaço' ? '' : key}
              </div>
            );
          })}
        </div>
      ))}
      <div className="flex justify-center mt-8 gap-6 px-4 py-3 bg-white rounded-2xl border border-sky-200 text-[10px] uppercase tracking-tighter font-black">
        <div className="flex items-center gap-2 text-rose-500">
          <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></div> Mindinho
        </div>
        <div className="flex items-center gap-2 text-cyan-600">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div> Anelar
        </div>
        <div className="flex items-center gap-2 text-emerald-600">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div> Medio
        </div>
        <div className="flex items-center gap-2 text-amber-600">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div> Indicador
        </div>
        <div className="flex items-center gap-2 text-fuchsia-600">
          <div className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse"></div> Polegar
        </div>
      </div>
    </div>
  );
};

export default Keyboard;

