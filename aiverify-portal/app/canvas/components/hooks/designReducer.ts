import { Layout } from 'react-grid-layout';
import { type WidgetCompositeId } from '@/app/canvas/components/designer';
import { Widget, WidgetToRender } from '@/app/types';
import { findWidgetInsertPosition } from './utils/findWidgetInsertPosition';

type DesignState = {
  currentPage: number;
  widgetLayouts: Layout[][];
  widgetToRender: WidgetToRender[][];
};

type WidgetAction =
  | {
      type: 'ADD_WIDGET_TO_CANVAS';
      widgetLayout: Layout;
      widgetToRender: WidgetToRender;
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
  widgetLayouts: [],
  widgetToRender: [],
};

function designReducer(state: DesignState, action: WidgetAction): DesignState {
  switch (action.type) {
    case 'ADD_WIDGET_TO_CANVAS':
      const { widgetLayouts, widgetToRender: widgetToRenderState } = state;
      const { widgetLayout, widgetToRender } = action;
      const insertPosition = findWidgetInsertPosition(
        widgetLayouts[state.currentPage],
        widgetLayout
      );
      widgetLayouts[state.currentPage].splice(insertPosition, 0, widgetLayout);
      widgetToRenderState[state.currentPage].splice(
        insertPosition,
        0,
        widgetToRender
      );
      return { ...state, widgetLayouts, widgetToRender: widgetToRenderState };
    case 'DELETE_WIDGET_FROM_CANVAS':
      return { ...state };
    case 'RESIZE_WIDGET':
      return { ...state };
    case 'CHANGE_WIDGET_POSITION':
      return { ...state };
  }
}

export { designReducer, initialState, type WidgetAction, type DesignState };
