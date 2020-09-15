const { execSync } = require("child_process");
const https = require("https");

exports.get_access_token = () => {
  // rewrite this with send_request
  var stdout = execSync("./lib/get_access_token.sh");
  return JSON.parse(stdout)["access_token"];
};

exports.build_query_string = (params) => {
  var data = []

  for (key in params)
    data.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));

  return data.join("&");
};

exports.send_request = (client, api_name, options) => {
      const req = https.request(options, (res) => {
        console.log(api_name, res.statusCode);
        var body = "";
        res.on("data", (d) => {
          body += d;
        });
        res.on("end", () => {
          client.emit(api_name, JSON.parse(body));
        });
      });

      req.on('error', (err) => {
        console.error(err);
      });

      req.end();
};

exports.sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
