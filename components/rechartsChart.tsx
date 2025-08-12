import React from 'react';
import {
  ComposedChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { place: 'Lugano', year: 2024, value: 100 },
  { place: 'Lugano', year: 2025, value: 300 },
  { place: 'Ascona', year: 2025, value: 150 },
  { place: 'Locarno', year: 2024, value: 220 },
  { place: 'Bellinzona', year: 2024, value: 180 },
  { place: 'Ascona', year: 2024, value: 130 },
];

const placeColors: Record<string, string> = {
  Lugano: '#1f77b4',
  Ascona: '#ff7f0e',
  Locarno: '#2ca02c',
  Bellinzona: '#d62728',
};

const placeStats: Record<
  string,
  { sum: number; count: number }
> = {};

data.forEach(({ place, value }) => {
  if (!placeStats[place]) placeStats[place] = { sum: 0, count: 0 };
  placeStats[place].sum += value;
  placeStats[place].count += 1;
});

const placeAverages = Object.entries(placeStats).map(([place, stats]) => ({
  place,
  average: stats.sum / stats.count,
  color: placeColors[place] || '#000',
}));

export default function GroupedBarWithAveragesRecharts() {
  const formattedData = data.map((d) => ({
    label: `${d.place} - ${d.year}`,
    value: d.value,
    place: d.place,
  }));

  return (
    <div className="bg-white p-4 rounded shadow">
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart
          data={formattedData}
          margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
        >
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip
            formatter={(val: number) => `€ ${val.toLocaleString()}`}
          />
          <Legend />

          <Bar dataKey="value" isAnimationActive={true}>
            {formattedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={(placeColors[entry.place] || '#888') + '80'}
              />
            ))}
          </Bar>

          {placeAverages.map(({ place, average, color }) => (
            <ReferenceLine
              key={place}
              y={average}
              stroke={color}
              strokeWidth={2}
              label={{
                value: `Media ${place}: €${average.toFixed(0)}`,
                position: 'right',
                fill: color,
                fontSize: 12,
              }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
