/**
 * Contains functions to query for historical stock data.
 */

import { HISTORICAL_DATA_URL } from '../constants.js';

export async function get_historical_data (options) {
  if (
    typeof options.symbol   === 'undefined' ||
    typeof options.range    === 'undefined' ||
    typeof options.interval === 'undefined'
  ) {
    throw new Error('symbol, range or interval field not defined but required for request');
  }

  return $.ajax(
    HISTORICAL_DATA_URL.replace('$SYMBOL', options.symbol), 
    {
      range: options.range,
      interval: options.interval,
      includePrePost: false,
      corsDomain: 'finance.yahoo.com'
    }
  );
}
