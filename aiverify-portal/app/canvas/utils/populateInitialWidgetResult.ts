import { WidgetOnGridLayout } from '@/app/canvas/types';

export function populateInitialWidgetResult(widget: WidgetOnGridLayout) {
  return {
    ...widget,
    result: widget.dependencies.reduce(
      (acc, dep) => ({
        ...acc,
        [`${widget.gid}:${dep.cid}`]: null,
      }),
      {} as Record<string, unknown>
    ),
  };
}
