// USGS Station coordinates for map display
// All coordinates verified from USGS API
const USGS_STATIONS = [
  // GALLATIN RIVER
  {
    river: 'Gallatin River',
    siteId: '06043120',
    location: 'Above Deer Creek, near Big Sky, MT',
    lat: 45.29727778,
    lon: -111.2113917,
    type: 'usgs'
  },
  {
    river: 'Gallatin River',
    siteId: '06043500',
    location: 'Near Gallatin Gateway, MT',
    lat: 45.4973,
    lon: -111.2707083,
    type: 'usgs'
  },
  {
    river: 'Gallatin River',
    siteId: '06048650',
    location: 'E Gallatin River above Water Reclamation, near Bozeman',
    lat: 45.72566667,
    lon: -111.0661944,
    type: 'usgs'
  },
  {
    river: 'Gallatin River',
    siteId: '06052500',
    location: 'At Logan, MT',
    lat: 45.8862472,
    lon: -111.4420083,
    type: 'usgs'
  },

  // MADISON RIVER
  {
    river: 'Upper Madison River',
    siteId: '06037500',
    location: 'Near West Yellowstone, MT',
    lat: 44.6570722,
    lon: -111.0679639,
    type: 'usgs'
  },
  {
    river: 'Madison River',
    siteId: '06038500',
    location: 'Below Hebgen Lake, near Grayling',
    lat: 44.86639167,
    lon: -111.3387806,
    type: 'usgs'
  },
  {
    river: 'Madison River',
    siteId: '06038800',
    location: 'At Kirby Ranch, near Cameron',
    lat: 44.88865556,
    lon: -111.580886,
    type: 'usgs'
  },
  {
    river: 'Madison River',
    siteId: '06040000',
    location: 'Near Cameron, MT',
    lat: 45.2331333,
    lon: -111.7516333,
    type: 'usgs'
  },
  {
    river: 'Madison River',
    siteId: '06040050',
    location: 'At Ennis, MT',
    lat: 45.34756389,
    lon: -111.72246389,
    type: 'usgs'
  },
  {
    river: 'Lower Madison River',
    siteId: '06040800',
    location: 'Above powerplant, near McAllister',
    lat: 45.4865944,
    lon: -111.6338583,
    type: 'usgs'
  },
  {
    river: 'Lower Madison River',
    siteId: '06041000',
    location: 'Below Ennis Lake, near McAllister, MT',
    lat: 45.49023056,
    lon: -111.6345056,
    type: 'usgs'
  },

  // YELLOWSTONE RIVER
  {
    river: 'Yellowstone River',
    siteId: '06191500',
    location: 'At Corwin Springs, MT',
    lat: 45.1121194,
    lon: -110.7936667,
    type: 'usgs'
  },
  {
    river: 'Yellowstone River',
    siteId: '06192500',
    location: 'Near Livingston, MT',
    lat: 45.5972111,
    lon: -110.5664972,
    type: 'usgs'
  },
  {
    river: 'Yellowstone River',
    siteId: '06207500',
    location: 'Clarks Fork near Belfry, MT',
    lat: 45.0099111,
    lon: -109.0653667,
    type: 'usgs'
  },
  {
    river: 'Yellowstone River',
    siteId: '06208500',
    location: 'Clarks Fork at Edgar, MT',
    lat: 45.46571389,
    lon: -108.8441056,
    type: 'usgs'
  },
  {
    river: 'Yellowstone River',
    siteId: '06214500',
    location: 'At Billings, MT',
    lat: 45.800119,
    lon: -108.468031,
    type: 'usgs'
  },
  {
    river: 'Yellowstone River',
    siteId: '06295000',
    location: 'At Forsyth, MT',
    lat: 46.266636,
    lon: -106.691303,
    type: 'usgs'
  },

  // MISSOURI RIVER
  {
    river: 'Missouri River',
    siteId: '06054500',
    location: 'At Toston, MT',
    lat: 46.1465722,
    lon: -111.4202778,
    type: 'usgs'
  },
  {
    river: 'Missouri River',
    siteId: '06065500',
    location: 'Below Hauser Dam, near Helena',
    lat: 46.76619167,
    lon: -111.8887944,
    type: 'usgs'
  },
  {
    river: 'Missouri River',
    siteId: '06066500',
    location: 'Below Holter Dam, near Wolf Creek, MT',
    lat: 46.99473889,
    lon: -112.0106667,
    type: 'usgs'
  },
  {
    river: 'Missouri River',
    siteId: '06074000',
    location: 'At Cascade, MT',
    lat: 47.2694861,
    lon: -111.6952306,
    type: 'usgs'
  },
  {
    river: 'Missouri River',
    siteId: '06078200',
    location: 'Near Ulm, MT',
    lat: 47.43496667,
    lon: -111.3884444,
    type: 'usgs'
  },

  // CLARK FORK RIVER
  {
    river: 'Clark Fork River',
    siteId: '12323800',
    location: 'Near Galen, MT',
    lat: 46.20824167,
    lon: -112.76735,
    type: 'usgs'
  },
  {
    river: 'Clark Fork River',
    siteId: '12324200',
    location: 'At Deer Lodge, MT',
    lat: 46.39765,
    lon: -112.7425389,
    type: 'usgs'
  },
  {
    river: 'Clark Fork River',
    siteId: '12331800',
    location: 'Near Drummond, MT',
    lat: 46.71191389,
    lon: -113.3307806,
    type: 'usgs'
  },
  {
    river: 'Clark Fork River',
    siteId: '12331900',
    location: 'Near Clinton, MT',
    lat: 46.71737778,
    lon: -113.5893306,
    type: 'usgs'
  },
  {
    river: 'Clark Fork River',
    siteId: '12334550',
    location: 'At Turah Bridge, near Bonner',
    lat: 46.8259111,
    lon: -113.8140306,
    type: 'usgs'
  },
  {
    river: 'Clark Fork River',
    siteId: '12340500',
    location: 'Above Missoula, MT',
    lat: 46.87676389,
    lon: -113.9321194,
    type: 'usgs'
  },
  {
    river: 'Clark Fork River',
    siteId: '12353000',
    location: 'Below Missoula, MT',
    lat: 46.8686333,
    lon: -114.1277472,
    type: 'usgs'
  },

  // BLACKFOOT RIVER
  {
    river: 'Blackfoot River',
    siteId: '12335100',
    location: 'Above Nevada Creek, near Helmville',
    lat: 46.9187944,
    lon: -113.014986,
    type: 'usgs'
  },
  {
    river: 'Blackfoot River',
    siteId: '12337900',
    location: 'North Fork below Bel Lake Creek, near Ovando',
    lat: 47.1032741,
    lon: -112.9603279,
    type: 'usgs'
  },
  {
    river: 'Blackfoot River',
    siteId: '12340000',
    location: 'Near Bonner, MT',
    lat: 46.8994111,
    lon: -113.7563194,
    type: 'usgs'
  },

  // BITTERROOT RIVER
  {
    river: 'Bitterroot River',
    siteId: '12342500',
    location: 'West Fork near Conner, MT',
    lat: 45.72482778,
    lon: -114.2822944,
    type: 'usgs'
  },
  {
    river: 'Bitterroot River',
    siteId: '12343400',
    location: 'East Fork near Conner, MT',
    lat: 45.88301667,
    lon: -114.0663139,
    type: 'usgs'
  },
  {
    river: 'Bitterroot River',
    siteId: '12344000',
    location: 'Near Darby, MT',
    lat: 45.97205,
    lon: -114.1412333,
    type: 'usgs'
  },
  {
    river: 'Bitterroot River',
    siteId: '12350250',
    location: 'At Bell Crossing, near Victor',
    lat: 46.4432,
    lon: -114.1237667,
    type: 'usgs'
  },
  {
    river: 'Bitterroot River',
    siteId: '12351200',
    location: 'Near Florence, MT',
    lat: 46.63308889,
    lon: -114.0509583,
    type: 'usgs'
  },
  {
    river: 'Bitterroot River',
    siteId: '12352500',
    location: 'Near Missoula, MT',
    lat: 46.83173889,
    lon: -114.054861,
    type: 'usgs'
  },

  // ROCK CREEK
  {
    river: 'Rock Creek',
    siteId: '12334510',
    location: 'Near Clinton, MT',
    lat: 46.7223361,
    lon: -113.683061,
    type: 'usgs'
  },

  // BIGHORN RIVER
  {
    river: 'Bighorn River',
    siteId: '06287000',
    location: 'Below Yellowtail Afterbay Dam, near St. Xavier',
    lat: 45.31690278,
    lon: -107.9188889,
    type: 'usgs'
  },
  {
    river: 'Bighorn River',
    siteId: '06287800',
    location: 'At bridge, St. Xavier, MT',
    lat: 45.46075278,
    lon: -107.7493283,
    type: 'usgs'
  },
  {
    river: 'Bighorn River',
    siteId: '06288400',
    location: 'At Two Leggins Bridge, near Hardin',
    lat: 45.6440863,
    lon: -107.6582164,
    type: 'usgs'
  },
  {
    river: 'Bighorn River',
    siteId: '06294500',
    location: 'Above Tullock Creek, near Bighorn, MT',
    lat: 46.1244722,
    lon: -107.4687917,
    type: 'usgs'
  },

  // BEAVERHEAD RIVER
  {
    river: 'Beaverhead River',
    siteId: '06016000',
    location: 'At Barretts, MT',
    lat: 45.11612778,
    lon: -112.7504944,
    type: 'usgs'
  },
  {
    river: 'Beaverhead River',
    siteId: '06017000',
    location: 'At Dillon, MT',
    lat: 45.2183833,
    lon: -112.6553333,
    type: 'usgs'
  },
  {
    river: 'Beaverhead River',
    siteId: '06023100',
    location: 'At Twin Bridges, MT',
    lat: 45.54688889,
    lon: -112.338111,
    type: 'usgs'
  },

  // BIG HOLE RIVER
  {
    river: 'Big Hole River',
    siteId: '06023500',
    location: 'Near Jackson, MT',
    lat: 45.24579167,
    lon: -113.45715,
    type: 'usgs'
  },
  {
    river: 'Big Hole River',
    siteId: '06023800',
    location: 'Above Spring Creek, near Jackson',
    lat: 45.36098056,
    lon: -113.4409667,
    type: 'usgs'
  },
  {
    river: 'Big Hole River',
    siteId: '06024450',
    location: 'Below Big Lake Creek, at Wisdom',
    lat: 45.61796667,
    lon: -113.4569417,
    type: 'usgs'
  },
  {
    river: 'Big Hole River',
    siteId: '06024540',
    location: 'Below Mudd Creek, near Wisdom',
    lat: 45.80754167,
    lon: -113.3132694,
    type: 'usgs'
  },
  {
    river: 'Big Hole River',
    siteId: '06024580',
    location: 'Near Wise River, MT',
    lat: 45.8508222,
    lon: -113.068361,
    type: 'usgs'
  },
  {
    river: 'Big Hole River',
    siteId: '06025250',
    location: 'At Maiden Rock, near Divide',
    lat: 45.7012694,
    lon: -112.7359694,
    type: 'usgs'
  },
  {
    river: 'Big Hole River',
    siteId: '06025500',
    location: 'Near Melrose, MT',
    lat: 45.52658056,
    lon: -112.701725,
    type: 'usgs'
  },

  // FLATHEAD RIVER
  {
    river: 'Flathead River',
    siteId: '12355500',
    location: 'North Fork near Columbia Falls',
    lat: 48.4957972,
    lon: -114.1267639,
    type: 'usgs'
  },
  {
    river: 'Flathead River',
    siteId: '12358500',
    location: 'Middle Fork near West Glacier',
    lat: 48.49551667,
    lon: -114.0102083,
    type: 'usgs'
  },
  {
    river: 'Flathead River',
    siteId: '12362500',
    location: 'South Fork near Columbia Falls',
    lat: 48.35657778,
    lon: -114.0378583,
    type: 'usgs'
  },
  {
    river: 'Flathead River',
    siteId: '12363000',
    location: 'At Columbia Falls, MT',
    lat: 48.3618111,
    lon: -114.18495,
    type: 'usgs'
  },
  {
    river: 'Flathead River',
    siteId: '12363500',
    location: 'Near Kalispell, MT',
    lat: 48.22113611,
    lon: -114.24188611,
    type: 'usgs'
  },
  {
    river: 'Flathead River',
    siteId: '12369000',
    location: 'Near Bigfork, MT',
    lat: 48.092325,
    lon: -114.1153694,
    type: 'usgs'
  },

  // JEFFERSON RIVER
  {
    river: 'Jefferson River',
    siteId: '06026500',
    location: 'Near Twin Bridges, MT',
    lat: 45.613283,
    lon: -112.329397,
    type: 'usgs'
  },
  {
    river: 'Jefferson River',
    siteId: '06027600',
    location: 'At Parsons Bridge, near Silver Star',
    lat: 45.747503,
    lon: -112.187228,
    type: 'usgs'
  },

  // RUBY RIVER
  {
    river: 'Ruby River',
    siteId: '06019500',
    location: 'Above reservoir, near Alder, MT',
    lat: 45.1923194,
    lon: -112.1428167,
    type: 'usgs'
  },
  {
    river: 'Ruby River',
    siteId: '06020600',
    location: 'Below reservoir, near Alder, MT',
    lat: 45.2418694,
    lon: -112.1112389,
    type: 'usgs'
  },
  {
    river: 'Ruby River',
    siteId: '06023000',
    location: 'Near Twin Bridges, MT',
    lat: 45.50691389,
    lon: -112.3308889,
    type: 'usgs'
  },

  // STILLWATER RIVER
  {
    river: 'Stillwater River',
    siteId: '06205000',
    location: 'Near Absarokee, MT',
    lat: 45.53674167,
    lon: -109.4220556,
    type: 'usgs'
  },

  // SWAN RIVER
  {
    river: 'Swan River',
    siteId: '12370000',
    location: 'Near Bigfork, MT',
    lat: 48.02423056,
    lon: -113.9788194,
    type: 'usgs'
  }
];

function getUSGSStations() {
  return USGS_STATIONS;
}

function getUSGSUrl(siteId) {
  return `https://waterdata.usgs.gov/monitoring-location/${siteId}`;
}

module.exports = { USGS_STATIONS, getUSGSStations, getUSGSUrl };
