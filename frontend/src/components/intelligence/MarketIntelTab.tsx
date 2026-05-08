"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const commercialData = [
  { indication: 'Rheumatoid Arthritis', tamBillions: 62.9, cagrPercent: 5.3, marketStage: 'Mature', competitorCount: 14, score: 72 },
  { indication: 'Lupus Erythematosus', tamBillions: 3.2, cagrPercent: 8.1, marketStage: 'Growth', competitorCount: 4, score: 85 },
];

export function MarketIntelTab() {
  return (
    <div className="flex flex-col h-full gap-6">
      {/* Chart */}
      <div className="shrink-0 border border-[#252830] bg-[#13161B] rounded-lg p-4">
        <p className="text-[11px] font-medium tracking-widest text-[#4A5060] uppercase mb-4">
          Market Size & Growth Projection
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={commercialData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid 
              strokeDasharray="0" 
              stroke="#252830" 
              vertical={false} 
            />
            <XAxis 
              dataKey="indication" 
              tick={{ fill: '#4A5060', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: '#252830' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: '#4A5060', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}B`}
            />
            <Tooltip
              contentStyle={{
                background: '#1A1D24',
                border: '1px solid #252830',
                borderRadius: 8,
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                color: '#E8E9EB'
              }}
              itemStyle={{ color: '#E8E9EB' }}
              cursor={{ fill: '#1A1D24' }}
            />
            <Bar dataKey="tamBillions" name="TAM ($B)" fill="#2563EB" radius={[3, 3, 0, 0]} maxBarSize={32} />
            <Bar dataKey="cagrPercent" name="CAGR (%)" fill="#1A4030" radius={[3, 3, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto border border-[#252830] bg-[#13161B] rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#252830]">
              <th className="p-3 text-[11px] uppercase tracking-widest text-[#4A5060] font-medium">Indication</th>
              <th className="p-3 text-[11px] uppercase tracking-widest text-[#4A5060] font-medium">TAM</th>
              <th className="p-3 text-[11px] uppercase tracking-widest text-[#4A5060] font-medium">CAGR</th>
              <th className="p-3 text-[11px] uppercase tracking-widest text-[#4A5060] font-medium">Stage</th>
              <th className="p-3 text-[11px] uppercase tracking-widest text-[#4A5060] font-medium text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {commercialData.map((row, i) => (
              <tr key={i} className="border-b border-[#1A1D24] hover:bg-[#1A1D24] transition-colors group">
                <td className="p-3 text-[12px] text-[#E8E9EB]">{row.indication}</td>
                <td className="p-3 text-[12px] font-mono text-[#E8E9EB]">${row.tamBillions}B</td>
                <td className="p-3 text-[12px] font-mono text-[#3A9E6F]">+{row.cagrPercent}%</td>
                <td className="p-3 text-[12px] text-[#8A8F9A]">{row.marketStage}</td>
                <td className="p-3 text-[12px] font-mono text-[#2563EB] text-right font-medium">{row.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
