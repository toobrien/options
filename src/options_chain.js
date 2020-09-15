const { sleep } = require("../src/utils");
const fs = require("fs");

class options_chain {

  async poll(ms) {
    while(true) {
      this.get_quotes();
      await sleep(ms);
    }
  }

  refresh_contracts() {
    this.contracts = document.getElementById("contracts").value.split('\n');
    var writable = JSON.stringify(this.contracts);
    fs.writeFile("./data/contracts.json", writable.toString(),
      () => console.log("refresh_contracts:", writable));
  }

  get_quotes() {
    // console.log("contracts:", contracts)
    if (this.contracts != undefined)
      this.client.quotes(this.contracts);
  }

  update_chain(response) {
    console.log("update:", response);
    var table = {};

    for (var contract in response) {
      var contract_data = response[contract];
      table[contract] = {};
      this.properties.forEach((property) => {
        table[contract][property] = contract_data[property];
      });
    }

    this.render_chain(table);
  }

  render_chain(table) {
    var text = this.header;

    for (var contract in table) {
      var data = table[contract];
      text += "<tr>";
      this.properties.forEach((property) => text += `<td>${data[property]}</td>`);
      text += "</tr>";
    };

    text = `<table>${text}</table>`
    // console.log("render:", text);
    document.getElementById("chain_view").innerHTML = text;
  }

  constructor(client) {
    this.client = client;
    this.contracts = JSON.parse(fs.readFileSync("./data/contracts.json"));
    document.getElementById("contracts").value = this.contracts.join("\n");

    this.properties = [
                  "symbol", "bidPrice", "askPrice", "bidSize", "askSize",
                  "lastPrice", "quoteTimeInLong", "tradeTimeInLong",
                  "openInterest", "volatility", "delta", "gamma", "theta",
                  "vega", "rho"
                ];
    this.header = "";
    this.properties.forEach((property) => {
      this.header += `<td>${property}</td>`;
    });
    this.header = `<tr>${this.header}</tr>`;

    this.client = new basic_client();
    this.client.on("quotes", this.update_chain.bind(this));

    this.poll(2000);
  }

}
