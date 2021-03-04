
class watchlist {

    build_table() {
        let table = document.createElement("table");
        let count = 0;
        let cur_row = null;

        for (category in list) {
            for (contract in list[category]) {
                if (count % row_width == 0)
                    cur_row = table.insertRow();
                
                count += 1;
                let cur_cell = cur_row.addCell();
                let cur_div = document.createElement("div");
                cur_div.setAttribute("id", list[category][contract]);
                cur_cell.appendChild(cur_div);
            }
        }

        return table;
    }

    populate_chart(name, code, data) {
        const chart = window.LightweightCharts.createChart(
            document.getElementById(code),
            {
                width: this.chart_width,
                height: this.chart_height,
                crosshair: {
                    // non-magnetic
                    mode: 0
                },
                watermark: {
                    color: 'rgba(0, 0, 0, 1)',
                    visible: true,
                    text: name,
                    fontSize: 14
                }
            }
        );
        let series = chart.addCandlestickSeries({
            upColor: "EEEEEE",
            downColor: "666666",
            borderVisible: false,
        });
        series.setData(data);
    }

    process_candles(data) {
        let candles = [];
        
        for (candle in data) {
            candle = data[candle];
            candles.push({
                "time": candle[0],
                "open": candle[1],
                "high": candle[2],
                "low": candle[3],
                "close": candle[4],
                "volume": candle[7]
            });
        }

        return candles;
    }

    async populate_charts() {
        for (category in this.list)
            for (contract in this.list[category]) {
                let code = this.list[category][contract];
                let res = fetch(prefix + code);
                let out = (await res).json();

                // console.log(out, null, 2);

                let data = this.process_candles(data);
                let div = document.getElementById(code);

                this.populate_chart(contract, code, data);
            }
    }

    async refresh() {
        let table = build_table();
        this.populate_charts();
    }

    constructor() {
        this.chart_width = 300;
        this.chart_height = 200;
        this.row_width = 5;
        this.prefix = "https://www.quandl.com/data/CHRIS/";
        this.list = {
            "equity index": {
                "s&p 500": "CME_ES1",
                "nasdaq 100": "CME_NQ1",
                "dow jones": "CME_YM1",
                "russel 2000": "ICE_TF1",
                "nikkei": "OSE_NK2251",
                "dax": "EUREX_FDAX1",
            },
            "bonds": {
                "10 year note": "CME_TY1",
                "treasury bond": "CME_US1",
                "bund": "EUREX_FGBL1",
                "bobl": "EUREX_FGBM1",
                "long gilt": "LIFFE_R1"
            },
            "currencies": {
                "british pound": "CME_BP1",
                "mexican peso": "CME_MP1",
                "japanese yen": "CME_JY1",
                "swiss franc": "CME_SF1",
                "canadian dollar": "CME_CD1",
                "australian dollar": "CHRIS/CME_AD1",
                "euro": "CHRIS/CME_E71",
                "russian ruble": "CHRIS/CME_RU1",
                "brazilian real": "CHRIS/CME_BR1"
            },
            "volatility": {
                "s&p (vix)": "CHRIS/CBOE_VX1",
                "nasdaq": "CHRIS/CBOE_VN1",
                "vstoxx": "CHRIS/EUREX_FVS1",
                "gold": "CHRIS/CBOE_GV1",
                "oil": "CHRIS/CBOE_OV1"
            },
            "softs": {
                "cocoa": "CHRIS/LIFFE_C1",
                "orange juice": "CHRIS/ICE_OJ1",
                "sugar #11": "CHRIS/ICE_SB1",
                "coffee": "CHRIS/ICE_KC5",
                "cotton #2": "CHRIS/ICE_CT1",
                "lumber": "CHRIS/CME_LB1"
            },
            "agricultural": {
                "wheat": "CHRIS/CME_W1",
                "corn": "CHRIS/CME_C1",
                "soybeans": "CHRIS/CME_S1",
                "soybean meal": "CHRIS/CME_SM1",
                "soybean oil": "CHRIS/CME_BO1",
                "lean hogs": "CHRIS/CME_LN1",
                "feeder cattle": "CHRIS/CME_FC1"
            },
            "metals": {
                "copper": "CHRIS/CME_HG1",
                "platinum": "CHRIS/CME_PL1",
                "gold": "CHRIS/CME_GC1",
                "silver": "CHRIS/CME_SI1",
                "palladium": "CHRIS/CME_PA1"
            },
            "energy": {
                "natural gas": "CHRIS/CME_NG1",
                "crude oil": "CHRIS/CME_CL1",
                "gas oil": "CHRIS/ICE_G1",
                "heating oil": "CHRIS/ICE_O1"
            }
        };
    }
}

export { watchlist };