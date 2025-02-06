import { Layout } from 'react-grid-layout';
import { WidgetOnGridLayout } from '@/app/canvas/types';
import { findWidgetInsertPosition } from './utils/findWidgetInsertPosition';

type DesignState = {
  currentPage: number;
  layouts: Layout[][];
  widgets: WidgetOnGridLayout[][];
};

type WidgetAction =
  | {
      type: 'ADD_WIDGET_TO_CANVAS';
      itemLayout: Layout;
      widget: WidgetOnGridLayout;
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
  | {
      type: 'UPDATE_WIDGET';
      widget: WidgetOnGridLayout;
    }
  | { type: 'ADD_NEW_PAGE' }
  | { type: 'SET_CURRENT_PAGE'; pageIndex: number }
  | { type: 'DELETE_PAGE'; pageIndex: number };

const initialState: DesignState = {
  currentPage: 0,
  layouts: [[]],
  widgets: [[]],
};

function designReducer(state: DesignState, action: WidgetAction): DesignState {
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

    case 'UPDATE_WIDGET':
      return {
        ...state,
        widgets: {
          ...state.widgets,
          [state.currentPage]: state.widgets[state.currentPage].map((widget) =>
            widget.gridItemId === action.widget.gridItemId
              ? action.widget
              : widget
          ),
        },
      };

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

    default:
      return state;
  }
}

export { designReducer, initialState, type WidgetAction, type DesignState };
