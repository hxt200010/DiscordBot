const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function test() {
    console.log('Testing trending and movers...');
    try {
        console.log('Fetching trending symbols (US)...');
        const trending = await yahooFinance.trending('US');
        console.log('Trending:', JSON.stringify(trending, null, 2));
    } catch (error) {
        console.error('Trending Error:', error.message);
    }

    try {
        console.log('Fetching daily gainers...');
        // yahoo-finance2 might not have a direct 'dailyGainers' method on the main class, 
        // but it has 'screener' or we can check 'trending' results. 
        // Let's check if there is a screener method or similar.
        // Common query for gainers is often via screener.
        
        // Let's try to see if we can use 'dailyGainers' if it exists in the modules.
        // Based on docs, it might be under 'dailyGainers' key in some results or a specific query.
        // Actually, let's try a search or look at the object keys again if needed.
        // But for now, let's try a standard screener query if possible, or just check trending.
        
        // Another option is `yahooFinance.dailyGainers` if it exists.
        if (yahooFinance.dailyGainers) {
             const gainers = await yahooFinance.dailyGainers({ count: 5 });
             console.log('Gainers:', gainers);
        } else {
            console.log('dailyGainers method not found directly.');
        }

    } catch (error) {
        console.error('Gainers Error:', error.message);
    }
}

test();
