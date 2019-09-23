/**
 * Determines in which direction resizable objects is resizing
 */
export enum ResizeDirection {
  UP = 1 << 1,
  LEFT = 1 << 2,
  RIGHT = 1 << 3,
  DOWN = 1 << 4,
  ALL = UP | LEFT | RIGHT | DOWN,
  NONE = 0
};
