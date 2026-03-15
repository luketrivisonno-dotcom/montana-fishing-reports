const axios = require('axios');

// River locations with lat/lon for weather
const RIVER_LOCATIONS = {
  'Gallatin River': { lat: 45.5200, lon: -111.2000, station: 'Gallatin Gateway' },
  'Upper Madison River': { lat: 45.3491, lon: -111.7308, station: 'Ennis' },
  'Lower Madison River': { lat: 45.8923, lon: -111.5522, station: 'Three Forks' },
  'Yellowstone River': { lat: 45.6770, lon: -110.5631, station: 'Livingston' },
  'Missouri River': { lat: 47.0746, lon: -111.9634, station: 'Craig' },
  'Clark Fork River': { lat: 46.6674, lon: -113.1467, station: 'Drummond' },
  'Blackfoot River': { lat: 46.8770, lon: -113.8940, station: 'Bonner' },
  'Bitterroot River': { lat: 46.2468, lon: -114.1548, station: 'Hamilton' },
  'Rock Creek': { lat: 46.7694, lon: -113.7117, station: 'Clinton' },
  'Bighorn River': { lat: 45.3099, lon: -107.9282, station: 'Fort Smith' },
  'Beaverhead River': { lat: 45.2163, lon: -112.6381, station: 'Dillon' },
  'Big Hole River': { lat: 45.7535, lon: -112.7457, station: 'Divide, MT' },
  'Flathead River': { lat: 48.3725, lon: -114.1818, station: 'Columbia Falls' },
  'Jefferson River': { lat: 45.4819, lon: -112.3320, station: 'Twin Bridges' },
  'Ruby River': { lat: 45.3295, lon: -112.1076, station: 'Alder' },
  'Stillwater River': { lat: 45.5291, lon: -109.4229, station: 'Absarokee' },
  'Boulder River': { lat: 45.3300, lon: -109.9800, station: 'McLeod' },
  'Swan River': { lat: 48.0833, lon: -114.0665, station: 'Big Fork' },
  'Yellowstone National Park': { lat: 44.6608, lon: -111.1040, station: 'West Yellowstone' },
  'Spring Creeks': { lat: 45.6625, lon: -110.5610, station: 'Livingston' }
};

// Cache for NOAA grid points (to avoid repeated API calls)
let noaaGridCache = {};

// WMO Weather codes to emoji icons
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

function getWindDirection(degrees) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

async function getWeatherForRiver(riverName) {
  const location = RIVER_LOCATIONS[riverName];
  if (!location) return null;

  try {
    const response = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&current_weather=true&timezone=America/Denver&forecast_days=1&temperature_unit=fahrenheit&windspeed_unit=mph`,
      { timeout: 5000 }
    );

    const daily = response.data.daily;
    const current = response.data.current_weather;
    const weatherCode = daily.weathercode[0];
    
    const windSpeed = Math.round(current.windspeed);
    const windDir = getWindDirection(current.winddirection);
    
    // Build NOAA link using lat/lon for proper forecast page
    const noaaLink = `https://forecast.weather.gov/MapClick.php?lat=${location.lat}&lon=${location.lon}`
    
    return {
      high: Math.round(daily.temperature_2m_max[0]),
      low: Math.round(daily.temperature_2m_min[0]),
      condition: getWeatherCondition(weatherCode),
      icon: getWeatherIcon(weatherCode),
      wind: `${windSpeed} mph ${windDir}`,
      windSpeed: windSpeed,
      windDirection: windDir,
      station: location.station,
      river: riverName,
      source: 'Open-Meteo',
      sourceUrl: 'https://open-meteo.com',
      noaaUrl: noaaLink,
      attribution: 'Weather data from Open-Meteo • NOAA link available'
    };
  } catch (error) {
    console.error(`Weather fetch failed for ${riverName}:`, error.message);
    return null;
  }
}

// Get NOAA grid point info for a location
async function getNOAAGridPoint(lat, lon) {
  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  
  if (noaaGridCache[cacheKey]) {
    return noaaGridCache[cacheKey];
  }
  
  try {
    const response = await axios.get(
      `https://api.weather.gov/points/${lat},${lon}`,
      { timeout: 5000, headers: { 'User-Agent': 'MontanaFishingReports/1.0' } }
    );
    
    const props = response.data.properties;
    const gridInfo = {
      gridId: props.gridId,
      gridX: props.gridX,
      gridY: props.gridY,
      forecastUrl: props.forecast,
      forecastHourlyUrl: props.forecastHourly,
      observationStations: props.observationStations
    };
    
    noaaGridCache[cacheKey] = gridInfo;
    return gridInfo;
  } catch (error) {
    console.error(`NOAA grid point fetch failed for ${lat},${lon}:`, error.message);
    return null;
  }
}

// Fetch detailed NOAA forecast if available
async function getNOAAForecast(riverName) {
  const location = RIVER_LOCATIONS[riverName];
  if (!location) return null;

  try {
    // First get the grid point info
    const gridPoint = await getNOAAGridPoint(location.lat, location.lon);
    if (!gridPoint) return null;
    
    // Then get the forecast using the correct grid URL
    const response = await axios.get(
      gridPoint.forecastUrl,
      { timeout: 5000, headers: { 'User-Agent': 'MontanaFishingReports/1.0' } }
    );
    
    const periods = response.data.properties?.periods;
    if (!periods || periods.length === 0) return null;
    
    const current = periods[0];
    
    return {
      temperature: current.temperature,
      temperatureUnit: current.temperatureUnit,
      shortForecast: current.shortForecast,
      detailedForecast: current.detailedForecast,
      windSpeed: current.windSpeed,
      windDirection: current.windDirection,
      icon: current.icon,
      source: 'NOAA',
      sourceUrl: `https://forecast.weather.gov/MapClick.php?lat=${location.lat}&lon=${location.lon}`,
      attribution: 'Weather data from NOAA National Weather Service'
    };
  } catch (error) {
    console.log(`NOAA forecast not available for ${riverName}:`, error.message);
    return null;
  }
}

module.exports = { 
  getWeatherForRiver, 
  getNOAAForecast,
  RIVER_LOCATIONS, 
  getWeatherIcon 
};
