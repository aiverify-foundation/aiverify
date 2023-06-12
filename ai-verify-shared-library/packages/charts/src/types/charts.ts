import { LegendType } from 'recharts';
import { CategoricalChartProps } from 'recharts/types/chart/generateCategoricalChart.d';
import { ImplicitLabelType } from 'recharts/types/component/Label.d';
import * as XAxisProps from 'recharts/types/cartesian/XAxis.d';
import * as YAxisProps from 'recharts/types/cartesian/YAxis.d';
import { DataKey, LayoutType } from 'recharts/types/util/types.d';
import { HorizontalAlignmentType, VerticalAlignmentType, IconType, Formatter } from 'recharts/types/component/DefaultLegendContent.d';

export interface PolarComponent {
  dataKey: DataKey<any>;
  // name?: string;
  // label?: ImplicitLabelType;
  fill?: string;
  legendType?: LegendType;
}

export interface CartesianComponent {
  dataKey: DataKey<any>;
  name?: string;
  label?: ImplicitLabelType;
  fill?: string;
  stackId?: string|number;
  legendType?: LegendType;
}

export interface LegendProps {
  layout: LayoutType;
  align: HorizontalAlignmentType,
  verticalAlign: VerticalAlignmentType;
  iconType: IconType;
  formatter: Formatter;
}

export interface BaseCartesianChartProps {
  data: any[];
  xAxisDataKey: DataKey<any>;
  chartProps: CategoricalChartProps;
  xAxisProps: XAxisProps.Props;
  yAxisProps: YAxisProps.Props;
  legendProps?: LegendProps;
  hideLegend?: boolean;
}

export interface BaseCategoryChartProps {
  data: any[];
  chartProps: CategoricalChartProps;
  legendProps?: LegendProps;
  hideLegend?: boolean;
}
