const WebSocket = require("ws");

function jsonToQueryString(json) {
    return Object.keys(json).map(function(key) {
            return encodeURIComponent(key) + '=' +
                encodeURIComponent(json[key]);
        }).join('&');
}

// get from https://developer.tdameritrade.com/user-principal/apis/get/userprincipals-0
var userPrincipalsResponse = {
  "authToken": "lhpr6nwunvJqyfUjA7FizNo7DB+QJgm/2gNcG05FanTh248WJ0ugIy+44U5uRpgifUFtNFzDAUCRR1vLKUFZo1B//y/vDRfrGMSXUYkXoOFdXgVIfD3xOlauhce4UdpH9qh2RIa/naXgArZk7aGh5Y7gdCNDYrhjk4k+UmCz73rZBuGy/CHXoaeN/R9mbRiYWm1ADCXFuHzT/7rDh0nzUJUItjc6d+l+9/IhTkQplyeX8Fgip1kEBuz0Nlt5U1APgT5/ftA2rGzMtbw8O5v0BrS/SRYWa1488f9sefRQ6THU1eSDHXs2ss8tzdSf8axz3jzWx8rnTPfgvucSOm9jsQrtm2gTwDYuo7176/Wr+yhmOSNjYTho4rF98UOAAb+OeSRITbNKAjTSQuzh6k+uv3A6NLI0iGxzlR8RPPTF//rwmgtVkgqbbmth/MPH2ncY4EA+P1ChDOYMk+/nlEskwFqVsGE45v2TYMV4KHnVPPc92HDoB3D087VRhNnU4Ddh6JbiIO+FjA53nl8BuuQF65YN0UEIStDoYpNOQ0uV4D40oZ9Rl100MQuG4LYrgoVi/JHHvlPUqWlGW31k92s/8kcaOhm8bunWN6236BRxTDGVZLlLnS50hTmZhfkTUawMTJp2wpRcSKZHpjhlcpUMAyhHvKz9U72VJdx+48uhe+xliDWP2VlGX6rQisZbPcPsXCMNzX+igeCjAGeV7SQjsBEAkTuwIwa81OPE6unATohy85dmD1+BtJEWb39KhMh8hYdKFeWq9a66jCN77LBnazTDAN7Vn+iDsFfzwAd2iqjgVXpjLdomS/Cn5ivpkzOnNGSzo390XH4iIfGphx7HvxufIc8JI0ivtACrj6ka1QKIrg9NVPrq7nybWX7iqnhCkt1cNL9tq5iLLsSLbIvMqJtGzXvmtdjFZud0ebUmfVE4Siyfe1tEl30V34rbviq9qpGLSxbrtyM5/o2/LckR2bKbWZLN/cI5jRCwzI51lxJRk8kwM9jLaNYolJFUJ1ONwAnjyQEyQunE2PlAJ1bHZxLlpdLLHe2grpKHKyxCnM1Mdju3vNPriYOBHUHbgiH+h6fdueaJD8O1FIA0RWlrHcVND+YcKXqMnqJqfIxM8IkqJFs+05jp7A==212FD3x19z9sWBHDJACbC00B75E",
  "userId": "somespace",
  "userCdDomainId": "A000000080377582",
  "primaryAccountId": "454424125",
  "lastLoginTime": "2020-09-08T23:00:33+0000",
  "tokenExpirationTime": "2020-09-08T23:33:19+0000",
  "loginTime": "2020-09-08T23:03:19+0000",
  "accessLevel": "CUS",
  "stalePassword": false,
  "streamerInfo": {
    "streamerBinaryUrl": "streamer-bin.tdameritrade.com",
    "streamerSocketUrl": "streamer-ws.tdameritrade.com",
    "token": "b2b26d5a308959b0e98377bf8bbfda0e8f0e1a05",
    "tokenTimestamp": "2020-09-08T23:03:38+0000",
    "userGroup": "ACCT",
    "accessLevel": "ACCT",
    "acl": "BPDRDTDWESF7G1G3G5G7GKGLH1H3H5LTM1MAOSPUQSRFSDTETFTOTTUAURXAXBXNXOD1D3D5D7E1E3E5E7F1F3F5H7I1",
    "appId": "somespace1"
  },
  "professionalStatus": "PROFESSIONAL",
  "quotes": {
    "isNyseDelayed": true,
    "isNasdaqDelayed": true,
    "isOpraDelayed": true,
    "isAmexDelayed": true,
    "isCmeDelayed": true,
    "isIceDelayed": true,
    "isForexDelayed": true
  },
  "streamerSubscriptionKeys": {
    "keys": [
      {
        "key": "a9a0450f7383816ce9a7e2f4193c00c6be37575f4335d0ba7ac382e89ee740b04"
      }
    ]
  },
  "accounts": [
    {
      "accountId": "454424125",
      "displayName": "somespace",
      "accountCdDomainId": "A000000080377581",
      "company": "AMER",
      "segment": "ADVNCED",
      "acl": "BPDRDTDWESF7G1G3G5G7GKGLH1H3H5LTM1MAOSPUQSRFSDTETFTOTTUAURXAXBXNXO",
      "authorizations": {
        "apex": false,
        "levelTwoQuotes": false,
        "stockTrading": true,
        "marginTrading": true,
        "streamingNews": false,
        "optionTradingLevel": "SPREAD",
        "streamerAccess": true,
        "advancedMargin": true,
        "scottradeAccount": false
      }
    }
  ]
}

//Converts ISO-8601 response in snapshot to ms since epoch accepted by Streamer
var tokenTimeStampAsDateObj = new Date(userPrincipalsResponse.streamerInfo.tokenTimestamp);
var tokenTimeStampAsMs = tokenTimeStampAsDateObj.getTime();

var credentials = {
"userid": userPrincipalsResponse.accounts[0].accountId,
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
}

var request = {
"requests": [
        {
            "service": "ADMIN",
            "command": "LOGIN",
            "requestid": 0,
            "account": userPrincipalsResponse.accounts[0].accountId,
            "source": userPrincipalsResponse.streamerInfo.appId,
            "parameters": {
                "credential": jsonToQueryString(credentials),
                "token": userPrincipalsResponse.streamerInfo.token,
                "version": "1.0"
            }
        }
]
}

var mySock = new WebSocket("wss://" + userPrincipalsResponse.streamerInfo.streamerSocketUrl + "/ws");

mySock.on('message', function(evt) { console.log(evt) });
mySock.on('close', function() { console.log("CLOSED"); });
setTimeout(() => { console.log(JSON.stringify(request, null, ' ')); mySock.send(JSON.stringify(request)); }, 2000);
