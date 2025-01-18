'use client';
import clsx from 'clsx';
import { useRef } from 'react';
import GridLayout, { ItemCallback, Layout } from 'react-grid-layout';
import { Plugin, Widget } from '@/app/types';
import { TextInput } from '@/lib/components/textInput';
import styles from './styles/designer.module.css';

const GRID_WIDTH = 774;
const GRID_ROW_HEIGHT = 30;
const GRID_MAX_ROWS = 36;
const GRID_STRICT_STYLE: React.CSSProperties = { height: '1080px' };

type DesignProps = {
  plugins: Record<string, Widget[]>[];
};

const gridLayouts: Layout[] = [];
function Designer({ plugins }: DesignProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  console.log(plugins);
  return (
    <main className="flex h-full gap-8">
      <section className="flex h-full w-[250px] flex-col gap-4 bg-secondary-900 p-4">
        <div>
          <h4 className="mb-0 text-lg font-bold">Project Name</h4>
          <p className="text-sm text-white">Project Description</p>
        </div>
        <div>
          <TextInput placeholder="Search" />
        </div>
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
            // onDrop={handleGridItemDrop}
            // onDragStart={handleGridItemDragStart}
            // onDragStop={handleGridItemDragStop}
            // onResizeStart={handleCanvasResizeStart}
            // onDropDragOver={handleGridItemDropDragOver}
            // onLayoutChange={handleLayoutChange}
            // onResizeStop={handleGridItemResizeStop}
            preventCollision
            isDroppable={true}
            isResizable={true}
            isBounded
            resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
            style={GRID_STRICT_STYLE}>
            <div
              key="1"
              data-grid={{ x: 0, y: 0, w: 6, h: 4 }}
              className="rounded-md bg-primary-700 p-4">
              <h3 className="text-lg font-bold">Header Widget</h3>
              <p>This is a sample header widget that can be dragged around</p>
            </div>

            <div
              key="2"
              data-grid={{ x: 6, y: 2, w: 6, h: 8 }}
              className="rounded-md bg-secondary-600 p-4">
              <h3 className="text-lg font-bold">Chart Widget</h3>
              <div className="flex h-full items-center justify-center">
                <p className="text-primary-300">
                  Chart visualization goes here
                </p>
              </div>
            </div>

            <div
              key="3"
              data-grid={{ x: 0, y: 8, w: 6, h: 6 }}
              className="rounded-md bg-slate-800 p-4">
              <h3 className="text-lg font-bold">Text Block</h3>
              <p className="mt-2">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </div>

            <div
              key="4"
              data-grid={{ x: 6, y: 20, w: 6, h: 4 }}
              className="rounded-md bg-secondary-800 p-4">
              <h3 className="text-lg font-bold">Metrics Widget</h3>
              <div className="mt-4 flex justify-around">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-300">95%</p>
                  <p className="text-sm">Accuracy</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-300">0.82</p>
                  <p className="text-sm">F1 Score</p>
                </div>
              </div>
            </div>
          </GridLayout>
        </div>
      </div>
    </main>
  );
}

export { Designer };
