'use client';
import clsx from 'clsx';
import { useRef, useState } from 'react';
import GridLayout, {
  DragOverEvent,
  ItemCallback,
  Layout,
  Layouts,
} from 'react-grid-layout';
import { MdxBundle, Plugin, Widget } from '@/app/types';
import { PlunginsPanel } from './pluginsPanel';
import styles from './styles/designer.module.css';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const GRID_WIDTH = 774;
const GRID_ROW_HEIGHT = 30;
const GRID_MAX_ROWS = 36;
const GRID_STRICT_STYLE: React.CSSProperties = { height: '1080px' };

type DesignProps = {
  plugins: Plugin[];
};

function parseMDXBundle(bundle: MdxBundle) {
  const { code } = bundle;
  const Component = new Function(`${code}; return Component;`)();
  return Component;
}

const gridLayouts: Layout[] = [];

function Designer({ plugins }: DesignProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);

  const widgetComponents = widgets.map((widget) => {
    if (widget.mdx) {
      const MdxComponent = parseMDXBundle(widget.mdx);
      return <MdxComponent key={widget.cid} />;
    }
  });

  function handleDrop(layout: Layout[], item: Layout, e: Event) {
    console.log('drop', layout, item, e);
    const widgetId = (e.target as HTMLElement).dataset.id;
    console.log(widgetId);
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
            {widgetComponents}
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
