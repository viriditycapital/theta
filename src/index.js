/**
 * Main entrypoint of app
 */

import './styles/index.scss';
import { PROXY_URL } from './constants.js';
import { vol_AVG } from './analysis/vol.js';
const YF = require('yahoo-finance');

/**
 * Builds the website and starts up the app
 */
async function init () {
  // Layout
  let left_side = document.createElement('div');
  let right_side = document.createElement('div');

  let title    = document.createElement('div');
  let right_title    = document.createElement('div');
  right_side.innerHTML = '<h1>Analysis</h1>';
  right_title.classList.add('title');

  // Main output
  let terminal = document.createElement('div');

  // Chart
  let chart = document.createElement('div');

  left_side.classList.add('left_side');
  right_side.classList.add('right_side');
  left_side.appendChild(title);
  left_side.appendChild(terminal);
  right_side.appendChild(right_title);
  right_side.appendChild(chart);

  document.body.appendChild(left_side);
  document.body.appendChild(right_side);

  // Stonk we are analyzing
  let STONK_TICKER = 'TSLA';

  let curr_price = await YF.quote({
    symbol: STONK_TICKER
  });

  title.innerHTML = `<h1>${STONK_TICKER} ${curr_price['price']['regularMarketPrice']}</h1>`;
  title.classList.add('title');

  terminal.innerHTML = 'loading...';

  /** Historical quotes */
  let quotes = await YF.historical({
    symbol: STONK_TICKER,
    from: '2019-07-25',
    to: '2020-07-25',
    period: 'd'
  });

  console.log(quotes);

  let prices = quotes.map((e) => e.close);
  let output_vol = {
    '2w' : vol_AVG(prices.slice(0, 10), 3),
    '1m' : vol_AVG(prices.slice(0, 20), 3),
    '3m' : vol_AVG(prices.slice(0, 60), 10),
    '6m' : vol_AVG(prices.slice(0, 120), 15),
    '1y' : vol_AVG(prices, 20)
  };

  let output_chart = '';
  for (const [key, value] of Object.entries(output_vol)) {
    output_chart +=
    `<tr>
      <th>
      ${key}
      </th>
      <th>
      ${value.vol_sa}
      </th>
      <th>
      ${value.vol_ma}
      </th>
      <th>
      ${value.vol_ema}
      </th>
    </tr>
    `;
  }

  /** Options quotes **/
  let options = await $.ajax(
    PROXY_URL + `query1.finance.yahoo.com/v7/finance/options/${STONK_TICKER}`
  );

  let calls = options['optionChain']['result'][0]['options'][0]['calls'];
  let puts  = options['optionChain']['result'][0]['options'][0]['puts'];

  console.log(puts);

  let output_puts = '';
  for (let i = 0; i < puts.length; i++) {
    output_puts +=
    `<tr>
      <th>
      ${puts[i]['contractSymbol']}
      </th>
      <th>
      ${Number(puts[i]['strike']).toFixed(2)}
      </th>
      <th>
      ${Number(puts[i]['lastPrice']).toFixed(2)}
      </th>
    </tr>
    `;
  }

  terminal.innerHTML = 
  `
  <table style="width:100%">
  <tr>
    <th>Contract Name</th>
    <th>Strike Price</th>
    <th>Last Price</th>
  </tr>
  ${output_puts}
  </table>
  `;

  chart.innerHTML = 
  `
  <table style="width:100%">
  <tr>
    <th>Time period</th>
    <th>SA</th>
    <th>MA</th>
    <th>EWMA</th>
  </tr>
  ${output_chart}
  </table>
  `;
}

init();