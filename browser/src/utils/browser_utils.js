// application specific id and redirect url
const client_id = "NUNBJMU9XQMDAANFOT6G4MQA1I85EG7P";
const redirect_uri = "https://www.tvix.xyz"

// initialize tokens;
var access_token = undefined;
var refresh_token = undefined;
var real_time_data = document.getElementById("real_time_data").checked;
var code = new URLSearchParams(window.location.search).get("code");

(async () => {
  if (code != null) {
    await set_tokens();
    window.history.replaceState(null, "", "/");                                 // remove the stale code
  }
})();

// for polling components that need to know when real time data has stopped or started
const data_listeners = [];

function register_data_listener(fn) {
  data_listeners.push(fn);
}

async function set_real_time_data() {
  real_time_data = document.getElementById("real_time_data").checked;

  if (real_time_data && refresh_token == undefined)
    refresh_token = await set_tokens();

  data_listeners.forEach((listener) => {
    listener(real_time_data);
  });
}

async function set_tokens() {
  if (refresh_token == undefined) {
    if (code == undefined) {
      window.location.href = `https://auth.tdameritrade.com/auth?response_type=code&redirect_uri=${redirect_uri}&client_id=${client_id}%40AMER.OAUTHAP`;
    } else {
      const form_data = build_query_string({
        "grant_type": "authorization_code",
        "access_type": "offline",
        "code": code,
        "client_id": "NUNBJMU9XQMDAANFOT6G4MQA1I85EG7P",
        "redirect_uri": redirect_uri
      });

      const res = await fetch(
        "https://api.tdameritrade.com/v1/oauth2/token",
        {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            "content-length": form_data.length
          },
          body: form_data
        }
      );

      const body = await res.json();
      refresh_token = body["refresh_token"];
      access_token = body["access_token"];
    }
  }

}

// refresh token must be set first
async function get_access_token() {
  if (refresh_token === undefined)
    await set_tokens();
  else if (access_token === undefined) {
    const form_data = build_query_string({
      "grant_type": "refresh_token",
      "redirect_uri": redirect_uri,
      "client_id": client_id,
      "refresh_token": refresh_token
    });

    const res = await fetch(
      "https://api.tdameritrade.com/v1/oauth2/token",
      {
        method: "POST",
        headers: {
            "content-type": "application/x-www-form-urlencoded",
            "content-length": form_data.length
        },
        body: form_data
      }
    );

    const body = await res.json();
    access_token = body["access_token"];

    // refresh access token in 29 minutes (it expires in 30)
    setTimeout(() => { access_token = undefined }, 1740000);
  }

  return access_token;
}

function build_query_string(params) {
  const data = []

  for (const key in params)
    data.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));

  return data.join("&");
};

async function send_request(path, params) {
  var path =
    `https://api.tdameritrade.com${path}?${build_query_string(params)}`;
  const init = { headers: {} };

  if (real_time_data) {
    init.headers.authorization = `Bearer ${await get_access_token()}`;
  } else {
    path += `&apikey=${client_id}`;
  }

  const res = await fetch(path, init);
  const body = await res.json();

  return body;
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

function look_back_range(days_back) {
  const end = new Date();
  const start = new Date();

  end.setDate(end.getDate() + 1);
  start.setDate(start.getDate() - (days_back));

  return { start: start, end: end };
}

// from stack overflow
function guid() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

function b_search(val, arr) {
  var i = 0;
  var j = arr.length - 1;
  var m = -1;

  while(i < j) {
    m = parseInt((i + j) / 2);

    if (val > arr[m]) {
      i = m + 1;
    } else if (val < arr[m]) {
      j = m - 1;
    } else if (val == arr[m]) {
      break;
    }
  }

  return m;
}

function clamp(mid, arr, range) {
  mid = mid < 0 ? 0 : mid;
  mid = mid > arr.length - 1 ? arr.length - 1 : mid;

  const half = parseInt(range / 2);
  const start = mid - half < 0 ? 0 : mid - half;
  const end = mid + half > arr.length - 1 ? arr.length - 1 : mid + half;

  return {
    start: start,
    end: end
  };
};

export {
  sleep, send_request, set_real_time_data,
  build_query_string, register_data_listener,
  look_back_range, guid, b_search, clamp
};
