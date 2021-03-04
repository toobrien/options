import { look_back_range } from "../src/utils/browser_utils.js";

class market_profile {

  async get_chart_data() {
    const symbol = document.getElementById("mp_symbol").value;
    const days = parseInt(document.getElementById("mp_days").value);
    const minimum_trend_dropdown = document.getElementById("mp_minimum_trend");
    const minimum_trend = parseInt(
      minimum_trend_dropdown.options[minimum_trend_dropdown.selectedIndex].value
    );

    const range = look_back_range(days);

    const response = await this.client.price_history(
      symbol, "day", undefined, "minute", this.period,
      range.start.getTime(), range.end.getTime(), false
    );


    this.chart(response, minimum_trend);
  }

  sub_chart(data, minimum_trend) {
    const sub_chart = {};
    var j = 0;
    var high = undefined;
    var low = undefined;

    data.candles.forEach((candle) => {
      high = (high == undefined | candle.high > high) ? candle.high : high;
      low = (low == undefined | candle.low < low) ? candle.low : low;
    });

    data.candles.forEach((candle) => {
      // turn prices into buckets (or levels)
      const end_bucket = Math.floor((candle.high * 100) / minimum_trend);
      const start_bucket = Math.floor((candle.low * 100) / minimum_trend);

      // fill levels with TPO characters
      for (var i = start_bucket; i <= end_bucket; i++) {
        if (!(i in sub_chart))
          sub_chart[i] = [];
        sub_chart[i].push(this.char_list[j]);
      }

      j++;
    });

    return sub_chart;
  }

  chart(response, minimum_trend) {
    const chart = {};
    const candle_data = {};                           // candlesticks from TDA api
    const sub_chart_data = {};                        // tpos per price level
    const min_offset = 4;                             // spaces between each session
    var max = undefined, min = undefined;
    var levels = 0;
    var width = 1;                                    // why 1?
    var axis = 0;                                     // width of price labels

    // create sub charts
    response["candles"].forEach((candle) => {
      const dt = new Date(candle["datetime"]);
      const session = dt.toLocaleDateString();

      if (!(session in candle_data)) {
        candle_data[session] = { candles: [] };
      }
      candle_data[session].candles.push(candle);
    });

    for (var session in candle_data) {
      sub_chart_data[session] = this.sub_chart(
                                  candle_data[session], minimum_trend
                                );
    }

    // calculate chart dimensions
    for (var sub_chart in sub_chart_data) {
      var wide_level = 0;
      var data = sub_chart_data[sub_chart];
      for (var level in data) {
        axis = level.length > axis ? level.length : axis;                       // the widest of all sessions ?
        var numeric = parseInt(level);                                          // numeric is not an actual price, but a level or price bucket
        var tpo_count = data[level].length;
        max = (max == undefined | numeric > max) ? numeric : max;
        min = (min == undefined | numeric < min) ? numeric : min;
        wide_level = wide_level > tpo_count ? wide_level : tpo_count;
      }
      width += wide_level;
      levels += 1;
    }

    // add more space for labels? not sure... seems like a bug
    width += levels * (min_offset + axis);

    // console.log(`chart: max: ${max}, min: ${min}, width: ${width}`);

    // zero chart and add price labels
    for (var i = min; i <= max; i++) {
      chart[i] = new Array(width);
      chart[i].fill(" ", 0, width);

      const str = i.toString();
      for (var j = 0; j < str.length; j++)
        chart[i][j] = str[j];
    }

    // initialize footer (for dates) and offset (for price labels)
    var offset = axis + 2;            // add 2 for a small margin around labels
    const footer = new Array(width);
    footer.fill(" ", 0, width);

    // copy session data into main data
    for (var sub_chart in sub_chart_data) {
      var levels = sub_chart_data[sub_chart];
      var tpo_count = 0;

      for (var level in levels) {
        var tpos = levels[level];
        tpo_count = tpos.length > tpo_count ? tpos.length : tpo_count;
        for (var i = 0; i < tpos.length; i++)
          chart[level][offset + i] = tpos[i];
      }

      for (var i = 0; i < sub_chart.length; i++)
        footer[offset + i] = sub_chart[i];
      offset += (min_offset + tpo_count);
    }

    // render chart as string -- reverse prices
    var out = "";
    for (var i = max; i >= min; i--)
      out += (chart[i].join("") + '\n');
    out += footer.join("");

    document.getElementById("mp_view").innerHTML =`<pre>${out}</pre>`;
  }

  constructor(client) {
    // tpo characters
    this.char_list = ['C','D','E','F','G','H','I','J','K',
                        'L','M','N','O','P','Q','R','S'];
    this.period = 30;
    this.client = client;
  }
}

export { market_profile };
