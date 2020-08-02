/**
 * Main entrypoint of app
 */

import './styles/index.scss';
import { PROXY_URL } from './constants.js';
import { cdf_normal } from './analysis/general.js';
import { vol_AVG } from './analysis/vol.js';
import * as CONST_STYLE from './CONST_STYLE.js';

import * as d3 from 'd3';
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
  let vol_analysis = document.createElement('div');
  let chart_vol = document.createElement('div');
  chart_vol.id = 'chart_vol';

  right_side.classList.add('right_side');
  right_title.classList.add('title');

  right_title.innerHTML = '<h1>Analysis</h1>';
  right_side.appendChild(right_title);
  right_side.appendChild(chart_vol);
  right_side.appendChild(vol_analysis);

  // Left side
  let left_side = document.createElement('div');
  left_side.classList.add('left_side');
  let title    = document.createElement('div');
  let chart_price = document.createElement('div');
  chart_price.id = 'chart_price';
  let terminal = document.createElement('div');

  left_side.appendChild(title);
  left_side.appendChild(chart_price);
  left_side.appendChild(terminal);

  // Main page
  document.body.appendChild(left_side);
  document.body.appendChild(right_side);

  /** GATHER DATA AND PERFORM ANALYSIS **/
  // Stonk we are analyzing
  let STONK_TICKER = 'BYND';

  title.innerHTML = 'getting quotes...';
  /* Current snapshot of stock */
  let curr_price_response = await YF.quote({
    symbol: STONK_TICKER
  });

  let curr_price = curr_price_response['price']['regularMarketPrice'];
  title.innerHTML = `<h1>${STONK_TICKER} ${curr_price}</h1>`;
  title.classList.add('title');

  terminal.innerHTML = 'loading...';

  /** Historical quotes */
  let curr_date = new Date();
  let curr_date_string = `${curr_date.getFullYear()}-${curr_date.getMonth()+1}-${curr_date.getDate()}`;
  curr_date.setFullYear(curr_date.getFullYear() - 1);
  let past_date_string = `${curr_date.getFullYear()}-${curr_date.getMonth()+1}-${curr_date.getDate()}`;

  let quotes_d = await YF.historical({
    symbol: STONK_TICKER,
    from: past_date_string,
    to: curr_date_string,
    period: 'd'
  });

  let quotes_w = await YF.historical({
    symbol: STONK_TICKER,
    from: past_date_string,
    to: curr_date_string,
    period: 'w'
  });

  // set the dimensions and margins of the graph
  var margin = {top: 20, right: 20, bottom: 50, left: 70};
  var width = 460 - margin.left - margin.right;
  var height = 450 - margin.top - margin.bottom;

  // set the ranges
  var x = d3.scaleTime().range([0, width]);
  var y = d3.scaleLinear().range([height, 0]);

  // append the svg obgect to the body of the page
  // appends a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  var svg = d3.select('#chart_price').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr(
      'transform',
      'translate(' + margin.left + ',' + margin.top + ')'
    );

  // Scale the range of the data
  x.domain(d3.extent(quotes_d, function(d) { return d.date; }));
  y.domain([d3.min(quotes_d, function(d) { return d.close; }), d3.max(quotes_d, function(d) { return d.close; })]);

  // Add the valueline path.
  svg.append('path')
    .data([quotes_d])
    .attr('fill', 'none')
    .attr('stroke', CONST_STYLE.BLUE_FB)
    .attr('stroke-width', 1.5)
    .attr('d', d3.line()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.close); })
    );

  // Add the x Axis
  svg.append('g')
    .attr('transform', 'translate(0,' + height + ')')
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('y', 0)
    .attr('x', 9)
    .attr('dy', '.35em')
    .attr('transform', 'rotate(90)')
    .style('text-anchor', 'start');

  // Add the y Axis
  svg.append('g')
    .call(d3.axisLeft(y));

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

  // Increase right margin for second plot
  margin = {top: 20, right: 70, bottom: 50, left: 70};

  // set the ranges
  var x_2 = d3.scaleTime().range([0, width]);
  var y_2 = d3.scaleLinear().range([height, 0]);

  // append the svg object to the body of the page
  // appends a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  var svg_2 = d3.select('#chart_vol').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr(
      'transform',
      'translate(' + margin.left + ',' + margin.top + ')'
    );

  // Scale the range of the data
  x_2.domain(d3.extent(data_vol, function(d) { return d.date; }));
  y_2.domain([d3.min(data_vol, function(d) { return d.vol_ewma; }), d3.max(data_vol, function(d) { return d.vol_ewma; })]);

  // Plot the price under the volatility
  svg_2.append('path')
    .data([quotes_d])
    .attr('fill', 'none')
    .attr('stroke', CONST_STYLE.GREEN_BYND)
    .attr('stroke-width', 1.5)
    .attr('d', d3.line()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.close); })
    );
  
  // Plot the volatility
  svg_2.append('path')
    .data([data_vol])
    .attr('fill', 'none')
    .attr('stroke', CONST_STYLE.BLUE_FB)
    .attr('stroke-width', 3)
    .attr('d', d3.line()
      .x(function(d) { return x_2(d.date); })
      .y(function(d) { return y_2(d.vol_ewma); })
    );

  // Add the x Axis
  svg_2.append('g')
    .attr('transform', 'translate(0,' + height + ')')
    .call(d3.axisBottom(x_2))
    .selectAll('text')
    .attr('y', 0)
    .attr('x', 9)
    .attr('dy', '.35em')
    .attr('transform', 'rotate(90)')
    .style('text-anchor', 'start');

  // Add the y Axis
  svg_2.append('g')
    .call(d3.axisLeft(y_2));

  svg_2.append('g')
    .attr('transform', `translate(${width}, 0)`)
    .call(d3.axisRight(y));

  // Handmade legend
  svg_2.append('circle')
    .attr('cx', width - 80)
    .attr('cy', 20)
    .attr('r', 6)
    .style('fill', CONST_STYLE.GREEN_BYND);

  svg_2.append('text')
    .attr('x', width - 60)
    .attr('y', 20)
    .text('Price')
    .style('font-size', '15px')
    .attr('alignment-baseline', 'middle');

  svg_2.append('circle')
    .attr('cx', width - 80)
    .attr('cy', 40)
    .attr('r', 6)
    .style('fill', '#404080');

  svg_2.append('text')
    .attr('x', width - 60)
    .attr('y', 40)
    .text('Volatility')
    .style('font-size', '15px')
    .attr('alignment-baseline', 'middle');

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
    PROXY_URL + `query1.finance.yahoo.com/v7/finance/options/${STONK_TICKER}`
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

  // TODO: unsure if diff_days is accurate, accounting for current trading day
  const one_day = (24 * 60 * 60 * 1000); // hours*minutes*seconds*milliseconds
  const diff_days = Math.ceil(Math.abs((new Date()) - (new Date(1000*puts[0]['expiration']))) / one_day);

  let output_puts = '';
  let vol_d_total = vol_res_d['2w'].vol_ewma[vol_res_d['2w'].vol_ewma.length - 1]*diff_days/100;
  // TODO: Unsure if it is valid to just take 1w vol and divide by 5 for daily...
  let vol_w_total = vol_res_w['3m'].vol_ewma[vol_res_w['3m'].vol_ewma.length - 1]*diff_days/(5*100);
  for (let i = 0; i < puts.length; i++) {
    if (
      puts[i]['strike'] > curr_price*(1 - 4*vol_d_total) &&
      puts[i]['strike'] < curr_price*(1 + 4*vol_d_total)
    ) {
      // RHS tail, since we want it to be above the strike for profit
      let cop_d = 
          (100*(1 - cdf_normal(puts[i]['strike'], curr_price, vol_d_total*curr_price))).toFixed(2);
      let cop_w = 
          (100*(1 - cdf_normal(puts[i]['strike'], curr_price, vol_w_total*curr_price))).toFixed(2);


      output_puts +=
      `<tr>
        <td>
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

  // Implied move
  // We calculate this as the straddle (ATM Call + Put) * 0.85
  let atm_strike = Math.round(curr_price);

  console.log(puts_strike);


  let put_mid = (puts_strike.get(atm_strike).ask + puts_strike.get(atm_strike).bid) / 2;
  let call_mid = (calls_strike.get(atm_strike).ask + calls_strike.get(atm_strike).bid) / 2;
  let straddle = 0.85 * (put_mid + call_mid);
  let move_percentage = (straddle/curr_price);

  let implied_move = document.createElement('div');
  implied_move.classList.add('implied_move');

  implied_move.innerHTML = 
  `
  <b>Implied move for ${STONK_TICKER} until ${(new Date(1000*puts[0].expiration)).toDateString()}</b>
  ${(100*move_percentage).toFixed(2)}%
  <br>
  At current price of $${curr_price}, this means a target of 
  $${(curr_price*(1-move_percentage)).toFixed(2)} or
  $${(curr_price*(1+move_percentage)).toFixed(2)} 
  `;

  right_side.appendChild(implied_move);

  // Tell MathJax to typeset our equations
  // eslint-disable-next-line no-undef
  MathJax.typeset();
}

init();