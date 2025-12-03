const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function test() {
    try {
        console.log('Testing screener for gainers...');
        const screener = await yahooFinance.screener({ scrIds: 'day_gainers', count: 5 });
        console.log('Gainers:', JSON.stringify(screener.quotes[0], null, 2));
    } catch (error) {
        console.error('Screener Gainers Error:', error.message);
    }

    try {
        console.log('Testing screener for losers...');
        const screener = await yahooFinance.screener({ scrIds: 'day_losers', count: 5 });
        console.log('Losers:', JSON.stringify(screener.quotes[0], null, 2));
    } catch (error) {
        console.error('Screener Losers Error:', error.message);
    }
}

test();
