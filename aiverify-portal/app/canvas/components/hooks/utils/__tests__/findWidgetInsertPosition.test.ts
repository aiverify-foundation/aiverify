import { Layout } from 'react-grid-layout';
import { findWidgetInsertPosition } from '../findWidgetInsertPosition';

describe('findWidgetInsertPosition', () => {
  it('returns 0 for empty array', () => {
    const layouts: Layout[] = [];
    const newItem: Layout = { i: 'test', x: 0, y: 0, w: 1, h: 1 };

    const result = findWidgetInsertPosition(layouts, newItem);

    expect(result).toBe(0);
  });

  it('inserts item at beginning when Y position is less than all items', () => {
    const layouts: Layout[] = [
      { i: 'item1', x: 0, y: 2, w: 1, h: 1 },
      { i: 'item2', x: 1, y: 2, w: 1, h: 1 },
    ];
    const newItem: Layout = { i: 'new', x: 0, y: 1, w: 1, h: 1 };

    const result = findWidgetInsertPosition(layouts, newItem);

    expect(result).toBe(0);
  });

  it('inserts item at end when Y position is greater than all items', () => {
    const layouts: Layout[] = [
      { i: 'item1', x: 0, y: 0, w: 1, h: 1 },
      { i: 'item2', x: 1, y: 0, w: 1, h: 1 },
    ];
    const newItem: Layout = { i: 'new', x: 0, y: 3, w: 1, h: 1 };

    const result = findWidgetInsertPosition(layouts, newItem);

    expect(result).toBe(2);
  });

  it('inserts item in middle based on Y position', () => {
    const layouts: Layout[] = [
      { i: 'item1', x: 0, y: 0, w: 1, h: 1 },
      { i: 'item2', x: 1, y: 2, w: 1, h: 1 },
      { i: 'item3', x: 0, y: 4, w: 1, h: 1 },
    ];
    const newItem: Layout = { i: 'new', x: 0, y: 3, w: 1, h: 1 };

    const result = findWidgetInsertPosition(layouts, newItem);

    expect(result).toBe(2);
  });

  it('inserts item based on X position when Y positions are equal', () => {
    const layouts: Layout[] = [
      { i: 'item1', x: 0, y: 1, w: 1, h: 1 },
      { i: 'item2', x: 2, y: 1, w: 1, h: 1 },
      { i: 'item3', x: 4, y: 1, w: 1, h: 1 },
    ];
    const newItem: Layout = { i: 'new', x: 3, y: 1, w: 1, h: 1 };

    const result = findWidgetInsertPosition(layouts, newItem);

    expect(result).toBe(2);
  });

  it('inserts item at exact position when X and Y match existing item', () => {
    const layouts: Layout[] = [
      { i: 'item1', x: 0, y: 0, w: 1, h: 1 },
      { i: 'item2', x: 1, y: 1, w: 1, h: 1 },
      { i: 'item3', x: 2, y: 2, w: 1, h: 1 },
    ];
    const newItem: Layout = { i: 'new', x: 1, y: 1, w: 1, h: 1 };

    const result = findWidgetInsertPosition(layouts, newItem);

    expect(result).toBe(1);
  });

  it('handles complex positioning with multiple items', () => {
    const layouts: Layout[] = [
      { i: 'item1', x: 0, y: 0, w: 1, h: 1 },
      { i: 'item2', x: 1, y: 0, w: 1, h: 1 },
      { i: 'item3', x: 0, y: 1, w: 1, h: 1 },
      { i: 'item4', x: 1, y: 1, w: 1, h: 1 },
      { i: 'item5', x: 0, y: 2, w: 1, h: 1 },
    ];
    const newItem: Layout = { i: 'new', x: 1, y: 1, w: 1, h: 1 };

    const result = findWidgetInsertPosition(layouts, newItem);

    expect(result).toBe(3);
  });

  it('handles edge case with single item', () => {
    const layouts: Layout[] = [
      { i: 'item1', x: 0, y: 0, w: 1, h: 1 },
    ];
    const newItem: Layout = { i: 'new', x: 0, y: 0, w: 1, h: 1 };

    const result = findWidgetInsertPosition(layouts, newItem);

    expect(result).toBe(0);
  });
}); 