#!/usr/bin/env python3
import sys
import csv

def extract_from_csv(filename):
    """Parse CSV with lat/lon columns"""
    points = []
    with open(filename, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                lat = float(row.get('Latitude', row.get('lat', 0)))
                lon = float(row.get('Longitude', row.get('lon', 0)))
                name = row.get('Name', row.get('SITE_NAME', row.get('AccessSite', 'Unknown')))
                if lat != 0 and lon != 0:
                    points.append({
                        'name': name,
                        'lat': lat,
                        'lon': lon,
                        'type': 'wade',
                        'parking': True,
                        'restrooms': False
                    })
            except:
                continue
    return points

# Main
if len(sys.argv) < 2:
    print("Usage: python3 extract_coords.py <file.csv>")
    sys.exit(1)

filename = sys.argv[1]
points = extract_from_csv(filename)
print(f"Found {len(points)} access points")

# Organize by river name keywords
rivers = {
    'Madison River': [],
    'Yellowstone River': [],
    'Gallatin River': [],
    'Missouri River': [],
    'Bighorn River': [],
    'Beaverhead River': [],
    'Big Hole River': [],
    'Bitterroot River': [],
    'Blackfoot River': [],
    'Clark Fork River': [],
    'Flathead River': [],
    'Jefferson River': [],
    'Ruby River': [],
    'Stillwater River': [],
    'Swan River': [],
    'Rock Creek': [],
    'Boulder River': [],
    'Spring Creeks': [],
    'Yellowstone National Park': []
}

for point in points:
    name = point['name'].lower()
    assigned = False
    for river in rivers.keys():
        river_key = river.lower().replace(' river', '').replace(' national park', '').replace(' creek', '')
        if river_key in name:
            rivers[river].append(point)
            assigned = True
            break
    
    if not assigned:
        # Try alternative matching
        if 'madison' in name:
            rivers['Madison River'].append(point)
        elif 'yellowstone' in name and 'park' not in name:
            rivers['Yellowstone River'].append(point)
        elif 'gallatin' in name:
            rivers['Gallatin River'].append(point)
        elif 'missouri' in name:
            rivers['Missouri River'].append(point)
        elif 'bighorn' in name:
            rivers['Bighorn River'].append(point)
        elif 'beaverhead' in name:
            rivers['Beaverhead River'].append(point)
        elif 'big hole' in name:
            rivers['Big Hole River'].append(point)
        elif 'bitterroot' in name:
            rivers['Bitterroot River'].append(point)
        elif 'blackfoot' in name:
            rivers['Blackfoot River'].append(point)
        elif 'clark fork' in name:
            rivers['Clark Fork River'].append(point)
        elif 'flathead' in name:
            rivers['Flathead River'].append(point)
        elif 'jefferson' in name:
            rivers['Jefferson River'].append(point)
        elif 'ruby' in name:
            rivers['Ruby River'].append(point)
        elif 'stillwater' in name:
            rivers['Stillwater River'].append(point)
        elif 'swan' in name:
            rivers['Swan River'].append(point)
        elif 'rock creek' in name:
            rivers['Rock Creek'].append(point)
        elif 'boulder' in name:
            rivers['Boulder River'].append(point)

# Generate JS
js = "export const ACCESS_POINTS = {\n"
for river, pts in rivers.items():
    if pts:
        js += f"  '{river}': [\n"
        for p in pts:
            safe_name = p['name'].replace("'", "\\'")
            js += f"    {{ name: '{safe_name}', lat: {p['lat']:.6f}, lon: {p['lon']:.6f}, type: '{p['type']}', parking: {str(p['parking']).lower()}, restrooms: {str(p['restrooms']).lower()} }},\n"
        js += "  ],\n"
js += "};\n\n"
js += """export const getAccessPoints = (riverName) => {
  return ACCESS_POINTS[riverName] || [];
};

export const getBoatLaunches = (riverName) => {
  const points = ACCESS_POINTS[riverName] || [];
  return points.filter(p => p.type === 'boat' || p.type === 'both');
};

export const getWadeAccess = (riverName) => {
  const points = ACCESS_POINTS[riverName] || [];
  return points.filter(p => p.type === 'wade' || p.type === 'both');
};
"""

with open('../data/accessPoints.js', 'w') as f:
    f.write(js)

print("Generated ../data/accessPoints.js")
print("\nSummary:")
for river, pts in rivers.items():
    if pts:
        print(f"  {river}: {len(pts)} points")
