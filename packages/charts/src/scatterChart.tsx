import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { BaseCartesianChartProps } from './types/charts';
import { getColor } from './chartUtils';

interface ScatterProps {
  data: any[];
  points?: any,
  lineType?: 'fitting' | 'joint';
  legendType?: 'line' | 'plainline' | 'square' | 'rect'| 'circle' | 'cross' | 'diamond' | 'square' | 'star' | 'triangle' | 'wye' | 'none';
  xAxisId?: string | number;
  yAxisId?: string | number;
  zAxisId?: string | number;
}

export interface ScatterChartProps extends BaseCartesianChartProps {
  scatters: ScatterProps[];
}

export default function MyScatterChart({ data, xAxisDataKey, chartProps, scatters, xAxisProps, yAxisProps, legendProps }: ScatterChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart
        data={data}
        {...chartProps}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" dataKey="x" {...xAxisProps} />
        <YAxis type="number" dataKey="y" { ...yAxisProps } />
        {scatters.map((scatter, index) => (
          <Scatter label key={`scatter-${index}`} fill={getColor(index)} isAnimationActive={false} {...scatter} />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
