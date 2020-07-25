# theta

This app is designed to help you find options you are willing to sell based on your risk.
The inner workings of this app uses historical data, and options metrics to figure out
the chances of success of deploying certain trades.

## Node

This app uses the deprecated node [Yahoo Finance API](https://github.com/pilwon/node-yahoo-finance).
In order to get CORS to work, I had to edit the package a bit, to forward all requests through a proxy,

```javascript
const PROXY_URL = 'https://cors-anywhere.herokuapp.com/';
exports.HISTORICAL_CRUMB_URL = PROXY_URL + 'finance.yahoo.com/quote/$SYMBOL/history';
exports.HISTORICAL_DOWNLOAD_URL = PROXY_URL + 'query1.finance.yahoo.com/v7/finance/download/$SYMBOL';
exports.SNAPSHOT_URL = PROXY_URL + 'query2.finance.yahoo.com/v10/finance/quoteSummary/$SYMBOL';
```
