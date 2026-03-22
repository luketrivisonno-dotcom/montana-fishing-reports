const cache = require('./cache');
const { getUSGSData } = require('./usgs');
const { getWeatherForRiver } = require('./weather');

async function getCachedRiverData(riverName) {
  const cacheKey = `river_${riverName}`;
  const cached = cache.get(cacheKey);
  
  if (cached) {
    console.log(`[CACHE HIT] ${riverName}`);
    return cached;
  }
  
  console.log(`[CACHE MISS] ${riverName}`);
  
  // Fetch fresh data
  const [usgs, weather] = await Promise.all([
    getUSGSData(riverName),
    getWeatherForRiver(riverName)
  ]);
  
  const data = {
    river: riverName,
    usgs,
    weather,
    timestamp: new Date().toISOString()
  };
  
  cache.set(cacheKey, data);
  return data;
}

module.exports = { getCachedRiverData };
