import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { CartesianComponent, BaseCartesianChartProps } from './types/charts';
import { getColor } from './chartUtils';

export interface BarChartProps extends BaseCartesianChartProps {
  bars: CartesianComponent[];
}

export default function MyBarChart({ data, xAxisDataKey, chartProps, bars, xAxisProps, yAxisProps, legendProps, hideLegend=false }: BarChartProps) {
  if (chartProps && chartProps.layout && chartProps.layout === "vertical") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          {...chartProps}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <YAxis type="category" dataKey={xAxisDataKey} {...yAxisProps} />
          <XAxis type="number" { ...xAxisProps } />
          {!hideLegend && <Legend {...legendProps} />}
          {bars.map((bar, index) => (
            <Bar key={`bar-${index}`} fill={getColor(index)} isAnimationActive={false} {...bar} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  } else {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          {...chartProps}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisDataKey} {...xAxisProps} />
          <YAxis { ...yAxisProps } />
          {!hideLegend && <Legend {...legendProps} />}
          {bars.map((bar, index) => (
            <Bar key={`bar-${index}`} fill={getColor(index)} isAnimationActive={false}  {...bar} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }
}
