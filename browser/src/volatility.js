import { look_back_range } from "../src/utils/browser_utils.js";

// historical volatility calculation:
// a * e^rt = b
// b/a = e^rt
// ln(b/a) = rt
// t = 30/365             (one month, because VIX extrapolates from a one month forecast)
// ln(b/a) * 365/30 = r   (forecasted one year compounded return)

class volatility {

  get_chart(member, view) {
    if (member) {
      member.remove();
      member = undefined;
    }

    const chart = window.LightweightCharts.createChart(
      document.getElementById(view),
      {
        width: this.chart_width,
        height: this.chart_height,
        crosshair: {
          // non-magnetic
          mode: 0
        }
      }
    );

    return chart;
  }

  parse_candles(ohlc) {
    const data = [];

    ohlc["candles"].forEach((candle) => {
      const time = new Date(0);

      time.setUTCSeconds(parseInt(candle.datetime) / 1000);

      const formatted = {
        time: time.toISOString(),
        value: candle.close
      };

      data.push(formatted);
    });

    return data;
  }

  // backward historical volatility: forecasted annual volatility from previous
  // 30 days
  get_backward_monthly(spx) {
    const hist = [];
    const t = Math.sqrt(365 / 30);

    for (var i = 29; i < spx.length; i++) {
      const vol = Math.abs(Math.log(spx[i].value / spx[i - 29].value)) * t;
      hist.push({
        time: spx[i].time,
        value: vol * 100
      });
    }

    return hist;
  }

  // forward historical volatility: forecasted annual volatility from next
  // 30 days (better for measuring VIX error in hindsight)
  get_forward_monthly(spx) {
    const hist = [];
    const t = Math.sqrt(365 / 30);

    for (var i = 0; i < spx.length - 29; i++) {
      const vol = Math.abs(Math.log(spx[i + 29].value / spx[i].value)) * t;
      hist.push({
        time: spx[i].time,
        value: vol * 100
      });
    }

    return hist;
  }

  // https://www.youtube.com/watch?v=v17M0glWCHA
  get_backward(spx) {
    const hist = [];

    for (var i = 29; i < spx.length; i++) {
      const log_returns = [];
      var avg = 0;
      var variance = 0;

      for (var j = i - 28; j <= i; j++)
        log_returns.push(Math.log(spx[j].value / spx[j - 1].value));

      avg = log_returns.reduce((acc, cur) => acc + cur, 0) / 30;

      for (var j = 0; j < log_returns.length; j++)
        variance += Math.pow(log_returns[j] - avg, 2);

      variance /= 29;

      hist.push({
        time: spx[i].time,
        value: Math.sqrt(variance) * Math.sqrt(252) * 100
      });
    }

    return hist;
  }

  // https://www.youtube.com/watch?v=v17M0glWCHA
  get_forward(spx) {
    const hist = [];

    for (var i = 0; i < spx.length - 29; i++) {
      const log_returns = [];
      var avg = 0;
      var variance = 0;

      for (var j = i; j <= i + 28; j++)
        log_returns.push(Math.log(spx[j + 1].value / spx[j].value));

      avg = log_returns.reduce((acc, cur) => acc + cur, 0) / 30;

      for (var j = 0; j < log_returns.length; j++)
        variance += Math.pow(log_returns[j] - avg, 2);

      variance /= 29;

      hist.push({
        time: spx[i].time,
        value: Math.sqrt(variance) * Math.sqrt(252) * 100
      });
    }

    return hist;
  }

  async update_vol_chart() {
    const type = document.getElementById("volatility_type").value;
    const range = look_back_range(this.range);

    this.vol_chart = this.get_chart(this.vol_chart, "volatility_vol_view");

    const vix_series = this.vol_chart.addLineSeries({
      color: "#0000FF",
      lineWidth: 1,
      title: "VIX"
    });

    const hist_series = this.vol_chart.addLineSeries({
      color: "#FF0000",
      lineWidth: 1,
      title: `SPX (${type})`
    });

    var vix = await this.client.price_history(
      "VIX", "month", undefined, "daily", 1,
      range.start.getTime(), range.end.getTime(), false
    );

    var spx = await this.client.price_history(
      "SPX", "month", undefined, "daily", 1,
      range.start.getTime(), range.end.getTime(), false
    );

    vix = this.parse_candles(vix);
    this.vix = vix;                 // for reuse with trader chart
    spx = this.parse_candles(spx);

    var hist;

    switch(type) {
      case "backward monthly":
        hist = this.get_backward_monthly(spx);
        break;
      case "forward monthly":
        hist = this.get_forward_monthly(spx);
        break;
      case "backward":
        hist = this.get_backward(spx);
        break;
      case "forward":
        hist = this.get_forward(spx);
        break;
    }

    vix_series.setData(vix);
    hist_series.setData(hist);
  }

  async update_trader_chart() {
    // chart configuration
    this.trader_chart = this.get_chart(
                                        this.trader_chart,
                                        "volatility_trader_view"
                                      );
    this.trader_chart.applyOptions({
      watermark: {
        color: 'rgba(11, 94, 29, 0.4)',
        visible: true,
        text: 'noncommercial net (green) vs commercial net (red) %',
        fontSize: 24,
        horzAlign: 'left',
        vertAlign: 'top',
      }
    });

    // add vix series
    const vix_series = this.trader_chart.addLineSeries({
      color: "#0000FF",
      lineWidth: 1,
      priceScaleId: "right",
      title: "vix"
    });

    vix_series.setData(this.vix);

    // add noncommercial series
    var cot = await fetch("https://api.tvix.xyz/cot/contract/1170E1");
    cot = await cot.json();

    const non_commercial_net_series = this.trader_chart.addHistogramSeries({
      color: "#00AA00",
      // priceScaleId: "left",
      base: 0,
      title: "noncommercials"
    });

    const commercial_net_series = this.trader_chart.addHistogramSeries({
      color: "#AA0000",
      base: 0,
      title: "commercials"
    })

    const non_commercial_net = [];
    const commercial_net = [];

    for (const [date, vals] of Object.entries(cot["records"])) {
      let long = parseInt(vals["noncommercial_long_contracts"]);
      let short = parseInt(vals["noncommercial_short_contracts"]);
      let pos = parseInt((long - short) / (long + short) * 100);
      non_commercial_net.push({ "time": date, "value": pos });
      
      long = parseInt(vals["commercial_long_contracts"]);
      short = parseInt(vals["commercial_short_contracts"]);
      pos = parseInt((long - short) / (long + short) * 100);
      commercial_net.push({ "time": date, "value": pos });
    }

    non_commercial_net.reverse();
    non_commercial_net_series.setData(non_commercial_net);

    commercial_net.reverse()
    commercial_net_series.setData(commercial_net);
  }

  async update() {
    await this.update_vol_chart();
    if (this.trader_chart == null)
      // only do this once,
      // reuses vix data from update_vol_chart (this.vix_candles)
      this.update_trader_chart();
  }

  constructor(client) {
    this.client = client;
    this.range = 365 * 30;
    this.chart_width = 800;
    this.chart_height = 400;
  }

}

export { volatility };
