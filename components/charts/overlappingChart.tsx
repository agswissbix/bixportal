'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Legend
} from 'recharts';

interface OverlappingBarChartProps {
  data: { name: string; target: number; actual: number }[];
  colors?: string[];
  formatter?: (value: number) => string;
  showDataLabels?: boolean;
  hideMeta?: boolean;
  seriesNames?: [string, string];
}

const OverlappingBarChart = ({ 
  data, 
  colors, 
  formatter = (v) => v.toString(), 
  showDataLabels = true, 
  hideMeta = false,
  seriesNames = ['Target', 'Actual']
}: OverlappingBarChartProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const targetColor = colors?.[0] || '#14b8a6';
  const actualColor = colors?.[1] || '#334155';

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
        >
          <CartesianGrid stroke="#d1d5db" vertical={false} strokeOpacity={1} strokeWidth={1} />
          {!hideMeta && <XAxis xAxisId="0" dataKey="name" axisLine={false} tickLine={false} />}
          <XAxis xAxisId="1" dataKey="name" axisLine={false} tickLine={false} hide />
          {!hideMeta && (
            <YAxis 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={formatter}
            />
          )}
          {!hideMeta && (
            <Tooltip 
                cursor={{ fill: 'transparent' }} 
                formatter={(value: number, name: string) => [formatter(value), name]}
            />
          )}
          {!hideMeta && (
            <Legend 
              verticalAlign="bottom" 
              align="center"
              content={(props) => {
                const { payload } = props;
                return (
                  <ul style={{ display: 'flex', justifyContent: 'center', listStyle: 'none', padding: 0, paddingTop: '10px', gap: '20px', margin: 0 }}>
                    {payload?.map((entry: any, index: number) => (
                      <li key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', color: 'black' }}>
                         <div style={{ width: 12, height: 12, backgroundColor: entry.color, marginRight: 8 }} />
                         <span style={{ color: 'black', fontWeight: 600, fontSize: '12px' }}>{entry.value}</span>
                      </li>
                    ))}
                  </ul>
                );
              }}
            />
          )}
          
          {/* Barra Target (Sfondo - più larga) */}
          <Bar 
            name={seriesNames[0]}
            xAxisId="0" 
            dataKey="target" 
            fill={targetColor} 
            barSize={50} 
            radius={[2, 2, 0, 0]}
          >
            {showDataLabels && !hideMeta && (
              <LabelList 
                dataKey="target" 
                position="top" 
                style={{ fill: targetColor, fontSize: '10px', fontWeight: 600 }} 
                formatter={formatter}
              />
            )}
          </Bar>

          {/* Barra Actual (Primo piano - più stretta) */}
          <Bar 
            name={seriesNames[1]}
            xAxisId="1" 
            dataKey="actual" 
            fill={actualColor} 
            barSize={30} 
            radius={[2, 2, 0, 0]}
          >
            {showDataLabels && !hideMeta && (
              <LabelList 
                dataKey="actual" 
                position="center" 
                style={{ fill: '#fff', fontSize: '10px', fontWeight: 600 }} 
                formatter={formatter}
              />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OverlappingBarChart;