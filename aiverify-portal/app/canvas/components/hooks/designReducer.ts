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
      widgetIndex: number;
      targetIndex: number;
    };

const initialState: DesignState = {
  currentPage: 0,
  layouts: [[]],
  widgets: [[]],
};

function designReducer(state: DesignState, action: WidgetAction): DesignState {
  const { layouts, widgets } = state;
  switch (action.type) {
    case 'ADD_WIDGET_TO_CANVAS':
      const insertPosition = findWidgetInsertPosition(
        layouts[state.currentPage],
        action.itemLayout
      );
      const updatedWidgetLayouts = [...layouts[state.currentPage]];
      updatedWidgetLayouts.splice(insertPosition, 0, action.itemLayout);
      layouts[state.currentPage] = updatedWidgetLayouts;
      const updatedWidgetsList = [...widgets[state.currentPage]];
      updatedWidgetsList.splice(insertPosition, 0, action.widget);
      widgets[state.currentPage] = updatedWidgetsList;
      return {
        ...state,
        layouts,
        widgets,
      };
    case 'DELETE_WIDGET_FROM_CANVAS':
      return { ...state };
    case 'RESIZE_WIDGET':
      return { ...state };
    case 'CHANGE_WIDGET_POSITION':
      return { ...state };
  }
}

export { designReducer, initialState, type WidgetAction, type DesignState };
