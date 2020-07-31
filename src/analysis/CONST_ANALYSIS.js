/**
 * Parameters used in the analysis library
 */

import { interpolateRgbBasis } from "d3";

/** Lambda as defined by riskmetrics for EWMA */
export const LAMBDA_EWMA = 0.94;

/**
 * Color scale from red to green based on 0 - 100 percent respectively
 *
 * @param { float } percentage 
 */
export const SUCCESS_GRADIENT = (percentage) => {
  if (percentage < 0 || percentage > 100) {
    throw new Error('Percentage must be between 0 and 100');
  }

  let r = Math.round(255*(1 - (percentage/100)));
  let g = Math.round(255*(percentage/100));

  return `rgba(${r}, ${g}, 0, 0.2)`;
};