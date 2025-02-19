import { Layout } from 'react-grid-layout';
import { WidgetOnGridLayout } from '@/app/canvas/types';
import { Algorithm } from '@/app/types';
import { findWidgetInsertPosition } from './utils/findWidgetInsertPosition';

export type State = {
  layouts: Layout[][];
  widgets: WidgetOnGridLayout[][];
  algos: Record<string, Algorithm[]>;
  inputBlocks: Record<string, unknown>;
  currentPage: number;
  showGrid: boolean;
  pageTypes: ('grid' | 'overflow')[]; // Track page types
  overflowParents: Array<number | null>; // just track parent page index, null for grid pages
};

export const initialState: State = {
  layouts: [[]],
  widgets: [[]],
  algos: {},
  inputBlocks: {},
  currentPage: 0,
  showGrid: true,
  pageTypes: ['grid'],
  overflowParents: [null],
};

type WidgetAction =
  | {
      type: 'ADD_WIDGET_TO_CANVAS';
      itemLayout: Layout;
      widget: WidgetOnGridLayout;
      algos: Algorithm[] | undefined;
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
      type: 'CHANGE_WIDGET_POSITION';
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
      type: 'MOVE_WIDGET_TO_PAGE';
      itemLayout: Layout;
      fromPageIndex: number;
      toPageIndex: number;
      widgetId: string;
    }
  | {
      type: 'ADD_OVERFLOW_PAGES';
      parentPageIndex: number;
      count: number;
    }
  | {
      type: 'REMOVE_OVERFLOW_PAGES';
      parentPageIndex: number;
    };

function pagesDesignReducer(state: State, action: WidgetAction): State {
  const { layouts, widgets } = state;

  switch (action.type) {
    case 'ADD_WIDGET_TO_CANVAS': {
      const clonedPageLayouts = layouts[action.pageIndex].slice();
      const insertPosition = findWidgetInsertPosition(
        clonedPageLayouts,
        action.itemLayout
      );
      clonedPageLayouts.splice(insertPosition, 0, action.itemLayout);
      const clonedPageWidgets = widgets[action.pageIndex].slice();
      clonedPageWidgets.splice(insertPosition, 0, action.widget);

      let clonedAlgos = state.algos;
      if (action.algos && action.algos.length > 0) {
        clonedAlgos = { ...state.algos };
        if (clonedAlgos[action.widget.gridItemId]) {
          clonedAlgos[action.widget.gridItemId] = [
            ...clonedAlgos[action.widget.gridItemId],
            ...action.algos,
          ];
        } else {
          clonedAlgos[action.widget.gridItemId] = action.algos.slice();
        }
      }

      return {
        ...state,
        layouts: layouts.map((layout, i) =>
          i === action.pageIndex ? clonedPageLayouts : layout
        ),
        widgets: widgets.map((widget, i) =>
          i === action.pageIndex ? clonedPageWidgets : widget
        ),
        algos: clonedAlgos,
      };
    }

    case 'DELETE_WIDGET_FROM_CANVAS': {
      const clonedPageLayouts = layouts[action.pageIndex].slice();
      const clonedPageWidgets = widgets[action.pageIndex].slice();

      clonedPageLayouts.splice(action.index, 1);
      clonedPageWidgets.splice(action.index, 1);

      return {
        ...state,
        layouts: layouts.map((layout, i) =>
          i === action.pageIndex ? clonedPageLayouts : layout
        ),
        widgets: widgets.map((widget, i) =>
          i === action.pageIndex ? clonedPageWidgets : widget
        ),
      };
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

      return {
        ...state,
        layouts: layouts.map((layout, i) =>
          i === action.pageIndex ? clonedPageLayouts : layout
        ),
      };
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

      return {
        ...state,
        layouts: layouts.map((layout, i) =>
          i === action.pageIndex ? clonedPageLayouts : layout
        ),
        widgets: widgets.map((widget, i) =>
          i === action.pageIndex ? clonedPageWidgets : widget
        ),
      };
    }

    case 'ADD_NEW_PAGE':
      return {
        ...state,
        layouts: [...state.layouts, []],
        widgets: [...state.widgets, []],
        pageTypes: [...state.pageTypes, 'grid'],
        overflowParents: [...state.overflowParents, null],
        currentPage: state.layouts.length,
      };

    case 'SET_CURRENT_PAGE':
      return {
        ...state,
        currentPage: action.pageIndex,
      };

    case 'DELETE_PAGE': {
      const { pageIndex } = action;
      const newLayouts = state.layouts.filter(
        (_, index) => index !== pageIndex
      );
      const newWidgets = state.widgets.filter(
        (_, index) => index !== pageIndex
      );

      const newCurrentPage = Math.min(state.currentPage, newLayouts.length - 1);

      return {
        ...state,
        layouts: newLayouts,
        widgets: newWidgets,
        currentPage: newCurrentPage,
      };
    }

    case 'TOGGLE_GRID':
      return {
        ...state,
        showGrid: !state.showGrid,
      };

    case 'UPDATE_WIDGET': {
      const clonedPageWidgets = widgets[action.pageIndex].slice();
      const widgetIndex = clonedPageWidgets.findIndex(
        (w) => w.gridItemId === action.widget.gridItemId
      );
      if (widgetIndex >= 0) {
        clonedPageWidgets[widgetIndex] = action.widget;
      }
      return {
        ...state,
        widgets: widgets.map((widget, i) =>
          i === action.pageIndex ? clonedPageWidgets : widget
        ),
      };
    }

    case 'MOVE_WIDGET_TO_PAGE': {
      const { itemLayout, fromPageIndex, toPageIndex, widgetId } = action;

      // Find widget to move
      const widgetToMove = state.widgets[fromPageIndex].find(
        (w) => w.gridItemId === widgetId
      );

      if (!widgetToMove) return state;

      // Remove from source page
      const sourceWidgets = state.widgets[fromPageIndex].filter(
        (w) => w.gridItemId !== widgetId
      );

      // Add to target page
      const targetWidgets = [...state.widgets[toPageIndex], widgetToMove];

      // Update layouts
      const newLayouts = [...state.layouts];
      newLayouts[fromPageIndex] = newLayouts[fromPageIndex].filter(
        (l) => l.i !== widgetId
      );
      newLayouts[toPageIndex] = [...newLayouts[toPageIndex], itemLayout];

      // Update widgets array
      const newWidgets = [...state.widgets];
      newWidgets[fromPageIndex] = sourceWidgets;
      newWidgets[toPageIndex] = targetWidgets;

      return {
        ...state,
        layouts: newLayouts,
        widgets: newWidgets,
      };
    }

    case 'ADD_OVERFLOW_PAGES': {
      const { parentPageIndex, count } = action;
      const insertIndex = parentPageIndex + 1;

      const newLayouts = new Array(count).fill([]);
      const newWidgets = new Array(count).fill([]);
      const newPageTypes = new Array(count).fill('overflow');
      const newOverflowParents = new Array(count).fill(parentPageIndex);

      return {
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
      return {
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
    }

    default:
      return state;
  }
}

export { pagesDesignReducer, type WidgetAction };
