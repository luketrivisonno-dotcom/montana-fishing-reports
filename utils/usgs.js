const axios = require('axios');

// USGS Site IDs with location names for display
const USGS_SITES = {
  'Gallatin River': { id: '06043500', location: 'Gallatin Gateway, MT' },
  'Upper Madison River': { id: '06040000', location: 'Cameron, MT' },
  'Lower Madison River': { id: '06041000', location: 'McAllister, MT' },
  'Yellowstone River': { id: '06191500', location: 'Corwin Springs, MT' },
  'Missouri River': { id: '06066500', location: 'Holter Dam, MT' },
  'Clark Fork River': { id: '12331800', location: 'Drummond, MT' },
  'Blackfoot River': { id: '12340000', location: 'Bonner, MT' },
  'Bitterroot River': { id: '12344000', location: 'Darby, MT' },
  'Rock Creek': { id: '12334510', location: 'Clinton, MT' },
  'Bighorn River': { id: '06287800', location: 'St. Xavier, MT' },
  'Beaverhead River': { id: '06017000', location: 'Dillon, MT' },
  'Big Hole River': { id: '06025500', location: 'Melrose, MT' },
  'Flathead River': { id: '12363000', location: 'Columbia Falls, MT' },
  'Jefferson River': { id: '06026500', location: 'Twin Bridges, MT' },
  'Ruby River': { id: '06019500', location: 'Alder, MT' },
  'Stillwater River': { id: '06205000', location: 'Absarokee, MT' },
  'Boulder River': { id: '06200000', location: 'Big Timber, MT' },
  'Swan River': { id: '12370000', location: 'Big Fork, MT' },
  // YNP Rivers
  'Firehole River': { id: '06036905', location: 'Near West Yellowstone, YNP' },
  'Soda Butte Creek': { id: '06187915', location: 'Near Lamar Ranger Station, YNP' },
  'Lamar River': { id: '06188000', location: 'Tower Station, YNP' },
  'Gardner River': { id: '06191000', location: 'Near Mammoth, YNP' }
};

// Seasonal gauges - USGS stations that only run part of the year
const SEASONAL_GAUGES = [
  'Beaverhead River',   // Typically ice-affected in winter
  'Big Hole River',     // Often seasonal ice effects
  'Ruby River',         // Small stream, seasonal patterns
  'Swan River',         // Seasonal high/low flows
  // YNP Rivers - high elevation, ice-affected in winter
  'Soda Butte Creek',   // Ice-affected Nov-May
  'Lamar River'         // Ice-affected Nov-May
];

// Nearby rivers to use as temp backup (in order of preference)
const NEARBY_RIVERS = {
  'Jefferson River': ['Upper Madison River', 'Missouri River', 'Ruby River'],
  'Beaverhead River': ['Ruby River', 'Big Hole River', 'Jefferson River'],
  'Spring Creeks': ['Yellowstone River', 'Stillwater River'],
  'Stillwater River': ['Yellowstone River', 'Boulder River'],
  'Boulder River': ['Yellowstone River', 'Stillwater River'],
  'Little Blackfoot River': ['Blackfoot River', 'Clark Fork River'],
  'Smith River': ['Missouri River', 'Big Hole River'],
  'Judith River': ['Missouri River'],
  'Musselshell River': ['Missouri River'],
  'Belt Creek': ['Missouri River']
};

// Seasonal water temperature estimates by river type (in Fahrenheit)
// Based on Montana river patterns: freestone vs spring creek vs tailwater
const SEASONAL_TEMPS = {
  // Standard freestone rivers
  'freestone': {
    'Jan': 34, 'Feb': 35, 'Mar': 38, 'Apr': 45, 'May': 52, 'Jun': 58,
    'Jul': 65, 'Aug': 64, 'Sep': 58, 'Oct': 50, 'Nov': 42, 'Dec': 36
  },
  // Spring creeks (more stable temps)
  'spring_creek': {
    'Jan': 42, 'Feb': 43, 'Mar': 45, 'Apr': 48, 'Jun': 55, 'Jul': 58,
    'Aug': 57, 'Sep': 55, 'Oct': 50, 'Nov': 46, 'Dec': 43, 'May': 52
  },
  // Tailwaters (dam-controlled, cold)
  'tailwater': {
    'Jan': 38, 'Feb': 39, 'Mar': 40, 'Apr': 42, 'May': 48, 'Jun': 52,
    'Jul': 55, 'Aug': 56, 'Sep': 54, 'Oct': 50, 'Nov': 44, 'Dec': 40
  },
  // High mountain streams (colder)
  'mountain': {
    'Jan': 32, 'Feb': 33, 'Mar': 35, 'Apr': 40, 'May': 48, 'Jun': 55,
    'Jul': 60, 'Aug': 59, 'Sep': 52, 'Oct': 45, 'Nov': 38, 'Dec': 33
  }
};

// River type classifications
const RIVER_TYPES = {
  'Missouri River': 'tailwater',
  'Bighorn River': 'tailwater',
  'Beaverhead River': 'tailwater',
  'Lower Madison River': 'tailwater',
  'Ruby River': 'tailwater',
  'Spring Creeks': 'spring_creek',
  'Gallatin River': 'freestone',
  'Upper Madison River': 'freestone',
  'Yellowstone River': 'freestone',
  'Big Hole River': 'freestone',
  'Rock Creek': 'freestone',
  'Bitterroot River': 'freestone',
  'Blackfoot River': 'freestone',
  'Clark Fork River': 'freestone',
  'Flathead River': 'freestone',
  'Jefferson River': 'freestone',

  'Stillwater River': 'freestone',
  'Boulder River': 'freestone',
  'Swan River': 'freestone',
  // YNP Rivers
  'Firehole River': 'freestone',
  'Soda Butte Creek': 'mountain',
  'Lamar River': 'freestone',
  'Gardner River': 'freestone',
  'Slough Creek': 'freestone',
  'Gibbon River': 'freestone'
};

function getSeasonalTemp(riverName) {
  const month = new Date().toLocaleString('en-US', { month: 'short' });
  const riverType = RIVER_TYPES[riverName] || 'freestone';
  const temps = SEASONAL_TEMPS[riverType];
  return temps ? temps[month] : null;
}

async function getUSGSData(riverName) {
  const site = USGS_SITES[riverName];
  
  // Try primary USGS site
  if (site) {
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

      const isSeasonal = SEASONAL_GAUGES.includes(riverName);
      
      // If we have real temp, use it
      if (temp) {
        return {
          river: riverName,
          flow: flow ? `${flow} CFS` : 'Seasonal',
          temp: `${temp}°F`,
          tempSource: 'USGS Live',
          siteId: site.id,
          location: site.location,
          url: `https://waterdata.usgs.gov/monitoring-location/${site.id}`,
          isSeasonal
        };
      }
      
      // No temp but have flow - continue to check nearby
      if (flow) {
        // Check nearby rivers for temp
        const nearbyTemp = await getNearbyRiverTemp(riverName);
        if (nearbyTemp) {
          return {
            river: riverName,
            flow: `${flow} CFS`,
            temp: nearbyTemp.temp,
            tempSource: nearbyTemp.source,
            siteId: site.id,
            location: site.location,
            url: `https://waterdata.usgs.gov/monitoring-location/${site.id}`,
            isSeasonal
          };
        }
        
        // Fall back to seasonal estimate
        const seasonalTemp = getSeasonalTemp(riverName);
        return {
          river: riverName,
          flow: `${flow} CFS`,
          temp: `${seasonalTemp}°F (est.)`,
          tempSource: 'Seasonal Estimate',
          siteId: site.id,
          location: site.location,
          url: `https://waterdata.usgs.gov/monitoring-location/${site.id}`,
          isSeasonal
        };
      }
      
      // Station exists but no flow data (iced over/offline) - still provide link
      return {
        river: riverName,
        flow: 'Seasonal',
        temp: `${getSeasonalTemp(riverName)}°F (est.)`,
        tempSource: 'Seasonal Estimate',
        siteId: site.id,
        location: site.location,
        url: `https://waterdata.usgs.gov/monitoring-location/${site.id}`,
        isSeasonal
      };
    } catch (error) {
      console.error(`USGS fetch failed for ${riverName}:`, error.message);
    }
  }
  
  // No USGS site or failed - try nearby rivers for temp
  const nearbyTemp = await getNearbyRiverTemp(riverName);
  const isSeasonal = SEASONAL_GAUGES.includes(riverName);
  const noDataLabel = isSeasonal ? 'Seasonal Gauge' : 'No USGS Station';
  
  if (nearbyTemp) {
    return {
      river: riverName,
      flow: noDataLabel,
      temp: nearbyTemp.temp,
      tempSource: nearbyTemp.source,
      location: 'Nearby Station',
      url: null,
      isSeasonal
    };
  }
  
  // Final fallback to seasonal estimate
  const seasonalTemp = getSeasonalTemp(riverName);
  if (seasonalTemp) {
    return {
      river: riverName,
      flow: noDataLabel,
      temp: `${seasonalTemp}°F (est.)`,
      tempSource: 'Seasonal Estimate',
      location: null,
      url: null,
      isSeasonal
    };
  }
  
  return null;
}

async function getNearbyRiverTemp(riverName) {
  const nearby = NEARBY_RIVERS[riverName];
  if (!nearby) return null;
  
  for (const nearbyRiver of nearby) {
    const nearbySite = USGS_SITES[nearbyRiver];
    if (!nearbySite) continue;
    
    try {
      const response = await axios.get(
        `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${nearbySite.id}&parameterCd=00010&period=P1D`,
        { timeout: 3000 }
      );
      
      const timeSeries = response.data.value.timeSeries;
      for (const series of timeSeries) {
        const values = series.values[0].value;
        if (values.length > 0) {
          const latest = values[values.length - 1];
          if (latest.value !== '-999999') {
            const temp = Math.round(parseFloat(latest.value) * 9/5 + 32);
            return {
              temp: `${temp}°F`,
              source: `${nearbyRiver} (nearby)`
            };
          }
        }
      }
    } catch (error) {
      console.error(`Failed to get temp from ${nearbyRiver}:`, error.message);
    }
  }
  
  return null;
}

// River-specific flow thresholds (CFS) for determining flow conditions
// Based on typical fishing conditions for each river
const FLOW_THRESHOLDS = {
  'Missouri River': { low: 3000, high: 8000, optimal: { min: 4000, max: 6000 } },
  'Madison River': { low: 400, high: 2500, optimal: { min: 800, max: 1500 } },
  'Upper Madison River': { low: 400, high: 2500, optimal: { min: 800, max: 1500 } },
  'Lower Madison River': { low: 800, high: 3500, optimal: { min: 1200, max: 2500 } },
  'Yellowstone River': { low: 1000, high: 5000, optimal: { min: 2000, max: 4000 } },
  'Bighorn River': { low: 1500, high: 6000, optimal: { min: 2500, max: 4500 } },
  'Gallatin River': { low: 200, high: 1500, optimal: { min: 400, max: 1000 } },
  'Bitterroot River': { low: 300, high: 2500, optimal: { min: 600, max: 1500 } },
  'Blackfoot River': { low: 200, high: 2000, optimal: { min: 400, max: 1200 } },
  'Clark Fork River': { low: 800, high: 4000, optimal: { min: 1500, max: 3000 } },
  'Rock Creek': { low: 100, high: 800, optimal: { min: 200, max: 500 } },
  'Big Hole River': { low: 200, high: 1500, optimal: { min: 400, max: 1000 } },
  'Beaverhead River': { low: 100, high: 800, optimal: { min: 200, max: 500 } },
  'Jefferson River': { low: 300, high: 2000, optimal: { min: 600, max: 1200 } },
  'Ruby River': { low: 100, high: 600, optimal: { min: 200, max: 400 } },
  'Stillwater River': { low: 200, high: 1500, optimal: { min: 400, max: 1000 } },
  'Boulder River': { low: 100, high: 800, optimal: { min: 200, max: 500 } },
  'Flathead River': { low: 500, high: 4000, optimal: { min: 1000, max: 2500 } }
};

// Default thresholds for rivers not in the list
const DEFAULT_THRESHOLDS = { low: 200, high: 3000, optimal: { min: 500, max: 1500 } };

/**
 * Calculate flow condition based on river and CFS value
 * @param {string} riverName - Name of the river
 * @param {number} cfs - Current flow in cubic feet per second
 * @returns {object} Flow condition with text, color, and description
 */
function calculateFlowCondition(riverName, cfs) {
  if (!cfs || cfs <= 0) return null;
  
  const thresholds = FLOW_THRESHOLDS[riverName] || DEFAULT_THRESHOLDS;
  
  // Determine condition
  if (cfs < thresholds.low) {
    return {
      text: 'Low',
      label: 'Low Flow',
      color: '#e74c3c',
      bgColor: '#ffebee',
      description: 'Very low flows. Fish are concentrated in deeper pools.',
      quality: 'poor'
    };
  }
  
  if (cfs > thresholds.high) {
    return {
      text: 'High',
      label: 'High Flow',
      color: '#e67e22',
      bgColor: '#fff3e0',
      description: 'High flows. Fish move to edges and slower water.',
      quality: 'poor'
    };
  }
  
  // Check if in optimal range
  if (cfs >= thresholds.optimal.min && cfs <= thresholds.optimal.max) {
    return {
      text: 'Good',
      label: 'Good Flow',
      color: '#27ae60',
      bgColor: '#e8f5e9',
      description: 'Optimal flows. Fish holding in typical spots.',
      quality: 'excellent'
    };
  }
  
  // Between low and optimal, or optimal and high
  if (cfs < thresholds.optimal.min) {
    return {
      text: 'Low',
      label: 'Below Average',
      color: '#f39c12',
      bgColor: '#fff8e1',
      description: 'Below average flows. Fish in deeper runs.',
      quality: 'fair'
    };
  }
  
  return {
    text: 'High',
    label: 'Above Average',
    color: '#f39c12',
    bgColor: '#fff8e1',
    description: 'Above average flows. Fish near banks.',
    quality: 'fair'
  };
}

module.exports = { getUSGSData, USGS_SITES, getSeasonalTemp, RIVER_TYPES, calculateFlowCondition };
