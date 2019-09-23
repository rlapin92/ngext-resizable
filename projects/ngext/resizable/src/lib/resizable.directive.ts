import {Directive, ElementRef, Input, NgZone, OnDestroy, OnInit, Renderer2} from '@angular/core';
import {fromEvent, merge, Subject} from "rxjs";
import {repeatWhen, switchMapTo, takeUntil} from "rxjs/operators";
import {ResizableConfig, ResizeHandler} from "./resizable-config";
import {ResizeDirection} from "./resizable-directions";
import * as _ from 'lodash';

const RESIZE_DIRECTIONS = {
  UP: 1 << 1,
  LEFT: 1 << 2,
  RIGHT: 1 << 3,
  DOWN: 1 << 4,
  NONE: 0
};

@Directive({
  selector: '[resizable]'
})
export class ResizableDirective implements OnInit, OnDestroy {
  private _config: ResizableConfig = {
    defaultResize: {
      allowedDirections: ResizeDirection.ALL,
      edgeOffset: 10,
      enabled: true
    }
  };
  private handlers = [];

  @Input('resizable') set config(newConfig: ResizableConfig) {
    this._config = _.merge(this._config, newConfig);
  }

  direction = 0;
  private unsubscribe$ = new Subject();

  constructor(private elementRef: ElementRef, private renderer: Renderer2, private ngZone: NgZone) {

  }

  addHandler(handler: ResizeHandler) {
    const event$ = fromEvent(handler.element, 'mousedown');
    event$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(evt => {
        this.direction = handler.direction;
      });
    this.handlers.push(event$);

  }


  ngOnInit(): void {
    this.ngZone.runOutsideAngular(() => {
      const mouseDown$ = fromEvent(window, 'mousedown');
      this._config.handlers.map(this.addHandler.bind(this));
      const mouseUp$ = fromEvent(window, 'mouseup').pipe(takeUntil(this.unsubscribe$));
      const mouseMove$ = fromEvent(window, 'mousemove').pipe(takeUntil(this.unsubscribe$));
      merge(mouseDown$, ...this.handlers).pipe(switchMapTo(mouseMove$.pipe(takeUntil(mouseUp$))))
        .subscribe((evt: MouseEvent) => {
          evt.preventDefault();
          const width = parseInt(this.elementRef.nativeElement.offsetWidth);
          const left = parseInt(this.elementRef.nativeElement.offsetLeft);
          const top = parseInt(this.elementRef.nativeElement.offsetTop);
          const height = parseInt(this.elementRef.nativeElement.offsetHeight);
          if (this.direction & RESIZE_DIRECTIONS.RIGHT) {
            const newWidth = evt.clientX - window.scrollX - left;
            if (newWidth >= _.get(this._config, 'minSize.width', 0)) {
              this.renderer.setStyle(this.elementRef.nativeElement, 'width', newWidth + 'px');
            }
          }
          if (this.direction & RESIZE_DIRECTIONS.DOWN) {
            let newHeight = evt.clientY - top + window.scrollY;
            if (newHeight >= _.get(this._config, 'minSize.height', 0)) {
              this.renderer.setStyle(this.elementRef.nativeElement, 'height', newHeight + 'px');
            }
          }
          if (this.direction & RESIZE_DIRECTIONS.LEFT) {
            const newWidth = width + window.scrollX + left - evt.clientX;
            if (newWidth >= _.get(this._config, 'minSize.width', 0)) {
              this.renderer.setStyle(this.elementRef.nativeElement, 'left', evt.clientX + 'px');
              this.renderer.setStyle(this.elementRef.nativeElement, 'width', newWidth + 'px');
            }
          }
          if (this.direction & RESIZE_DIRECTIONS.UP) {
            let newHeight = height + window.scrollY + top - evt.clientY;
            if (newHeight >= _.get(this._config, 'minSize.height', 0)) {
              this.renderer.setStyle(this.elementRef.nativeElement, 'top', evt.clientY + 'px');
              this.renderer.setStyle(this.elementRef.nativeElement, 'height', newHeight + 'px');
            }
          }
        });


      mouseMove$.pipe(takeUntil(mouseDown$), repeatWhen(() => mouseUp$)).subscribe(
        (evt: MouseEvent) => {
          const rect = this.elementRef.nativeElement.getBoundingClientRect();
          this.direction = 0;
          if (this.intersectsLeft(rect, evt)) {
            this.direction |= RESIZE_DIRECTIONS.LEFT;
          }
          if (this.intersectsRight(rect, evt)) {
            this.direction |= RESIZE_DIRECTIONS.RIGHT;
          }
          if (this.intersectsTop(rect, evt)) {
            this.direction |= RESIZE_DIRECTIONS.UP;
          }
          if (this.intersectsBottom(rect, evt)) {
            this.direction |= RESIZE_DIRECTIONS.DOWN;
          }
          this.updateCursor();
        });
    });

  }

  private intersectsBottom(rect, {clientY: y}) {
    return rect.bottom > y && rect.bottom - y < this._config.defaultResize.edgeOffset;
  }

  private intersectsTop(rect, {clientY: y}) {
    return rect.top < y && y - rect.top < this._config.defaultResize.edgeOffset;
  }

  private intersectsRight(rect, {clientX: x}) {
    return rect.right > x && rect.right - x < this._config.defaultResize.edgeOffset;
  }

  private intersectsLeft(rect, {clientX: x}) {
    return rect.left < x && x - rect.left < this._config.defaultResize.edgeOffset;
  }

  private updateCursor() {
    this.renderer.setStyle(document.body, 'cursor', this.getCursor());
  }

  private getCursor() {
    switch (this.direction) {
      case RESIZE_DIRECTIONS.DOWN:
        return 's-resize';
      case RESIZE_DIRECTIONS.DOWN | RESIZE_DIRECTIONS.LEFT:
        return 'sw-resize';
      case RESIZE_DIRECTIONS.DOWN | RESIZE_DIRECTIONS.RIGHT:
        return 'se-resize';
      case RESIZE_DIRECTIONS.UP:
        return 'n-resize';
      case RESIZE_DIRECTIONS.UP | RESIZE_DIRECTIONS.LEFT:
        return 'nw-resize';
      case RESIZE_DIRECTIONS.UP | RESIZE_DIRECTIONS.RIGHT:
        return 'ne-resize';
      case RESIZE_DIRECTIONS.LEFT:
        return 'w-resize';
      case RESIZE_DIRECTIONS.RIGHT:
        return 'e-resize';
      default:
        return 'inherit';
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
