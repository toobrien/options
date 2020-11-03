import { guid, b_search, clamp } from "../utils/browser_utils.js";

class slice {

  constructor(container, guid) {
    this.container = container;                  // not used
    this.id = `options_chart_slice_${guid}`;
    this.body = document.createElement("table");
    this.body.className += "test";
    this.expiry_range = 13;
    this.strike_range = 7;
    this.default_vol = 30;                       // no contract vol, no user vol
    this.formatter = new Intl.DateTimeFormat(
                                              "en-US",
                                              {
                                                day: "numeric",
                                                month: "short",
                                                year: "2-digit"
                                              }
                                            );
    this.strategy = container.get_strategy();
  }

  get_id() { return this.id; }

  get_body() { return this.body; }

  format_date(expiry) {
    const d = new Date(parseInt(expiry));
    const diff = Math.ceil(
                                new Date(d - new Date())
                                .getTime() / 86400000
                              );
    const parts = this.formatter.formatToParts(d);
    return `${parseInt(parts[2].value) + 1} ${parts[0].value}` +
            ` ${parts[4].value} (${diff})`;
  }

  // retrieve slice of options chain nearest user click
  update(date, price, chain) {
    // store for refresh
    this.date = date;
    this.price = price;
    this.chain = chain;

    // used for theoretical price calculations
    const expiries = chain.get_nearest_expiries(
                                                date.getTime(),
                                                this.expiry_range
                                              );
    const strikes = chain.get_nearest_strikes(
                                                price,
                                                this.strike_range
                                              ).reverse();

    // puts or calls
    const type_select = document.getElementById("options_chart_type");
    const type = type_select.options[type_select.selectedIndex].text;

    this.render(chain, expiries, strikes, type);
  }

  // render slice of options chain
  render(chain, expiries, strikes, type) {
    // clear table
    this.body.innerHTML = "";

    // header row
    const header_row = this.body.insertRow(-1);
    const type_cell = header_row.insertCell(-1);
    type_cell.innerHTML = type;

    for (var i = 0; i < expiries.length; i++) {
      const expiry = expiries[i];
      const header = header_row.insertCell(-1);
      header.innerHTML = this.format_date(expiry);
    }

    // data rows
    for (var i = 0; i < strikes.length; i++) {
      const row = this.body.insertRow(-1);
      const label = row.insertCell(-1);
      label.innerHTML = strikes[i];

      for (var j = 0; j  < expiries.length; j++) {
        const expiry = expiries[j];
        const strike = strikes[i]
        const contract = chain.get_contract(expiry, strike, type);
        const value_cell = row.insertCell(-1);

        if (contract != undefined) {
          // TDA sometimes gives value and volatility as NaN for some reason,
          // so mark these red and give them default volatility
          if (contract.default)
            value_cell.style.color = "#FF0000";

          value_cell.id = `${contract.id}_value_cell`;
          value_cell.innerHTML = contract.value;

          if (this.strategy.contains_contract(contract.id))
            value_cell.className += "active_contract";

          value_cell.addEventListener(
                      "click",
                      (e) => {
                        if (this.strategy.contains_contract(contract.id)) {
                          this.strategy.remove_contract(contract.id);
                          value_cell.className = "";
                        } else {
                          this.strategy.add_contract(contract);
                          value_cell.className += "active_contract";
                        }
                      }
                    );
        }
      }
    }
  }

  // called when user changes default rate or vol
  // chain.refresh must be called first, in options_chart.refresh()
  refresh() {
    if (this.date && this.price && this.chain)
      this.update(this.date, this.price, this.chain);
  }

}

export { slice };
