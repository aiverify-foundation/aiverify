import React from 'react';
import {
  GlobalVariable,
  LayoutItemProperties,
  ProjectInformation,
} from 'src/types/projectTemplate.interface';

export const getItemLayoutProperties = (
  itemLayout: LayoutItemProperties,
  canvas = false
): React.CSSProperties => {
  const getTranslateAlignItems = () => {
    switch (itemLayout.alignItems) {
      case 'center':
        return 'center';
      case 'top':
        return 'flex-start';
      case 'bottom':
        return 'flex-end';
      default:
        return undefined;
    }
  };

  let backgroundColor =
    itemLayout.bgcolor && itemLayout.bgcolor.length > 0
      ? itemLayout.bgcolor
      : undefined;
  const color =
    itemLayout.color && itemLayout.color.length > 0
      ? itemLayout.color
      : undefined;
  let border = null;
  let borderColor = null;

  if (canvas) {
    if (!backgroundColor) backgroundColor = 'white';
    if (!border) border = '1px solid';
    if (!borderColor) borderColor = 'black';
  }

  const result: React.CSSProperties = {
    justifyContent: itemLayout.justifyContent
      ? itemLayout.justifyContent
      : 'left',
    alignItems: getTranslateAlignItems(),
    textAlign: itemLayout.textAlign
      ? (itemLayout.textAlign as 'left' | 'right' | 'center')
      : 'left',
    backgroundColor,
    color,
  };

  return result;
};

export type WidgetProperties = {
  combinedGlobalVars: GlobalVariable[];
  getProperty: (prop: string) => string;
};

export type WidgetPropertiesProp = {
  projectInfo: ProjectInformation;
  globalVars: GlobalVariable[];
};

export function useWidgetProperties({
  globalVars,
}: WidgetPropertiesProp): WidgetProperties {
  const combinedGlobalVars = globalVars;
  const getProperty = (prop: string) => {
    const match = prop.match(/^\{(.+)\}$/);
    if (match) {
      const found = globalVars.find((e) => e.key === match[1]);
      if (found) return found.value;
      else return prop;
    } else {
      return prop;
    }
  };

  return {
    combinedGlobalVars,
    getProperty,
  };
}
