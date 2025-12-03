const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();
const QuickChart = require('quickchart-js');

class StockService {
    /**
     * Fetch stock quote
     * @param {string} symbol 
     */
    async getQuote(symbol) {
        try {
            const quote = await yahooFinance.quote(symbol);
            return quote;
        } catch (error) {
            console.error(`Error fetching quote for ${symbol}:`, error);
            return null;
        }
    }

    /**
     * Fetch historical data
     * @param {string} symbol 
     * @param {string} interval 
     * @param {number} days 
     */
    async getHistory(symbol, interval = '1d', days = 30) {
        try {
            const period1 = new Date();
            period1.setDate(period1.getDate() - days);
            
            const queryOptions = { period1: period1.toISOString().split('T')[0], interval: interval };
            const result = await yahooFinance.chart(symbol, queryOptions);
            return result.quotes;
        } catch (error) {
            console.error(`Error fetching history for ${symbol}:`, error);
            return null;
        }
    }

    /**
     * Search for stock symbols
     * @param {string} query 
     */
    async search(query) {
        try {
            const result = await yahooFinance.search(query);
            return result.quotes;
        } catch (error) {
            console.error(`Error searching for ${query}:`, error);
            return [];
        }
    }

    /**
     * Get trending stocks
     * @param {string} country 
     */
    async getTrending(country = 'US') {
        try {
            const result = await yahooFinance.trendingSymbols(country);
            return result.quotes.map(q => q.symbol);
        } catch (error) {
            console.error(`Error fetching trending for ${country}:`, error);
            return [];
        }
    }

    /**
     * Generate stock chart URL
     * @param {string} symbol 
     * @param {Array} data 
     */
    async generateChart(symbol, data) {
        const chart = new QuickChart();
        chart.setWidth(800);
        chart.setHeight(400);
        
        const labels = data.map(d => d.date.toISOString().split('T')[0]);
        const prices = data.map(d => d.close);

        chart.setConfig({
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${symbol} Price`,
                    data: prices,
                    borderColor: 'rgb(75, 192, 192)',
                    fill: false,
                    tension: 0.1
                }]
            },
            options: {
                title: {
                    display: true,
                    text: `${symbol} Stock Price History`
                },
                scales: {
                    xAxes: [{
                        type: 'time',
                        time: {
                            unit: 'day'
                        }
                    }]
                }
            }
        });

        return chart.getUrl();
    }

    /**
     * Generate comparison chart URL
     * @param {string} symbol1 
     * @param {Array} data1 
     * @param {string} symbol2 
     * @param {Array} data2 
     */
    async generateComparisonChart(symbol1, data1, symbol2, data2) {
        const chart = new QuickChart();
        chart.setWidth(800);
        chart.setHeight(400);

        // Normalize dates (assuming similar availability, but taking intersection is better)
        // For simplicity, using data1 labels. In prod, align dates properly.
        const labels = data1.map(d => d.date.toISOString().split('T')[0]);
        
        // Normalize prices to percentage change for fair comparison
        const startPrice1 = data1[0].close;
        const startPrice2 = data2[0].close;

        const prices1 = data1.map(d => ((d.close - startPrice1) / startPrice1) * 100);
        const prices2 = data2.map(d => ((d.close - startPrice2) / startPrice2) * 100);

        chart.setConfig({
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: `${symbol1} % Change`,
                        data: prices1,
                        borderColor: 'rgb(75, 192, 192)',
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: `${symbol2} % Change`,
                        data: prices2,
                        borderColor: 'rgb(255, 99, 132)',
                        fill: false,
                        tension: 0.1
                    }
                ]
            },
            options: {
                title: {
                    display: true,
                    text: `${symbol1} vs ${symbol2} Performance`
                },
                scales: {
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'Percentage Change (%)'
                        }
                    }]
                }
            }
        });

        return chart.getUrl();
    }
}

module.exports = new StockService();
