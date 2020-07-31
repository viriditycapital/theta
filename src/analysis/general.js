/**
 * General math library.
 *
 * TODO: this may not be widely used, so maybe eventually delete some of these
 * functions. Webpack will minify them away anyway for production so not a big deal.
 * 
 * @author mikinty
 */

import { erf } from 'mathjs';

/**
 * CDF 
 * @param { float } x Value to calculate CDF at
 * @param { float } mean 
 * @param { float } std The standard deviation
 */
export function cdf_normal (x, mean, std) {
  return (1 - erf((mean - x ) / (Math.sqrt(2) * std))) / 2;
}

/**
 * Standard deviation
 * 
 * @param { float[] } quotes Price data
 * @param { float[] } avg    Average price data to calculate std from
 */
export function STD (quotes, avg) {
  if (quotes.length != avg.length) {
    throw new Error (
      'STD takes in two lists of equal lengths'
    );
  }

  let variance = 0;
  let n = quotes.length;
  for (let i = 0; i < n; i++) {
    variance += Math.pow (
      quotes[i] - avg[i], 2
    );
  }

  return Math.sqrt(variance/n);
}

/**
 * Moving average  
 * 
 * @param { float[] } data
 * @param { int } window_size Size of MA window
 */
export function MA (data, window_size) {
  let ma = [];

  for (let i = 0; i < data.length; i++) {
    let curr_sum = 0;

    for (let j = 0; j < window_size; j++) {
      if (i - j < 0) {
        break;
      }
      
      curr_sum += data[i - j];
    }

    let divide = Math.min(window_size, i+1);

    ma.push(
      curr_sum/divide
    );
  }

  return ma;
}

/**
 * Exponential moving average  
 * 
 * @param { float[] } data
 * @param { int } window_size Size of MA window
 * @param { float } lambda EWMA weight
 */
export function EWMA (data, window_size, lambda=2/(window_size + 1)) {
  if (data.length < 1) {
    return data;
  }

  let ma = [];

  let curr_sum = data[0];
  for (let i = 0; i < data.length; i++) {
    curr_sum = lambda*data[i] + (1-lambda)*curr_sum;

    ma.push(
      curr_sum
    );
  }

  return ma;
}