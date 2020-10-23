const fs = require("fs");

const index = fs.readFileSync("./index.html");
const bundle = fs.readFileSync("./bundle.js");

const routes = {
  "/": {
    "data": index,
    "content-type": "text/html"
  },
  "/index": {
    "data": index,
    "content-type": "text/html"
  },
  "/bundle.js": {
    "data": bundle,
    "content-type": "text/javascript"
  },
  "404": {
    "data": "404",
    "content-type": "text/plain"
  }
};

exports.handler = async (event) => {
  const content = event.rawPath in routes ?
                  routes[event.rawPath] : routes["404"];

  const response = {
    statusCode: 200,
    isBase64Encoded: true,
    headers: {
      "content-type": content["content-type"]
    },
    body: Buffer.from(content["data"]).toString("base64")
  };

  return response;
};
