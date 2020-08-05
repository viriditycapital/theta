/**
 * Main entrypoint of app
 */

import './styles/index.scss';
import * as CONST from './constants.js';
import { cdf_normal } from './analysis/general.js';
import { vol_AVG } from './analysis/vol.js';
import * as CONST_STYLE from './CONST_STYLE.js';
import { Chart_d3 } from './plot/plot_d3.js';

import * as YF from 'yahoo-finance';
import { SUCCESS_GRADIENT } from './analysis/CONST_ANALYSIS';

/**
 * Builds the website and starts up the app
 */
async function init () {
  /** DOCUMENT LAYOUT* */
  // Right side
  let right_side = document.createElement('div');
  let right_title = document.createElement('div');
  let timescale_filler = document.createElement('div');
  timescale_filler.classList.add('timescale_wrapper');
  let vol_analysis = document.createElement('div');
  let chart_vol = document.createElement('div');
  chart_vol.id = 'chart_vol';
  let implied_move = document.createElement('div');
  implied_move.classList.add('implied_move');

  right_side.classList.add('right_side');
  right_title.classList.add('title');

  right_title.innerHTML = 'Analysis';
  right_side.appendChild(right_title);
  right_side.appendChild(timescale_filler);
  right_side.appendChild(chart_vol);
  right_side.appendChild(vol_analysis);
  right_side.appendChild(implied_move);

  // Left side
  let left_side = document.createElement('div');
  left_side.classList.add('left_side');
  let title = document.createElement('div');
  title.classList.add('title');
  let title_stock_price = document.createElement('div');
  title_stock_price.classList.add('stock_ticker_price');
  let title_stock_change = document.createElement('div');
  title_stock_change.classList.add('stock_ticker_change');
  let search_bar = document.createElement('div');
  search_bar.classList.add('search_bar');
  let ticker_input = document.createElement('input');

  let timescale_wrapper = document.createElement('div');
  timescale_wrapper.classList.add('timescale_wrapper');
  let timescale = document.createElement('div');
  timescale.classList.add('timescale');
  timescale_wrapper.appendChild(timescale);

  let chart_price = document.createElement('div');
  chart_price.id = 'chart_price';
  let terminal = document.createElement('div');

  search_bar.appendChild(ticker_input);
  title.appendChild(search_bar);
  title.appendChild(title_stock_price);
  title.appendChild(title_stock_change);
  left_side.appendChild(title);
  left_side.appendChild(timescale_wrapper);
  left_side.appendChild(chart_price);
  left_side.appendChild(terminal);

  // Main page
  let body_wrapper = document.createElement('div');
  body_wrapper.classList.add('body_wrapper');
  let disclaimer = document.createElement('div');
  disclaimer.innerHTML = 'This is not investment advice.';
  body_wrapper.appendChild(left_side);
  body_wrapper.appendChild(right_side);
  document.body.appendChild(body_wrapper);
  document.body.appendChild(disclaimer);

  // Search Bar
  ticker_input.addEventListener('keyup', (event) => {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
      // Cancel the default action, if needed
      event.preventDefault();

      // Reset visibility
      title.classList.remove('search_active') ;
      search_bar.classList.remove('search_active');
      document.body.classList.remove('search_active');

      // Get new quotes
      main(ticker_input.value);
    }
  });

  title_stock_price.onclick = () => {
    search_bar.classList.add('search_active');
    title.classList.add('search_active');
    document.body.classList.add('search_active');

    ticker_input.focus();
  };

  // Initialize charts
  let chart_price_obj = new Chart_d3 ('chart_price', {top: 20, right: 20, bottom: 50, left: 70});
  let chart_vol_obj = new Chart_d3 ('chart_vol', {top: 20, right: 70, bottom: 50, left: 70});

  // Global data
  let quotes_d;
  let quotes_w;
  let data_vol;

  main(CONST.DEFAULT_TICKER);

  async function main (ticker) {
    ticker = ticker.toUpperCase();

    let curr_price = await get_current_quote(ticker);

    // If there is an error, stop
    if (curr_price >= 0) {
      get_historical_quotes(ticker, curr_price);
    }

    // Tell MathJax to typeset our equations
    // eslint-disable-next-line no-undef
    MathJax.typeset();
  }

  /** GATHER DATA AND PERFORM ANALYSIS **/
  async function get_current_quote (ticker) {
    title_stock_price.innerHTML = 'getting quotes...';
    /* Current snapshot of stock */
    let curr_price_response;
    try {
      curr_price_response = await YF.quote({
        symbol: ticker
      });
    } catch (err) {
      title_stock_price.innerHTML = 'invalid ticker';
      return -1;
    }

    try {
      let curr_price = curr_price_response['price']['regularMarketPrice'];
      let curr_price_delta = (curr_price_response['price']['regularMarketChange']).toFixed(2);
      let curr_price_delta_percent = (100*curr_price_response['price']['regularMarketChangePercent']).toFixed(2);

      title_stock_price.innerHTML = `${ticker} $${(curr_price).toFixed(2)}`;

      if (curr_price_delta >= 0) {
        title_stock_change.innerHTML = `<b>+${curr_price_delta} (+${curr_price_delta_percent}%)</b>`;
        title_stock_change.classList.remove('stock_ticker_red');
        title_stock_change.classList.add('stock_ticker_green');
      } else {
        title_stock_change.innerHTML = `<b>${curr_price_delta} (${curr_price_delta_percent}%)</b>`;
        title_stock_change.classList.remove('stock_ticker_green');
        title_stock_change.classList.add('stock_ticker_red');
      }

      return curr_price;
    } catch (err) {
      title_stock_price.innerHTML = 'invalid ticker';
      return -1;
    }
  }

  async function get_historical_quotes (ticker, curr_price) {
    let YAHOO_DATE = (date) => `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;

    /** Historical quotes */
    terminal.innerHTML = 'loading...';
    let curr_date = new Date();
    let curr_date_string = YAHOO_DATE(curr_date);
    curr_date.setFullYear(curr_date.getFullYear() - 1);
    let past_date_string = YAHOO_DATE(curr_date);

    quotes_d = await YF.historical({
      symbol: ticker,
      from: past_date_string,
      to: curr_date_string,
      period: 'd'
    });

    // If the current week is not complete, the weekly will return a null entry
    let prev_monday = new Date();
    prev_monday.setDate(prev_monday.getDate() - 1 - (prev_monday.getDay() + 6) % 7);

    quotes_w = await YF.historical({
      symbol: ticker,
      from: past_date_string,
      to: YAHOO_DATE(prev_monday),
      period: 'w'
    });

    chart_price_obj.plot_line('price', quotes_d, 'date', 'close', true);

    // Concern: when we do things like this we lose the date that is associated
    // with each price
    let prices_d = quotes_d.map((e) => e.close);
    let prices_w = quotes_w.map((e) => e.close);

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

    // Plot volatility
    // Notice that we have one less data point since we don't 
    // have the volatility for the first day
    data_vol = [];

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
    chart_vol_obj.plot_line('price', quotes_d, 'date', 'close', false, CONST_STYLE.GREEN_BYND, 1);
    chart_vol_obj.plot_line('vol', data_vol, 'date', 'vol_ewma', true, CONST_STYLE.BLUE_FB);

    chart_vol_obj.add_legend(
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

    /** Options quotes **/
    let options = await $.ajax(
      CONST.PROXY_URL + `query1.finance.yahoo.com/v7/finance/options/${ticker}`
    );

    let calls = options['optionChain']['result'][0]['options'][0]['calls'];
    let puts  = options['optionChain']['result'][0]['options'][0]['puts'];
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
    const diff_days = Math.ceil(Math.abs((new Date()) - (new Date(1000*puts[0]['expiration']))) / one_day);
    let implied_volatility = puts_strike.get(atm_strike).impliedVolatility;
    let iv_movement_until_exp = implied_volatility*Math.sqrt(diff_days/365);
    let iv_delta = iv_movement_until_exp * curr_price;

    implied_move.innerHTML = 
    `
    <p>
    <b>Implied move for ${ticker} until ${(new Date(1000*puts[0].expiration)).toDateString()}</b>
    ${(100*move_percentage).toFixed(2)}%
    <br>
    At current price of $${curr_price}, this means a target of 
    $${(implied_move_bottom).toFixed(2)} or
    $${(implied_move_top).toFixed(2)}.
    <br>
    This is marked on the table by two black lines.
    </p>
    <p>
    If we take a look at the IV of options, we can calculate an implied move of ${(100*iv_movement_until_exp).toFixed(2)}%
    of 1 standard deviation. We use this to calculate our chance of profit with IV.
    </p>
    `;

    /** Create table of options **/

    let output_puts = '';
    let vol_d_total = vol_res_d['2w'].vol_ewma[vol_res_d['2w'].vol_ewma.length - 1]*diff_days/100;
    // Based on Gaussian, we'll multiply by \sqrt{t}/\sqrt{total_time}
    let vol_w_total = vol_res_w['3m'].vol_ewma[vol_res_w['3m'].vol_ewma.length - 1]*Math.sqrt(diff_days/5)/(100);
    let passed_bottom = false;
    let passed_top = false;

    let NUM_TABLE_COLS = 6;
    for (let i = 0; i < puts.length; i++) {
      if (
        (puts.length < CONST.MAX_OPTIONS) ||
        (puts[i]['strike'] > curr_price*(1 - 4*vol_d_total) &&
        puts[i]['strike'] < curr_price*(1 + 4*vol_d_total))
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

    terminal.innerHTML = 
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

    vol_analysis.innerHTML = 
    `
    <table style="width:100%">
    ${output_vol}
    </table>
    `;
  }

  /** TIMESCALE **/
  for (let i = 0; i < CONST.GRANULARITY_KEYS.length; i++) {
    let curr_time = document.createElement('div');
    curr_time.classList.add('timescale_button');
    curr_time.innerHTML = CONST.GRANULARITY_KEYS[i];

    curr_time.onclick = () => plot_historical(CONST.GRANULARITY_KEYS[i]);

    timescale.appendChild(curr_time);
  }

  /**
   * 
   * @param { string } granularity Should be 1y, 6m, 3m, 1m, 2w
   */
  function plot_historical (granularity) {
    if (granularity != '1y') {
      chart_price_obj.plot_line('price', quotes_d.slice(0, CONST.GRANULARITY[granularity]), 'date', 'close', true);
      chart_vol_obj.plot_line('price', quotes_d.slice(0, CONST.GRANULARITY[granularity]), 'date', 'close', false, CONST_STYLE.GREEN_BYND, 1);
      chart_vol_obj.plot_line('vol', data_vol.slice(0, CONST.GRANULARITY[granularity]), 'date', 'vol_ewma', true, CONST_STYLE.BLUE_FB);
    } else {
      chart_price_obj.plot_line('price', quotes_d, 'date', 'close', true);
      chart_vol_obj.plot_line('price', quotes_d, 'date', 'close', false, CONST_STYLE.GREEN_BYND, 1);
      chart_vol_obj.plot_line('vol', data_vol, 'date', 'vol_ewma', true, CONST_STYLE.BLUE_FB);
    }
  }

}

init();