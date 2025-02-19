const A4_WIDTH = 794; // ideal width of A4 page
const A4_HEIGHT = 1100; // ideal height of A4 page
const A4_MARGIN = 12; // margin of A4 page
const GRID_ROWS = 36; // number of rows of the grid
const GRID_COLUMNS = 12; // number of columns of the grid
const GRID_WIDTH = A4_WIDTH - A4_MARGIN * 2; // width of the grid within the A4 page
const GRID_HEIGHT = A4_HEIGHT - A4_MARGIN * 2; // height of the grid within the A4 page
const GRID_ROW_HEIGHT = GRID_HEIGHT / GRID_ROWS; // calculated height of each row in the grid
const CONTAINER_PAD = 100; // padding used to calculate virtual space at top and bottom of the free from content

export {
  A4_WIDTH,
  A4_HEIGHT,
  A4_MARGIN,
  GRID_ROWS,
  GRID_COLUMNS,
  GRID_WIDTH,
  GRID_ROW_HEIGHT,
  GRID_HEIGHT,
  CONTAINER_PAD,
};
