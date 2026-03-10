const axios = require('axios');

// River locations with weather station names
const RIVER_LOCATIONS = {
  'Gallatin River': { lat: 45.2602, lon: -111.1951, station: 'Gallatin Gateway', noaaStation: 'KGTF' },
  'Upper Madison River': { lat: 45.2847, lon: -111.4753, station: 'Ennis', noaaStation: 'KEKS' },
  'Lower Madison River': { lat: 45.6000, lon: -111.6500, station: 'Three Forks', noaaStation: 'K3TR' },
  'Yellowstone River': { lat: 45.6770, lon: -110.5631, station: 'Livingston', noaaStation: 'KLVM' },
  'Missouri River': { lat: 47.0527, lon: -111.8316, station: 'Craig', noaaStation: 'KCTB' },
  'Clark Fork River': { lat: 46.8721, lon: -113.9940, station: 'Missoula', noaaStation: 'KMSO' },
  'Blackfoot River': { lat: 47.0527, lon: -112.5560, station: 'Bonner', noaaStation: 'KMSO' },
  'Bitterroot River': { lat: 46.5891, lon: -114.0510, station: 'Hamilton', noaaStation: 'KMSO' },
  'Rock Creek': { lat: 46.5100, lon: -113.8000, station: 'Clinton', noaaStation: 'KMSO' },
  'Bighorn River': { lat: 45.4605, lon: -107.8745, station: 'Hardin', noaaStation: 'KHDN' },
  'Beaverhead River': { lat: 45.2163, lon: -112.6381, station: 'Dillon', noaaStation: 'KDLN' },
  'Big Hole River': { lat: 45.1847, lon: -113.4081, station: 'Divide', noaaStation: 'KBTM' },
  'Flathead River': { lat: 48.4733, lon: -114.0834, station: 'Columbia Falls', noaaStation: 'KGPI' },
  'Jefferson River': { lat: 45.8933, lon: -111.5053, station: 'Twin Bridges', noaaStation: 'K3TR' },
  'Ruby River': { lat: 45.3295, lon: -112.1076, station: 'Alder', noaaStation: 'KRXE' },
  'Stillwater River': { lat: 45.5291, lon: -109.4229, station: 'Absarokee', noaaStation: 'KBYZ' },
  'Swan River': { lat: 47.7458, lon: -114.0856, station: 'Big Fork', noaaStation: 'KGPI' },
  'Yellowstone National Park': { lat: 44.6608, lon: -111.1040, station: 'West Yellowstone', noaaStation: 'KWYS' }
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
    
    // Build NOAA link if available
    const noaaLink = location.noaaStation 
      ? `https://forecast.weather.gov/station.php?id=${location.noaaStation}`
      : null;
    
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
      noaaStation: location.noaaStation,
      noaaUrl: noaaLink,
      attribution: 'Weather data from Open-Meteo • NOAA station available'
    };
  } catch (error) {
    console.error(`Weather fetch failed for ${riverName}:`, error.message);
    return null;
  }
}

// Fetch detailed NOAA forecast if available
async function getNOAAForecast(riverName) {
  const location = RIVER_LOCATIONS[riverName];
  if (!location || !location.noaaStation) return null;

  try {
    // NOAA API endpoint for forecast
    const response = await axios.get(
      `https://api.weather.gov/gridpoints/${location.noaaStation}/31,80/forecast`,
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
      sourceUrl: `https://forecast.weather.gov/station.php?id=${location.noaaStation}`,
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
