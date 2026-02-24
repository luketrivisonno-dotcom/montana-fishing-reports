const axios = require('axios');

// River locations with weather station names
const RIVER_LOCATIONS = {
  'Gallatin River': { lat: 45.2602, lon: -111.1951, station: 'Gallatin Gateway' },
  'Upper Madison River': { lat: 45.2847, lon: -111.4753, station: 'Ennis' },
  'Lower Madison River': { lat: 45.6000, lon: -111.6500, station: 'Three Forks' },
  'Yellowstone River': { lat: 45.6770, lon: -110.5631, station: 'Livingston' },
  'Missouri River': { lat: 47.0527, lon: -111.8316, station: 'Craig' },
  'Clark Fork River': { lat: 46.8721, lon: -113.9940, station: 'Missoula' },
  'Blackfoot River': { lat: 47.0527, lon: -112.5560, station: 'Bonner' },
  'Bitterroot River': { lat: 46.5891, lon: -114.0510, station: 'Hamilton' },
  'Rock Creek': { lat: 46.5100, lon: -113.8000, station: 'Clinton' },
  'Bighorn River': { lat: 45.4605, lon: -107.8745, station: 'Hardin' },
  'Beaverhead River': { lat: 45.2163, lon: -112.6381, station: 'Dillon' },
  'Big Hole River': { lat: 45.1847, lon: -113.4081, station: 'Divide' },
  'Flathead River': { lat: 48.4733, lon: -114.0834, station: 'Columbia Falls' },
  'Jefferson River': { lat: 45.8933, lon: -111.5053, station: 'Three Forks' }
};

// WMO Weather codes to icons
const WEATHER_ICONS = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌧️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '🌨️', 77: '🌨️',
  80: '🌦️', 81: '🌧️', 82: '🌧️',
  85: '🌨️', 86: '🌨️',
  95: '⛈️', 96: '⛈️', 99: '⛈️'
};

function getWeatherIcon(code) {
  return WEATHER_ICONS[code] || '☁️';
}

function getWeatherCondition(code) {
  const conditions = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
    80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
    85: 'Slight snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail'
  };
  return conditions[code] || 'Unknown';
}

async function getWeatherForRiver(riverName) {
  const location = RIVER_LOCATIONS[riverName];
  if (!location) return null;

  try {
    // Use Fahrenheit
    const response = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=America/Denver&forecast_days=1&temperature_unit=fahrenheit`,
      { timeout: 5000 }
    );

    const daily = response.data.daily;
    const weatherCode = daily.weathercode[0];
    
    return {
      high: Math.round(daily.temperature_2m_max[0]),
      low: Math.round(daily.temperature_2m_min[0]),
      condition: getWeatherCondition(weatherCode),
      icon: getWeatherIcon(weatherCode),
      station: location.station,
      river: riverName
    };
  } catch (error) {
    console.error(`Weather fetch failed for ${riverName}:`, error.message);
    return null;
  }
}

module.exports = { getWeatherForRiver, RIVER_LOCATIONS };
