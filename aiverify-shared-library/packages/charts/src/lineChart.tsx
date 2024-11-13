import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { CartesianComponent, BaseCartesianChartProps } from './types/charts';
import { getColor } from './chartUtils';

export interface LineChartProps extends BaseCartesianChartProps {
  lines: CartesianComponent[];
}

export default function MyLineChart({ data, xAxisDataKey, chartProps, lines, xAxisProps, yAxisProps, legendProps, hideLegend=false }: LineChartProps) {
  if (chartProps && chartProps.layout && chartProps.layout === "vertical") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          {...chartProps}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <YAxis type="category" dataKey={xAxisDataKey} {...yAxisProps} />
          <XAxis type="number" { ...xAxisProps } />
          {!hideLegend && <Legend {...legendProps} />}
          {lines.map((bar, index) => (
            <Line key={`line-${index}`} type="monotone" stroke={getColor(index)} isAnimationActive={false} {...bar} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  } else {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          {...chartProps}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisDataKey} {...xAxisProps} />
          <YAxis { ...yAxisProps } />
          <Legend {...legendProps} />
          {lines.map((bar, index) => (
            <Line key={`line-${index}`} type="monotone" stroke={getColor(index)} isAnimationActive={false} {...bar} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }
}
