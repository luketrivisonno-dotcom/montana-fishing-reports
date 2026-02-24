const axios = require('axios');

const RIVER_LOCATIONS = {
    'Gallatin River': { lat: 45.4708, lon: -111.2266, locationName: 'Gallatin Gateway, MT' },
    'Upper Madison River': { lat: 45.2847, lon: -111.4753, locationName: 'Ennis, MT' },
    'Lower Madison River': { lat: 45.7324, lon: -111.5511, locationName: 'Three Forks, MT' },
    'Yellowstone River': { lat: 45.6735, lon: -110.7416, locationName: 'Emigrant, MT' },
    'Missouri River': { lat: 47.0722, lon: -111.8353, locationName: 'Craig, MT' },
    'Clark Fork River': { lat: 46.4000, lon: -112.7333, locationName: 'Deer Lodge, MT' },
    'Blackfoot River': { lat: 46.8772, lon: -113.3814, locationName: 'Bonner, MT' },
    'Bitterroot River': { lat: 46.2471, lon: -114.1598, locationName: 'Darby, MT' },
    'Rock Creek': { lat: 46.7686, lon: -113.7365, locationName: 'Clinton, MT' },
    'Bighorn River': { lat: 45.7324, lon: -107.6120, locationName: 'Hardin, MT' },
    'Beaverhead River': { lat: 45.2669, lon: -112.6381, locationName: 'Dillon, MT' },
    'Big Hole River': { lat: 45.3500, lon: -112.5500, locationName: 'Divide, MT' },
    'Flathead River': { lat: 48.3722, lon: -114.1826, locationName: 'Columbia Falls, MT' },
    'Jefferson River': { lat: 45.7324, lon: -111.5511, locationName: 'Three Forks, MT' }
};

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

function getWeatherIcon(code) {
    if (code === 0) return '☀️';
    if (code === 1) return '🌤️';
    if (code === 2) return '⛅';
    if (code === 3) return '☁️';
    if (code >= 45 && code <= 48) return '🌫️';
    if (code >= 51 && code <= 55) return '🌦️';
    if (code >= 61 && code <= 65) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 82) return '🌦️';
    if (code >= 85 && code <= 86) return '🌨️';
    if (code >= 95) return '⛈️';
    return '🌤️';
}

async function getWeatherForRiver(riverName) {
    const location = RIVER_LOCATIONS[riverName];
    if (!location) return null;

    try {
        const response = await axios.get(
            `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=America/Denver&forecast_days=1`,
            { timeout: 5000 }
        );

        const current = response.data.current || {};
        const daily = response.data.daily || {};
        const weatherCode = current.weather_code || 0;
        
        return {
            high: Math.round(daily.temperature_2m_max?.[0] || 0),
            low: Math.round(daily.temperature_2m_min?.[0] || 0),
            current: Math.round(current.temperature_2m || 0),
            condition: getWeatherCondition(weatherCode),
            condition_code: weatherCode,
            icon: getWeatherIcon(weatherCode),
            location: location.locationName,
            river: riverName
        };
    } catch (error) {
        console.error(`Weather fetch failed for ${riverName}:`, error.message);
        return null;
    }
}

module.exports = { getWeatherForRiver, getWeatherIcon, RIVER_LOCATIONS };