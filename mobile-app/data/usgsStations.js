// USGS Station coordinates for map display
const USGS_STATIONS = [
  {
    river: 'Gallatin River',
    siteId: '06043500',
    location: 'Gallatin Gateway, MT',
    lat: 45.4752,
    lon: -111.2275,
    type: 'usgs'
  },
  {
    river: 'Upper Madison River',
    siteId: '06037500',
    location: 'Cameron Bridge, MT',
    lat: 45.2255,
    lon: -111.6855,
    type: 'usgs'
  },
  {
    river: 'Lower Madison River',
    siteId: '06041000',
    location: 'Black\'s Ford, MT',
    lat: 45.8124,
    lon: -111.5780,
    type: 'usgs'
  },
  {
    river: 'Yellowstone River',
    siteId: '06192500',
    location: 'Corwin Springs, MT',
    lat: 45.1124,
    lon: -110.7921,
    type: 'usgs'
  },
  {
    river: 'Missouri River',
    siteId: '06066500',
    location: 'Holter Dam, MT',
    lat: 46.9955,
    lon: -111.8050,
    type: 'usgs'
  },
  {
    river: 'Clark Fork River',
    siteId: '12331800',
    location: 'Deer Lodge, MT',
    lat: 46.4005,
    lon: -112.7320,
    type: 'usgs'
  },
  {
    river: 'Blackfoot River',
    siteId: '12340000',
    location: 'Bonner, MT',
    lat: 46.8771,
    lon: -113.9137,
    type: 'usgs'
  },
  {
    river: 'Bitterroot River',
    siteId: '12344000',
    location: 'Darby, MT',
    lat: 46.0216,
    lon: -114.1798,
    type: 'usgs'
  },
  {
    river: 'Rock Creek',
    siteId: '12334510',
    location: 'Clinton, MT',
    lat: 46.7694,
    lon: -113.7159,
    type: 'usgs'
  },
  {
    river: 'Bighorn River',
    siteId: '06294500',
    location: 'Bighorn, MT',
    lat: 45.4500,
    lon: -107.9334,
    type: 'usgs'
  },
  {
    river: 'Beaverhead River',
    siteId: '06017000',
    location: 'Dillon, MT',
    lat: 45.2152,
    lon: -112.6342,
    type: 'usgs'
  },
  {
    river: 'Big Hole River',
    siteId: '06025500',
    location: 'Melrose, MT',
    lat: 45.6141,
    lon: -112.6786,
    type: 'usgs'
  },
  {
    river: 'Flathead River',
    siteId: '12389000',
    location: 'Columbia Falls, MT',
    lat: 48.3711,
    lon: -114.1879,
    type: 'usgs'
  },
  {
    river: 'Jefferson River',
    siteId: '06026500',
    location: 'Twin Bridges, MT',
    lat: 45.5460,
    lon: -112.2539,
    type: 'usgs'
  },
  {
    river: 'Ruby River',
    siteId: '06019500',
    location: 'Alder, MT',
    lat: 45.3255,
    lon: -112.1186,
    type: 'usgs'
  },
  {
    river: 'Stillwater River',
    siteId: '06205000',
    location: 'Absarokee, MT',
    lat: 45.5205,
    lon: -109.4393,
    type: 'usgs'
  },
  {
    river: 'Swan River',
    siteId: '12370000',
    location: 'Big Fork, MT',
    lat: 48.0630,
    lon: -114.0729,
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
