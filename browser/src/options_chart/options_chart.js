import { createChart } from "../lightweight-charts.js";
import { look_back_range, guid } from "../utils/browser_utils.js"
import { container } from "../options_chart/container.js";
import { chain } from "../options_chart/chain.js";

class options_chart {

  async get_ohlc(symbol) {
    const range = look_back_range(this.look_behind);
    const candles = await this.client.price_history(
                                                    symbol,
                                                    "year",                     // period type
                                                    undefined,                  // # periods
                                                    "daily",                    // candle type
                                                    1,                          // days per candle
                                                    range.start.getTime(),      // start
                                                    range.end.getTime(),        // end
                                                    false
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
    const start_price = ohlc[ohlc.length - 1].close;
    const start = Date.parse(start_str);

    for (var i = 1; i < this.look_ahead; i++) {
      const next = new Date(start);
      next.setDate(next.getDate() + i);
      ohlc.push({ time: next.toISOString() });
    }

    const end_str = ohlc[ohlc.length - 1].time;

    // start and end are used in subsequent options chain api call
    return {
      ohlc: ohlc,
      start_date: start_str,
      start_price: start_price,
      end_date: end_str
    };
  }

  get_chart(symbol, ohlc, chain, container) {
    const chart = window.LightweightCharts.createChart(
      container.get_canvas(),
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

    return {
      chart: chart,
      series: series
    };
  }

  // convert y to price, x to date
  convert_coords(chart, series, e) {
    const price = series.coordinateToPrice(e.point.y);
    const time_obj = chart.timeScale().coordinateToTime(e.point.x);
    const date = new Date();
    date.setFullYear(time_obj.year);
    date.setMonth(time_obj.month - 1);
    date.setDate(time_obj.day);
    return {
      price: price,
      date: date
    };
  }

  async get_chain(symbol, start, end) {
    const data = await this.client.option_chain(
      symbol, "", "", start, end, ""
    );

    const instance = new chain(data);

    return {
      chain: instance,
      volatility: data["volatility"],
      rate: data["interestRate"]
    };
  }

  async add_container() {
    // init container
    const symbol = document.getElementById("options_chart_symbol").value;
    const c = new container(this);
    const id = c.get_id();

    // the order is important, the dependencies are annoying...
    const res_ohlc = await this.get_ohlc(symbol);
    const res_chain = await this.get_chain(
                                            symbol,
                                            res_ohlc.start_date,
                                            res_ohlc.end_date
                                          );
    const res_chart = this.get_chart(symbol, res_ohlc.ohlc, res_chain.chain, c);

    // container properties
    const props = {};
    props.ref = c;

    props.chart = {};
    props.chart.ref = res_chart.chart;
    props.chart.price_series = res_chart.series;
    props.chart.start_date = res_ohlc.start_date;
    props.chart.end_date = res_ohlc.end_date;
    props.chart.start_price = res_ohlc.start_price;
    props.active_contract = undefined;
    props.chart.stdev_series_up = undefined;
    props.chart.stdev_series_down = undefined;
    props.chart.expirations = [];

    res_chain.chain.get_expiries().get_list().forEach((expiry) => {
      const expiration = document.createElement("div");
      expiration.className = "expiration";
      props.chart.expirations.push({
        ref: expiration,
        time: new Date(expiry).toISOString()
      });
    });

    props.chart.ref.subscribeClick((e) => {
      if (e.point && e.time) {
        const converted = this.convert_coords(
                              props.chart.ref, props.chart.price_series, e
                          );
        c.get_slice().update(converted.date, converted.price, res_chain.chain);
      }
    });

    props.chart.ref.subscribeCrosshairMove((e) => {
      if (e.point && e.time) {
        const converted = this.convert_coords(
                                props.chart.ref, props.chart.price_series, e
                          );
        c.get_strategy().update(converted.date, converted.price);
      }
    });

    const draw_expiries = (ts) => {
      if (props.chart.active_contract != undefined)
        props.chart.expirations.forEach((expiration) => {
          expiration.ref.style.left = `${
                                          props.chart.ref.timeScale().
                                          timeToCoordinate(expiration.time)
                                      }px`;
        });
      window.requestAnimationFrame(draw_expiries);
    };

    window.requestAnimationFrame(draw_expiries);

    props.chain = res_chain.chain;
    props.index = this.grid_index;

    // add container to grid
    this.containers[id] = props;
    this.view_list.appendChild(c.get_body());

    // just set default rate, default vol will come from contract
    // user can override by typing in their own vol
    document.getElementById("options_chart_rate").value = res_chain.rate;
  }

  remove_container(id) {
    this.containers[id].ref.get_body().remove();
    delete this.containers[id];
  }

  get_container(id) { return this.containers[id]; }

  // called when user updates default rate or vol
  refresh_defaults() {
    for (const [k, v] of Object.entries(this.containers())) {
        v.chain.refresh_defaults();
        v.ref.refresh();
    }
  }

  get_look_behind() { return this.look_behind; }

  constructor(client) {
    // controls
    this.symbol = undefined;
    this.volatility = undefined;
    this.rate = undefined;

    // api settings
    this.chain = undefined;                     // see options_chain_schema
    this.client = client;

    // per container properties
    this.containers = {};

    // chart settings
    this.look_behind = 10 * 365;                // days of OHLC per chart
    this.look_ahead = 3 * 365;                  // blank days appended
    this.chart_width = 700;
    this.chart_height = 350;

    // view initialization
    this.view_list = document.createElement("table");
    document.getElementById("options_chart_view").appendChild(this.view_list);
  }

}

export { options_chart };
