import { GRID_ITEM_CLASSNAME } from '../gridItemBoxOutline';

export function getGridItemElement(
  clickedElement: HTMLElement
): HTMLDivElement | undefined {
  let el: HTMLElement | null = clickedElement;
  do {
    if (!el) return;
    if (el.classList.contains(GRID_ITEM_CLASSNAME)) {
      return el as HTMLDivElement;
    }
    el = el.parentElement;
  } while (el);
  return;
}
