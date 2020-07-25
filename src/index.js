/**
 * Main entrypoint of app
 */

import './components/style.scss';
import { PROXY_URL } from './constants.js';
const YF = require('yahoo-finance');

/**
 * Builds the website and starts up the app
 */
async function init () {
  // Layout
  let left_side = document.createElement('div');
  let right_side = document.createElement('div');

  let title    = document.createElement('div');

  // Main output
  let terminal = document.createElement('div');

  // Chart
  let chart = document.createElement('div');

  left_side.classList.add('left_side');
  right_side.classList.add('right_side');
  left_side.appendChild(title);
  left_side.appendChild(terminal);
  right_side.appendChild(chart);

  document.body.appendChild(left_side);
  document.body.appendChild(right_side);

  chart.innerHTML = 'chart location';

  // Stonk we are analyzing
  let STONK_TICKER = 'BYND';

  let curr_price = await YF.quote({
    symbol: STONK_TICKER
  });

  console.log(curr_price);

  title.innerHTML = `<h1>${STONK_TICKER} ${curr_price['price']['regularMarketPrice']}</h1>`;
  title.classList.add('title');

  terminal.innerHTML = 'loading...';

  /** Historical quotes */
  let quotes = await YF.historical({
    symbol: STONK_TICKER,
    from: '2020-01-01',
    to: '2020-06-30',
    period: 'd'
  });

  let options = await $.ajax(
    PROXY_URL + `query1.finance.yahoo.com/v7/finance/options/${STONK_TICKER}`
  );

  console.log(options);

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
}

init();