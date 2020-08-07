/**
 * Operations associated with historical quotes
 */ 

import * as CONST_STYLE from '../CONST_STYLE.js';
import { vol_AVG } from '../analysis/vol.js';

/**
 * Updates charts associated with historical quotes
 *
 * @param { yf_quotes } quotes_d Daily quotes
 *
 * @returns Volatility analysis results
 * 
 * @bug Assumes that we have a year's worth of quotes.
 * If this is not the case, many calculations will fail.
 * Plotting will probably be fine but be weird since
 * there are null spots. A good solution would probably be 
 * to just have null-handling in the volatility calculations,
 * e.g. skip through all the null entries.
 */
export function update_historical (quotes_d, DOM, CHARTS) {
  console.log('historical');
  // If the current week is not complete, the weekly will return a null entry
  CHARTS.price.plot_line('price', quotes_d, 'date', 'close', true);

  // Concern: when we do things like this we lose the date that is associated
  // with each price
  let prices_d = quotes_d.map((e) => e.close);
  let prices_w = [];

  for (let i = 0; i < prices_d.length; i += 5) {
    prices_w.push(prices_d[i]);
  }

  let vol_res_d = {
    '2w' : vol_AVG(prices_d.slice(0, 10)),
    '1m' : vol_AVG(prices_d.slice(0, 20)),
    '3m' : vol_AVG(prices_d.slice(0, 60)),
    '6m' : vol_AVG(prices_d.slice(0, 120)),
    '1y' : vol_AVG(prices_d)
  };

  let vol_res_w = {
    '3m' : vol_AVG(prices_w.slice(0, 12)),
    '6m' : vol_AVG(prices_w.slice(0, 24)),
    '1y' : vol_AVG(prices_w)
  };

  console.log(vol_res_w)

  // Plot volatility
  // Notice that we have one less data point since we don't 
  // have the volatility for the first day
  let data_vol = [];

  for (let i = 1; i < quotes_d.length; i++) {
    data_vol.push(
      {
        date: quotes_d[i]['date'],
        vol_sa: vol_res_d['1y']['vol_sa'][i-1],
        vol_ewma: vol_res_d['1y']['vol_ewma'][i-1]
      }
    );
  }

  // Increase right margin for second plot since we are plotting two series
  CHARTS.vol.plot_line('price', quotes_d, 'date', 'close', false, CONST_STYLE.GREEN_BYND, 1);
  CHARTS.vol.plot_line('vol', data_vol, 'date', 'vol_ewma', true, CONST_STYLE.BLUE_FB);

  CHARTS.vol.add_legend(
    ['Volatility', 'Price'],
    [CONST_STYLE.BLUE_FB, CONST_STYLE.GREEN_BYND]
  );

  let output_vol = '';

  // First do the weekly
  output_vol += 
  `
  <th colspan="3">Granularity: 1w</th>
  <tr>
    <th>Sample timeline</th>
    <th>SA</th>
    <th>EWMA</th>
  </tr>
  `;
  for (const [key, value] of Object.entries(vol_res_w)) {
    output_vol +=
    `<tr>
      <td>
      ${key}
      </td>
      <td>
      ${(value.vol_sa[value.vol_sa.length-1]).toFixed(3)}%
      </td>
      <td>
      ${(value.vol_ewma[value.vol_ewma.length-1]).toFixed(3)}%
      </td>
    </tr>
    `;
  }

  // Do the daily volatility
  output_vol += 
  `
  <th colspan="3">Granularity: 1d</th>
  <tr>
    <th>Sample timeline</th>
    <th>SA</th>
    <th>EWMA</th>
  </tr>
  `;
  for (const [key, value] of Object.entries(vol_res_d)) {
    output_vol +=
    `<tr>
      <td>
      ${key}
      </td>
      <td>
      ${(value.vol_sa[value.vol_sa.length-1]).toFixed(3)}%
      </td>
      <td>
      ${(value.vol_ewma[value.vol_ewma.length-1]).toFixed(3)}%
      </td>
    </tr>
    `;
  }

  DOM.vol_analysis.innerHTML = 
  `
  <table style="width:100%">
  ${output_vol}
  </table>
  `;

  return {
    vol_res_d: vol_res_d,
    vol_res_w: vol_res_w,
    data_vol: data_vol
  };
}