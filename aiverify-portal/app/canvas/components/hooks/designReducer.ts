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
    }
  | {
      type: 'DELETE_WIDGET_FROM_CANVAS';
      index: number;
    }
  | {
      type: 'RESIZE_WIDGET';
      itemLayout: Layout;
    }
  | {
      type: 'CHANGE_WIDGET_POSITION';
      itemLayout: Layout;
    }
  | {
      type: 'UPDATE_WIDGET';
      widget: WidgetOnGridLayout;
    }
  | { type: 'ADD_NEW_PAGE' }
  | { type: 'SET_CURRENT_PAGE'; pageIndex: number };

const initialState: DesignState = {
  currentPage: 0,
  layouts: [[]],
  widgets: [[]],
};

function designReducer(state: DesignState, action: WidgetAction): DesignState {
  const { layouts, widgets } = state;
  const clonedCurrentPageLayouts = layouts[state.currentPage].slice();
  switch (action.type) {
    case 'ADD_WIDGET_TO_CANVAS':
      const insertPosition = findWidgetInsertPosition(
        clonedCurrentPageLayouts,
        action.itemLayout
      );
      clonedCurrentPageLayouts.splice(insertPosition, 0, action.itemLayout);
      layouts[state.currentPage] = clonedCurrentPageLayouts;
      const clonedCurrentPageWidgets = widgets[state.currentPage].slice();
      clonedCurrentPageWidgets.splice(insertPosition, 0, action.widget);
      widgets[state.currentPage] = clonedCurrentPageWidgets;
      return {
        ...state,
        layouts,
        widgets,
      };

    case 'DELETE_WIDGET_FROM_CANVAS':
      clonedCurrentPageLayouts.splice(action.index, 1);
      const clonedCurrentPageWidgetsForDelete =
        widgets[state.currentPage].slice();
      clonedCurrentPageWidgetsForDelete.splice(action.index, 1);
      layouts[state.currentPage] = clonedCurrentPageLayouts;
      widgets[state.currentPage] = clonedCurrentPageWidgetsForDelete;
      return { ...state, layouts, widgets };

    case 'RESIZE_WIDGET':
      const resizingIndex = clonedCurrentPageLayouts.findIndex(
        (layout) => layout.i === action.itemLayout.i
      );
      if (resizingIndex === -1) {
        console.error('resizing - layout index not found');
        return state;
      }
      clonedCurrentPageLayouts[resizingIndex] = action.itemLayout;
      layouts[state.currentPage] = clonedCurrentPageLayouts;
      return { ...state, layouts };

    case 'CHANGE_WIDGET_POSITION':
      const movingIndex = clonedCurrentPageLayouts.findIndex(
        (layout) => layout.i === action.itemLayout.i
      );
      if (movingIndex === -1) {
        console.error('moving - layout index not found');
        return state;
      }
      const clonedCurrentPageWidgetsForMove =
        widgets[state.currentPage].slice();
      const widgetToMove = clonedCurrentPageWidgetsForMove[movingIndex];
      clonedCurrentPageWidgetsForMove.splice(movingIndex, 1);
      const newPosition = findWidgetInsertPosition(
        clonedCurrentPageLayouts,
        action.itemLayout
      );
      clonedCurrentPageWidgetsForMove.splice(newPosition, 0, widgetToMove);
      widgets[state.currentPage] = clonedCurrentPageWidgetsForMove;
      clonedCurrentPageLayouts[movingIndex] = action.itemLayout;
      layouts[state.currentPage] = clonedCurrentPageLayouts;
      return { ...state, layouts };

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

    default:
      return state;
  }
}

export { designReducer, initialState, type WidgetAction, type DesignState };
