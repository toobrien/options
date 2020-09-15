const EventEmitter = require("events");
const {
  get_access_token,
  build_query_string,
  send_request } = require("../src/utils.js");

class basic_client extends(EventEmitter) {

  // symbol:        e.g. MELI
  // contractType:  PUT, CALL, ALL
  // strikeCount:   above and below ATM
  // fromDate:      yyyy-MM-DD
  // toDate:        yyyy-MM-DD
  // expMonth:      JAN, FEB, MAR, etc.
  // maybe i don't need all of these
  option_chain(
    symbol,
    contractType,
    strikeCount,
    fromDate,
    toDate,
    expMonth
  ) {
    const params = {
      "symbol": symbol,
      "contractType": contractType,
      "strikeCount": strikeCount,
      "fromDate": fromDate,
      "toDate": toDate,
      "expMonth": expMonth
    };
    const options = {
      hostname: "api.tdameritrade.com",
      port: 443,
      path: `/v1/marketdata/chains?${build_query_string(params)}`,
      headers: {
        "Authorization": `Bearer ${this.access_token}`
      }
    };

    send_request(this, "option_chain", options);
  }

  // for options, symbols is an array of strings like:
  // [NAME]_MMDDYY[P|C][STRIKE] e.g. MELI_091820P1020
  quotes(symbols) {
    const options = {
      hostname: "api.tdameritrade.com",
      port: 443,
      path: `/v1/marketdata/quotes?symbol=${symbols.join(",")}`,
      headers: {
        "Authorization": `Bearer ${this.access_token}`
      }
    };

    send_request(this, "quotes", options);
  };

  // see API guide for valid values
  // symbol: XYZ
  // period_type: day, month, year, ytd
  // period: see API guide for default values
  // frequencyType: minute, daily, weekly, monthly
  // frequency: 1, 5, 10, 15, 30
  // startDate: milliseconds since epoch (default: last trading day;
  // endDate: milliseconds since epoch    if not provided, don't provide period)
  // needExtendedHoursData: true, false
  price_history(symbol, period_type, period, frequency_type, frequency,
    start_date, end_date, need_extended_hours_data) {
    const params = {
      "periodType": period_type,
      "period": period,
      "frequencyType": frequency_type,
      "frequency": frequency,
      //"endDate": end_date,
      //"startDate": start_date,2
      "needExtendedHoursData": need_extended_hours_data
    };

    const options = {
      hostname: "api.tdameritrade.com",
      port: 443,
      path:
        `/v1/marketdata/${symbol}/pricehistory?${build_query_string(params)}`,
      headers: {
        "Authorization": `Bearer ${this.access_token}`
      }
    };

    // console.log("price_history:",
    //  `/v1/marketdata/${symbol}/pricehistory?${build_query_string(params)}`);
    send_request(this, "price_history", options);
  }

  constructor() {
    super();
    this.access_token = get_access_token();
    // console.log("access_token:", this.access_token);
  }

}

module.exports = basic_client;
