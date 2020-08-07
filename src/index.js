/**
 * Main entrypoint of app
 */

// Stylesheet
import './styles/index.scss';

// Constants
import * as CONST from './constants.js';
import * as CONST_STYLE from './CONST_STYLE.js';

// Utility
import { Chart_d3 } from './plot/plot_d3.js';
import * as UTIL from './util.js';

// Webpage building functions
import { update_current_quote } from './pages/quote.js';
import { update_historical } from './pages/historical.js';
import { update_options } from './pages/options.js';

// For retrieving historical data
import * as YF from 'yahoo-finance';

/*** STORE GLOBAL VARIABLES ***/
// Global state variables
const STATE = {};

// Store reference to DOM here
const DOM = {};

// Stores references to our d3 charts
const CHARTS = {};

// From our HTML requests
const DATA = {};

/**
 * Builds the website and starts up the app
 */
async function init () {
  /** DOCUMENT LAYOUT* */
  // Right side
  DOM.right_side = document.createElement('div');
  DOM.right_title = document.createElement('div');
  DOM.timescale_filler = document.createElement('div');
  DOM.timescale_filler.classList.add('timescale_wrapper');
  DOM.vol_analysis = document.createElement('div');
  DOM.chart_vol = document.createElement('div');
  DOM.chart_vol.id = 'chart_vol';
  DOM.implied_move = document.createElement('div');
  DOM.implied_move.classList.add('implied_move');

  DOM.right_side.classList.add('right_side');
  DOM.right_title.classList.add('title');

  DOM.right_title.innerHTML = 'Analysis';
  DOM.right_side.appendChild(DOM.right_title);
  DOM.right_side.appendChild(DOM.timescale_filler);
  DOM.right_side.appendChild(DOM.chart_vol);
  DOM.right_side.appendChild(DOM.vol_analysis);
  DOM.right_side.appendChild(DOM.implied_move);

  // Left side
  DOM.left_side = document.createElement('div');
  DOM.left_side.classList.add('left_side');
  DOM.title = document.createElement('div');
  DOM.title.classList.add('title');
  DOM.title_stock_price = document.createElement('div');
  DOM.title_stock_price.classList.add('stock_ticker_price');
  DOM.title_stock_change = document.createElement('div');
  DOM.title_stock_change.classList.add('stock_ticker_change');
  DOM.search_bar = document.createElement('div');
  DOM.search_bar.classList.add('search_bar');
  DOM.ticker_input = document.createElement('input');

  DOM.timescale_wrapper = document.createElement('div');
  DOM.timescale_wrapper.classList.add('timescale_wrapper');
  DOM.timescale = document.createElement('div');
  DOM.timescale.classList.add('timescale');
  DOM.timescale_wrapper.appendChild(DOM.timescale);

  DOM.chart_price = document.createElement('div');
  DOM.chart_price.id = 'chart_price';
  DOM.options_chain_select_wrapper = document.createElement('div');
  DOM.options_chain_select_wrapper.classList.add('options_chain_select_wrapper');
  DOM.options_chain_select = document.createElement('select');
  DOM.options_chain_select_label = document.createElement('span');
  DOM.options_chain_select_label.innerHTML = 'Expiration: ';
  DOM.terminal = document.createElement('div');

  DOM.search_bar.appendChild(DOM.ticker_input);
  DOM.title.appendChild(DOM.search_bar);
  DOM.title.appendChild(DOM.title_stock_price);
  DOM.title.appendChild(DOM.title_stock_change);
  DOM.left_side.appendChild(DOM.title);
  DOM.left_side.appendChild(DOM.timescale_wrapper);
  DOM.left_side.appendChild(DOM.chart_price);
  DOM.left_side.appendChild(DOM.options_chain_select_wrapper);
  DOM.options_chain_select_wrapper.appendChild(DOM.options_chain_select_label);
  DOM.options_chain_select_wrapper.appendChild(DOM.options_chain_select);
  DOM.left_side.appendChild(DOM.terminal);

  // Main page
  DOM.body_wrapper = document.createElement('div');
  DOM.body_wrapper.classList.add('body_wrapper');
  DOM.disclaimer = document.createElement('div');
  DOM.disclaimer.classList.add('disclaimer');
  DOM.disclaimer.innerHTML = 'This is not investment advice.';
  DOM.body_wrapper.appendChild(DOM.left_side);
  DOM.body_wrapper.appendChild(DOM.right_side);
  document.body.appendChild(DOM.body_wrapper);
  document.body.appendChild(DOM.disclaimer);

  // Search Bar
  DOM.ticker_input.addEventListener('keyup', (event) => {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
      // Cancel the default action, if needed
      event.preventDefault();

      // Reset visibility
      DOM.title.classList.remove('search_active') ;
      DOM.search_bar.classList.remove('search_active');
      document.body.classList.remove('search_active');

      if (DOM.ticker_input.value.toUpperCase() != STATE.ticker) {
        // Get new quotes
        main(DOM.ticker_input.value);
      }
    }
  });

  DOM.title_stock_price.onclick = () => {
    DOM.search_bar.classList.add('search_active');
    DOM.title.classList.add('search_active');
    document.body.classList.add('search_active');

    DOM.ticker_input.focus();
  };

  // Initialize charts
  CHARTS.price = new Chart_d3(
    'chart_price', 
    {top: 20, right: 20, bottom: 50, left: 70}
  );
  CHARTS.vol = new Chart_d3(
    'chart_vol', 
    {top: 20, right: 70, bottom: 50, left: 70}
  );

  /** TIMESCALE **/
  for (let i = 0; i < CONST.GRANULARITY_KEYS.length; i++) {
    let curr_time = document.createElement('div');
    curr_time.classList.add('timescale_button');
    curr_time.innerHTML = CONST.GRANULARITY_KEYS[i];

    curr_time.onclick = () => plot_historical(CONST.GRANULARITY_KEYS[i]);

    DOM.timescale.appendChild(curr_time);
  }

  // Kick off webpage building
  if (main(CONST.DEFAULT_TICKER) < 0) {
    console.log('main initialization error');
  }
}

/**
  * Builds the entire webpage. 
  *
  * Makes requests for all the data needed
  *
  * @param { string } ticker 
  */
async function main (ticker) {
  ticker = ticker.toUpperCase();

  DOM.title_stock_price.innerHTML = `getting quotes for ${ticker}...`;
  /** Current quote and options **/
  try {
    // This response will return the most recent expiration,
    // but will also return the other available expirations
    let promise1 = $.ajax(
      CONST.PROXY_URL + `query1.finance.yahoo.com/v7/finance/options/${ticker}`
    );

    let curr_date = new Date();
    curr_date.setFullYear(curr_date.getFullYear() - 1);

    let promise2 = YF.historical({
      symbol: ticker,
      from: UTIL.YAHOO_DATE(curr_date),
      to: UTIL.YAHOO_DATE(new Date()),
      period: 'd'
    });

    const data = await Promise.all([promise1, promise2]);

    // Extract out layers
    DATA.options_response = data[0]['optionChain']['result'][0];
    DATA.quotes_d = data[1];
    STATE.ticker = DATA.options_response['quote']['symbol'];
  } catch (err) {
    console.log(err);
    return -1;
  }

  update_current_quote(DATA.options_response['quote'], DOM);

  /** Historical quotes */
  DATA.vol_res = update_historical(DATA.quotes_d, DOM, CHARTS);

  update_options(DATA.options_response, DATA.vol_res, DOM);

  // Set up options chain select
  update_options_select(DATA.options_response, DOM);

  // Tell MathJax to typeset our equations
  // eslint-disable-next-line no-undef
  MathJax.typeset();
}

function update_options_select(options_response, DOM) {
  let available_dates = options_response['expirationDates'].map(date => {
    let new_date = new Date(date*1000);

    // The Yahoo Finance API seems to return 19, 20 o'clock before the next day
    new_date.setHours(new_date.getHours() + 12);

    return new_date;
  });

  DOM.options_chain_select.innerHTML = '';
  for (let i = 0; i < available_dates.length; i++) {
    DOM.options_chain_select.innerHTML += 
    `
    <option value="${options_response['expirationDates'][i]}">
    ${available_dates[i].toLocaleDateString('en-US')}
    </option>
    `;
  }

  DOM.options_chain_select.onchange = () => {
    let new_date = DOM.options_chain_select.value;

    $.ajax(
      CONST.PROXY_URL + `query1.finance.yahoo.com/v7/finance/options/${STATE.ticker}?&date=${new_date}`
    ).then(data => {
      DATA.options_response = data['optionChain']['result'][0];
      update_options(DATA.options_response, DATA.vol_res, DOM);
    }).catch(err => {
      console.log('Error changing options chain', err);
    });
  };
}

/**
  * Used to plot historical quotes and volatility on the charts
  * @param { string } granularity Should be 1y, 6m, 3m, 1m, 2w
  */
function plot_historical (granularity) {
  if (granularity != '1y') {
    CHARTS.price.plot_line('price', DATA.quotes_d.slice(0, CONST.GRANULARITY[granularity]), 'date', 'close', true);
    CHARTS.vol.plot_line('price', DATA.quotes_d.slice(0, CONST.GRANULARITY[granularity]), 'date', 'close', false, CONST_STYLE.GREEN_BYND, 1);
    CHARTS.vol.plot_line('vol', DATA.vol_res.data_vol.slice(0, CONST.GRANULARITY[granularity]), 'date', 'vol_ewma', true, CONST_STYLE.BLUE_FB);
  } else {
    CHARTS.price.plot_line('price', DATA.quotes_d, 'date', 'close', true);
    CHARTS.vol.plot_line('price', DATA.quotes_d, 'date', 'close', false, CONST_STYLE.GREEN_BYND, 1);
    CHARTS.vol.plot_line('vol', DATA.vol_res.data_vol, 'date', 'vol_ewma', true, CONST_STYLE.BLUE_FB);
  }
}

init();