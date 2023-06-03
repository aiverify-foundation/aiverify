import React from 'react';
import { PieChart, Pie, PieLabel, Cell, Legend, ResponsiveContainer } from 'recharts';
import { PolarComponent, BaseCartesianChartProps } from './types/charts';
import { getColor } from './chartUtils';
import { DataKey } from 'recharts/types/util/types.d';


const RADIAN = Math.PI / 180;
export const renderCustomizedPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, percent, index }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent == 0)
    return "";

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {value}
    </text>
  );
};

interface PieProps extends PolarComponent {
  data: any[];
  label?: PieLabel;
  nameKey?: DataKey<any>;
  cx?: number | string;
  cy?: number | string;
  innerRadius?: number | string;
  outerRadius?: number | string;
  startAngle?: number;
  endAngle?: number;
  minAngle?: number;
  paddingAngle?: number;
}

export interface PieChartProps extends BaseCartesianChartProps {
  pies: PieProps[];
}

export default function MyPieChart({ chartProps, pies, legendProps, hideLegend=false }: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart
        {...chartProps}
      >
        {!hideLegend && <Legend {...legendProps} />}
        {pies.map((pie, index) => (
          <Pie key={`pie-${index}`} fill="#8884d8" label isAnimationActive={false} {...pie}>
            {pie.data.map((item, index2) => (
              <Cell key={`cell-${index}-${index2}`} fill={getColor(index2)} />
            ))}
          </Pie>
        ))}
      </PieChart>
    </ResponsiveContainer>
  );
}
