export const ACCESS_POINTS = {
  'Yellowstone River': [
    { name: 'Clarks Fork Yellowstone', lat: 45.264290, lon: -108.914950, type: 'wade', parking: true, restrooms: false },
  ],
  'Gallatin River': [
    { name: 'Gallatin Forks', lat: 45.889790, lon: -111.327810, type: 'wade', parking: true, restrooms: false },
  ],
  'Bighorn River': [
    { name: 'Bighorn', lat: 45.414600, lon: -107.786480, type: 'wade', parking: true, restrooms: false },
  ],
  'Blackfoot River': [
    { name: 'Little Blackfoot', lat: 46.568760, lon: -112.665890, type: 'wade', parking: true, restrooms: false },
  ],
  'Ruby River': [
    { name: 'Ruby Island', lat: 45.324150, lon: -112.115230, type: 'wade', parking: true, restrooms: false },
    { name: 'Ruby Dam', lat: 45.241690, lon: -112.109820, type: 'wade', parking: true, restrooms: false },
  ],
  'Swan River': [
    { name: 'Swan River', lat: 48.041850, lon: -113.978460, type: 'wade', parking: true, restrooms: false },
  ],
  'Rock Creek': [
    { name: 'Rock Creek', lat: 47.767630, lon: -106.285880, type: 'wade', parking: true, restrooms: false },
    { name: 'Red Rocks', lat: 46.941520, lon: -113.598480, type: 'wade', parking: true, restrooms: false },
    { name: 'Point of Rocks', lat: 45.254760, lon: -110.869400, type: 'wade', parking: true, restrooms: false },
    { name: 'Big Rock', lat: 45.792930, lon: -109.964460, type: 'wade', parking: true, restrooms: false },
    { name: 'Maidenrock', lat: 45.655580, lon: -112.696110, type: 'wade', parking: true, restrooms: false },
    { name: 'Castle Rock', lat: 45.473030, lon: -109.741040, type: 'wade', parking: true, restrooms: false },
  ],
  'Boulder River': [
    { name: 'Boulder Forks', lat: 45.657690, lon: -110.108720, type: 'wade', parking: true, restrooms: false },
  ],
  'Spring Creeks': [
    { name: 'Bull Springs', lat: 45.278500, lon: -109.209590, type: 'wade', parking: true, restrooms: false },
    { name: 'Sunny Brook Springs', lat: 45.308870, lon: -110.890890, type: 'wade', parking: true, restrooms: false },
    { name: 'Silver Springs Bridge', lat: 45.411820, lon: -112.205840, type: 'wade', parking: true, restrooms: false },
    { name: 'Bluewater Springs', lat: 45.331610, lon: -108.802290, type: 'wade', parking: true, restrooms: false },
  ],
};

export const getAccessPoints = (riverName) => {
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
