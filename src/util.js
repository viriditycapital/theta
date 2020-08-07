/**
 * Utility functions
 */

// Converts a Date object to the format accepted by Yahoo Finance API
export const YAHOO_DATE = (date) => `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;