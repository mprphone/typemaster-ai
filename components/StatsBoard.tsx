import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StatsBoardProps {
  wpmHistory: number[];
}

const StatsBoard: React.FC<StatsBoardProps> = ({ wpmHistory }) => {
  const data = wpmHistory.map((wpm, index) => ({
    name: `Pratica ${index + 1}`,
    wpm,
  }));

  return (
    <div className="bg-white/80 p-6 rounded-2xl border border-sky-200 shadow-lg mt-8">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
        <span className="w-2 h-2 rounded-full bg-sky-500"></span>
        Evolucao de Velocidade (WPM)
      </h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" vertical={false} />
            <XAxis dataKey="name" hide={true} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #bae6fd', borderRadius: '10px' }}
              labelStyle={{ color: '#64748b' }}
            />
            <Line
              type="monotone"
              dataKey="wpm"
              stroke="#0284c7"
              strokeWidth={3}
              dot={{ fill: '#0ea5e9', r: 4 }}
              activeDot={{ r: 6, fill: '#38bdf8' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatsBoard;
