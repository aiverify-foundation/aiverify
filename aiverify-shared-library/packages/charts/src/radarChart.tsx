import React from 'react';
import { RadarChart, Radar, RadarProps, PolarGrid, PolarAngleAxis, PolarAngleAxisProps, PolarRadiusAxis, PolarRadiusAxisProps, Legend, ResponsiveContainer } from 'recharts';
import { BaseCategoryChartProps } from './types/charts';
import { getColor } from './chartUtils';

type RadarProps2 = Omit<RadarProps, 'ref'>;
type PolarAngleAxisProps2 = Omit<PolarAngleAxisProps, 'ref'>;
type PolarRadiusAxisProps2 = Omit<PolarRadiusAxisProps, 'ref'>;

export interface RadarChartProps extends BaseCategoryChartProps {
  radars: RadarProps2[];
  polarAngleAxis?: PolarAngleAxisProps2;
  polarRadiusAxis?: PolarRadiusAxisProps2;
}

export default function MyPieChart({ radars, data, chartProps, legendProps, hideLegend=false, polarAngleAxis, polarRadiusAxis }: RadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data} {...chartProps}>
        <PolarGrid />
        <PolarAngleAxis {...polarAngleAxis} />
        <PolarRadiusAxis {...polarRadiusAxis} />
        {!hideLegend && <Legend {...legendProps} />}
        {radars.map((radar, index) => (
          <Radar key={`radar-${index}`} fill={getColor(index)} stroke={getColor(index)} fillOpacity={0.6} isAnimationActive={false} {...radar} />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  );
}
