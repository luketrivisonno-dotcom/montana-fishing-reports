const axios = require('axios');

const USGS_SITES = {
    'Gallatin River': '06043500',
    'Upper Madison River': '06037500',
    'Lower Madison River': '06041000',
    'Yellowstone River': '06192500',
    'Missouri River': '06066500',
    'Clark Fork River': '12331800',
    'Blackfoot River': '12340000',
    'Bitterroot River': '12344000',
    'Rock Creek': '12331800',
    'Bighorn River': '06295000',
    'Beaverhead River': '06013500',
    'Big Hole River': '06024500',
    'Flathead River': '12389000',
    'Jefferson River': '06026500'
};

async function getUSGSData(riverName) {
    const siteId = USGS_SITES[riverName];
    if (!siteId) return null;

    try {
        const response = await axios.get(
            `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${siteId}&parameterCd=00060,00010&period=P1D`,
            { timeout: 5000 }
        );

        const timeSeries = response.data.value?.timeSeries || [];
        let flow = null;
        let temp = null;

        timeSeries.forEach(series => {
            const param = series.variable?.variableCode?.[0]?.value;
            const values = series.values?.[0]?.value;
            if (values && values.length > 0) {
                const latest = values[values.length - 1];
                const val = parseFloat(latest.value);
                if (param === '00060') flow = Math.round(val);
                if (param === '00010') temp = Math.round(val);
            }
        });

        return {
            river: riverName,
            flow: flow ? `${flow} CFS` : 'N/A',
            temp: temp ? `${temp}°F` : 'N/A',
            rawFlow: flow,
            rawTemp: temp,
            siteId: siteId,
            url: `https://waterdata.usgs.gov/monitoring-location/${siteId}/`
        };
    } catch (error) {
        return {
            river: riverName,
            flow: 'N/A',
            temp: 'N/A',
            siteId: siteId,
            url: `https://waterdata.usgs.gov/monitoring-location/${siteId}/`
        };
    }
}

module.exports = { getUSGSData, USGS_SITES };