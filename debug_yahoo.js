const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();
const fs = require('fs');

async function test() {
    let log = 'Testing yahoo-finance2 directly...\n';
    
    try {
        log += 'Fetching quote for AAPL...\n';
        const quote = await yahooFinance.quote('AAPL');
        log += `Quote result: ${JSON.stringify(quote, null, 2)}\n`;
    } catch (error) {
        log += `Quote Error: ${error.message}\n${JSON.stringify(error, null, 2)}\n`;
    }

    try {
        log += 'Fetching history for AAPL with Date object...\n';
        const queryOptions = { period1: new Date('2023-01-01'), interval: '1d' };
        const result = await yahooFinance.historical('AAPL', queryOptions);
        log += `History result (Date): ${JSON.stringify(result[0], null, 2)}\n`;
    } catch (error) {
        log += `History Error (Date): ${error.message}\n${JSON.stringify(error, null, 2)}\n`;
    }

    try {
        log += 'Fetching chart for AAPL...\n';
        const result = await yahooFinance.chart('AAPL', { period1: '2023-01-01', interval: '1d' });
        log += `Chart result: ${JSON.stringify(result.quotes[0], null, 2)}\n`;
    } catch (error) {
        log += `Chart Error: ${error.message}\n${JSON.stringify(error, null, 2)}\n`;
    }

    fs.writeFileSync('debug_error.log', log);
    console.log('Done. Check debug_error.log');
}

test();
