import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { CartesianComponent, BaseCartesianChartProps } from './types/charts';
import { getColor } from './chartUtils';

export interface AreaChartProps extends BaseCartesianChartProps {
  areas: CartesianComponent[];
}

export default function MyAreaChart({ data, xAxisDataKey, chartProps, areas, xAxisProps, yAxisProps, legendProps, hideLegend=false }: AreaChartProps) {
  if (chartProps && chartProps.layout && chartProps.layout === "vertical") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          {...chartProps}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <YAxis type="category" dataKey={xAxisDataKey} {...yAxisProps} />
          <XAxis type="number" { ...xAxisProps } />
          {!hideLegend && <Legend {...legendProps} />}
          {areas.map((bar, index) => (
            <Area key={`bar-${index}`} type="monotone" fill={getColor(index)} isAnimationActive={false} {...bar} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  } else {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          {...chartProps}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisDataKey} {...xAxisProps} />
          <YAxis { ...yAxisProps } />
          <Legend {...legendProps} />
          {areas.map((bar, index) => (
            <Area key={`bar-${index}`} type="monotone" fill={getColor(index)} isAnimationActive={false} {...bar} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }
}
