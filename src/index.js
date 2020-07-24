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
  let title    = document.createElement('div');

  // Main output
  let terminal = document.createElement('div');

  document.body.appendChild(title);
  document.body.appendChild(terminal);

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
    PROXY_URL + `finance.yahoo.com\/quote\/${STONK_TICKER}\/options\/`
  );

  /** GET OPTIONS DATA */
  // TODO: magic numbers af to parse this.
  let options_data = JSON.parse(
    options.slice(
      options.search(/\"displayed/)+12,
      options.search(/\"MobileHeaderStore/)-22
    )
  );

  let calls = options_data['calls']['contracts'];
  let puts  = options_data['puts']['contracts'];

  console.log(puts);

  let output_puts = '';
  for (let i = 0; i < puts.length; i++) {
    output_puts +=
    `<tr>
      <th>
      ${puts[i]['contractSymbol']}
      </th>
      <th>
      ${puts[i]['strike']['fmt']}
      </th>
      <th>
      ${puts[i]['lastPrice']['fmt']}
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