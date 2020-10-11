import { send_request } from "../src/browser_utils.js";

class basic_client {

  // symbol:        e.g. MELI
  // contractType:  PUT, CALL, ALL
  // strikeCount:   above and below ATM
  // fromDate:      yyyy-MM-DD
  // toDate:        yyyy-MM-DD
  // expMonth:      JAN, FEB, MAR, etc.
  // maybe i don't need all of these
  async option_chain(
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
    let data = await send_request("/v1/marketdata/chains", params);
    return data;
  }

  // for options, symbols is an array of strings like:
  // [NAME]_MMDDYY[P|C][STRIKE] e.g. MELI_091820P1020
  async quotes(symbols) {
    let data = await send_request(
      "/v1/marketdata/quotes", { symbol: symbols.join(",") }
    );
    return data;
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
  async price_history(symbol, period_type, period, frequency_type, frequency,
    start_date, end_date, need_extended_hours_data) {
    const params = {
      "periodType": period_type,
      "frequencyType": frequency_type,
      "frequency": frequency,
      "needExtendedHoursData": need_extended_hours_data
    };

    if (period != undefined)
      params.period = period;
    else {
      params.endDate = end_date;
      params.startDate = start_date;
    }

    let data = await send_request(
      `/v1/marketdata/${symbol}/pricehistory`, params
    );
    return data;
  }

  constructor() {}

}

export { basic_client };
