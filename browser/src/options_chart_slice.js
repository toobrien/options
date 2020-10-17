import { guid } from "../src/browser_utils.js";

class options_chart_slice {

  constructor(container, guid) {
    this.container = container;                   // not used
    this.id = `options_chart_slice_${guid}`;
    this.body = document.createElement("table");
    this.expiry_range = 10;
    this.strike_range = 5;
  }

  get_id() { return this.id; }

  get_body() { return this.body; }

  update(date, price, chain) {
    const type_select = document.getElementById("options_chart_type");
    const type = type_select.options[type_select.selectedIndex].text;

    const contracts = this.lookup(date, price, chain)[type];

    this.body.innerHTML = "";

    // format row headers and column labels
    var min_expiry = undefined;
    const rows = {};
    const cols = {};

    // expiries
    const header_row = this.body.insertRow(-1);

    // empty corner
    header_row.insertCell(-1);

    var i = 1;
    for (var expiry in contracts) {
      const header = header_row.insertCell(-1);
      try {
        // header.innerHTML = new Date(expiry).toISOString().split("T")[0];
        header.innerHTML = expiry;
        min_expiry = (min_expiry == undefined) || min_expiry < expiry ?
          expiry : min_expiry;
        cols[expiry] = i++;
      } catch (e) {
        console.log(e, expiry);
      }
    }

    // use the front contract as a reference for the columns, since it should
    // have the most strikes... this is probably a bad assumption
    var i = 1;
    for (var strike in contracts[min_expiry]) {
      const row = this.body.insertRow(-1);
      const label = row.insertCell(-1);
      label.innerHTML = strike;
      rows[strike] = i++;
    }

    // populate table
    for (var expiry in contracts) {
      const strikes = contracts[expiry];
      for (var strike in strikes) {
        const r = rows[strike];
        const c = cols[expiry];
        if (r && c) {
          while (this.body.rows[r].cells[c] == null)
            this.body.rows[r].insertCell(-1);

          this.body.rows[r].cells[c].innerHTML =
            strikes[strike].theoretical_value;
        }
      }
    }
  }

  b_search(val, arr) {
    var i = 0;
    var j = arr.length - 1;
    var m = -1;

    while(i < j) {
      m = parseInt((i + j) / 2);

      if (val > arr[m]) {
        i = m + 1;
      } else if (val < arr[m]) {
        j = m - 1;
      } else if (val == arr[m]) {
        break;
      }
    }

    return m;
  }

  clamp(mid, arr, range) {
    mid = mid < 0 ? 0 : mid;
    mid = mid > arr.length - 1 ? arr.length - 1 : mid;

    const half = parseInt(range / 2);
    const start = mid - half < 0 ? 0 : mid - half;
    const end = mid + half > arr.length - 1 ? arr.length - 1 : mid + half;

    return {
      start: start,
      end: end
    };
  };

  // retrieve nearest contracts
  lookup(date, price, chain) {
    const results = {
      expiries: [],
      calls: {},
      puts: {}
    };

    // find expiries near date
    const mid_date = this.b_search(date, chain.expiries);
    const date_range = this.clamp(
      mid_date, chain.expiries, this.expiry_range
    );

    for (var i = date_range.start; i <= date_range.end; i++)
      results.expiries.push(chain.expiries[i]);

    // find strikes near price
    results.expiries.forEach((expiry) => {
      results.calls[expiry] = {};
      results.puts[expiry] = {};
      const calls = chain.calls[expiry];
      const puts = chain.puts[expiry];

      // assume puts and calls have same strikes
      const mid_price = this.b_search(price, calls.strike_list);
      const price_range = this.clamp(
                                      mid_price,
                                      calls.strike_list,
                                      this.strike_range
                                    );

      for (var i = price_range.start; i <= price_range.end; i++) {
        const strike = calls.strike_list[i];
        // shallow copy
        // assumes that for every strike has both a put and a call
        results.calls[expiry][strike] = chain.calls[expiry][strike];
        results.puts[expiry][strike] = chain.puts[expiry][strike];
      }
    });

    return results;
  }

}

export { options_chart_slice };
