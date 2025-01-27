'use client';
import clsx from 'clsx';
import { useRef, useState } from 'react';
import { useReducer } from 'react';
import GridLayout, {
  DragOverEvent,
  ItemCallback,
  Layout,
  Layouts,
} from 'react-grid-layout';
import { z } from 'zod';
import { MdxBundle, Plugin, Widget } from '@/app/types';
import { Callout } from '@/lib/components/callout';
import { findWidgetFromPluginsById } from '../utils/findWidgetFromPluginsById';
import { initialState } from './hooks/designReducer';
import { PlunginsPanel } from './pluginsPanel';
import styles from './styles/designer.module.css';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { RiErrorWarningFill } from '@remixicon/react';
import { designReducer } from './hooks/designReducer';

const GRID_WIDTH = 774;
const GRID_ROW_HEIGHT = 30;
const GRID_MAX_ROWS = 36;
const GRID_STRICT_STYLE: React.CSSProperties = { height: '1080px' };

type DesignProps = {
  plugins: Plugin[];
};

type EventDataTransfer = Event & {
  dataTransfer: {
    getData: (type: 'application/json') => string;
  };
};

const widgetItemSchema = z.object({
  gid: z.string(),
  cid: z.string(),
});

export type WidgetCompositeId = z.infer<typeof widgetItemSchema>;

const gridLayouts: Layout[] = [];

function Designer({ plugins }: DesignProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [state, dispatch] = useReducer(designReducer, initialState);
  const [error, setError] = useState<string | undefined>();
  console.log(plugins);

  function handleDrop(layout: Layout[], item: Layout, e: EventDataTransfer) {
    console.log('drop', layout);
    const data: unknown = JSON.parse(
      e.dataTransfer.getData('application/json')
    );
    const result = widgetItemSchema.safeParse(data);
    if (!result.success) {
      console.error('Invalid widget item data', result.error);
      setError(result.error?.message);
      return;
    }
    const validData: WidgetCompositeId = result.data;
    const widget = findWidgetFromPluginsById(
      plugins,
      validData.gid,
      validData.cid
    );
    if (!widget) {
      console.error(
        `Widget not found - gid: ${validData.gid} - cid: ${validData.cid}`
      );
      setError(
        `Widget not found - gid: ${validData.gid} - cid: ${validData.cid}`
      );
      return;
    }
    const widgetLayout = { x: 0, y: 0, w: 1, h: 1, i: widget.cid };
    dispatch({
      type: 'ADD_WIDGET_TO_CANVAS',
      widgetLayout,
      widgetToRender: widget,
    });
  }

  function handleLayoutChange(layout: Layout[]) {
    console.log(layout);
  }

  function handleGridItemDropDragOver(e: DragOverEvent) {
    console.log(e);
    return { w: 2, h: 2 };
  }

  return (
    <main className="flex h-full gap-8">
      <section className="flex h-full w-[250px] flex-col gap-4 bg-secondary-900 p-4">
        <div>
          <h4 className="mb-0 text-lg font-bold">Project Name</h4>
          <p className="text-sm text-white">Project Description</p>
        </div>
        <PlunginsPanel plugins={plugins} />
      </section>
      <div className="mt-8 flex h-full flex-col gap-2">
        <div className="mb-8">
          <h4 className="text-lg font-bold">Design the report</h4>
          <p className="text-sm font-light text-white">
            Drag report widgets from the left panel onto the design canvas
          </p>
        </div>
        <Callout
          variant="error"
          title="Data from the dropped widget is invalid"
          icon={RiErrorWarningFill}>
          The data from the widget you dropped is invalid. Please check the data
          and try again.
        </Callout>
        <div
          ref={canvasRef}
          className={clsx(
            styles.canvas,
            styles.reportRoot,
            styles.reportContainer,
            styles.reportHeight
          )}>
          <div className={styles.canvas_grid} />
          <GridLayout
            layout={gridLayouts}
            width={GRID_WIDTH}
            rowHeight={GRID_ROW_HEIGHT}
            maxRows={GRID_MAX_ROWS}
            margin={[0, 0]}
            compactType={null}
            // onDrag={handleOnGridItemDrag}
            onDrop={handleDrop}
            // onDragStart={handleGridItemDragStart}
            // onDragStop={handleGridItemDragStop}
            // onResizeStart={handleCanvasResizeStart}
            onDropDragOver={handleGridItemDropDragOver}
            onLayoutChange={handleLayoutChange}
            // onResizeStop={handleGridItemResizeStop}
            preventCollision
            isResizable={true}
            isDroppable={true}
            isDraggable={true}
            isBounded
            // useCSSTransforms={true}
            resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
            style={GRID_STRICT_STYLE}>
            {/* <div
              className="bg-blue-900"
              key="2"
              data-grid={{ x: 2, y: 0, w: 4, h: 3 }}>
              Drop here
            </div> */}
          </GridLayout>
        </div>
      </div>
    </main>
  );
}

export { Designer };
