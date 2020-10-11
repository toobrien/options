import { createChart } from "../src/lightweight-charts.js";
import { look_back_range } from "../src/browser_utils.js"

class options_chart {

  async refresh() {
    const symbol = document.getElementById("options_chart_symbol").value;
    this.symbol = symbol;

    // get price history data for chart
    const candles = await this.client.price_history(
      symbol, "year", this.range, "daily", "1", undefined, undefined, false
    );

    // format chart data
    const price_data = [];

    candles["candles"].forEach((candle) => {
      const time = new Date(0);
      time.setUTCSeconds(parseInt(candle.datetime) / 1000);

      const formatted = {
        time: time.toISOString(),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close
      };

      price_data.push(formatted);
    });

    // add whitespace for simulating future prices
    const firstDateString = price_data[price_data.length - 1].time;             // reuse in options chain API call
    const firstDate = Date.parse(firstDateString);

    for (var i = 1; i < this.lookahead; i++) {
      const nextDate = new Date(firstDate);
      nextDate.setDate(nextDate.getDate() + i);
      price_data.push({ time: nextDate.toISOString() });
    }

    // used below, in option api call
    const lastDateString = price_data[price_data.length - 1].time;

    // update chart
    this.chart.applyOptions(
      {
        watermark: {
          color: 'rgba(11, 94, 29, 0.4)',
          visible: true,
          text: symbol,
          fontSize: 24,
          horzAlign: 'left',
          vertAlign: 'top'
        }
      }
    );

    if (this.series != undefined) this.chart.removeSeries(this.series);         // strip old data
    const price = this.chart.addCandlestickSeries();
    price.setData(price_data);
    this.series = price;

    // get options data and make lookup table
    const chain = await this.client.option_chain(
      symbol, "", "", firstDateString, lastDateString, ""
    );

    this.chain = {
      expiries: [],
      calls: {},
      puts: {}
    };

    const calls = chain["callExpDateMap"];
    const puts = chain["putExpDateMap"];

    for (var expiry in calls) {                                                 // puts and calls should have the same expiries
      const ms = Date.parse(expiry.split(":")[0]);                              // date from "yyyy-mm-dd:dte"

      this.chain.expiries.push(ms);
      this.chain.calls[ms] = { "strike_list": [] };
      this.chain.puts[ms] = { "strike_list": [] };

      // populate strikes for this contract (expiry)
      // assumes there is a put and call for every strike
      const call_strikes = calls[expiry];
      const put_strikes = puts[expiry];

      const calls_ = this.chain.calls[ms];
      const puts_ = this.chain.puts[ms];

      for (var strike in call_strikes) {
        const call_data = call_strikes[strike];
        const put_data = put_strikes[strike];

        const price = parseFloat(strike);

        calls_.strike_list.push(price);
        puts_.strike_list.push(price);

        calls_[price] = {
          volatility: call_data[0].volatility,
          dte: call_data[0].daysToExpiration,
          expiration_type: call_data[0].expirationType
        };

        puts_[price] = {
          volatility: put_data[0].volatility,
          dte: put_data[0].daysToExpiration,
          expiration_type: put_data[0].expirationType
        };
      }
    }

    // set volatility and rate defaults
    const rate = chain["interestRate"];
    const volatility = chain["volatility"];

    this.volatility = volatility;
    this.rate = rate;

    document.getElementById("options_chart_volatility").value = volatility;
    document.getElementById("options_chart_rate").value = rate;

    console.log(JSON.stringify(this.chain),null,2);
  }

  b_search(val, arr) {
    var i = 0;
    var j = arr.length - 1;
    var m = -1;

    while(i < j) {
      m = Math.floor((i + j) / 2);

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

    const half = math.floor(range / 2);
    const start = mid - half < 0 ? 0 : mid - half;
    const end = mid + half > arr.length - 1 ? arr.length - 1 : mid + half;

    return {
      start: start,
      end: end
    };
  };

  // retrieve nearest contracts
  lookup(date, price) {
    const results = {
      expiries: [],
      calls: {},
      puts: {}
    };

    // find expiries near date
    const ms = Date.parse(date);
    const mid_date = this.b_search(ms, this.chain.expiries);
    const date_range =
      this.clamp(mid_date, this.chain.expiries, this.expiry_range);

    for (var i = date_range.start; i <= date_range.end; i++)
      results.expiries.push(this.chain.expiries[i]);

    // find strikes near price
    results.expiries.forEach((expiry) => {
      const calls = this.chain.calls[expiry];
      const puts = this.chain.puts[expiry];
      const mid_price = this.b_search(price, calls.strike_list);
      const price_range =
        this.clamp(mid_price, calls.strike_list, this.strike_range);

      for (var i = price_range.start; i <= price_range.end; i++) {
        const strike = calls.strike_list[i];
        // shallow copy
        // assumes that for every strike there is a put and a call
        results.calls[expiry][strike] = this.chain[expiry][strike];
        results.puts[expiry][strike] = this.chain[expiry][strike];
      }
    });

    return results;
  }

  menu(evt) {
    if (evt.point) {
      const price = this.series.coordinateToPrice(evt.point.y);
      const date = this.chart.timeScale().coordinateToTime(evt.point.x);
      console.log(
        `(${evt.point.x},${evt.point.y})`,
        `(${date},${price})`
      );
      const contracts = this.lookup(date, price);
      console.log(JSON.stringify(contracts, null, 2));
    }
  }

  update(evt) {
    // console.log(JSON.stringify(evt,null,2));
  }

  constructor(client) {
    this.symbol = undefined;
    this.volatility = undefined;
    this.rate = undefined;
    this.strikes = undefined;
    this.strike_range = 3;
    this.expiry_range = 3;
    this.weeklies = undefined;
    this.chain = undefined;
    this.contracts = {};
    this.client = client;
    this.series = undefined;
    this.range = 10;                                                            // years of daily OHLC data to load
    this.lookahead = 365;                                                       // future days to simulate
    this.chart = window.LightweightCharts.createChart(
      document.getElementById("options_chart_view"),
      {
        width: 800,
        height: 400,
        crosshair: {
          mode: 0
        }
      }
    );
    this.chart.subscribeClick(this.menu.bind(this));
    this.chart.subscribeCrosshairMove(this.update.bind(this));
  }

}

export { options_chart };
