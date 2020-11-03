import { b_search, clamp } from "../utils/browser_utils.js";
import { theoretical } from "../utils/bs.js";
import { index } from "../options_chart/index.js";

class chain {

  constructor(data) {
    this.symbol = data.symbol;
    this.rate = data.interestRate;
    this.underlying = data.underlyingPrice;
    this.expiries = new index("expiry");
    this.strikes = new index("strike");
    this.contracts = {};
    const d_vol = document.getElementById("options_chart_volatility");
    this.default_volatility = parseInt(d_vol.value);
    if (isNaN(this.default_volatility)) {
      d_vol.value = 30;
      this.default_volatility = 30;
    }

    this.build(data.putExpDateMap, "puts");
    this.build(data.callExpDateMap, "calls");

    this.expiries.finalize();
    this.strikes.finalize();
  }

  get_symbol() {
    return this.symbol;
  }

  get_expiries() { return this.expiries; }

  get_strikes() { return this.strikes; }

  // expiry should be milliseconds since epoch
  // date.parse(str) or date.getTime()
  get_nearest_expiries(expiry, range) {
    const idx = b_search(expiry, this.expiries.list);
    const limits = clamp(idx, this.expiries.list, range);
    const results = [];
    for (var i = limits.start; i <= limits.end; i++)
      results.push(this.expiries.list[i]);
    return results;
  }

  get_nearest_strikes(strike, range) {
    const idx = b_search(strike, this.strikes.list);
    const limits = clamp(idx, this.strikes.list, range);
    const results = [];
    for (var i = limits.start; i <= limits.end; i++)
      results.push(this.strikes.list[i]);
    return results;
  }

  get_contract(expiry, strike, type) {
    var result = undefined;
    const contract = `${expiry}:${strike}:${type}`;
    if (contract in this.contracts)
      result = this.contracts[contract];
    return result;
  }

  add_contract(expiry, strike, type, data) {
    var contract = `${expiry}:${strike}:${type}`;

    this.contracts[contract] = {
      id: contract,
      strike: data[0].strikePrice,
      volatility: data[0].volatility,
      value: data[0].theoreticalOptionValue,
      dte: data[0].daysToExpiration + 1,
      type: type,
      default: false
    };

    contract = this.contracts[contract];

    if (isNaN(contract.value)) {
      contract.volatility = this.default_volatility;
      contract.value = parseFloat(
                                  theoretical(
                                    this.underlying,
                                    contract.strike,
                                    this.rate,
                                    this.default_volatility,
                                    contract.dte,
                                    type
                                  ).toFixed(2)
                                );
      contract.default = true;
    }
  }

  build(map, type) {
    for (var expiry in map) {
      const expiry_data = map[expiry];
      const ms = Date.parse(expiry.split(":")[0]);
      this.expiries.add_location(ms);
      for (var strike in expiry_data) {
        const strike_data = expiry_data[strike];
        strike = parseFloat(strike);
        this.add_contract(ms, strike, type, strike_data);
        this.strikes.add_location(strike);
        this.expiries.add_heading(ms, strike);
        this.strikes.add_heading(strike, ms);
      }
    }
  }

  // called when user changes default rate or vol
  // this must be called before refreshing the strategy or slice,
  // in options_chart.refresh()
  refresh() {
    this.default_volatility = parseInt(
                                document.getElementById(
                                "options_chart_volatility"
                                ).value
                              );
    this.rate = parseFloat(document.getElementById("options_chart_rate").value);

    for (const [k, v] of Object.entries(this.contracts)) {
      if (v.default) {
        v.volatility = this.default_volatility;
        v.value = parseFloat(
                                      theoretical(
                                        this.underlying,
                                        contract.strike,
                                        this.rate,
                                        v.volatility,
                                        v.dte,
                                        v.type
                                      ).toFixed(2)
                                    );
      }
    }

  }

}

export { chain };
