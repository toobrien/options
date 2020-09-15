
const WebSocket = require("ws");
const EventEmitter = require("events");
const querystring = require("querystring");
const { get_access_token, send_request } = require("../src/utils.js")

class streamclient extends EventEmitter {

  process_data(data) {
    var parsed = JSON.parse(data);

    if ("response" in parsed) {
      parsed["response"].forEach((item, index) => {
        if (item["service"] === "ADMIN" &&
            item["command"] === "LOGIN" &&
            item["content"]["code"] === 0
          )
          this.emit("ready");
        else if (item["service"] === "OPTIONS_BOOK")
          this.emit("options_book", item);
        else if (item["service"] === "OPTIONS")
          this.emit("options", item);
        else
          this.emit("data", item);
      });
    } else {
      console.log(JSON.stringify(parsed, null, " "));
    }
    // console.log(JSON.stringify(parsed, null, " "));
  }

  send(req) {
    var requests = {
      "requests": [
        {
            "service": req.service,
            "command": req.command,
            "requestid": this.requestId++,
            "account": this.account,
            "source": this.source,
            "parameters": req.parameters
        }
      ]
    }

    // console.log(JSON.stringify(requests, null, ' '));
    this.ws.send(JSON.stringify(requests));
  }

  option_book(symbols) {
    var req = {
      service: "OPTIONS_BOOK",
      command: "SUBS",
      parameters: {
        "keys": symbols,
        "fields": "0,1,2,3"
      }
    };

    this.send(req);
  }

  initiate_socket(userPrincipalsResponse) {
    var tokenTimeStampAsDateObj = new Date(userPrincipalsResponse.streamerInfo.tokenTimestamp);
    var tokenTimeStampAsMs = tokenTimeStampAsDateObj.getTime();

    var credentials = {
      "userId": userPrincipalsResponse.accounts[0].accountId,
      "token": userPrincipalsResponse.streamerInfo.token,
      "company": userPrincipalsResponse.accounts[0].company,
      "segment": userPrincipalsResponse.accounts[0].segment,
      "cddomain": userPrincipalsResponse.accounts[0].accountCdDomainId,
      "usergroup": userPrincipalsResponse.streamerInfo.userGroup,
      "accesslevel": userPrincipalsResponse.streamerInfo.accessLevel,
      "authorized": "Y",
      "timestamp": tokenTimeStampAsMs,
      "appid": userPrincipalsResponse.streamerInfo.appId,
      "acl": userPrincipalsResponse.streamerInfo.acl
    };

    this.account = userPrincipalsResponse.accounts[0].accountId;
    this.source = userPrincipalsResponse.streamerInfo.appId;
    this.ws = new WebSocket("ws://" + userPrincipalsResponse.streamerInfo.streamerSocketUrl + "/ws");

    // login to the API
    this.ws.on('open', () => {
      this.send({
        service: "ADMIN",
        command: "LOGIN",
        parameters: {
          "credential": querystring.stringify(credentials),
          "token": userPrincipalsResponse.streamerInfo.token,
          "version": "1.0"
        }
      });
    });

    this.ws.on('message', (data) => { this.process_data(data) });
    this.ws.on('close', () => { console.log("CLOSED"); });
    process.on('SIGINT', () => { this.ws.close(); });

  }

  obtain_user_principals(accessToken) {
    const params = {
      "fields": "streamerSubscriptionKeys,streamerConnectionInfo"
    };
    const options = {
      hostname: "api.tdameritrade.com",
      port: 443,
      path: "/v1/userprincipals?" + build_query_string(params),
      headers: {
        "Authorization": "Bearer " + accessToken
      }
    }

    this.on("user_principals", initiate_socket(JSON.parse(data)));
    send_request(this, "user_principals", options);
  }

  constructor() {
    super();
    this.ws = null;
    this.requestId = 0;
    this.account = null;
    this.source = null;
    var access_token = get_access_token();
    this.obtain_user_principals(access_token);
  }

}

module.exports = stream_client;
