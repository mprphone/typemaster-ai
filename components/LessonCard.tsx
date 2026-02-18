import React from 'react';
import { Lesson } from '../types';
import { Play, CheckCircle, Flame } from 'lucide-react';

interface LessonCardProps {
  lesson: Lesson;
  isCompleted: boolean;
  onSelect: (lesson: Lesson) => void;
}

const LessonCard: React.FC<LessonCardProps> = ({ lesson, isCompleted, onSelect }) => {
  const getGradient = (level: number) => {
    const gradients = [
      'from-sky-400 to-cyan-500',
      'from-fuchsia-400 to-indigo-500',
      'from-rose-400 to-orange-500',
      'from-amber-300 to-orange-400',
    ];
    return gradients[(level - 1) % gradients.length];
  };

  return (
    <button
      onClick={() => onSelect(lesson)}
      className={`group relative flex flex-col p-6 rounded-3xl text-left transition-all duration-300 transform hover:-translate-y-2 hover:rotate-1
        bg-white/85 border-2 ${isCompleted ? 'border-emerald-400/70' : 'border-sky-200'}
        shadow-[0_12px_32px_-16px_rgba(14,116,144,0.45)] overflow-hidden
      `}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${getGradient(lesson.level)} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity`}></div>

      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-2xl bg-gradient-to-br ${getGradient(lesson.level)} shadow-lg text-white`}>
          <span className="font-black text-xl">LVL {lesson.level}</span>
        </div>
        {isCompleted ? (
          <div className="bg-emerald-500 rounded-full p-1 shadow-[0_0_15px_rgba(16,185,129,0.35)]">
            <CheckCircle className="text-white w-5 h-5" />
          </div>
        ) : (
          <Flame className="text-slate-400 group-hover:text-orange-500 transition-colors" size={24} />
        )}
      </div>

      <h3 className="text-2xl font-black mb-2 text-slate-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-sky-700 group-hover:to-fuchsia-700 transition-all">
        {lesson.title}
      </h3>
      <p className="text-slate-600 text-sm mb-8 leading-relaxed font-medium">{lesson.description}</p>

      <div className="mt-auto flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Iniciar Missao</span>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-sky-100 group-hover:bg-gradient-to-br ${getGradient(lesson.level)} text-sky-700 group-hover:text-white transition-all shadow-inner`}>
          <Play size={16} fill="currentColor" />
        </div>
      </div>
    </button>
  );
};

export default LessonCard;
