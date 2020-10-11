import { createChart } from "../src/lightweight-charts.js";

class returns_histogram {

  async retrieve_histogram() {
    const current_symbol =
      document.getElementById("histogram_symbol").value.toUpperCase();

    this.update_histogram(
      current_symbol,
      await this.client.price_history(
        current_symbol,"ytd",1,"daily","1","","",false
      )
    )
  }

  update_histogram(symbol, response) {
    // histogram buckets are 1 percentage point, centered around 0.
    const range = 50;
    const min_bucket = -range / 2;
    const buckets = [];
    for (var i = 0; i <= range; i++)
      buckets[i] = { time: min_bucket + i, value: 0 };

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
    const chart = window.LightweightCharts.createChart(
              document.getElementById("histogram_view"),
              {
                width: 400,
                height: 300,
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

    const returns_series = chart.addHistogramSeries();
    returns_series.setData(buckets);

  }

  constructor(client) {
    this.client = client;
  }

}

export { returns_histogram };
