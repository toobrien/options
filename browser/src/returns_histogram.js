import { createChart } from "../src/lightweight-charts.js";
import { look_back_range } from "../src/utils/browser_utils.js";

class returns_histogram {

  async retrieve_histogram() {
    if (this.chart != undefined) {
      this.chart.remove();
      this.data.style.display = "none";
    }

    const symbol = document.getElementById("histogram_symbol")
                           .value.toUpperCase();

    const days = parseInt(document.getElementById("histogram_days").value);
    console.log(days);
    const range = look_back_range(days);
    console.log(range.start.getTime(), range.end.getTime());

    this.update_histogram(
      symbol,
      await this.client.price_history(
        symbol, "month", undefined, "daily", 1,
        range.start.getTime(), range.end.getTime(), false
      )
    )
  }

  update_histogram(symbol, response) {
    // histogram buckets are 1 percentage point, centered around 0.
    const min_bucket = -this.range / 2;
    const buckets = [];

    for (var i = 0; i <= this.range; i++)
      buckets[i] = {
                    time: min_bucket + i,
                    value: 0,
                    color: this.default_color
                   };

    // calculate returns
    const candles = response["candles"];

    if (candles.length == 0) {
      alert("invalid symbol");
      return;
    }

    const returns = new Array(candles.length - 1);

    for (var i = 1; i < candles.length; i++)
      returns[i - 1] = Math.log(
        candles[i]["close"] / candles[i - 1]["close"]
      ) * 100;

    returns.sort((a,b) => { return a - b; });

    const mean = returns.reduce((s, v) => s += v, 0) / returns.length;
    const stdev = Math.sqrt(
                        returns.reduce(
                          (s, v) => s += (v - mean)**2
                        ) / returns.length
                      );

    document.getElementById("returns_histogram_mean")
            .innerHTML = mean.toFixed(2);
    document.getElementById("returns_histogram_stdev")
            .innerHTML = stdev.toFixed(2);

    // populate buckets
    try {
      for (var i = 0, j = 0, k = min_bucket; i < returns.length; i++) {
        if (returns[i] < k) {
          buckets[j].value++;
        } else {
          buckets[j].time = k; // min bound (daily return) of bucket
          j++;
          k++;
          i--;
        }
      }
    } catch (e) {
      console.log("update_histogram:", e);
    }

    // explanation of options: https://github.com/tradingview/lightweight-charts/blob/master/docs/customization.md
    this.chart = window.LightweightCharts.createChart(
              document.getElementById("returns_histogram_view"),
              {
                width: this.chart_width,
                height: this.chart_height,
                timeScale: {
                  // formats x-axis as number, not date
                  tickMarkFormatter: (time, tickMarkType, locale) => {
                    return `${(time).toFixed(2)}`;
                  }
                },
                localization: {
                  // formats crosshair as number, not date
                  timeFormatter: (time, tickMarkType, locale) => {
                    return `${(time).toFixed(2)}`;
                  }
                },
                watermark: {
                  color: 'rgba(11, 94, 29, 0.4)',
                  visible: true,
                  text: symbol,
                  fontSize: 24,
                  horzAlign: 'left',
                  vertAlign: 'top'
                },
                rightPriceScale: {
                  scaleMargins: {
                    top: 0.3,
                    bottom: 0
                  }
                }
              }
            );

    const returns_series = this.chart.addHistogramSeries();
    returns_series.setData(buckets);

    this.chart.subscribeClick((e) => {
      if (e.time) {
        const lim = parseInt(e.time + this.range / 2);
        var count = 0;
        var i = 0;

        for (; i <= lim; i++) {
          count += buckets[i].value;
          buckets[i].color = this.highlight_color;
        }

        for (; i < buckets.length; i++)
          buckets[i].color = this.default_color;

        document.getElementById("returns_histogram_pv")
                .innerHTML = (1 - count / returns.length).toFixed(4);
      } else {
        for (var i = 0; i < this.range; i++)
          buckets[i].color = this.default_color;
      }

      returns_series.setData(buckets);
    });

    this.data.style.display = "block";
  }

  constructor(client) {
    this.chart = undefined;
    this.chart_width = 800;
    this.chart_height = 400;
    this.data = document.getElementById("returns_histogram_data");
    this.client = client;
    this.range = 100;
    this.default_color = "#00CC00";
    this.highlight_color = "#CC0000";
  }

}

export { returns_histogram };
