const axios = require('axios');

// River locations (latitude, longitude) for weather
const RIVER_LOCATIONS = {
  'Gallatin River': { lat: 45.2602, lon: -111.1951 }, // Gallatin Gateway
  'Upper Madison River': { lat: 45.2847, lon: -111.4753 }, // Ennis
  'Lower Madison River': { lat: 45.6000, lon: -111.6500 }, // Three Forks area
  'Yellowstone River': { lat: 45.6770, lon: -110.5631 }, // Livingston
  'Missouri River': { lat: 47.0527, lon: -111.8316 }, // Craig
  'Clark Fork River': { lat: 46.8721, lon: -113.9940 }, // Missoula
  'Blackfoot River': { lat: 47.0527, lon: -112.5560 }, // Bonner
  'Bitterroot River': { lat: 46.5891, lon: -114.0510 }, // Hamilton
  'Rock Creek': { lat: 46.5100, lon: -113.8000 }, // Near Missoula
  'Bighorn River': { lat: 45.4605, lon: -107.8745 } // Fort Smith
};

async function getWeatherForRiver(riverName) {
  const location = RIVER_LOCATIONS[riverName];
  if (!location) return null;

  try {
    // Use Open-Meteo API (free, no key needed)
    const response = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=America/Denver&forecast_days=1`,
      { timeout: 5000 }
    );

    const daily = response.data.daily;
    return {
      high: Math.round(daily.temperature_2m_max[0]),
      low: Math.round(daily.temperature_2m_min[0]),
      condition: getWeatherCondition(daily.weathercode[0]),
      river: riverName
    };
  } catch (error) {
    console.error(`Weather fetch failed for ${riverName}:`, error.message);
    return null;
  }
}

function getWeatherCondition(code) {
  // WMO Weather interpretation codes
  const conditions = {
    0: 'Clear sky',
    1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
    85: 'Slight snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail'
  };
  return conditions[code] || 'Unknown';
}

module.exports = { getWeatherForRiver, RIVER_LOCATIONS };