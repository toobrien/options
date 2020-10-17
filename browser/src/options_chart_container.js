import { guid } from "../src/browser_utils.js";
import { options_chart_slice } from "../src/options_chart_slice.js";
import { options_chart_strategy } from "../src/options_chart_strategy.js";

class options_chart_container {

  constructor(guid) {
    this.id = guid;
    this.canvas = document.createElement("div");
    this.body = document.createElement("table");
    this.slice = new options_chart_slice(this, guid);
    this.strategy = new options_chart_strategy(guid);

    const r1 = this.body.insertRow(0);
    const r2 = this.body.insertRow(1);
    const canvas_cell = r1.insertCell(0);
    const slice_cell = r1.insertCell(1);
    const null_cell = r2.insertCell(0);
    const strategy_cell = r2.insertCell(1);

    canvas_cell.rowspan = 2;
    canvas_cell.appendChild(this.canvas);
    slice_cell.appendChild(this.slice.get_body());
    strategy_cell.appendChild(this.strategy.get_body());
  }

  get_id() { return this.id; }

  get_canvas() { return this.canvas; }

  get_body() { return this.body; }

  get_slice() { return this.slice; }

  get_strategy() { return this.strategy; }

}

export { options_chart_container };
