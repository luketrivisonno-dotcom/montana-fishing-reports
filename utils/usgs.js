const axios = require('axios');

// USGS Site IDs with location names for display
const USGS_SITES = {
  'Gallatin River': { id: '06043500', location: 'Gallatin Gateway, MT' },
  'Upper Madison River': { id: '06037500', location: 'Cameron Bridge, MT' },
  'Lower Madison River': { id: '06041000', location: 'Black\'s Ford, MT' },
  'Yellowstone River': { id: '06192500', location: 'Corwin Springs, MT' },
  'Missouri River': { id: '06066500', location: 'Holter Dam, MT' },
  'Clark Fork River': { id: '12331800', location: 'Deer Lodge, MT' },
  'Blackfoot River': { id: '12340000', location: 'Bonner, MT' },
  'Bitterroot River': { id: '12344000', location: 'Darby, MT' },
  'Rock Creek': { id: '12334510', location: 'Clinton, MT' },
  'Bighorn River': { id: '06294500', location: 'Bighorn, MT' },
  'Beaverhead River': { id: '06017000', location: 'Dillon, MT' },
  'Big Hole River': { id: '06025500', location: 'Melrose, MT' },
  'Flathead River': { id: '12389000', location: 'Columbia Falls, MT' },
  'Jefferson River': { id: '06026500', location: 'Twin Bridges, MT' },
  'Ruby River': { id: '06019500', location: 'Alder, MT' },
  'Stillwater River': { id: '06205000', location: 'Absarokee, MT' },
  'Swan River': { id: '12370000', location: 'Big Fork, MT' }
};

async function getUSGSData(riverName) {
  const site = USGS_SITES[riverName];
  if (!site) return null;

  try {
    const response = await axios.get(
      `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${site.id}&parameterCd=00060,00010&period=P1D`,
      { timeout: 5000 }
    );

    const timeSeries = response.data.value.timeSeries;
    let flow = null;
    let temp = null;

    timeSeries.forEach(series => {
      const param = series.variable.variableCode[0].value;
      const values = series.values[0].value;
      if (values.length > 0) {
        const latest = values[values.length - 1];
        if (latest.value !== '-999999') {
          if (param === '00060') flow = Math.round(parseFloat(latest.value));
          if (param === '00010') temp = Math.round(parseFloat(latest.value) * 9/5 + 32);
        }
      }
    });

    return {
      river: riverName,
      flow: flow ? `${flow} CFS` : 'Ice/No Data',
      temp: temp ? `${temp}°F` : 'N/A',
      siteId: site.id,
      location: site.location,
      url: `https://waterdata.usgs.gov/monitoring-location/${site.id}`
    };
  } catch (error) {
    console.error(`USGS fetch failed for ${riverName}:`, error.message);
    return null;
  }
}

module.exports = { getUSGSData, USGS_SITES };
