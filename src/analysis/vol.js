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
import { LAMBDA_EWMA } from './CONST_ANALYSIS.js';

/**
 * Calculates the variance based on simple avg, EWMA
 *
 * We convert everything to \sigma at the end instead
 * of leaving it squared
 * 
 * @param { float[] } data Price data
 * @param { int } window_size 
 * 
 * @returns Object containing sa, ewma volatilities
 */
export function vol_AVG (data, lambda=LAMBDA_EWMA) {
  // Calculate the returns 
  let returns = [];
  for (let i = 1; i < data.length; i++) {
    returns.push(
      Math.pow(
        Math.log(data[i] / data[i-1]),
        2
      )
    );
  }

  // SA
  let vol_sa = [];
  for (let i = 0; i < returns.length; i++) {
    let curr_sum = 0;
    for (let j = 0; j <= i; j++) {
      curr_sum += returns[j];
    }

    vol_sa.push(
      100*Math.sqrt(
        curr_sum/(i+1)
      )
    );
  }

  // EWMA
  let vol_ewma = [
    returns[0]
  ];
  for (let i = 1; i < returns.length; i++) {
    vol_ewma.push(
      (1-lambda)*returns[i] + lambda*vol_ewma[i-1]
    );
  }

  let sqrt_vol_ewma = vol_ewma.map(e => 100*Math.sqrt(e));

  return {
    vol_sa: vol_sa,
    vol_ewma: sqrt_vol_ewma
  };
}