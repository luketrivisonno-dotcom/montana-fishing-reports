from flask import Flask, jsonify
from flask_cors import CORS
import requests
import datetime

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Version to verify deployment
API_VERSION = "2.0.1-weather-fix"

# CORRECT coordinates for Montana river weather stations
RIVER_COORDINATES = {
    'Gallatin River': {
        'lat': 45.4128,
        'lon': -111.2266,
        'location': 'Gallatin Gateway, MT',
        'station': 'GBSM8 - Gallatin River above Deer Creek'
    },
    'Upper Madison River': {
        'lat': 44.6583,
        'lon': -111.0961,
        'location': 'West Yellowstone, MT',
        'station': 'MDSM8 - Madison River near West Yellowstone'
    },
    'Lower Madison River': {
        'lat': 45.3394,
        'lon': -111.7122,
        'location': 'Ennis, MT',
        'station': 'ENNM8 - Ennis RAWS'
    },
    'Madison River': {
        'lat': 44.6583,
        'lon': -111.0961,
        'location': 'West Yellowstone, MT',
        'station': 'MDSM8 - Madison River near West Yellowstone'
    },
    'Yellowstone River': {
        'lat': 45.6614,
        'lon': -110.5606,
        'location': 'Livingston, MT',
        'station': 'LIVM8 - Yellowstone River near Livingston'
    },
    'Missouri River': {
        'lat': 47.0722,
        'lon': -111.8353,
        'location': 'Craig, MT',
        'station': 'DBOM8 - Dearborn RAWS near Craig'
    },
    'Bighorn River': {
        'lat': 45.3169,
        'lon': -107.9251,
        'location': 'Fort Smith, MT',
        'station': 'FSMM8 - Fort Smith Air Strip'
    },
    'Clark Fork River': {
        'lat': 46.8721,
        'lon': -113.9940,
        'location': 'Missoula, MT',
        'station': 'PNTM8 - Point Six RAWS near Missoula'
    },
    'Blackfoot River': {
        'lat': 46.8772,
        'lon': -113.3814,
        'location': 'Bonner, MT',
        'station': 'BONM8 - Blackfoot River near Bonner'
    },
    'Bitterroot River': {
        'lat': 46.2471,
        'lon': -114.1598,
        'location': 'Darby, MT',
        'station': 'DARM8 - Bitterroot River near Darby'
    },
    'Rock Creek': {
        'lat': 46.7686,
        'lon': -113.7365,
        'location': 'Clinton, MT',
        'station': 'RCCM8 - Rock Creek near Clinton'
    }
}

USGS_GAUGES = {
    'Gallatin River': {'site': '06043500', 'name': 'Gallatin River near Gallatin Gateway, MT'},
    'Upper Madison River': {'site': '06037500', 'name': 'Madison River near West Yellowstone, MT'},
    'Lower Madison River': {'site': '06041000', 'name': 'Madison River below Ennis Lake near McAllister'},
    'Madison River': {'site': '06037500', 'name': 'Madison River near West Yellowstone, MT'},
    'Yellowstone River': {'site': '06192500', 'name': 'Yellowstone River near Livingston, MT'},
    'Missouri River': {'site': '06043000', 'name': 'Missouri River near Craig, MT'},
    'Bighorn River': {'site': '06295000', 'name': 'Bighorn River near St. Xavier 14W'},
    'Clark Fork River': {'site': '12331800', 'name': 'Clark Fork River near Plains 2SE'},
    'Blackfoot River': {'site': '12340000', 'name': 'Blackfoot River near Bonner 6NE'},
    'Bitterroot River': {'site': '12344000', 'name': 'Bitterroot River near Darby'},
    'Rock Creek': {'site': '12331800', 'name': 'Rock Creek near Clinton 4SE'}
}

FISHING_REPORTS = {
    'Gallatin River': [
        {'id': '1', 'source': 'Montana Angler', 'url': 'https://www.montanaangler.com/gallatin-river-fishing-report', 'last_updated': '2024-01-15'},
        {'id': '2', 'source': 'Outside Bozeman', 'url': 'https://outsidebozeman.com/fishing/gallatin-river', 'last_updated': '2024-01-14'}
    ],
    'Madison River': [
        {'id': '3', 'source': 'Madison River Fishing Company', 'url': 'https://www.madisonriverfishing.com/fishing-report', 'last_updated': '2024-01-15'},
        {'id': '4', 'source': 'Kelly Galloup', 'url': 'https://slideinn.com/fishing-report/', 'last_updated': '2024-01-14'}
    ],
    'Upper Madison River': [
        {'id': '5', 'source': 'Madison River Fishing Company', 'url': 'https://www.madisonriverfishing.com/fishing-report', 'last_updated': '2024-01-15'}
    ],
    'Lower Madison River': [
        {'id': '6', 'source': 'Madison River Fishing Company', 'url': 'https://www.madisonriverfishing.com/fishing-report', 'last_updated': '2024-01-15'}
    ],
    'Yellowstone River': [
        {'id': '7', 'source': 'Park\'s Fly Shop', 'url': 'https://parksflyshop.com/fishing-report/', 'last_updated': '2024-01-15'},
        {'id': '8', 'source': 'Montana Angler', 'url': 'https://www.montanaangler.com/yellowstone-river-fishing-report', 'last_updated': '2024-01-14'}
    ],
    'Missouri River': [
        {'id': '9', 'source': 'Headhunters Fly Shop', 'url': 'https://www.headhuntersflyshop.com/fishing-report/', 'last_updated': '2024-01-15'},
        {'id': '10', 'source': 'CrossCurrents Fly Shop', 'url': 'https://www.crosscurrents.com/missouri-river-fishing-report', 'last_updated': '2024-01-14'}
    ],
    'Bighorn River': [
        {'id': '11', 'source': 'Bighorn Angler', 'url': 'https://bighornangler.com/fishing-report/', 'last_updated': '2024-01-15'},
        {'id': '12', 'source': 'Fort Smith Fly Shop', 'url': 'https://fortsmithflyshop.com/fishing-report', 'last_updated': '2024-01-14'}
    ],
    'Clark Fork River': [
        {'id': '13', 'source': 'Missoula Fly Shop', 'url': 'https://www.missoulaflyshop.com/fishing-report', 'last_updated': '2024-01-15'}
    ],
    'Blackfoot River': [
        {'id': '14', 'source': 'Missoula Fly Shop', 'url': 'https://www.missoulaflyshop.com/fishing-report', 'last_updated': '2024-01-15'},
        {'id': '15', 'source': 'Blackfoot River Outfitters', 'url': 'https://www.blackfootriver.com/fishing-report', 'last_updated': '2024-01-14'}
    ],
    'Bitterroot River': [
        {'id': '16', 'source': 'Missoula Fly Shop', 'url': 'https://www.missoulaflyshop.com/fishing-report', 'last_updated': '2024-01-15'},
        {'id': '17', 'source': 'Bitterroot Fly Company', 'url': 'https://bitterrootflycompany.com/fishing-report', 'last_updated': '2024-01-14'}
    ],
    'Rock Creek': [
        {'id': '18', 'source': 'Rock Creek Fisherman', 'url': 'https://rockcreekfisherman.com/fishing-report', 'last_updated': '2024-01-15'}
    ]
}

@app.route('/api/version')
def get_version():
    return jsonify({
        'version': API_VERSION,
        'timestamp': datetime.datetime.now().isoformat(),
        'rivers_count': len(RIVER_COORDINATES)
    })

@app.route('/api/rivers')
def get_rivers():
    return jsonify({'rivers': list(RIVER_COORDINATES.keys())})

@app.route('/api/river-details/<path:river_name>')
def get_river_details(river_name):
    try:
        weather = get_weather_for_river(river_name)
        gauge = USGS_GAUGES.get(river_name, {})
        usgs_data = get_usgs_data(gauge.get('site', ''), gauge.get('name', river_name))
        reports = FISHING_REPORTS.get(river_name, [])
        
        return jsonify({
            'river': river_name,
            'weather': weather,
            'usgs': usgs_data,
            'reports': reports,
            'api_version': API_VERSION
        })
    except Exception as e:
        return jsonify({'error': str(e), 'api_version': API_VERSION}), 500

def get_weather_for_river(river_name):
    coords = RIVER_COORDINATES.get(river_name, {
        'lat': 47.0,
        'lon': -110.0,
        'location': 'Montana',
        'station': 'Unknown'
    })
    
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        'latitude': coords['lat'],
        'longitude': coords['lon'],
        'current': 'temperature_2m,weather_code',
        'daily': ['temperature_2m_max', 'temperature_2m_min'],
        'temperature_unit': 'fahrenheit',
        'timezone': 'America/Denver',
        'forecast_days': 1
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        current = data.get('current', {})
        daily = data.get('daily', {})
        
        # Debug print to Railway logs
        print(f"[{API_VERSION}] Weather for {river_name}: current={current}, daily={daily}")
        
        weather_code = current.get('weather_code', 0)
        
        return {
            'high': round(daily.get('temperature_2m_max', [0])[0]) if daily.get('temperature_2m_max') else '--',
            'low': round(daily.get('temperature_2m_min', [0])[0]) if daily.get('temperature_2m_min') else '--',
            'current': round(current.get('temperature_2m', 0)) if current.get('temperature_2m') else '--',
            'condition_code': weather_code,
            'location': coords['location'],
            'station': coords['station']
        }
    except Exception as e:
        print(f"[{API_VERSION}] Weather error for {river_name}: {e}")
        return {
            'high': '--',
            'low': '--',
            'current': '--',
            'condition_code': 0,
            'location': coords['location'],
            'station': coords['station'],
            'error': str(e)
        }

def get_usgs_data(site_code, location_name):
    if not site_code:
        return None
    
    url = f"https://waterservices.usgs.gov/nwis/iv/?format=json&sites={site_code}&parameterCd=00060,00010&period=P1D"
    
    try:
        response = requests.get(url, timeout=10)
        data = response.json()
        
        flow = "N/A"
        temp = "N/A"
        
        if 'value' in data and 'timeSeries' in data['value']:
            for series in data['value']['timeSeries']:
                variable = series['variable']['variableCode'][0]['value']
                values = series['values'][0]['value']
                
                if values:
                    latest = values[-1]
                    val = latest.get('value', 'N/A')
                    
                    if variable == '00060':
                        flow = f"{val} cfs" if val != 'N/A' else 'N/A'
                    elif variable == '00010':
                        temp = f"{val}°F" if val != 'N/A' else 'N/A'
        
        return {
            'flow': flow,
            'temp': temp,
            'location': location_name,
            'site_code': site_code
        }
    except Exception as e:
        return {
            'flow': 'N/A',
            'temp': 'N/A',
            'location': location_name,
            'site_code': site_code
        }

if __name__ == '__main__':
    app.run(debug=True, port=5000)
