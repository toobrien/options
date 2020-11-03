import { theoretical, itm, below } from "../utils/bs.js";

class strategy {

  constructor(container) {
    this.container = container;
    this.guid = this.container.get_id();
    this.id = `options_chart_strategy_${this.guid}`;
    this.body = document.createElement("table");
    this.contracts = {};
    this.line_settings = { lineWidth: 1 };
    this.look_ahead = 1000;
    this.formatter = new Intl.DateTimeFormat(
                                              "en-US",
                                              {
                                                day: "numeric",
                                                month: "short",
                                                year: "2-digit"
                                              }
                                            );
  }

  // shallow copy... any problem?
  add_contract(data) {
    data.sim_value = data.value;
    this.contracts[data.id] = data;
  }

  // stop calculating a contract's theoretical value and remove it from the UI
  remove_contract(id) {
    const chart = this.container.get_parent().get_container(this.guid).chart;

    delete this.contracts[id];

    const cell = document.getElementById(`${this.id}_${id}_row`);
    if (cell != undefined) cell.remove();
    if (chart.active_contract == id) {
      this.remove_expirations(chart);
      this.remove_stdev_series(chart);
      chart.active_contract = undefined;
    }

    if (Object.keys(this.contracts).length == 0)
      this.body.innerHTML = "";
  }

  contains_contract(id) { return id in this.contracts; }

  // updates the theoretical values of contracts selected from the slice
  update(date, price) {
    // store for refresh
    this.date = date;
    this.price = price;

    const chart = this.container.get_parent().get_container(this.guid).chart;

    if (Object.keys(this.contracts).length == 0)
      return;

    const rate = parseFloat(
                            document.
                            getElementById("options_chart_rate")
                            .value
                          );

    const start_time = Date.parse(chart.start_date);
    const until_date = Math.ceil((date.getTime() - start_time) / 86400000);

    for (var key in this.contracts) {
      const contract = this.contracts[key];

      // calculate dates until expiration
      const exp_date = new Date();
      exp_date.setDate(exp_date.getDate() + contract.dte);
      const diff = (exp_date.getTime() - date.getTime())
      const dte = Math.ceil(diff / 86400000);

      contract.sim_dte = dte;

      // calculate future values from the cursor's location
      contract.sim_value = theoretical(
                                        price,
                                        contract.strike,
                                        rate,
                                        contract.volatility,
                                        dte,
                                        contract.type
                                      );

      contract.itm = itm(
                          price, contract.strike, contract.volatility,
                          dte, contract.type
                        ).toFixed(2);
      contract.otm = (1 - parseFloat(contract.itm)).toFixed(2);
      contract.below = below(
                              chart.start_price, price,
                              contract.volatility, until_date
                            ).toFixed(2);
      contract.above = (1 - parseFloat(contract.below)).toFixed(2);

      contract.itm = isNaN(contract.itm) ? "exp" : contract.itm;
      contract.otm = isNaN(contract.otm) ? "exp" : contract.otm;
      contract.below = isNaN(contract.below) ? "exp" : contract.below;
      contract.above = isNaN(contract.above) ? "exp" : contract.above;
    }

    this.render(chart);
  }

  // draws strategy table beneath slice table, showing how select contract
  // values change over time
  render(chart) {
    this.body.innerHTML = "";

    const table = document.createElement("table");
    table.className += "test";

    const header = table.insertRow(0);
    header.id = `${this.id}_header`;
    header.insertCell(0).innerHTML = "contract";
    header.insertCell(1).innerHTML = "value";
    header.insertCell(2).innerHTML = "volatility";
    header.insertCell(3).innerHTML = "% below";
    header.insertCell(4).innerHTML = "% above";
    header.insertCell(5).innerHTML = "% itm";
    header.insertCell(6).innerHTML = "% otm";
    header.insertCell(7).innerHTML = "pnl (short)";
    header.insertCell(8).innerHTML = "pnl (long)";

    // for highlighting active contract
    for (var key in this.contracts) {
      const contract = this.contracts[key];
      const row = table.insertRow(-1);

      row.insertCell(0).innerHTML = this.format_contract(
                                                          contract.id,
                                                          contract.sim_dte
                                                        );
      row.insertCell(1).innerHTML = this.format_price(contract.sim_value);
      row.insertCell(2).appendChild(this.get_vol_field(row.cells[2], contract));
      row.insertCell(3).innerHTML = contract.below;
      row.insertCell(4).innerHTML = contract.above;
      row.insertCell(5).innerHTML = contract.itm;
      row.insertCell(6).innerHTML = contract.otm;
      row.insertCell(7).innerHTML = this.format_price(
                                      contract.value - contract.sim_value
                                    );
      row.insertCell(8).innerHTML = this.format_price(
                                      contract.sim_value - contract.value
                                    );

      // for modifying by vol_field or removing
      row.id = `${this.id}_${contract.id}_row`;

      // for drawing stdev lines on chart
      row.cells[0].id = `${contract.id}_strategy_cell`;
      row.cells[0].addEventListener(
        "click",
        (e) => this.update_graph(e.target, contract.volatility, chart)
      );

      if (chart.active_contract === contract.id)
        row.cells[0].className = "active_contract";
    }

    this.body.appendChild(table);
  }

  // return per-contract volatility modulator
  get_vol_field(cell, contract) {
    const chart = this.container.get_parent().get_container(this.guid).chart;
    const vol_field = document.createElement("input");

    vol_field.type = "text";
    vol_field.size = 4;
    vol_field.value = contract.volatility.toFixed(2);

    vol_field.addEventListener("change", (e) => {
      contract.volatility = parseFloat(e.target.value);

      if (chart.active_contract == contract.id) {
        this.remove_stdev_series(chart);
        this.add_stdev_series(chart, contract.volatility);
      }

      this.refresh();
    });

    return vol_field;
  }

  // highlights the active cell and draws standard deviation series on chart
  update_graph(cell, vol, chart) {
    const active_contract = chart.active_contract;
    const cell_contract = cell.id.split("_")[0];

    if (active_contract != undefined) {
      this.remove_expirations(chart);
      this.remove_stdev_series(chart);
      chart.active_contract = undefined;
      document.getElementById(`${active_contract}_strategy_cell`)
              .className = "";
    }

    if (active_contract != cell_contract) {
      chart.active_contract = cell_contract;
      this.add_expirations(chart);
      this.add_stdev_series(chart, vol);
      cell.className = "active_contract";
    }

    chart.ref.timeScale().setVisibleRange({
      from: (Date.parse(chart.start_date) - (100 * 86400000)) / 1000,
      to: (Date.parse(chart.start_date) + (100 * 86400000)) / 1000
    });
  }

  // draw one standard deviation expected moves on chart
  add_stdev_series(chart, vol) {
    vol /= 100;

    const stdev_up_series = chart.ref.addLineSeries(this.line_settings);
    const stdev_down_series = chart.ref.addLineSeries(this.line_settings);
    const stdev_up_data = [];
    const stdev_down_data = [];
    const start_date = Date.parse(chart.start_date);
    const start_price = chart.start_price;

    for (var i = 1; i < this.look_ahead; i++) {
      const next = new Date(start_date);
      next.setDate(next.getDate() + i);
      const next_str = next.toISOString();
      const next_price_up = start_price * Math.exp(vol * Math.sqrt(i / 365));
      const next_price_down = start_price * Math.exp(-vol * Math.sqrt(i / 365));
      stdev_up_data.push({ time: next_str, value: next_price_up });
      stdev_down_data.push({ time: next_str, value: next_price_down });
    }

    stdev_up_series.setData(stdev_up_data);
    stdev_down_series.setData(stdev_down_data);
    chart.stdev_up_series = stdev_up_series;
    chart.stdev_down_series = stdev_down_series;
  }

  // remove one standard deviation expected move series from charts
  remove_stdev_series(chart) {
    if (
          chart.stdev_up_series != undefined &&
          chart.stdev_down_series != undefined
        )
    chart.ref.removeSeries(chart.stdev_up_series);
    chart.ref.removeSeries(chart.stdev_down_series);
    chart.stdev_up_series = undefined;
    chart.stdev_down_series = undefined;
  }

  add_expirations(chart) {
    const root = document.querySelector(".tv-lightweight-charts");
    const viewport = root.querySelector(
                      "tr:nth-child(1) td:nth-child(2) > div"
                    );
    const active_contract = parseInt(chart.active_contract.split("_"[0]));

    chart.expirations.forEach((expiration) => {
      if (Date.parse(expiration.time) == active_contract)
        expiration.ref.style.borderLeft = "1px solid red";

      viewport.appendChild(expiration.ref);

      expiration.ref.style.left =
        `${chart.ref.timeScale().timeToCoordinate(expiration.time)}px`;
    });
  }

  remove_expirations(chart) {
    const active_contract = parseInt(chart.active_contract.split("_")[0]);

    chart.expirations.forEach((expiration) => {
      if (Date.parse(expiration.time) == active_contract)
        expiration.ref.style.borderLeft = "1px solid blue";
      expiration.ref.remove();
    });
  }

  // show month, day, year, strike price, and days to expiration
  format_contract(contract_id, dte) {
    const parts = contract_id.split(":");
    const type = parts[2].substring(0, parts[2].length - 1);  // trim "s"
    const date = this.formatter.formatToParts(parts[0]);

    return `${parseInt(date[2].value) + 1} ${date[0].value}` +
            ` ${date[4].value} ${parts[1]} ${type} (${dte})`;
  }

  format_price(price) {
    return (isNaN(price) ? 0 : price).toFixed(2);
  }

  get_id() { return this.id; }

  get_body() { return this.body; }

  // called when user changes default rate or vol
  // chain.refresh() must be called first, in options_chart.refresh()
  refresh() {
    if (this.date && this.price)
      this.update(this.date, this.price);
  }

}

export { strategy };
