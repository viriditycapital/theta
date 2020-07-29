/**
 * Main entrypoint of app
 */

import './styles/index.scss';
import { PROXY_URL } from './constants.js';
import { vol_AVG } from './analysis/vol.js';
import * as CONST_STYLE from './CONST_STYLE.js';

import * as d3 from 'd3';
import * as YF from 'yahoo-finance';

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

  /* Current snapshot of stock */
  let curr_price = await YF.quote({
    symbol: STONK_TICKER
  });

  title.innerHTML = `<h1>${STONK_TICKER} ${curr_price['price']['regularMarketPrice']}</h1>`;
  title.classList.add('title');

  terminal.innerHTML = 'loading...';

  /** Historical quotes */
  let curr_date = new Date();
  let curr_date_string = `${curr_date.getFullYear()}-${curr_date.getMonth()+1}-${curr_date.getDate()}`;
  curr_date.setFullYear(curr_date.getFullYear() - 1);
  let past_date_string = `${curr_date.getFullYear()}-${curr_date.getMonth()+1}-${curr_date.getDate()}`;

  let quotes = await YF.historical({
    symbol: STONK_TICKER,
    from: past_date_string,
    to: curr_date_string,
    period: 'd'
  });

  // set the dimensions and margins of the graph
  var margin = {top: 20, right: 20, bottom: 50, left: 70};
  var width = 460- margin.left - margin.right;
  var height = 500 - margin.top - margin.bottom;

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

  let data = quotes;

  // Scale the range of the data
  x.domain(d3.extent(data, function(d) { return d.date; }));
  y.domain([0, d3.max(data, function(d) { return d.close; })]);

  // Add the valueline path.
  svg.append('path')
    .data([data])
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 1.5)
    .attr('d', d3.line()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.close); })
    );

  // Add the x Axis
  svg.append('g')
    .attr('transform', 'translate(0,' + height + ')')
    .call(d3.axisBottom(x));

  // Add the y Axis
  svg.append('g')
    .call(d3.axisLeft(y));

  // Concern: when we do things like this we lose the date that is associated
  // with each price
  let prices = quotes.map((e) => e.close);
  let vol_res = {
    '2w' : vol_AVG(prices.slice(0, 10)),
    '1m' : vol_AVG(prices.slice(0, 20)),
    '3m' : vol_AVG(prices.slice(0, 60)),
    '6m' : vol_AVG(prices.slice(0, 120)),
    '1y' : vol_AVG(prices)
  };

  // Plot volatility
  // Notice that we have one less data point since we don't 
  // have the volatility for the first day
  let data_vol = [];

  for (let i = 1; i < quotes.length; i++) {
    data_vol.push(
      {
        date: quotes[i]['date'],
        vol_sa: vol_res['1y']['vol_sa'][i-1],
        vol_ewma: vol_res['1y']['vol_ewma'][i-1]
      }
    );
  }

  // Increase right margin for second plot
  margin = {top: 20, right: 70, bottom: 50, left: 70};

  // set the ranges
  var x_2 = d3.scaleTime().range([0, width]);
  var y_2 = d3.scaleLinear().range([height, 0]);

  // append the svg obgect to the body of the page
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
  y_2.domain([0, d3.max(data_vol, function(d) { return d.vol_ewma; })]);

  // Add the valueline path.
  svg_2.append('path')
    .data([data_vol])
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 3)
    .attr('d', d3.line()
      .x(function(d) { return x_2(d.date); })
      .y(function(d) { return y_2(d.vol_ewma); })
    );


  svg_2.append('path')
    .data([data])
    .attr('fill', 'none')
    .attr('stroke', CONST_STYLE.GREEN_BYND)
    .attr('stroke-width', 1.5)
    .attr('d', d3.line()
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.close); })
    );

  // Add the x Axis
  svg_2.append('g')
    .attr('transform', 'translate(0,' + height + ')')
    .call(d3.axisBottom(x_2));

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
  for (const [key, value] of Object.entries(vol_res)) {
    output_vol +=
    `<tr>
      <th>
      ${key}
      </th>
      <th>
      ${(100*Math.sqrt(value.vol_sa[value.vol_sa.length-1])).toFixed(3)}%
      </th>
      <th>
      ${(100*Math.sqrt(value.vol_ewma[value.vol_ewma.length-1])).toFixed(3)}%
      </th>
    </tr>
    `;
  }

  /** Options quotes **/
  let options = await $.ajax(
    PROXY_URL + `query1.finance.yahoo.com/v7/finance/options/${STONK_TICKER}`
  );

  // let calls = options['optionChain']['result'][0]['options'][0]['calls'];
  let puts  = options['optionChain']['result'][0]['options'][0]['puts'];
  
  console.log(puts[0]);

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
      <th>
      ${Number(100*puts[i]['impliedVolatility']).toFixed(2)}
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
    <th>IV</th>
  </tr>
  ${output_puts}
  </table>
  `;

  vol_analysis.innerHTML = 
  `
  \\[\\sigma\\]
  <table style="width:100%">
  <tr>
    <th>Time period</th>
    <th>SA</th>
    <th>EWMA</th>
  </tr>
  ${output_vol}
  </table>
  `;

  // Tell MathJax to typeset our equations
  // eslint-disable-next-line no-undef
  MathJax.typeset();
}

init();