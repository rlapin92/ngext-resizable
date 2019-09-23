import {ResizeDirection} from "./resizable-directions";

export interface ResizeHandler {
  element: HTMLElement;
  direction: ResizeDirection

}

/**
 * Configuration that is used with ResizableDirective
 */
export interface ResizableConfig {
  handlers?: ResizeHandler[];
  minSize?: {
    width: number;
    height: number;
  }
  /**
   * Configuration for the resizing using border of the container
   */
  defaultResize?: {
    enabled: boolean;
    /**
     * Defines the maximum distance in px between the edge and the cursor position when the resize trigger works
     */
    edgeOffset: number;
    /**
     * Defines the bit mask for direction.
     */
    allowedDirections: number;
  }
}
