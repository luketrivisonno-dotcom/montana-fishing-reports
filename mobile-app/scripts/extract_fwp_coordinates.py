#!/usr/bin/env python3
"""
Script to extract fishing access site coordinates from Montana FWP data.
Download the FWP Fishing Access Sites shapefile/KML from:
https://gis-mtfwp.hub.arcgis.com/datasets/40c5d0eafa9343249239b71cbd4e95b6_0/explore

Usage:
1. Download the FWP Fishing Access Sites data (Shapefile or KML format)
2. Place the file in this directory
3. Run: python3 extract_fwp_coordinates.py <filename.shp or filename.kml>
4. The script will output a JavaScript file with the coordinates
"""

import sys
import json
import re

def parse_shapefile(filename):
    """Parse shapefile and extract coordinates"""
    try:
        import shapefile
        sf = shapefile.Reader(filename)
        features = []
        
        for i, shape in enumerate(sf.shapes()):
            record = sf.record(i)
            name = record.get('Name', record.get('SITE_NAME', f'Access {i}'))
            lat = shape.points[0][1]
            lon = shape.points[0][0]
            
            # Determine type from record
            boat_launch = record.get('Boat_Launch', False)
            type_val = 'boat' if boat_launch else 'wade'
            
            features.append({
                'name': name,
                'lat': lat,
                'lon': lon,
                'type': type_val,
                'parking': record.get('Parking', True),
                'restrooms': record.get('Restrooms', False)
            })
        
        return features
    except ImportError:
        print("Installing pyshp...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyshp"])
        return parse_shapefile(filename)

def parse_kml(filename):
    """Parse KML file and extract coordinates"""
    try:
        from xml.etree import ElementTree as ET
        
        tree = ET.parse(filename)
        root = tree.getroot()
        features = []
        
        ns = {'kml': 'http://www.opengis.net/kml/2.2'}
        
        for placemark in root.findall('.//kml:Placemark', ns):
            name = placemark.find('kml:name', ns)
            name = name.text if name is not None else 'Unknown'
            
            point = placemark.find('.//kml:Point/kml:coordinates', ns)
            if point is not None:
                coords = point.text.strip().split(',')
                lon = float(coords[0])
                lat = float(coords[1])
                
                # Try to determine type from name
                type_val = 'wade'
                if 'boat' in name.lower() or 'launch' in name.lower():
                    type_val = 'boat'
                elif 'both' in name.lower() or 'ramp' in name.lower():
                    type_val = 'both'
                
                features.append({
                    'name': name,
                    'lat': lat,
                    'lon': lon,
                    'type': type_val,
                    'parking': True,
                    'restrooms': False
                })
        
        return features
    except Exception as e:
        print(f"Error parsing KML: {e}")
        return []

def organize_by_river(features):
    """Organize access points by river"""
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
    
    for feature in features:
        name = feature['name'].lower()
        assigned = False
        
        # Check for river names in the access point name
        for river in rivers.keys():
            river_key = river.lower().replace(' river', '').replace(' national park', '').replace(' creek', '')
            if river_key in name:
                rivers[river].append(feature)
                assigned = True
                break
        
        # Special cases
        if not assigned:
            if 'madison' in name:
                rivers['Madison River'].append(feature)
                assigned = True
            elif 'yellowstone' in name and 'park' not in name:
                rivers['Yellowstone River'].append(feature)
                assigned = True
            elif 'gallatin' in name:
                rivers['Gallatin River'].append(feature)
                assigned = True
            elif 'missouri' in name:
                rivers['Missouri River'].append(feature)
                assigned = True
            elif 'bighorn' in name:
                rivers['Bighorn River'].append(feature)
                assigned = True
        
        if not assigned:
            print(f"Could not assign: {feature['name']}")
    
    return rivers

def generate_js(rivers):
    """Generate JavaScript file"""
    js_content = "export const ACCESS_POINTS = {\\n"
    
    for river, points in rivers.items():
        if points:
            js_content += f"  '{river}': [\\n"
            for point in points:
                # Escape single quotes in names
                safe_name = point['name'].replace("'", "\\\\'")
                js_content += f"    {{ name: '{safe_name}', lat: {point['lat']}, lon: {point['lon']}, type: '{point.get('type', 'wade')}', parking: {str(point.get('parking', True)).lower()}, restrooms: {str(point.get('restrooms', False)).lower()} }},\\n"
            js_content += "  ],\\n"
    
    js_content += "};\\n\\n"
    js_content += """export const getAccessPoints = (riverName) => {
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
    
    return js_content

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 extract_fwp_coordinates.py <filename.shp or filename.kml>")
        print("\\nDownload FWP data from:")
        print("https://gis-mtfwp.hub.arcgis.com/datasets/40c5d0eafa9343249239b71cbd4e95b6_0/explore")
        sys.exit(1)
    
    filename = sys.argv[1]
    
    if filename.endswith('.shp'):
        features = parse_shapefile(filename)
    elif filename.endswith('.kml'):
        features = parse_kml(filename)
    else:
        print("Unsupported file format. Use .shp or .kml")
        sys.exit(1)
    
    print(f"Found {len(features)} access points")
    
    rivers = organize_by_river(features)
    js_content = generate_js(rivers)
    
    output_file = '../data/accessPoints.js'
    with open(output_file, 'w') as f:
        f.write(js_content)
    
    print(f"Generated {output_file}")
    print("\\nSummary:")
    for river, points in rivers.items():
        if points:
            print(f"  {river}: {len(points)} access points")
