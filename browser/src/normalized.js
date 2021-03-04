import { look_back_range } from "../src/utils/browser_utils.js";

class normalized {

  async update_chart() {
    if (this.chart) {
      this.chart.remove();
      this.chart = undefined;
    }

    const days = parseInt(document.getElementById("normalized_days").value);
    const symbols = document.getElementById("normalized_symbols")
                            .value.split("\n");
    const range = look_back_range(days);

    this.chart = window.LightweightCharts.createChart(
      document.getElementById("normalized_view"),
      {
        width: this.chart_width,
        height: this.chart_height,
        priceScale: {
          mode: window.LightweightCharts.PriceScaleMode.IndexedTo100
        },
        crosshair: {
          // non-magnetic
          mode: 0
        },
        watermark: {
          color: 'rgba(11, 94, 29, 0.4)',
          visible: true,
          text: symbols.join(", "),
          fontSize: 24,
          horzAlign: 'left',
          vertAlign: 'top'
        }
      }
    );

    symbols.forEach(async (symbol) => {
      symbol = symbol.trim().toUpperCase();

      const candles = await this.client.price_history(
        symbol, "month", undefined, "daily", 1,
        range.start.getTime(), range.end.getTime(), false
      );

      const data = [];

      candles["candles"].forEach((candle) => {
        const time = new Date(0);

        time.setUTCSeconds(parseInt(candle.datetime) / 1000);

        const formatted = {
          time: time.toISOString(),
          value: candle.close
        };

        data.push(formatted);
      });

      this.color_index = (this.color_index + 1) % this.color_count;

      const series = this.chart.addLineSeries({
        color: this.colors[this.color_index],
        lineWidth: 1,
        title: symbol
      });
      series.setData(data);
    });
  }

  update_presets() {
    const preset = document.getElementById("normalized_presets")
                           .selectedIndex;
    console.log(preset);
    var symbols;

    switch(preset) {
      case 0:
        // custom
        symbols = [];
        break;
      case 1:
        // us indices
        symbols = [ "SPY", "QQQ", "DIA", "IWM" ];
        break;
      case 2:
        // soybeans
        symbols = [ "ZS", "ZM", "ZL" ];
        break;
      case 3:
        // tech
        symbols = [
                    "AAPL", "AMZN", "GOOG", "FB", "MSFT", "NFLX"
                  ];
        break;
      case 4:
        // ev
        symbols = [
                    "TSLA", "NIO", "NKLA",
                    "WKHS", "HLYN", "XPEV",
                    "LI"
                  ];
        break;
      case 5:
        // social
        symbols = [ "SNAP", "TWTR", "FB", "RENN" ];
        break;
      case 6:
        // dividend
        symbols = [ "XOM", "JNJ", "KO", "T", "PG", "MO" ];
        break;
      default:
        symbols = [];
        break;
    }

    document.getElementById("normalized_symbols")
            .value = symbols.join("\n");
  }

  constructor(client) {
    this.chart = undefined;
    this.chart_width = 800;
    this.chart_height = 400;
    this.color_index = 0;
    this.colors = {
      0: "#00BCD4",
      1: "#363A45",
      2: "#2196F3",
      3: "#E040FB",
      4: "#787B86",
      5: "#4CAF50",
      6: "#00E676",
      7: "#880E4F",
      8: "#311B92",
      9: "#808000",
      10: "#FF9800",
      11: "#9C27B0",
      12: "#FF5252",
      13: "#B2B5BE",
      14: "#00897B",
      15: "#FFFFFF",
      16: "#FFEB3B"
    }
    this.color_count = 17;
    this.client = client;
  }

}

export { normalized };
