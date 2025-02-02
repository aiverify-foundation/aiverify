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
      widgetIndex: number;
    }
  | {
      type: 'RESIZE_WIDGET';
      itemLayout: Layout;
    }
  | {
      type: 'CHANGE_WIDGET_POSITION';
      itemLayout: Layout;
    };

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
      return { ...state };
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
      clonedCurrentPageLayouts[movingIndex] = action.itemLayout;
      layouts[state.currentPage] = clonedCurrentPageLayouts;
      return { ...state, layouts };
  }
}

export { designReducer, initialState, type WidgetAction, type DesignState };
