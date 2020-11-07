import { register_data_listener } from "../src/utils/browser_utils.js";

class time_and_sales {

  tick(data) {
    const ticks = data["content"];

    if (!Array.isArray(ticks)) {
      console.log("time_and_sales.tick:", JSON.stringify(data, null, " "));
      return;
    }

    ticks.forEach((tick) => {
      const contract = tick["key"];

      if(contract in this.contracts) {
        const tape = document.getElementById(contract + "_tape");

        //  the first two rows are headers
        tape.insertRow(2);
        tape.rows[2].insertCell(0).innerHTML = tick["1"].toLocaleTimeString();
        tape.rows[2].insertCell(1).innerHTML = tick["2"];
        tape.rows[2].insertCell(3).innerHTML = tick["3"];

        if (tape.rows.length == this.max_length)
          tape.deleteRow(this.max_length - 1);
      }
    });
  }

  async add_contracts() {
    const new_contracts =
      document.getElementById("ts_contracts").value.split(",");

    new_contracts.forEach(async (contract) => {
      if (!(contract in this.contracts)) {                                      // this test fails for some reason

        if (!(await this.client.time_and_sales(new_contracts))) {               // subscribe to time and sales api
          return;
        }

        this.contracts[contract] = {};                                          // register contract

        const tape = document.createElement("table");                           // create tape and add to "tape_row"
        tape.id = `${contract}_tape`;

        tape.insertRow(0);                                                      // title row
        tape.rows[0].insertCell(0);
        tape.rows[0].cells[0].colSpan = 3;
        tape.rows[0].cells[0].style.textAlign = "center";
        tape.rows[0].cells[0].innerHTML = contract;

        tape.insertRow(1);                                                      // headers

        ["timestamp", "price", "qty"].forEach((header, i, arr) => {
          const header_cell = tape.rows[1].insertCell(i);
          header_cell.style.textAlign = "center";
          header_cell.style.fontWeight = "bold";
          header_cell.innerHTML = header;
        });

        const container = document.createElement("td");     // each tape is a new cell in "tape_row"
        container.id = `${contract}_cell`;
        container.appendChild(tape);
        document.getElementById("tape_row").appendChild(container);
      }
    });
  }

  remove(contract) {
    if ((contract in this.contracts)) {
      delete this.contracts[contract];
      document.getElementById(`${contract}_cell`).remove();
    }
  }

  remove_contracts() {
    document.getElementById("ts_contracts").value.split("\n").forEach(
      contract => this.remove(contract)
    );
  }

  // quick fix: just delete everything if real-time-data is deactivated
  // the websocket goes away and all subscriptions are lost
  reset(real_time_data) {
    if (!real_time_data) {
      for (var contract in this.contracts)
        this.remove(contract);
      document.getElementById("tape_row").innerHTML =
        `this tool is incomplete. if you would like to use it, please log-in and tick the real-time data box first.`;
    } else
      document.getElementById("tape_row").innerHTML = "";

  }

  constructor(client) {
    this.contracts = {}
    this.client = client;
    this.max_length = 50;
    register_data_listener(this.reset.bind(this));
    this.reset(false);
    client.register("time_and_sales", this.tick.bind(this));
  }

}

export { time_and_sales };
