import {
  LayoutItemProperties,
  ReportWidgetItem,
} from 'src/types/projectTemplate.interface';
import { UserDefinedProperty } from 'src/types/plugin.interface';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import AlignVerticalTopIcon from '@mui/icons-material/AlignVerticalTop';
import AlignVerticalCenterIcon from '@mui/icons-material/AlignVerticalCenter';
import AlignVerticalBottomIcon from '@mui/icons-material/AlignVerticalBottom';
import WidgetsIcon from '@mui/icons-material/Widgets';
import { IconButton } from 'src/components/iconButton';
import { ColorResult, SketchPicker } from 'react-color';
import styles from './styles/widget-properties.module.css';
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Layout } from 'react-grid-layout';

type WidgetPropertiesPanelProps = {
  reportWidget: ReportWidgetItem | null;
  layout?: Layout;
  onPropertyChange?: (prop: UserDefinedProperty, value: string) => void;
  onVisualStylePropertyChange: (
    prop: keyof LayoutItemProperties,
    value: string
  ) => void;
};

enum ColoringMode {
  FILL,
  FONT,
}

const WIDGET_PANEL_ID = 'aivWidgetPropertiesPanel';
const colorPickerClassName = 'aiv-colorpicker';
const default_FillColor = '#FFFFFF';
const default_FontColor = '#000000';

function WidgetPropertiesPanel(props: WidgetPropertiesPanelProps) {
  const { reportWidget, layout, onVisualStylePropertyChange } = props;
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [coloringMode, setColoringMode] = useState<ColoringMode | undefined>(
    undefined
  );
  const [fillColor, setFillColor] = useState<string>(default_FillColor);
  const [textColor, setTextColor] = useState<string>(default_FontColor);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const colorFillBoxRef = useRef<HTMLDivElement>(null);
  const colorFontBoxRef = useRef<HTMLDivElement>(null);
  const colorPickLeftPos = coloringMode === ColoringMode.FILL ? '20px' : '60px';
  const pickerColor =
    coloringMode === ColoringMode.FILL ? fillColor : textColor;

  function handleFillColorClick() {
    document.addEventListener('click', handleOutsideColorPickerClick);
    setColoringMode(ColoringMode.FILL);
    setShowColorPicker(true);
  }

  function handleFontColorClick() {
    document.addEventListener('click', handleOutsideColorPickerClick);
    setColoringMode(ColoringMode.FONT);
    setShowColorPicker(true);
  }

  function handleColorChange(color: ColorResult) {
    if (coloringMode === ColoringMode.FILL) {
      setFillColor(color.hex);
      onVisualStylePropertyChange('bgcolor', color.hex);
    } else {
      setTextColor(color.hex);
      onVisualStylePropertyChange('color', color.hex);
    }
  }

  function handleAlignmentChange(
    styleProperty: keyof LayoutItemProperties,
    value: string
  ) {
    return function () {
      onVisualStylePropertyChange(styleProperty, value);
    };
  }

  function handleOutsideColorPickerClick(e: Event) {
    let targetEl: HTMLElement | ParentNode | null = e.target as HTMLElement;
    if (colorFillBoxRef.current && targetEl === colorFillBoxRef.current) return;
    if (colorFontBoxRef.current && targetEl === colorFontBoxRef.current) return;
    e.preventDefault();
    do {
      if (targetEl === colorPickerRef.current) return;
      targetEl = targetEl.parentNode;
    } while (targetEl);
    setColoringMode(undefined);
    setShowColorPicker(false);
    document.removeEventListener('click', handleOutsideColorPickerClick);
  }

  useEffect(() => {
    if (reportWidget) {
      setFillColor(
        reportWidget.layoutItemProperties.bgcolor || default_FillColor
      );
      setTextColor(
        reportWidget.layoutItemProperties.color || default_FontColor
      );
      return;
    }
    setFillColor(default_FillColor);
    setTextColor(default_FontColor);
  }, [reportWidget]);

  return (
    <div id={WIDGET_PANEL_ID} className={styles.propertiesPanel}>
      <div className={styles.propertiesHeading}>
        <div className={styles.headingContainer}>
          <WidgetsIcon style={{ fontSize: '18px' }} />
          <span style={{ marginLeft: '10px' }}>Widget Properties</span>
        </div>
      </div>
      <div className={styles.propertiesContent}>
        <div
          style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <div className={styles.propertyName}>Layout / Dimension</div>
          <div className={styles.dimension}>
            <div className={styles.dimensionCol}>
              <div>x: {layout ? layout.x : ''}</div>
              <div>y: {layout ? layout.y : ''}</div>
            </div>
            <div className={styles.dimensionCol}>
              <div>W: {layout ? layout.w : ''}</div>
              <div>H: {layout ? layout.h : ''}</div>
            </div>
            <div className={styles.dimensionCol}>
              <div>minW: {layout ? layout.minW : ''}</div>
              <div>minH: {layout ? layout.minH : ''}</div>
            </div>
            <div className={styles.dimensionCol}>
              <div>maxW: {layout ? layout.maxW : ''}</div>
              <div>maxH: {layout ? layout.maxH : ''}</div>
            </div>
          </div>
          <div className={styles.propertyName}>Alignment</div>
          <div
            style={{
              marginBottom: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
            }}>
            <div>
              <IconButton
                iconComponent={FormatAlignLeftIcon}
                style={{ marginRight: '5px' }}
                onClick={handleAlignmentChange('textAlign', 'left')}
              />
              <IconButton
                iconComponent={FormatAlignCenterIcon}
                style={{ marginRight: '5px' }}
                onClick={handleAlignmentChange('textAlign', 'center')}
              />
              <IconButton
                iconComponent={FormatAlignRightIcon}
                onClick={handleAlignmentChange('textAlign', 'right')}
              />
            </div>
            <div>
              <IconButton
                iconComponent={AlignVerticalTopIcon}
                style={{ marginRight: '5px' }}
                onClick={handleAlignmentChange('alignItems', 'top')}
              />
              <IconButton
                iconComponent={AlignVerticalCenterIcon}
                style={{ marginRight: '5px' }}
                onClick={handleAlignmentChange('alignItems', 'center')}
              />
              <IconButton
                iconComponent={AlignVerticalBottomIcon}
                onClick={handleAlignmentChange('alignItems', 'bottom')}
              />
            </div>
          </div>
          <div className={styles.propertyName}>Colors</div>
          <div style={{ display: 'flex', width: '100%', position: 'relative' }}>
            <div
              style={{
                display: 'flex',
                marginRight: '20px',
                alignItems: 'center',
              }}>
              <FormatColorFillIcon
                style={{
                  color: '#676767',
                  fontSize: '20px',
                  marginRight: '8px',
                }}
              />
              <div
                className={styles.colorBox}
                onClick={handleFillColorClick}
                style={{ backgroundColor: fillColor }}
                ref={colorFillBoxRef}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <FormatColorTextIcon
                style={{
                  color: '#676767',
                  fontSize: '20px',
                  marginRight: '8px',
                }}
              />
              <div
                className={styles.colorBox}
                onClick={handleFontColorClick}
                style={{ backgroundColor: textColor }}
                ref={colorFontBoxRef}
              />
            </div>
            {showColorPicker ? (
              <div
                className={clsx(
                  styles.colorPickerWrapper,
                  colorPickerClassName
                )}
                style={{ left: colorPickLeftPos }}
                ref={colorPickerRef}>
                <SketchPicker
                  color={pickerColor}
                  onChangeComplete={handleColorChange}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export { WidgetPropertiesPanel, WIDGET_PANEL_ID };
export type { WidgetPropertiesPanelProps };
