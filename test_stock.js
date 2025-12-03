const stockService = require('./src/services/stockService');

async function test() {
    console.log('Testing StockService...');

    // Test getQuote
    console.log('Fetching quote for AAPL...');
    const quote = await stockService.getQuote('AAPL');
    if (quote) {
        console.log(`Success: AAPL Price: $${quote.regularMarketPrice}`);
    } else {
        console.error('Failed to fetch quote');
    }

    // Test getHistory
    console.log('Fetching history for AAPL...');
    const history = await stockService.getHistory('AAPL', '1d', 7);
    if (history && history.length > 0) {
        console.log(`Success: Fetched ${history.length} days of history`);
    } else {
        console.error('Failed to fetch history');
    }

    // Test generateChart
    console.log('Generating chart for AAPL...');
    if (history && history.length > 0) {
        const chartUrl = await stockService.generateChart('AAPL', history);
        console.log(`Success: Chart URL: ${chartUrl}`);
    }

    console.log('Test complete.');
}

test();
