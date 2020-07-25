/**
 * Volatility analysis library
 *
 * @author mikinty 
 * 
 * @sources
 * - https://medium.com/auquan/time-series-analysis-for-finance-arch-garch-models-822f87f1d755
 * 
 * @terms
 * - MA: Moving Average
 * - EWMA: Exponentially Weighted Moving Average
 */

import { STD, MA, EWMA } from './general.js';

/**
 * Calculates the variance based on simple avg, MA, EMA
 * 
 * @param { float[] } data Price data
 * @param { int } window_size 
 * 
 * @returns Object containing sa, ma, ema volatilities
 */
export function vol_AVG (data, window_size) {
  let N = data.length;
  let avg = data.reduce((a, b) => a + b, 0) / N;

  // SA
  let vol_sa = Math.sqrt (
    data
      .map((x) => Math.pow(x-avg, 2))
      .reduce((a, b) => a+b, 0) / N
  );

  // MA
  let ma = MA(data, window_size);
  let vol_ma = STD(data, ma);

  // EWMA
  let ema = EWMA(data, window_size);
  let vol_ema = STD(data, ema);

  return {
    vol_sa: vol_sa,
    vol_ma: vol_ma,
    vol_ema: vol_ema
  };
}