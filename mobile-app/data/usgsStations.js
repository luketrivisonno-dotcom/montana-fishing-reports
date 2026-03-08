// USGS Station coordinates for map display
// All coordinates verified from USGS API
const USGS_STATIONS = [
  {
    river: 'Gallatin River',
    siteId: '06043500',
    location: 'Near Gallatin Gateway, MT',
    lat: 45.4973,
    lon: -111.2707083,
    type: 'usgs'
  },
  {
    river: 'Upper Madison River',
    siteId: '06037500',
    location: 'Near West Yellowstone, MT',
    lat: 44.6570722,
    lon: -111.0679639,
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
  {
    river: 'Yellowstone River',
    siteId: '06192500',
    location: 'Near Livingston, MT',
    lat: 45.5972111,
    lon: -110.5664972,
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
    river: 'Clark Fork River',
    siteId: '12331800',
    location: 'Near Drummond, MT',
    lat: 46.71191389,
    lon: -113.3307806,
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
  {
    river: 'Bitterroot River',
    siteId: '12344000',
    location: 'Near Darby, MT',
    lat: 45.97205,
    lon: -114.1412333,
    type: 'usgs'
  },
  {
    river: 'Rock Creek',
    siteId: '12334510',
    location: 'Near Clinton, MT',
    lat: 46.7223361,
    lon: -113.683061,
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
  {
    river: 'Beaverhead River',
    siteId: '06017000',
    location: 'At Dillon, MT',
    lat: 45.2183833,
    lon: -112.6553333,
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
  {
    river: 'Flathead River',
    siteId: '12363000',
    location: 'At Columbia Falls, MT',
    lat: 48.3618111,
    lon: -114.18495,
    type: 'usgs'
  },
  {
    river: 'Jefferson River',
    siteId: '06026500',
    location: 'Near Twin Bridges, MT',
    lat: 45.613283,
    lon: -112.329397,
    type: 'usgs'
  },
  {
    river: 'Ruby River',
    siteId: '06019500',
    location: 'Above reservoir, near Alder, MT',
    lat: 45.1923194,
    lon: -112.1428167,
    type: 'usgs'
  },
  {
    river: 'Stillwater River',
    siteId: '06205000',
    location: 'Near Absarokee, MT',
    lat: 45.53674167,
    lon: -109.4220556,
    type: 'usgs'
  },
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
