
class options_chart_strategy {

  constructor(guid) {
    this.id = `options_chart_strategy_${guid}`;
    this.body = document.createElement("table");
    const header = this.body.insertRow(0);
    const title = header.insertCell(0);
  }

  get_id() { return this.id; }

  get_body() { return this.body; }

}

export { options_chart_strategy }
