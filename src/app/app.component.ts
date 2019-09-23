import {Component, ViewChild} from '@angular/core';
import {ResizableConfig} from "../../projects/ngext/resizable/src/lib/resizable-config";
import {ResizeDirection} from "../../projects/ngext/resizable/src/lib/resizable-directions";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ngx-resizable';
  @ViewChild('right', {static: true}) rightDiv: HTMLElement;

  resizableConfig: ResizableConfig = {handlers: [{element: this.rightDiv, direction: ResizeDirection.RIGHT}]};
  visible = true;
}
