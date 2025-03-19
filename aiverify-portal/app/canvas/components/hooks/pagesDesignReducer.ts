import { Layout } from 'react-grid-layout';
import { WidgetOnGridLayout } from '@/app/canvas/types';
import { debouncedSaveStateToDatabase } from '@/app/canvas/utils/saveStateToDatabase';
import { Algorithm, InputBlock } from '@/app/types';
import { findWidgetInsertPosition } from './utils/findWidgetInsertPosition';

export type WidgetAlgoAndResultIdentifier = {
  gid: string;
  cid: string;
  testResultId?: number;
};

export type WidgetInputBlockIdentifier = {
  gid: string;
  cid: string;
  inputBlockDataId?: number;
};

type WidgetGridItemId = string;

export type State = {
  /**
   * 2D array where each row represents a page and each column contains a widget's layout configuration.
   * Layout objects are used by react-grid-layout to position widgets on the grid.
   */
  layouts: Layout[][];

  /**
   * 2D array where each row represents a page and each column contains a widget's configuration and content.
   * Widgets contain the actual MDX code, properties, and metadata.
   */
  widgets: WidgetOnGridLayout[][];

  /**
   * Collection of all algorithms/tests referenced by widgets in the report.
   * Used to track dependencies and ensure required data is available.
   */
  algorithmsOnReport: Algorithm[];

  /**
   * Collection of all input blocks referenced by widgets in the report.
   * Used to track dependencies and ensure required data is available.
   */
  inputBlocksOnReport: InputBlock[];

  /**
   * Maps grid item IDs to their associated algorithms and test results.
   * Enables widgets to access their required test data.
   */
  gridItemToAlgosMap: Record<WidgetGridItemId, WidgetAlgoAndResultIdentifier[]>;

  /**
   * Maps grid item IDs to their associated input block and input block data.
   * Enables widgets to access their required input data.
   */
  gridItemToInputBlockDatasMap: Record<
    WidgetGridItemId,
    WidgetInputBlockIdentifier[]
  >;

  /** Index of the currently active/visible page */
  currentPage: number;

  /** Controls visibility of the grid background */
  showGrid: boolean;

  /**
   * Array indicating the type of each page ('grid' for normal pages, 'overflow' for content spillover)
   */
  pageTypes: ('grid' | 'overflow')[];

  /**
   * Array tracking parent page relationships for overflow pages.
   * null indicates a normal grid page, number indicates the parent page index
   * Example: [null, null, null, 2, 2] means pages 4 and 5 are overflow from page 3
   */
  overflowParents: Array<number | null>;
};

export const initialState: State = {
  layouts: [[]],
  widgets: [[]],
  algorithmsOnReport: [],
  gridItemToAlgosMap: {},
  gridItemToInputBlockDatasMap: {},
  currentPage: 0,
  showGrid: true,
  pageTypes: ['grid'],
  overflowParents: [null],
  inputBlocksOnReport: [],
};

type WidgetAction =
  | {
      type: 'ADD_WIDGET_TO_CANVAS';
      itemLayout: Layout;
      widget: WidgetOnGridLayout;
      gridItemAlgosMap: WidgetAlgoAndResultIdentifier[] | undefined;
      gridItemInputBlockDatasMap: WidgetInputBlockIdentifier[] | undefined;
      algorithms: Algorithm[];
      inputBlocks: InputBlock[];
      pageIndex: number;
    }
  | {
      type: 'DELETE_WIDGET_FROM_CANVAS';
      index: number;
      pageIndex: number;
    }
  | {
      type: 'RESIZE_WIDGET';
      itemLayout: Layout;
      pageIndex: number;
    }
  | {
      type: 'CHANGE_WIDGET_POSITION'; //TODO - review; was using this for moving widgets across pages.
      itemLayout: Layout;
      pageIndex: number;
    }
  | { type: 'ADD_NEW_PAGE' }
  | { type: 'SET_CURRENT_PAGE'; pageIndex: number }
  | { type: 'DELETE_PAGE'; pageIndex: number }
  | { type: 'TOGGLE_GRID' }
  | {
      type: 'UPDATE_WIDGET';
      widget: WidgetOnGridLayout;
      pageIndex: number;
    }
  | {
      type: 'ADD_OVERFLOW_PAGES';
      parentPageIndex: number;
      count: number;
    }
  | {
      type: 'REMOVE_OVERFLOW_PAGES';
      parentPageIndex: number;
    }
  | {
      type: 'UPDATE_ALGO_TRACKER';
      gridItemAlgosMap: WidgetAlgoAndResultIdentifier[];
    }
  | {
      type: 'UPDATE_INPUT_BLOCK_TRACKER';
      gridItemInputBlockDatasMap: WidgetInputBlockIdentifier[];
    }
  | {
      type: 'INITIALIZE_WITH_TEMPLATE';
      layouts: Layout[][];
      widgets: WidgetOnGridLayout[][];
      algorithmsOnReport: Algorithm[];
      inputBlocksOnReport: InputBlock[];
      gridItemToAlgosMap: Record<
        WidgetGridItemId,
        WidgetAlgoAndResultIdentifier[]
      >;
      gridItemToInputBlockDatasMap: Record<
        WidgetGridItemId,
        WidgetInputBlockIdentifier[]
      >;
      pageTypes: ('grid' | 'overflow')[];
      overflowParents: Array<number | null>;
    };

function pagesDesignReducer(state: State, action: WidgetAction): State {
  const { layouts, widgets } = state;
  let newState = state;

  switch (action.type) {
    case 'ADD_WIDGET_TO_CANVAS': {
      const clonedPageLayouts = layouts[action.pageIndex].slice();
      const insertPosition = findWidgetInsertPosition(
        clonedPageLayouts,
        action.itemLayout
      );
      clonedPageLayouts.splice(insertPosition, 0, action.itemLayout); //splice creates a new array
      const clonedPageWidgets = widgets[action.pageIndex].slice();
      clonedPageWidgets.splice(insertPosition, 0, action.widget);

      let clonedAlgosMap = state.gridItemToAlgosMap;
      let clonedInputBlockDatasMap = state.gridItemToInputBlockDatasMap;

      // Update the algorithm mapping for the widget if provided, either by merging with existing
      // algorithms or creating a new entry in the map for this widget
      if (action.gridItemAlgosMap && action.gridItemAlgosMap.length > 0) {
        clonedAlgosMap = { ...state.gridItemToAlgosMap };
        if (clonedAlgosMap[action.widget.gridItemId]) {
          clonedAlgosMap[action.widget.gridItemId] = [
            ...clonedAlgosMap[action.widget.gridItemId],
            ...action.gridItemAlgosMap,
          ];
        } else {
          clonedAlgosMap[action.widget.gridItemId] =
            action.gridItemAlgosMap.slice();
        }
      }

      if (
        action.gridItemInputBlockDatasMap &&
        action.gridItemInputBlockDatasMap.length > 0
      ) {
        clonedInputBlockDatasMap = { ...state.gridItemToInputBlockDatasMap };
        if (clonedInputBlockDatasMap[action.widget.gridItemId]) {
          clonedInputBlockDatasMap[action.widget.gridItemId] = [
            ...clonedInputBlockDatasMap[action.widget.gridItemId],
            ...action.gridItemInputBlockDatasMap,
          ];
        } else {
          clonedInputBlockDatasMap[action.widget.gridItemId] =
            action.gridItemInputBlockDatasMap.slice();
        }
      }
      // Update algorithms list without duplicates
      const newAlgorithms = [...state.algorithmsOnReport];
      action.algorithms.forEach((algo) => {
        if (
          !newAlgorithms.some(
            (existing) => existing.gid === algo.gid && existing.cid === algo.cid
          )
        ) {
          newAlgorithms.push(algo);
        }
      });

      // Update input blocks list without duplicates
      const newInputBlocks = [...state.inputBlocksOnReport];
      action.inputBlocks.forEach((inputBlock) => {
        if (
          !newInputBlocks.some(
            (existing) =>
              existing.gid === inputBlock.gid && existing.cid === inputBlock.cid
          )
        ) {
          newInputBlocks.push(inputBlock);
        }
      });

      newState = {
        ...state,
        layouts: layouts.map((layout, i) =>
          i === action.pageIndex ? clonedPageLayouts : layout
        ),
        widgets: widgets.map((widget, i) =>
          i === action.pageIndex ? clonedPageWidgets : widget
        ),
        gridItemToAlgosMap: clonedAlgosMap,
        gridItemToInputBlockDatasMap: clonedInputBlockDatasMap,
        algorithmsOnReport: newAlgorithms,
        inputBlocksOnReport: newInputBlocks,
      };
      break;
    }

    case 'DELETE_WIDGET_FROM_CANVAS': {
      const clonedPageLayouts = layouts[action.pageIndex].slice();
      const clonedPageWidgets = widgets[action.pageIndex].slice();

      // Get widget ID before deletion to clean up algos
      const widgetToDelete = clonedPageWidgets[action.index];

      clonedPageLayouts.splice(action.index, 1);
      clonedPageWidgets.splice(action.index, 1);

      // Clean up algos from map
      const clonedAlgosMap = { ...state.gridItemToAlgosMap };
      if (widgetToDelete) {
        delete clonedAlgosMap[widgetToDelete.gridItemId];
      }

      // Clean up input block datas from map
      const clonedInputBlockDatasMap = {
        ...state.gridItemToInputBlockDatasMap,
      };
      if (widgetToDelete) {
        delete clonedInputBlockDatasMap[widgetToDelete.gridItemId];
      }

      // Clean up algorithmsOnReport
      const allRemainingAlgos = Object.values(clonedAlgosMap).flat();
      const newAlgorithmsOnReport = (state.algorithmsOnReport || []).filter(
        (algo) =>
          allRemainingAlgos.some(
            (remaining) =>
              remaining.gid === algo.gid && remaining.cid === algo.cid
          )
      );

      // Clean up inputBlocksOnReport
      const allRemainingInputBlocks = Object.values(
        clonedInputBlockDatasMap
      ).flat();
      const newInputBlocksOnReport = state.inputBlocksOnReport.filter(
        (inputBlock) =>
          allRemainingInputBlocks.some(
            (remaining) =>
              remaining.gid === inputBlock.gid &&
              remaining.cid === inputBlock.cid
          )
      );

      newState = {
        ...state,
        layouts: layouts.map((layout, i) =>
          i === action.pageIndex ? clonedPageLayouts : layout
        ),
        widgets: widgets.map((widget, i) =>
          i === action.pageIndex ? clonedPageWidgets : widget
        ),
        gridItemToAlgosMap: clonedAlgosMap,
        gridItemToInputBlockDatasMap: clonedInputBlockDatasMap,
        algorithmsOnReport: newAlgorithmsOnReport,
        inputBlocksOnReport: newInputBlocksOnReport,
      };
      break;
    }

    case 'RESIZE_WIDGET': {
      const clonedPageLayouts = layouts[action.pageIndex].slice();
      const resizingIndex = clonedPageLayouts.findIndex(
        (layout) => layout.i === action.itemLayout.i
      );

      if (resizingIndex === -1) {
        console.error('resizing - layout index not found');
        return state;
      }

      clonedPageLayouts[resizingIndex] = action.itemLayout;

      newState = {
        ...state,
        layouts: layouts.map((layout, i) =>
          i === action.pageIndex ? clonedPageLayouts : layout
        ),
      };
      break;
    }

    case 'CHANGE_WIDGET_POSITION': {
      const clonedPageLayouts = layouts[action.pageIndex].slice();
      const clonedPageWidgets = widgets[action.pageIndex].slice();

      const movingIndex = clonedPageLayouts.findIndex(
        (layout) => layout.i === action.itemLayout.i
      );

      if (movingIndex === -1) {
        console.error('moving - layout index not found');
        return state;
      }

      const widgetToMove = clonedPageWidgets[movingIndex];
      clonedPageWidgets.splice(movingIndex, 1);

      const newPosition = findWidgetInsertPosition(
        clonedPageLayouts,
        action.itemLayout
      );
      clonedPageWidgets.splice(newPosition, 0, widgetToMove);
      clonedPageLayouts[movingIndex] = action.itemLayout;

      newState = {
        ...state,
        layouts: layouts.map((layout, i) =>
          i === action.pageIndex ? clonedPageLayouts : layout
        ),
        widgets: widgets.map((widget, i) =>
          i === action.pageIndex ? clonedPageWidgets : widget
        ),
      };
      break;
    }

    case 'ADD_NEW_PAGE':
      newState = {
        ...state,
        layouts: [...state.layouts, []],
        widgets: [...state.widgets, []],
        pageTypes: [...state.pageTypes, 'grid'],
        overflowParents: [...state.overflowParents, null],
        currentPage: state.layouts.length,
      };
      break;

    case 'SET_CURRENT_PAGE':
      newState = {
        ...state,
        currentPage: action.pageIndex,
      };
      break;

    case 'DELETE_PAGE': {
      const { pageIndex } = action;

      // Find indices of overflow pages to remove if this is a grid page
      const overflowIndicesToRemove =
        state.pageTypes[pageIndex] === 'grid'
          ? state.pageTypes.reduce((indices, type, idx) => {
              if (
                type === 'overflow' &&
                state.overflowParents[idx] === pageIndex
              ) {
                indices.push(idx);
              }
              return indices;
            }, [] as number[])
          : [];

      // Combine all indices to remove
      const allIndicesToRemove = [pageIndex, ...overflowIndicesToRemove];

      // Filter out the deleted pages and their overflow pages
      const newLayouts = state.layouts.filter(
        (_, idx) => !allIndicesToRemove.includes(idx)
      );
      const newWidgets = state.widgets.filter(
        (_, idx) => !allIndicesToRemove.includes(idx)
      );
      const newPageTypes = state.pageTypes.filter(
        (_, idx) => !allIndicesToRemove.includes(idx)
      );
      const newOverflowParents = state.overflowParents.filter(
        (_, idx) => !allIndicesToRemove.includes(idx)
      );

      // Adjust overflow parent indices after deletion
      const adjustedOverflowParents = newOverflowParents.map((parent) =>
        parent === null ? null : parent >= pageIndex ? parent - 1 : parent
      );

      // Get all widgets that will be deleted
      const widgetsToDelete = allIndicesToRemove.flatMap(
        (pageIdx) => state.widgets[pageIdx] || []
      );

      // Clean up algos and input block datas maps
      const clonedAlgosMap = { ...state.gridItemToAlgosMap };
      const clonedInputBlockDatasMap = {
        ...state.gridItemToInputBlockDatasMap,
      };

      // Remove entries for deleted widgets
      widgetsToDelete.forEach((widget) => {
        if (widget) {
          delete clonedAlgosMap[widget.gridItemId];
          delete clonedInputBlockDatasMap[widget.gridItemId];
        }
      });

      // Clean up algorithmsOnReport
      const allRemainingAlgos = Object.values(clonedAlgosMap).flat();
      const newAlgorithmsOnReport = (state.algorithmsOnReport || []).filter(
        (algo) =>
          allRemainingAlgos.some(
            (remaining) =>
              remaining.gid === algo.gid && remaining.cid === algo.cid
          )
      );

      // Clean up inputBlocksOnReport
      const allRemainingInputBlocks = Object.values(
        clonedInputBlockDatasMap
      ).flat();
      const newInputBlocksOnReport = state.inputBlocksOnReport.filter(
        (inputBlock) =>
          allRemainingInputBlocks.some(
            (remaining) =>
              remaining.gid === inputBlock.gid &&
              remaining.cid === inputBlock.cid
          )
      );

      const newCurrentPage = Math.min(state.currentPage, newLayouts.length - 1);

      newState = {
        ...state,
        layouts: newLayouts,
        widgets: newWidgets,
        pageTypes: newPageTypes,
        overflowParents: adjustedOverflowParents,
        currentPage: newCurrentPage,
        gridItemToAlgosMap: clonedAlgosMap,
        gridItemToInputBlockDatasMap: clonedInputBlockDatasMap,
        algorithmsOnReport: newAlgorithmsOnReport,
        inputBlocksOnReport: newInputBlocksOnReport,
      };
      break;
    }

    case 'TOGGLE_GRID':
      newState = {
        ...state,
        showGrid: !state.showGrid,
      };
      break;

    case 'UPDATE_WIDGET': {
      const clonedPageWidgets = widgets[action.pageIndex].slice();
      const widgetIndex = clonedPageWidgets.findIndex(
        (w) => w.gridItemId === action.widget.gridItemId
      );
      if (widgetIndex >= 0) {
        clonedPageWidgets[widgetIndex] = action.widget;
      }
      newState = {
        ...state,
        widgets: widgets.map((widget, i) =>
          i === action.pageIndex ? clonedPageWidgets : widget
        ),
      };
      break;
    }

    case 'ADD_OVERFLOW_PAGES': {
      const { parentPageIndex, count } = action;
      const insertIndex = parentPageIndex + 1;

      const newLayouts = new Array(count).fill([]);
      const newWidgets = new Array(count).fill([]);
      const newPageTypes = new Array(count).fill('overflow');
      const newOverflowParents = new Array(count).fill(parentPageIndex);

      newState = {
        ...state,
        layouts: [
          ...state.layouts.slice(0, insertIndex),
          ...newLayouts,
          ...state.layouts.slice(insertIndex),
        ],
        widgets: [
          ...state.widgets.slice(0, insertIndex),
          ...newWidgets,
          ...state.widgets.slice(insertIndex),
        ],
        pageTypes: [
          ...state.pageTypes.slice(0, insertIndex),
          ...newPageTypes,
          ...state.pageTypes.slice(insertIndex),
        ],
        overflowParents: [
          ...state.overflowParents.slice(0, insertIndex),
          ...newOverflowParents,
          ...state.overflowParents.slice(insertIndex),
        ],
      };
      break;
    }

    case 'REMOVE_OVERFLOW_PAGES': {
      const { parentPageIndex } = action;

      // Find indices of overflow pages to remove
      const indicesToRemove = state.pageTypes.reduce((indices, type, idx) => {
        if (
          type === 'overflow' &&
          state.overflowParents[idx] === parentPageIndex
        ) {
          indices.push(idx);
        }
        return indices;
      }, [] as number[]);

      // Remove the pages
      newState = {
        ...state,
        layouts: state.layouts.filter(
          (_, idx) => !indicesToRemove.includes(idx)
        ),
        widgets: state.widgets.filter(
          (_, idx) => !indicesToRemove.includes(idx)
        ),
        pageTypes: state.pageTypes.filter(
          (_, idx) => !indicesToRemove.includes(idx)
        ),
        overflowParents: state.overflowParents.filter(
          (_, idx) => !indicesToRemove.includes(idx)
        ),
        currentPage:
          state.currentPage >= parentPageIndex
            ? parentPageIndex
            : state.currentPage,
      };
      break;
    }

    case 'UPDATE_ALGO_TRACKER': {
      const clonedAlgosMap = { ...state.gridItemToAlgosMap };

      // Iterate through each grid item in the cloned map
      Object.keys(clonedAlgosMap).forEach((key) => {
        // Update each algorithm reference in this grid item
        clonedAlgosMap[key] = clonedAlgosMap[key].map((existing) => {
          // Look for a matching algorithm in the action's map
          const matchingAlgo = action.gridItemAlgosMap.find(
            (algoMap) =>
              algoMap.gid === existing.gid && algoMap.cid === existing.cid
          );

          // If found, update with the new testResultId, otherwise reset to undefined
          return matchingAlgo
            ? { ...existing, testResultId: matchingAlgo.testResultId }
            : { ...existing, testResultId: undefined };
        });
      });

      newState = { ...state, gridItemToAlgosMap: clonedAlgosMap };
      break;
    }

    case 'UPDATE_INPUT_BLOCK_TRACKER': {
      const clonedInputBlockDatasMap = {
        ...state.gridItemToInputBlockDatasMap,
      };

      // Iterate through each grid item in the cloned map
      Object.keys(clonedInputBlockDatasMap).forEach((key) => {
        // Update each input block reference in this grid item
        clonedInputBlockDatasMap[key] = clonedInputBlockDatasMap[key].map(
          (existing) => {
            // Look for a matching input block in the action's map
            const matchingInputBlock = action.gridItemInputBlockDatasMap.find(
              (inputBlockMap) =>
                inputBlockMap.gid === existing.gid &&
                inputBlockMap.cid === existing.cid
            );

            // If found, update with the new inputBlockDataId, otherwise reset to undefined
            return matchingInputBlock
              ? {
                  ...existing,
                  inputBlockDataId: matchingInputBlock.inputBlockDataId,
                }
              : { ...existing, inputBlockDataId: undefined };
          }
        );
      });

      newState = {
        ...state,
        gridItemToInputBlockDatasMap: clonedInputBlockDatasMap,
      };
      break;
    }

    case 'INITIALIZE_WITH_TEMPLATE': {
      const {
        layouts: templateLayouts,
        widgets: templateWidgets,
        algorithmsOnReport,
        inputBlocksOnReport,
        gridItemToAlgosMap,
        gridItemToInputBlockDatasMap,
        pageTypes,
        overflowParents,
      } = action;

      // Validate input arrays
      if (!Array.isArray(templateLayouts) || !Array.isArray(templateWidgets)) {
        console.error(
          'Invalid template data: layouts or widgets are not arrays'
        );
        return state;
      }

      // Process each page's layouts and widgets to ensure proper positioning
      const processedLayouts = templateLayouts.map((pageLayouts, pageIndex) => {
        if (
          !Array.isArray(pageLayouts) ||
          !Array.isArray(templateWidgets[pageIndex])
        ) {
          console.error(`Invalid page data at index ${pageIndex}`);
          return [];
        }

        const sortedLayouts: Layout[] = [];
        const sortedWidgets = templateWidgets[pageIndex].filter(
          (widget) => widget && widget.gridItemId // Filter out invalid widgets
        );

        // Position each widget using findWidgetInsertPosition
        pageLayouts.forEach((layout, idx) => {
          if (!layout || !sortedWidgets[idx]) return; // Skip invalid layouts/widgets

          const insertPosition = findWidgetInsertPosition(
            sortedLayouts,
            layout
          );
          sortedLayouts.splice(insertPosition, 0, layout);

          // Move the corresponding widget to match the layout position
          if (idx !== insertPosition) {
            const [widget] = sortedWidgets.splice(idx, 1);
            sortedWidgets.splice(insertPosition, 0, widget);
          }
        });

        templateWidgets[pageIndex] = sortedWidgets;
        return sortedLayouts;
      });

      newState = {
        ...state,
        layouts: processedLayouts,
        widgets: templateWidgets,
        algorithmsOnReport: algorithmsOnReport || [],
        inputBlocksOnReport: inputBlocksOnReport || [],
        gridItemToAlgosMap: gridItemToAlgosMap || {},
        gridItemToInputBlockDatasMap: gridItemToInputBlockDatasMap || {},
        pageTypes: pageTypes || ['grid'],
        overflowParents: overflowParents || [null],
      };
      break;
    }

    default:
      return state;
  }

  // Save state to database (debounced)
  console.log('saving hereee', newState);
  debouncedSaveStateToDatabase(newState);

  return newState;
}

export { pagesDesignReducer, type WidgetAction };
