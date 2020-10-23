import {
  send_request, sleep, build_query_string,
  register_data_listener
}
  from "../utils/browser_utils.js";

class stream_client {

  process_data(response) {
    try {
      var parsed = JSON.parse(response["data"]);
    } catch (e) {
      console.log("stream_client.proccess_data:", e);
    }
    // the top level is "response" for a subscription response, but "data" for
    // the data itself
    const items = "response" in parsed ? parsed["response"] :
                  "data" in parsed ? parsed["data"] :
                  undefined;

    if (items == undefined) {
      console.log(
        "stream_client.process_data:",
        JSON.stringify(parsed, null, 2)
      );
      return;
    }

    items.forEach((item, index) => {
      if (item["service"] === "ADMIN" &&
          item["command"] === "LOGIN" &&
          item["content"]["code"] === 0
        )
        this.ready = true;                                                      // readiness set here!
      else if (item["service"] === "OPTIONS_BOOK")
        this.listeners["options_book"].forEach(
          (listener) => { listener(item); }
        );
      else if (item["service"] === "OPTIONS")
        this.listeners["options"].forEach((listener) => { listener(item); });
      else if (item["service"] === "TIMESALE_EQUITY")
        this.listeners["time_and_sales"].forEach(
          (listener) => { listener(item); }
        );
      else if (item["service"] === "TIMESALE_EQUITY")
        this.listeners["time_and_sales"].forEach((listener) => {
          listener(item);
        });
      else
        console.log("stream_client.process_data: not consumed", item);
    });
  }

  send(req) {
    var requests = {
      "requests": [
        {
            "service": req.service,
            "command": req.command,
            "requestid":
              this.requestId = (this.requestId + 1) % 2147483648,
            "account": this.account,
            "source": this.source,
            "parameters": req.parameters
        }
      ]
    }

    this.ws.send(JSON.stringify(requests));
  }

  // block until the socket is initiated, or return immediately should
  // real time data be disabled, in which case the caller propagates "false"
  // to the would-be subscribing module
  async check_ready() {
    if (this.real_time_enabled) {
      if (this.ws == null)
        await this.initiate_socket();
        while(!this.ready) await sleep(250);
    }
  }


  check_subscription(symbol, type) {
    var found;

    if (
        symbol in this.subscriptions &&
        this.subscriptions[symbol][type] == true
      )
      found = true;
    else {
      if (!(symbol in this.subscriptions))
        this.subscriptions[symbol] = {
          "options_book": false,
          "options": false,
          "time_and_sales": false
        };
      this.subscriptions[symbol][type] = true;
      found = false;
    }

    return found;
  }

  async options_book(symbols) {
    if (this.real_time_enabled) {
      await this.check_ready();

      symbols.forEach((symbol) => {
        if (!this.check_subscription(symbol, "otpions_book")) {
          const req = {
            service: "OPTIONS_BOOK",
            command: "SUBS",
            parameters: {
              "keys": symbols,
              "fields": "0,1,2,3"
            }
          };
          this.send(req);
        } // else: already subscribed
      });
    }

    return this.real_time_enabled;
  }

  async time_and_sales(symbols) {
    if (this.real_time_enabled) {
      await this.check_ready();

      symbols.forEach((symbol) => {
          if (!this.check_subscription(symbol, "time_and_sales")) {
            const req = {
              service: "TIMESALE_EQUITY",
              command: "SUBS",
              parameters: {
                "keys": symbol,
                "fields": "0,1,2,3,4"
              }
            };
            this.send(req);
          } // else: already subscribed
      });
    }

    return this.real_time_enabled;
  }

  async initiate_socket() {
    if (this.user_principals == undefined)
      this.user_principals = await this.obtain_user_principals();

    const tokenTimeStampAsDateObj =
      new Date(this.user_principals.streamerInfo.tokenTimestamp);
    const tokenTimeStampAsMs = tokenTimeStampAsDateObj.getTime();

    const credentials = {
      "userId": this.user_principals.accounts[0].accountId,
      "token": this.user_principals.streamerInfo.token,
      "company": this.user_principals.accounts[0].company,
      "segment": this.user_principals.accounts[0].segment,
      "cddomain": this.user_principals.accounts[0].accountCdDomainId,
      "usergroup": this.user_principals.streamerInfo.userGroup,
      "accesslevel": this.user_principals.streamerInfo.accessLevel,
      "authorized": "Y",
      "timestamp": tokenTimeStampAsMs,
      "appid": this.user_principals.streamerInfo.appId,
      "acl": this.user_principals.streamerInfo.acl
    };

    this.account = this.user_principals.accounts[0].accountId;
    this.source = this.user_principals.streamerInfo.appId;
    this.ws = new WebSocket(
      "wss://" + this.user_principals.streamerInfo.streamerSocketUrl + "/ws"
    );

    this.ws.onmessage = (data) => { this.process_data(data); };
    this.ws.onclose = () => { console.log("websocket closed"); };

    // log in
    while (this.ws.readyState != WebSocket.OPEN) await sleep(50);

    this.send({
      service: "ADMIN",
      command: "LOGIN",
      parameters: {
        "credential": build_query_string(credentials),
        "token": this.user_principals.streamerInfo.token,
        "version": "1.0"
      }
    });
  }

  obtain_user_principals() {
    const params = {
      "fields": "streamerSubscriptionKeys,streamerConnectionInfo"
    };
    return send_request("/v1/userprincipals", params);
  }

  // client modules will register for their subscriptions, e.g. "time_and_sales"
  register(type, f) {
    if (!(type in this.listeners))
      this.listeners[type] = [];
    this.listeners[type].push(f);
  }

  async manage_socket(real_time_data) {
    this.real_time_enabled = real_time_data;                                    // real_time_data

    if (!this.real_time_enabled) {
      if (this.ws != null) {
        this.ws.close();
        while(this.ws.readyState != WebSocket.CLOSED) await sleep(50);
        this.ws = null;
      }
      this.subscriptions = [];                                                  // clients will need to resubscribe
    }
  }

  constructor() {
    this.ws = null;
    this.requestId = 0;
    this.account = null;
    this.source = null;
    this.subscriptions = [];  // i should combine these
    this.listeners = {};      // two somehow
    this.user_principals = undefined;
    this.real_time_enabled = false;
    this.ready = false;
    register_data_listener(this.manage_socket.bind(this));
  }

}

export { stream_client };
