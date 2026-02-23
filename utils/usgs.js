const axios = require('axios');

// USGS Site IDs for Montana rivers
const USGS_SITES = {
  'Gallatin River': '06043500', // Gallatin Gateway
  'Madison River': '06037500', // Cameron (covers upper/lower)
  'Yellowstone River': '06192500', // Corwin Springs
  'Missouri River': '06066500', // Wolf Creek
  'Clark Fork River': '12331800', // Missoula
  'Blackfoot River': '12340000', // Bonner
  'Bitterroot River': '12344000', // Darby
  'Bighorn River': '06294000' // Fort Smith
};

async function getUSGSData(riverName) {
  const siteId = USGS_SITES[riverName];
  if (!siteId) return null;

  try {
    // Get current discharge (CFS) and water temperature
    const response = await axios.get(
      `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${siteId}&parameterCd=00060,00010&period=P1D`,
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
        if (param === '00060') flow = Math.round(parseFloat(latest.value));
        if (param === '00010') temp = Math.round(parseFloat(latest.value));
      }
    });

    return {
      river: riverName,
      flow: flow ? `${flow} CFS` : 'N/A',
      temp: temp ? `${temp}°F` : 'N/A',
      siteId: siteId
    };
  } catch (error) {
    console.error(`USGS fetch failed for ${riverName}:`, error.message);
    return null;
  }
}

module.exports = { getUSGSData, USGS_SITES };