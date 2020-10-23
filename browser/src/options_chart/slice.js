import { guid, b_search, clamp } from "../utils/browser_utils.js";
import { theoretical } from "../utils/bs.js";

class slice {

  constructor(container, guid) {
    this.container = container;                   // not used
    this.id = `options_chart_slice_${guid}`;
    this.body = document.createElement("table");
    this.body.className += "test";
    this.expiry_range = 13;
    this.strike_range = 7;
    this.formatter = new Intl.DateTimeFormat(
                                              "en-US",
                                              {
                                                day: "numeric",
                                                month: "short",
                                                year: "2-digit"
                                              }
                                            );
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
    return `${parts[2].value} ${parts[0].value}` +
            ` ${parts[4].value} (${diff})`;
  }

  update(date, price, chain) {
    // used for theoretical price calculations
    const given_vol = parseInt(
                                document.getElementById(
                                  "options_chart_volatility"
                                ).value
                              );
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

    // clear table
    this.body.innerHTML = "";

    const header_row = this.body.insertRow(-1);

    // empty corner
    header_row.insertCell(-1);

    for (var i = 0; i < expiries.length; i++) {
      const expiry = expiries[i];
      const header = header_row.insertCell(-1);
      header.innerHTML = this.format_date(expiry);
      // header.className += "expiry_label_cell";
    }

    // data rows
    for (var i = 0; i < strikes.length; i++) {
      const row = this.body.insertRow(-1);
      const label = row.insertCell(-1);
      label.innerHTML = strikes[i];
      // label.className += "strike_label_cell";
      for (var j = 0; j  < expiries.length; j++) {
        const contract = chain.get_contract(
                                              expiries[j],
                                              strikes[i],
                                              type
                                            );
        const value_cell = row.insertCell(-1);
        if (contract != undefined) {
          if (!isNaN(contract.value)) {
            value_cell.innerHTML = contract.value;
          } else {
            // TDA sometimes gives value and volatility as NaN for some reason,
            // so substitute theoretical value
             value_cell.innerHTML = theoretical(
                                                  chain.underlying,
                                                  contract.strike,
                                                  chain.rate,
                                                  given_vol,
                                                  contract.dte,
                                                  type
                                                ).toFixed(2);
            value_cell.style.color = "#FF0000";
          }
        }
      }
    }
  }

}

export { slice };
