// const { createChart } = require("lightweight-charts");
//import { createChart } from "lightweight-charts";

class returns_histogram {

  retrieve_histogram() {
    var current_symbol = document.getElementById("histogram_symbol").value;
    client.price_history(current_symbol,"ytd",1,"daily","1","","",false);
  }

  update_histogram(response) {
    // document.getElementById("histogram_view").innerHTML =
    // JSON.stringify(response, null, " ");

    const num_buckets = 20;
    const buckets = [];
    for (var i = 0; i < num_buckets; i++) {
      if (i < 10)
        buckets[i] = { "time": `2020-09-0${(i + 1).toString()}`, "value": 0 }
      else
        buckets[i] = { "time": `2020-09-${(i + 1).toString()}`, "value": 0 }
    }
    const candles = response["candles"];
    const returns = new Array(candles.length - 1);

    for (var i = 1; i < candles.length; i++)
      returns[i - 1] = Math.log(
        candles[i]["close"] / candles[i - 1]["close"]
      ) * 100;

    returns.sort((a,b) => { return a - b; });

    const range = returns[returns.length - 1] - returns[0];
    var step = range / num_buckets;
    var lim = returns[0] < 0 ? returns[0] + step : step;

    for (var i = 0, j = 0; i < returns.length; i++) {
      if (returns[i] - lim <= 0.0001) {
        buckets[j]["value"]++;
      } else {
        j++;
        lim += step;
        i--;
      }
    }

    const chart = window.LightweightCharts.createChart(
              document.getElementById("histogram_view"),
              { width: 400, height: 300 }
            );
    const returns_series = chart.addHistogramSeries();
    returns_series.setData(buckets);

  }

  constructor(client) {
    this.client = client;
    client.on("price_history", this.update_histogram.bind(this));
  }

}
