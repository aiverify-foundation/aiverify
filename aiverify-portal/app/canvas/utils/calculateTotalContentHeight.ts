export function calculateTotalContentHeight(element: HTMLElement): number {
  let totalHeight = 0;
  const children = Array.from(element.children) as HTMLElement[];

  for (const child of children) {
    const computedStyle = window.getComputedStyle(child);
    const childHeight = child.getBoundingClientRect().height;
    const marginTop = parseFloat(computedStyle.marginTop) || 0;
    const marginBottom = parseFloat(computedStyle.marginBottom) || 0;
    totalHeight += childHeight + marginTop + marginBottom;
  }

  return totalHeight;
}
