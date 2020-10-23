import { guid } from "../utils/browser_utils.js";
import { slice } from "../options_chart/slice.js";
import { strategy } from "../options_chart/strategy.js";

class container {

  constructor(guid) {
    this.id = guid;
    this.canvas = document.createElement("div");
    this.body = document.createElement("table");
    this.slice = new slice(this, guid);

    const row = this.body.insertRow(0);
    const canvas_cell = row.insertCell(0);
    const slice_cell = row.insertCell(1);

    canvas_cell.appendChild(this.canvas);
    slice_cell.appendChild(this.slice.get_body());
  }

  get_id() { return this.id; }

  get_canvas() { return this.canvas; }

  get_body() { return this.body; }

  get_slice() { return this.slice; }

}

export { container };
