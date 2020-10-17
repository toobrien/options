import { createChart } from "../src/lightweight-charts.js";
import { look_back_range, guid } from "../src/browser_utils.js"
import { options_chart_container } from "../src/options_chart_container.js";

class options_chart {

  async get_ohlc(symbol) {
    const candles = await this.client.price_history(
      symbol, "year", this.range, "daily", "1", undefined, undefined, false
    );

    // format: { time: ISOString, price: float }
    const ohlc = [];

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

      ohlc.push(formatted);
    });

    // add whitespace for future prices: { time: ISOString }
    const start_str = ohlc[ohlc.length - 1].time;
    const start = Date.parse(start_str);

    for (var i = 1; i < this.lookahead; i++) {
      const next = new Date(start);
      next.setDate(next.getDate() + i);
      ohlc.push({ time: next.toISOString() });
    }

    const end_str = ohlc[ohlc.length - 1].time;

    // start and end are used in subsequent options chain api call
    return {
      ohlc: ohlc,
      start: start_str,
      end: end_str
    };
  }

  get_chart(symbol, canvas, ohlc, chain, container) {
    const chart = window.LightweightCharts.createChart(
      canvas,
      {
        width: this.chart_width,
        height: this.chart_height,
        crosshair: {
          // non-magnetic
          mode: 0
        },
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

    const series = chart.addCandlestickSeries();
    series.setData(ohlc);

    // do i need to bind this lambda first?
    chart.subscribeClick((e) => {
      if (e.point) {
        // convert (x, y) to (date, price)
        const price = series.coordinateToPrice(e.point.y);
        const time_obj = chart.timeScale().coordinateToTime(e.point.x);
        const date = new Date();
        date.setFullYear(time_obj.year);
        date.setMonth(time_obj.month - 1);
        date.setDate(time_obj.day);

        container.get_slice().update(date, price, chain);
      }
    });

    return {
      chart: chart,
      series: series
    }
  }

  async get_chain(symbol, start, end) {
    const data = await this.client.option_chain(
      symbol, "", "", start, end, ""
    );

    const chain = {
      expiries: [],
      calls: {},
      puts: {}
    };

    const calls = data["callExpDateMap"];
    const puts = data["putExpDateMap"];

    // puts and calls should have the same expiries
    for (var expiry in calls) {
      // "yyyy-mm-dd:dte"
      const ms = Date.parse(expiry.split(":")[0]);

      chain.expiries.push(ms);
      chain.calls[ms] = { "strike_list": [] };
      chain.puts[ms] = { "strike_list": [] };

      // populate strikes for this contract (expiry)
      // assumes there is a put and call for every strike
      const call_strikes = calls[expiry];
      const put_strikes = puts[expiry];

      const calls_ = chain.calls[ms];
      const puts_ = chain.puts[ms];

      for (var strike in call_strikes) {
        const call_data = call_strikes[strike];
        const put_data = put_strikes[strike];

        const price = parseFloat(strike);

        calls_.strike_list.push(price);
        puts_.strike_list.push(price);

        calls_[price] = {
          volatility: call_data[0].volatility,
          dte: call_data[0].daysToExpiration,
          expiration_type: call_data[0].expirationType,
          theoretical_value: call_data[0].theoreticalOptionValue
        };

        puts_[price] = {
          volatility: put_data[0].volatility,
          dte: put_data[0].daysToExpiration,
          expiration_type: put_data[0].expirationType,
          theoretical_value: put_data[0].theoreticalOptionValue
        };
      }
    }

    return {
      chain: chain,
      volatility: data["volatility"],
      rate: data["interestRate"]
    };
  }

  // should be per container? are these even used?
  set_defaults(volatility, rate) {
    this.volatility = volatility;
    this.rate = rate;

    document.getElementById("options_chart_volatility").value = volatility;
    document.getElementById("options_chart_rate").value = rate;
  }

  async add_container() {
    // init container
    const symbol = document.getElementById("options_chart_symbol").value;
    const id = guid();
    const container = new options_chart_container(id);

    // the order is important, the dependencies are annoying...
    const res_ohlc = await this.get_ohlc(symbol);
    const res_chain = await this.get_chain(
                                            symbol,
                                            res_ohlc.start,
                                            res_ohlc.end
                                          );
    const res_chart = this.get_chart(
                                      symbol,
                                      container.get_canvas(),
                                      res_ohlc.ohlc,
                                      res_chain.chain,
                                      container
                                    );

    // container properties
    const props = {};
    props.ref = container;
    props.series = res_chart.series;
    props.chart = res_chart.chart;
    props.chain = res_chain.chain;
    props.index = this.grid_index;

    // add container to grid
    this.containers[id] = props;
    this.append_to_grid(container.get_body());

    // set global volatility and interest rate -- probably wrong
    this.set_defaults(res_chain.volatility, res_chain.rate);
  }

  remove_container(id) {
    const index = this.containers[id].index;
    const body = this.containers[id].reference.get_body();
    document.getElementById("options_chain_view").remove(body);
    delete this.containers[id];
  }

  grid_coord(index) {
    return {
      row: parseInt(index / this.grid_width),
      col: parseInt(index % this.grid_width)
    }
  }

  append_to_grid(body) {
    const coords = this.grid_coord(this.grid_index);
    const row = coords.row;
    const col = coords.col;

    if (row >= this.grid.rows.length)
      this.grid.insertRow(row);
    if (col >= this.grid.rows[row].cells.length)
      this.grid.rows[row].insertCell(col);

    this.grid.rows[row].cells[col].appendChild(body);
    this.grid_index++;
  }

  remove_from_grid(index) {
    var last = this.grid_coord(index);

    this.grid.rows[last[row]].cells[last[col]].removeChild(0);

    // shift containers to fill vacancy
    for (var i = index + 1; i <= this.grid_index; i++) {
      var next = this.grid_coord(i);
      var container = this.grid.rows[next[row]].cells[next[col]].children[0];
      this.grid.rows[next[row]].cells[next[col]].removeChild(0);
      this.grid.rows[last[row]].cells[last[col]].appendChild(container);
      last = next;
    }

    this.grid_index--;
  }

  constructor(client) {
    // controls
    this.symbol = undefined;
    this.volatility = undefined;
    this.rate = undefined;
    this.weeklies = undefined;    // true to display

    // api settings
    this.chain = undefined;       // see options_chain_schema
    this.client = client;

    // per container properties
    this.containers = {};

    // chart settings
    this.range = 10;              // years of daily OHLC data to load
    this.lookahead = 365;         // future days to simulate
    this.chart_width = 600;
    this.chart_height = 250;

    // grid settings and initialization
    this.grid_index = 0;
    this.grid_width = 1;
    this.grid = document.createElement("table");
    document.getElementById("options_chart_view").appendChild(this.grid);
  }

}

export { options_chart };
