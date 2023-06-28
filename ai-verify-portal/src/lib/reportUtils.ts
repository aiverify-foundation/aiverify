// A4 size in pixels 150dpi
// const A4_PAPER_WIDTH = 1240;
// const A4_PAPER_HEIGHT = 1754;
export const A4_PAPER_WIDTH = 794;
export const A4_PAPER_HEIGHT = 1123;

// const A4_ASPECT_RATIO = 1.414;
export const COLUMNS = 12;
// const ROWS = 17;

export const MARGIN = 10;
export const WIDTH = A4_PAPER_WIDTH - MARGIN - MARGIN;
export const HEIGHT = A4_PAPER_HEIGHT - MARGIN - MARGIN;
// const ROW_HEIGHT = Math.floor(HEIGHT / ROWS);
export const ROW_HEIGHT = 30;
export const MAX_ROWS = Math.floor(HEIGHT / ROW_HEIGHT); // 37
