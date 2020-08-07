/**
 * Updates the quotes of the main page
 */

/**
 * Updates the current quote information for a stock
 * @param { string } ticker 
 * @param { DOM object } DOM
 */ 
export function update_current_quote (quote_response, DOM) {
  let curr_price = quote_response['regularMarketPrice'];
  let curr_price_delta = (quote_response['regularMarketChange']).toFixed(2);
  let curr_price_delta_percent = (100*quote_response['regularMarketChangePercent']).toFixed(2);

  DOM.title_stock_price.innerHTML = `${quote_response['symbol']} $${(curr_price).toFixed(2)}`;

  if (curr_price_delta >= 0) {
    DOM.title_stock_change.innerHTML = `<b>+${curr_price_delta} (+${curr_price_delta_percent}%)</b>`;
    DOM.title_stock_change.classList.remove('stock_ticker_red');
    DOM.title_stock_change.classList.add('stock_ticker_green');
  } else {
    DOM.title_stock_change.innerHTML = `<b>${curr_price_delta} (${curr_price_delta_percent}%)</b>`;
    DOM.title_stock_change.classList.remove('stock_ticker_green');
    DOM.title_stock_change.classList.add('stock_ticker_red');
  }
}
