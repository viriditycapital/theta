/**
 * Constants used throughout the project
 */

// Need a proxy to avoid CORS issues
export const PROXY_URL = 'https://cors-anywhere.herokuapp.com/';
// export const PROXY_URL = 'https://';

// BYND is elite
export const DEFAULT_TICKER = 'BYND';

// Maximum number of options to display
export const MAX_OPTIONS = 20;

// Set of granularities for historical data
export const GRANULARITY_KEYS = [
  '2w', '1m', '3m', '6m', '1y'
];

// Granularities to number of days
export const GRANULARITY = {
  '2w': 10,
  '1m': 20,
  '3m': 60,
  '6m': 120
};