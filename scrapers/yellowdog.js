const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeYellowDog() {
    const url = 'https://www.yellowdogflyfishing.com/pages/gallatin-river-fishing-report';
    
    console.log('Scraping Yellow Dog...');
    
    try {
        const { data } = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
            },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        
        // Get all text from the page
        const pageText = $('body').text();
        
        // Look for "Updated" followed by a date
        // Matches: "Updated Feb 21, 26" or "Updated February 21, 2026"
        const dateMatch = pageText.match(/Updated\s+([A-Za-z]+\s+\d{1,2},?\s+\d{2,4})/i);
        
        let reportDate = null;
        if (dateMatch) {
            reportDate = dateMatch[1];
            console.log('Found date:', reportDate);
        } else {
            console.log('Date not found in page text, searching HTML...');
            
            // Try to find in any element
            let foundDate = null;
            $('*').each((i, elem) => {
                const text = $(elem).text();
                if (text.includes('Updated') && text.match(/\d{1,2}/)) {
                    foundDate = text.trim();
                    console.log('Found in element:', foundDate);
                    return false;
                }
            });
            
            if (foundDate) {
                const match = foundDate.match(/Updated\s+([A-Za-z]+\s+\d{1,2},?\s+\d{2,4})/i);
                reportDate = match ? match[1] : null;
            }
        }
        
        const result = {
            source: 'Yellow Dog Fly Fishing',
            river: 'Gallatin River',
            url: url,
            last_updated: reportDate,
            scraped_at: new Date()
        };
        
        console.log('Final result:', result);
        return result;
        
    } catch (error) {
        console.error('Yellow Dog scrape failed:', error.message);
        if (error.response) {
            console.error('Status code:', error.response.status);
        }
        return null;
    }
}

if (require.main === module) {
    scrapeYellowDog().then(() => process.exit(0));
}

module.exports = scrapeYellowDog;