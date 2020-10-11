import { send_request, sleep } from "../src/browser_utils.js";

class options_chain {

  // de-activate when tab is closed
  async poll_quotes(ms) {
    while(this.active) {
      if (this.contracts.length > 0) {
        const quotes = await this.client.quotes(this.contracts)
        this.update_data(quotes);
      }
      await sleep(ms);
    }
  }

  update_data(response) {
    this.update_chain_data(response);
    this.update_charts(response);
  }

  refresh_contracts() {
    const new_contracts = document.getElementById("opt_contracts").value;

    if (new_contracts != "") {
      this.active = true;
      this.contracts = new_contracts.split("\n");
      this.update_chain();
      this.poll_quotes(this.interval);
    } else {
      this.active = false;
      this.contracts = [];
      this.update_chain();
    }

    try {
      window.localStorage.setItem("contracts", JSON.stringify(this.contracts));
    } catch (e) {
      console.log("refresh_contracts:", e);
    }
  }

  // https://github.com/tradingview/lightweight-charts/blob/master/docs/series-basics.md
  update_charts(response) {
    for (var contract in response) {
      if (contract in this.charts) {
        const contract_data = response[contract];
        const bid_price = contract_data["bidPrice"];
        const ask_price = contract_data["askPrice"];
        const last_price = contract_data["lastPrice"];
        const theoretical_option_value =
          contract_data["theoreticalOptionValue"];

        const ts = Date.now() / 1000;

        this.charts[contract].bid_price.update({time: ts, value: bid_price});
        this.charts[contract].ask_price.update({time: ts, value: ask_price});
        this.charts[contract].last_price.update({time: ts, value: last_price});
        this.charts[contract].theoretical_option_value.update(
          { time: ts, value: theoretical_option_value }
        );
      }
    }

    // need to remove chart here
  }

  add_chart(contract) {

    if (!(contract in this.charts)) {
      const chart = window.LightweightCharts.createChart(
                document.getElementById("chart_view"),
                { width: 1800, height: 250 }
              );

      const bid_price = chart.addLineSeries({
        title: "bid",
        lineStyle: window.LightweightCharts.LineStyle.Dotted
      });
      const ask_price = chart.addLineSeries({
        title: "ask",
        lineStyle: window.LightweightCharts.LineStyle.Dotted
      });
      const last_price = chart.addLineSeries({
        title: "last",
        color: "#800080"
      });
      const theoretical_option_value = chart.addLineSeries({
        title: "theoretical",
        color: "#ff0000"
      });

      bid_price.setData([]);
      ask_price.setData([]);
      last_price.setData([]);
      theoretical_option_value.setData([]);

      this.charts[contract] = {
        chart_ref: chart,
        bid_price: bid_price,
        ask_price: ask_price,
        last_price: last_price,
        theoretical_option_value: theoretical_option_value
       };
    }
  }

  // called after an update to this.contracts, update_chain adds and deletes
  // rows from the viewed table
  update_chain() {
    const new_contracts = {};
    const old_contracts = {};
    const rows = this.chain.rows;

    this.contracts.forEach((new_contract) => {
      new_contracts[new_contract] = true;
    });

    // delete stale rows, but keep header
    for (var i = 1; i < rows.length; i++) {
      var old_contract = rows[i].cells[0].innerHTML;

      if (!(old_contract in this.contracts)) {
        const row = this.chain.rows[i];
        var chart_cell = row.cells[row.cells.length - 1];
        chart_cell.removeChild[0];                    // for some reason... i need to delete the button
        this.chain.deleteRow(i--);
      }
    }

    // add rows for new contracts
    this.contracts.forEach((new_contract) => {
      if (!(new_contract in old_contracts)) {
        // don't duplicate old contracts
        const i = rows.length;
        this.chain.insertRow(i);

        // add symbol name in first column
        const symbol = rows[i].insertCell(0);
        symbol.innerHTML = new_contract;

        // add blank columns for each property
        var j = 1;
        for (; j < this.properties.length; j++)
          rows[i].insertCell(j);

        // add chart button
        const chart_cell = rows[i].insertCell(j);

        const chart_button = document.createElement("button");
        chart_button.innerHTML = "chart";
        chart_button.addEventListener(
          "click", () => { this.add_chart(new_contract); }
        );

        chart_cell.appendChild(chart_button);
      }
    });

  }

  // enter quotes into the chain
  update_chain_data(response) {
    const rows = this.chain.rows;

    for (var i = 1; i < rows.length; i++) { // skip header row
      const cells = rows[i].cells;
      const contract = cells[0].innerHTML;
      var data = undefined;

      // the response might have stale data... just skip and wait for next tick
      try {
        data = response[contract];
      } catch (e) {
        console.log(`update_chain_data: ${contract} not found\n${e}`);
        continue;
      }

      // format milliseconds as dates
      data["quoteTimeInLong"] =
        new Date(data["quoteTimeInLong"]).toLocaleString();
      data["tradeTimeInLong"] =
        new Date(data["tradeTimeInLong"]).toLocaleString();
      data["lastTradingDay"] =
        new Date(data["lastTradingDay"]).toLocaleString();

      // copy data into table
      this.properties.forEach((property, j, arr) => {
        cells[j].innerHTML = data[property];
      });
    }
  }

  constructor(client) {
    this.client = client;
    this.charts = {};
    this.contracts = [];
    this.interval = 2000;
    this.active = false;
    this.properties = [
                  "symbol", "underlyingPrice", "bidPrice", "askPrice",
                  "lastPrice", "theoreticalOptionValue", "bidSize", "askSize",
                  "lastSize", "quoteTimeInLong", "tradeTimeInLong",
                  "openInterest", "totalVolume", "volatility", "delta", "gamma",
                  "theta","vega", "rho", "lastTradingDay"
                ];

    // create chain (table)
    this.chain = document.createElement("TABLE");
    const header = this.chain.insertRow(0);

    this.properties.forEach((property) => {
      const cell = header.insertCell(header.cells.length);
      cell.style.textAlign = "center";
      cell.style.fontWeight = "bold";
      cell.innerHTML = property;
    });

    document.getElementById("chain_view").appendChild(this.chain);

    // try to initialize contracts and table from local storage
    try {
      const stored_contracts =
        JSON.parse(window.localStorage.getItem("contracts"));

      if (Array.isArray(stored_contracts)) {
        document.getElementById("opt_contracts").value =
          stored_contracts.join("\n");
      }
    } catch (e) {
      console.log("options_chain (constructor):", e);
    }

  }

}

export { options_chain };
