import { guid } from "../utils/browser_utils.js";
import { slice } from "../options_chart/slice.js";
import { strategy } from "../options_chart/strategy.js";

class container {

  constructor(parent) {
    this.id = guid();
    this.parent = parent;
    this.canvas = document.createElement("div");
    this.body = document.createElement("table");

    // slice depends on strategy, so initialize strategy first... bad
    this.strategy = new strategy(this, guid);
    this.slice = new slice(this, guid);

    const r1 = this.body.insertRow(0);
    const r2 = this.body.insertRow(1);

    const canvas_cell = r1.insertCell(0);
    const slice_cell = r1.insertCell(1);
    const close_cell = r2.insertCell(0)
    const strategy_cell = r2.insertCell(1);

    canvas_cell.style.verticalAlign = "top";
    close_cell.style.verticalAlign = "top";
    close_cell.style.textAlign = "center";

    const close_button = document.createElement("button");
    close_button.innerHTML = "X";
    close_button.addEventListener("click", (e) => {
      this.parent.remove_container(this.id);
    });

    canvas_cell.appendChild(this.canvas);
    close_cell.appendChild(close_button);
    slice_cell.appendChild(this.slice.get_body());
    strategy_cell.appendChild(this.strategy.get_body());
  }

  get_id() { return this.id; }

  get_canvas() { return this.canvas; }

  get_body() { return this.body; }

  get_slice() { return this.slice; }

  get_strategy() { return this.strategy; }

  get_parent() { return this.parent; }

  // called when user changes default rate or vol
  refresh() {
    this.strategy.refresh();
    this.slice.refresh();
  }

}

export { container };
