function cdf(x) {
  var t = 1 / (1 + .2316419 * Math.abs(x));
  var d = .3989423*Math.exp(-x * x / 2);
  var p =  d * t * (.3193815 + t * (-.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if ( x > 0 ) p = 1 - p
  return p
}

function d1(price, strike, rate, vol, time) {
  return 1 / (vol * Math.sqrt(time)) * (Math.log(price / strike) + (rate + (Math.pow(vol, 2) / 2)) * time);
}

function d2(d1_, vol, time) {
  return d1_ - vol * Math.sqrt(time);
}

function call(price, strike, rate, vol, time) {
  vol /= 100;                                     // as a percentage
  time /= 365;                                    // percentage of trading year (should denominator be trading days (252)?

  const d1_ = d1(price, strike, rate, vol, time)
  const d2_ = d2(d1_, vol, time);
  const p_d1_ = cdf(d1_);
  const p_d2_ = cdf(d2_);
  const discount = Math.exp(-rate * time);

  return (price * p_d1_) - (strike * discount * p_d2_);
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

// mcmillan, pg. 803
function itm(price, strike, vol, time, type) {
  vol /= 100;
  time /= 365;

  const p = cdf(Math.log(price / strike) / (vol * Math.sqrt(time)));

  return type === "calls" ? p : 1 - p;
}

// probability of price moving below the target
function below(price, target, vol, time) {
  vol /= 100;
  time /= 365;

  return cdf(Math.log(target / price) / (vol * Math.sqrt(time)));
}

export { call, put, theoretical, itm, below };
