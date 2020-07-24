import { get_historical_data } from './lib/historical_data';

async function main () {
  let a = await get_historical_data({
    symbol: 'BYND',
    range: '1y',
    interval: '1d'
  });

  console.log(a);
}

main();