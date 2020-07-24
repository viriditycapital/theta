/**
 * Constants used throughout the app
 */

/** Yahoo API version */
export const YAHOO_API_VERSION = 8;
/** Base URL for API requests */
export const BASE_URL = `https:\/\/cors-anywhere.herokuapp.com\/query1.finance.yahoo.com\/v${YAHOO_API_VERSION}\/finance\/`;
/** URL to gather historical data */
export const HISTORICAL_DATA_URL = `${BASE_URL}chart\/$SYMBOL`;