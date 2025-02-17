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
};

export const initialState: State = {
  layouts: [[]],
  widgets: [[]],
  algos: {},
  inputBlocks: {},
  currentPage: 0,
  showGrid: true,
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

    default:
      return state;
  }
}

export { pagesDesignReducer, type WidgetAction };
