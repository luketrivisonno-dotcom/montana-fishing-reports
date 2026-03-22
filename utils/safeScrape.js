async function safeScrape(scraperFn, sourceName) {
  try {
    console.log(`[SCRAPER] Starting ${sourceName}...`);
    const result = await scraperFn();
    console.log(`[SCRAPER] ${sourceName} success: ${result.length} reports`);
    return result;
  } catch (error) {
    console.error(`[SCRAPER ERROR] ${sourceName}:`, error.message);
    return []; // Return empty array instead of crashing
  }
}

module.exports = { safeScrape };
