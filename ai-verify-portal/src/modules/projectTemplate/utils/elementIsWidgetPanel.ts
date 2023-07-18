import { WIDGET_PANEL_ID } from '../widgetPropertiesPanel';

export function elementIsWidgetPanel(clickedElement: HTMLElement): boolean {
  let el: HTMLElement | null = clickedElement;
  do {
    if (!el) return false;
    if (
      el.id === WIDGET_PANEL_ID ||
      el.id === 'widgetPropertiesDialog' ||
      el.id === 'gridItemActionMenu'
    ) {
      return true;
    }
    el = el.parentElement;
  } while (el);
  return false;
}
