function cdf(x) {
  var t = 1 / (1 + .2316419 * Math.abs(x));
  var d = .3989423*Math.exp(-x * x / 2);
  var p =  d * t * (.3193815 + t * (-.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if ( x > 0 ) p = 1 - p
  return p
}

function call(price, strike, rate, vol, time) {
  vol /= 100;                                     // as a percentage
  time /= 365;                                    // percentage of trading year (should denominator trading days (252)?

  // console.log(`${price} ${strike} ${rate} ${vol} ${time}`);

  const d1 = 1 / (vol * Math.sqrt(time)) * (Math.log(price / strike) + (rate + (Math.pow(vol, 2) / 2)) * time);
  const d2 = d1 - vol * Math.sqrt(time);
  const p_d1 = cdf(d1);
  const p_d2 = cdf(d2);
  const discount = Math.exp(-rate * time);
  const val = (price * p_d1) - (strike * discount * p_d2);

  /*
  console.log(
    JSON.stringify({
      "d1": d1,
      "d2": d2,
      "p_d1": p_d1,
      "p_d2": p_d2,
      "discount": discount,
      "time": time,
      "formula": `(${price} * ${p_d1}) - (${strike} * ${discount} * ${p_d2}) = ${val}`
    }, null, 2)
  );
  */

  return val;
}

function put(price, strike, rate, vol, time) {
  return strike * Math.exp(-rate * (time/365)) - price + call(price, strike, rate, vol, time);
}

function theoretical(underlying, strike, rate, vol, time, type) {
  switch(type) {
    case "calls":
      return call(underlying, strike, rate, vol, time);
    case "puts":
      return put(underlying, strike, rate, vol, time);
  }

}

export { call, put, theoretical };
