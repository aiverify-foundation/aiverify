import { Layout } from 'react-grid-layout';
import { Widget } from '@/app/types';
import { findWidgetInsertPosition } from './utils/findWidgetInsertPosition';

type DesignState = {
  currentPage: number;
  widgetLayouts: Layout[][];
  widgets: Widget[][];
};

type WidgetAction =
  | {
      type: 'ADD_WIDGET_TO_CANVAS';
      widgetLayout: Layout;
      widget: Widget;
    }
  | {
      type: 'DELETE_WIDGET_FROM_CANVAS';
      widgetIndex: number;
    }
  | {
      type: 'RESIZE_WIDGET';
      widgetIndex: number;
      widgetLayout: Layout;
    }
  | {
      type: 'CHANGE_WIDGET_POSITION';
      widgetIndex: number;
      targetIndex: number;
    };

const initialState: DesignState = {
  currentPage: 0,
  widgetLayouts: [[]],
  widgets: [[]],
};

function designReducer(state: DesignState, action: WidgetAction): DesignState {
  switch (action.type) {
    case 'ADD_WIDGET_TO_CANVAS':
      const { widgetLayouts, widgets } = state;
      const { widgetLayout, widget } = action;
      const insertPosition = findWidgetInsertPosition(
        widgetLayouts[state.currentPage],
        widgetLayout
      );
      const updatedWidgetLayouts = [...widgetLayouts[state.currentPage]];
      updatedWidgetLayouts.splice(insertPosition, 0, widgetLayout);
      widgetLayouts[state.currentPage] = updatedWidgetLayouts;
      const updatedWidgetsList = [...widgets[state.currentPage]];
      updatedWidgetsList.splice(insertPosition, 0, widget);
      widgets[state.currentPage] = updatedWidgetsList;
      return {
        ...state,
        widgetLayouts,
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
