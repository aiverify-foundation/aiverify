import React from 'react';
import { Treemap, ResponsiveContainer } from 'recharts';
import { Colors } from './chartUtils';
import { Props } from 'recharts/types/chart/Treemap';

export const FONT_FAMILY ="Inter";

export const styles = {
  textBlock: {
    width: '100%',
    height: '100%',
    display: 'flex',
  },
  text: {
    color: 'white',
    whitespace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }
}

export function CustomizedContent ({ root, depth, x, y, width, height, index, children, colors, name, hideNonLeaf, nonLeafStyle, leafStyle }: any) {
  if (width <= 10 || height <= 20)
    return null;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: depth < 2 ? colors[Math.floor((index / root.children.length) * 6)] : '#ffffff00',
          stroke: '#fff',
          strokeWidth: 2 / (depth + 1e-10),
          strokeOpacity: 1 / (depth + 1e-10),
        }}
      />
      <switch>
        <foreignObject x={x} y={y} width={width} height={height}>
          <div xmlns="http://www.w3.org/1999/xhtml" style={{ width, height, margin:0, padding:'3px' }}>
          {!children && (
            <div style={{ ...styles.textBlock, justifyContent:'center', alignItems:'center' }}>
              <div style={{ ...styles.text, fontSize:13, ...leafStyle }}>{name}</div>
            </div>
          )}
          {children && !hideNonLeaf && (
            <div style={{ ...styles.textBlock, justifyContent:'flex-start', alignItems:'flex-start' }}>
              <div style={{ ...styles.text, textDecoration:'underline', fontSize:13, ...nonLeafStyle }}>{name}</div>
            </div>
          )}
          </div>
        </foreignObject>
        {!children && (
          <text x={x + width / 2} y={y + height / 2 + 7} textAnchor="middle" fill="#fff" fontSize={13} font-family={FONT_FAMILY}>
            {name}
          </text>
        )}
        {children && !hideNonLeaf && (
          <text x={x + 4} y={y + 18} fill="#fff" fontSize={16} fillOpacity={0.9} font-family={FONT_FAMILY}>
            {name}
          </text>
        )}
      </switch>        
    </g>
  );
}

export interface TreemapProps extends Props {
  colors?: string[];
  leafStyle?: React.CSSProperties;
  hideNonLeaf?: boolean;
  nonLeafStyle?: React.CSSProperties;
}

export default function MyTreemapChart({ data, colors=Colors, hideNonLeaf=false, nonLeafStyle={}, leafStyle={}, ...props }: TreemapProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <Treemap
        data={data}
        isAnimationActive={false}
        content={<CustomizedContent colors={colors} hideNonLeaf={hideNonLeaf} nonLeafStyle={nonLeafStyle} leafStyle={leafStyle} />}
        {...props}
      />
    </ResponsiveContainer>
  );
}
