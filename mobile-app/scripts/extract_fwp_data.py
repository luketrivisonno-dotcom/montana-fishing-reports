#!/usr/bin/env python3
import sys
import os
import csv
import glob

def find_csv_file():
    search_paths = [
        'downloads/fishing_access_sites.csv',
        '~/Downloads/fishing_access_sites.csv',
        '../downloads/fishing_access_sites.csv',
    ]
    
    for pattern in search_paths:
        expanded = os.path.expanduser(pattern)
        if os.path.exists(expanded):
            return expanded
    
    # Search for any CSV
    for pattern in ['downloads/*.csv', '~/Downloads/*.csv']:
        matches = glob.glob(os.path.expanduser(pattern))
        if matches:
            return matches[0]
    
    return None

def read_csv(filepath):
    encodings = ['utf-8', 'latin-1', 'cp1252']
    
    for encoding in encodings:
        try:
            points = []
            with open(filepath, 'r', encoding=encoding) as f:
                sample = f.read(1000)
                f.seek(0)
                delimiter = '\t' if '\t' in sample else ','
                reader = csv.DictReader(f, delimiter=delimiter)
                
                print(f"Columns: {reader.fieldnames}")
                
                for row in reader:
                    try:
                        lat = lon = None
                        name = None
                        
                        for key in row.keys():
                            if not key:
                                continue
                            kl = key.lower()
                            if any(x in kl for x in ['lat', 'y_coord']):
                                lat = float(row[key])
                            if any(x in kl for x in ['lon', 'long', 'x_coord']):
                                lon = float(row[key])
                            if any(x in kl for x in ['name', 'site', 'location']):
                                name = row[key]
                        
                        if lat and lon and name:
                            points.append({
                                'name': name.strip(),
                                'lat': lat,
                                'lon': lon,
                                'type': 'wade',
                                'parking': True,
                                'restrooms': False
                            })
                    except:
                        continue
            
            if points:
                print(f"Read {len(points)} points with {encoding}")
                return points
        except Exception as e:
            print(f"{encoding} failed: {e}")
            continue
    
    return []

def organize_rivers(points):
    rivers = {r: [] for r in [
        'Madison River', 'Yellowstone River', 'Gallatin River', 'Missouri River',
        'Bighorn River', 'Beaverhead River', 'Big Hole River', 'Bitterroot River',
        'Blackfoot River', 'Clark Fork River', 'Flathead River', 'Jefferson River',
        'Ruby River', 'Stillwater River', 'Swan River', 'Rock Creek', 'Boulder River',
        'Spring Creeks', 'Yellowstone National Park'
    ]}
    
    for p in points:
        name = p['name'].lower()
        assigned = False
        
        for river in rivers.keys():
            key = river.lower().replace(' river', '').replace(' national park', '').replace(' creek', '')
            if key in name:
                rivers[river].append(p)
                assigned = True
                break
        
        if not assigned:
            if 'madison' in name: rivers['Madison River'].append(p)
            elif 'yellowstone' in name and 'park' not in name: rivers['Yellowstone River'].append(p)
            elif 'gallatin' in name: rivers['Gallatin River'].append(p)
            elif 'missouri' in name: rivers['Missouri River'].append(p)
            elif 'bighorn' in name: rivers['Bighorn River'].append(p)
            elif 'beaverhead' in name: rivers['Beaverhead River'].append(p)
            elif 'big hole' in name: rivers['Big Hole River'].append(p)
            elif 'bitterroot' in name: rivers['Bitterroot River'].append(p)
            elif 'blackfoot' in name: rivers['Blackfoot River'].append(p)
            elif 'clark fork' in name: rivers['Clark Fork River'].append(p)
            elif 'flathead' in name: rivers['Flathead River'].append(p)
            elif 'jefferson' in name: rivers['Jefferson River'].append(p)
            elif 'ruby' in name: rivers['Ruby River'].append(p)
            elif 'stillwater' in name: rivers['Stillwater River'].append(p)
            elif 'swan' in name: rivers['Swan River'].append(p)
            elif 'rock creek' in name: rivers['Rock Creek'].append(p)
            elif 'boulder' in name: rivers['Boulder River'].append(p)
    
    return rivers

def main():
    filepath = sys.argv[1] if len(sys.argv) > 1 else find_csv_file()
    
    if not filepath or not os.path.exists(filepath):
        print("CSV file not found. Please provide path:")
        print("  python3 extract_fwp_data.py /path/to/file.csv")
        sys.exit(1)
    
    print(f"Processing: {filepath}")
    points = read_csv(filepath)
    
    if not points:
        print("No valid points found")
        sys.exit(1)
    
    rivers = organize_rivers(points)
    
    # Generate JS
    js = "export const ACCESS_POINTS = {\n"
    for river, pts in rivers.items():
        if pts:
            js += f"  '{river}': [\n"
            for p in pts:
                safe = p['name'].replace("'", "\\'")
                js += f"    {{ name: '{safe}', lat: {p['lat']:.6f}, lon: {p['lon']:.6f}, type: '{p['type']}', parking: true, restrooms: false }},\n"
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
    
    print(f"\n✓ Generated ../data/accessPoints.js")
    total = sum(len(p) for p in rivers.values())
    print(f"Total: {total} access points")

if __name__ == '__main__':
    main()
