/**
 * Updates site elements associated options
 */

import * as CONST from '../constants.js';
import { cdf_normal } from '../analysis/general.js';
import { SUCCESS_GRADIENT } from '../analysis/CONST_ANALYSIS.js';

/**
 * 
 * @param { yf_options } options_response 
 * @param { vol_res } vol_res 
 */
export function update_options (options_response, vol_res, DOM) {
  let curr_price = options_response['quote']['regularMarketPrice'];
  let ticker = options_response['quote']['symbol'];
  let calls = options_response['options'][0]['calls'];
  let puts  = options_response['options'][0]['puts'];
  /*
  * Sample output:
  *
  * ask: 0.01
  * bid: 0
  * change: 0
  * contractSize: "REGULAR"
  * contractSymbol: "BYND200731P00065000"
  * currency: "USD"
  * expiration: 1596153600
  * impliedVolatility: 3.93750015625
  * inTheMoney: false
  * lastPrice: 0.01
  * lastTradeDate: 1595943521
  * openInterest: 154
  * percentChange: 0
  * strike: 65
  * volume: 2
  */

  // Sort calls and puts by indexing the strike price
  let calls_strike = new Map();
  for (let i = 0; i < calls.length; i++) {
    calls_strike.set(calls[i].strike, calls[i]);
  }
  let puts_strike = new Map();
  for (let i = 0; i < puts.length; i++) {
    puts_strike.set(puts[i].strike, puts[i]);
  }

  /** Implied move **/
  // We calculate this as the straddle (ATM Call + Put) * 0.85
  // We have to manually calculate the closest strike
  let atm_strike = -1;
  for (const key of puts_strike.keys()) {
    if (
      (atm_strike < 0) || 
      (Math.abs(curr_price - key) < Math.abs(curr_price - atm_strike))
    ) {
      atm_strike = key;
    }
  }

  let put_mid = (puts_strike.get(atm_strike).ask + puts_strike.get(atm_strike).bid) / 2;
  let call_mid = (calls_strike.get(atm_strike).ask + calls_strike.get(atm_strike).bid) / 2;
  let straddle = 0.85 * (put_mid + call_mid);
  let move_percentage = (straddle/curr_price);

  let implied_move_bottom = curr_price*(1-move_percentage);
  let implied_move_top = curr_price*(1+move_percentage);

  /** IV Chance of Profit **/
  // TODO: unsure if diff_days is accurate, accounting for current trading day
  const one_day = (24 * 60 * 60 * 1000); // hours*minutes*seconds*milliseconds
  // Yahoo finance is weird and returns an expiration date that is a bit off
  const diff_days = Math.ceil(Math.abs((new Date()) - (new Date(1000*puts[0]['expiration'] + 3600000*12))) / one_day);
  let implied_volatility = puts_strike.get(atm_strike).impliedVolatility;
  let iv_movement_until_exp = implied_volatility*Math.sqrt(diff_days/365);
  let iv_delta = iv_movement_until_exp * curr_price;

  let exp_date = new Date(1000*puts[0].expiration);
  exp_date.setHours(exp_date.getHours() + 12);

  DOM.implied_move.innerHTML = 
  `
  <p>
  <b>Implied move for ${ticker} until ${exp_date.toDateString()}</b> is
  ${(100*move_percentage).toFixed(2)}%
  <br>
  At current price of $${curr_price}, this means a target of 
  $${(implied_move_bottom).toFixed(2)} or
  $${(implied_move_top).toFixed(2)}.
  <br>
  This is marked on the table by two black lines.
  </p>
  <p>
  If we take a look at the IV of options, we can calculate an implied move of
  ${(100*iv_movement_until_exp).toFixed(2)}% of 1 standard deviation until
  the expiration date. We use this to calculate our chance of profit with IV.
  </p>
  `;

  /** Create table of options **/
  let output_puts = '';
  let vol_d_total = vol_res.vol_res_d['2w'].vol_ewma[vol_res.vol_res_d['2w'].vol_ewma.length - 1]*Math.sqrt(diff_days)/100;
  // Based on Gaussian, we'll multiply by \sqrt{t}/\sqrt{total_time}
  let vol_w_total = vol_res.vol_res_w['3m'].vol_ewma[vol_res.vol_res_w['3m'].vol_ewma.length - 1]*Math.sqrt(diff_days/5)/(100);
  let passed_bottom = false;
  let passed_top = false;

  // If the puts are all very much lower than at the money, then they will not show.
  let puts_too_low = puts[puts.length - 1]['strike'] < curr_price;
  let lower_bound = options_response['strikes'][Math.max(0, options_response['strikes'].indexOf(atm_strike) - 5)];
  let upper_bound = options_response['strikes'][Math.min(options_response['strikes'].length - 1, options_response['strikes'].indexOf(atm_strike) + 5)];
  let put_lower_bound = Math.min(lower_bound, curr_price*(1 - 3*iv_movement_until_exp));
  let put_upper_bound = Math.max(upper_bound, curr_price*(1 + 3*iv_movement_until_exp));

  let NUM_TABLE_COLS = 6;
  for (let i = 0; i < puts.length; i++) {
    // TODO: this logic is bad and complicated. It is meant to show the correct
    // number of options given the scenario
    if (
      // Not many options, show them all
      (puts.length < CONST.MAX_OPTIONS) ||
      // Strikes are significantly lower than the current price
      (puts_too_low && i >= (puts.length - (CONST.MAX_OPTIONS/2) + 1)) ||
      // Show strikes within our interest
      (puts[i]['strike'] > put_lower_bound &&
      puts[i]['strike'] < put_upper_bound) 
    ) {
      let break_even_price = puts[i]['strike'] - (puts[i]['ask'] + puts[i]['bid'])/2;
      iv_movement_until_exp = puts[i]['impliedVolatility']*Math.sqrt(diff_days/365);
      iv_delta = iv_movement_until_exp * curr_price;

      // RHS tail, since we want it to be above the strike for profit
      let cop_d = 
          (100*(1 - cdf_normal(break_even_price, curr_price, vol_d_total*curr_price))).toFixed(2);
      let cop_w = 
          (100*(1 - cdf_normal(break_even_price, curr_price, vol_w_total*curr_price))).toFixed(2);
      let cop_iv = 
          (100*(1 - cdf_normal(break_even_price, curr_price, iv_delta))).toFixed(2);

      // This code places the boundaries for the implied movement 
      if (!passed_bottom && puts[i]['strike'] > implied_move_bottom) {
        passed_bottom = true;
        output_puts += 
        `
        <tr>
        <td colspan="${NUM_TABLE_COLS}" style="background-color: black">
        </td>
        </tr>
        `;
      }

      if (!passed_top && puts[i]['strike'] > implied_move_top) {
        passed_top = true;
        output_puts += 
        `
        <tr>
        <td colspan="${NUM_TABLE_COLS}" style="background-color: black">
        </td>
        </tr>
        `;
      }

      let curr_cell_color = 'white';

      if (puts[i]['strike'] == atm_strike) {
        curr_cell_color = '#add8e6';
      }

      // Adds the current entry
      output_puts +=
      `<tr>
        <td style="background-color: ${curr_cell_color}">
        ${Number(puts[i]['strike']).toFixed(2)}
        </td>
        <td>
        ${Number(puts[i]['lastPrice']).toFixed(2)}
        </td>
        <td>
        ${Number(100*puts[i]['impliedVolatility']).toFixed(2)}%
        </td>
        <td style="background-color:${SUCCESS_GRADIENT(cop_d)}">
        ${cop_d}%
        </td>
        <td style="background-color:${SUCCESS_GRADIENT(cop_w)}">
        ${cop_w}%
        </td>
        <td style="background-color:${SUCCESS_GRADIENT(cop_iv)}">
        ${cop_iv}%
        </td>
      </tr>
      `;
    }
  }

  DOM.terminal.innerHTML = 
  `
  <table style="width:100%">
  <tr>
    <th>Strike</th>
    <th>Last Price</th>
    <th>IV</th>
    <th>COP_d</th>
    <th>COP_w</th>
    <th>COP_IV</th>
  </tr>
  ${output_puts}
  </table>
  `;
}