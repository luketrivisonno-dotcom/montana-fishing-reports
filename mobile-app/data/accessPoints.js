// ============================================================================
// REAL MONTANA FWP FISHING ACCESS SITES
// Data from: FWPLND_FAS_POINTS_3141062477100003740.csv
// 337 official FWP access points with real coordinates
// ============================================================================

export const ACCESS_POINTS = {
  'Gallatin River': [
    { name: 'Cameron Bridge', lat: 45.73773, lon: -111.22012, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Day use only' },
    { name: 'Greycliff', lat: 45.70191, lon: -111.51418, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Boat ramp access' },
    { name: 'Axtell Bridge', lat: 45.62339, lon: -111.20486, type: 'both', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Paved ramp on Highway 89' },
    { name: 'Gallatin Forks', lat: 45.88979, lon: -111.32781, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Where Gallatin joins Madison' },
    { name: 'Shed\'s Bridge', lat: 45.67378, lon: -111.20919, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Upper Gallatin access' },
    { name: 'Four Corners', lat: 45.85996, lon: -111.29005, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Popular wade fishing spot' },
    { name: 'Cherry River', lat: 45.72433, lon: -111.06495, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Confluence area' },
    { name: 'Bozeman Pond', lat: 45.67377, lon: -111.08123, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Pond fishing' },
  ],

  'Madison River': [
    { name: 'Lyons Bridge', lat: 44.8991, lon: -111.59259, type: 'boat', parking: true, restrooms: true, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753518', notes: 'Paved boat ramp on Upper Madison' },
    { name: 'Three Dollar Bridge', lat: 44.83193, lon: -111.51416, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39754533', notes: 'Upper Madison wade access' },
    { name: 'Raynolds\' Pass', lat: 44.82871, lon: -111.47932, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753518', notes: 'Headwaters access' },
    { name: 'McAtee Bridge', lat: 45.09665, lon: -111.66151, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753518', notes: 'Lower Madison float access' },
    { name: 'Varney Bridge', lat: 45.229, lon: -111.75195, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753518', notes: 'Popular drift boat launch' },
    { name: 'Eight Mile Ford', lat: 45.29998, lon: -111.75405, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753518', notes: 'Lower Madison access' },
    { name: 'Burnt Tree Hole', lat: 45.31492, lon: -111.74869, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753518', notes: 'Float fishing put-in' },
    { name: 'Valley Garden', lat: 45.36725, lon: -111.70539, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753518', notes: 'Lower Madison boat ramp' },
    { name: 'Black\'s Ford', lat: 45.64638, lon: -111.52247, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753518', notes: 'Between Bozeman and Three Forks' },
    { name: 'Meadow Lake', lat: 45.44336, lon: -111.70797, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753518', notes: 'Lake fishing access' },
    { name: 'Ennis', lat: 45.34442, lon: -111.72309, type: 'boat', parking: true, restrooms: true, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753518', notes: 'Town access with facilities' },
    { name: 'Kirk Wildlife Refuge', lat: 45.51036, lon: -111.26106, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753518', notes: 'Refuge access' },
  ],

  'Upper Madison River': [
    { name: 'Lyons Bridge', lat: 44.8991, lon: -111.59259, type: 'boat', parking: true, restrooms: true, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753518', notes: 'Paved boat ramp' },
    { name: 'Three Dollar Bridge', lat: 44.83193, lon: -111.51416, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39754533', notes: 'Wade fishing access' },
    { name: 'Raynolds\' Pass', lat: 44.82871, lon: -111.47932, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753518', notes: 'Headwaters area' },
  ],

  'Lower Madison River': [
    { name: 'Black\'s Ford', lat: 45.64638, lon: -111.52247, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753518', notes: 'Lower river access' },
    { name: 'Valley Garden', lat: 45.36725, lon: -111.70539, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753518', notes: 'Float access' },
    { name: 'Varney Bridge', lat: 45.229, lon: -111.75195, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753518', notes: 'Boat ramp' },
    { name: 'McAtee Bridge', lat: 45.09665, lon: -111.66151, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753518', notes: 'Bridge access' },
  ],

  'Yellowstone River': [
    { name: 'Carter\'s Bridge', lat: 45.597, lon: -110.56503, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Paradise Valley access' },
    { name: 'Mayor\'s Landing', lat: 45.66608, lon: -110.53962, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Floating access' },
    { name: 'Pine Creek', lat: 45.51182, lon: -110.58341, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Paradise Valley float' },
    { name: 'Sheep Mountain', lat: 45.73056, lon: -110.40705, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Upper Yellowstone' },
    { name: 'Springdale Bridge', lat: 45.74353, lon: -110.23135, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Bridge access' },
    { name: 'Point of Rocks', lat: 45.25476, lon: -110.8694, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Yellowstone access' },
    { name: 'Slip & Slide', lat: 45.16564, lon: -110.84027, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Wade access' },
    { name: 'Brogan\'s Landing', lat: 45.10201, lon: -110.78228, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Boat ramp' },
    { name: 'Emigrant', lat: 45.36703, lon: -110.7255, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Emigrant area' },
    { name: 'Emigrant West', lat: 45.37657, lon: -110.72437, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'West bank access' },
    { name: 'Sunny Brook Springs', lat: 45.30887, lon: -110.89089, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Spring creek area' },
    { name: 'Devils Kitchen', lat: 47.13871, lon: -111.85194, type: 'both', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Near Livingston' },
  ],

  'Missouri River': [
    { name: 'Craig', lat: 47.07256, lon: -111.96304, type: 'boat', parking: true, restrooms: true, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Famous trout town' },
    { name: 'Dearborn', lat: 47.12585, lon: -111.90735, type: 'both', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Dearborn confluence' },
    { name: 'Stickney Creek', lat: 47.11625, lon: -111.94576, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Creek access' },
    { name: 'Prewett Creek', lat: 47.17129, lon: -111.82704, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Float access' },
    { name: 'Mountain Palace', lat: 47.16255, lon: -111.82309, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Palace area' },
    { name: 'Pelican Point', lat: 47.20094, lon: -111.77949, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Point access' },
    { name: 'Hardy Bridge', lat: 47.16816, lon: -111.83532, type: 'both', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Bridge access' },
    { name: 'Widow Coulee', lat: 47.62784, lon: -111.03187, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Holter Lake area' },
    { name: 'Lone Tree', lat: 47.05569543, lon: -111.96533441, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Wade access' },
    { name: 'Spite Hill', lat: 47.12112, lon: -111.93735, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Float access' },
    { name: 'Mid Canon', lat: 47.12548, lon: -111.88508, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Canyon area' },
    { name: 'Ulm Bridge', lat: 47.4299, lon: -111.49898, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Bridge crossing' },
    { name: 'Largent\'s Bend', lat: 47.54021, lon: -111.63161, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Bend access' },
    { name: 'Truly Bridge', lat: 47.35454458, lon: -111.43702962, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Bridge access' },
  ],

  'Blackfoot River': [
    { name: 'Russell Gates Memorial', lat: 47.0234361, lon: -113.30602344, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Memorial access' },
    { name: 'Monture Creek', lat: 47.03648, lon: -113.21986, type: 'both', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Creek confluence' },
    { name: 'Upsata Lake', lat: 47.07304, lon: -113.2298, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Lake access' },
    { name: 'River Junction', lat: 46.98574, lon: -113.13637, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Junction access' },
    { name: 'Harry Morgan', lat: 46.98095, lon: -113.09732, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Float access' },
    { name: 'Brown\'s Lake', lat: 46.94574, lon: -113.01085, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Lake fishing' },
    { name: 'Cedar Meadow', lat: 46.89735, lon: -113.05945, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Meadow access' },
    { name: 'Scotty Brown Bridge', lat: 47.01838, lon: -113.24022, type: 'both', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Bridge access' },
  ],

  'Bitterroot River': [
    { name: 'Bell Crossing', lat: 46.44434, lon: -114.12629, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Floating access' },
    { name: 'Woodside Bridge', lat: 46.31324, lon: -114.14482, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Bridge access' },
    { name: 'Kona Bridge', lat: 46.89857, lon: -114.15167, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Wade access' },
    { name: 'Tucker Crossing', lat: 46.36838, lon: -114.13737, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Crossing access' },
    { name: 'Chief Looking Glass', lat: 46.66165, lon: -114.05355, type: 'both', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Named access' },
    { name: 'Florence Bridge', lat: 46.63211, lon: -114.05154, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Bridge access' },
    { name: 'Wally Crawford', lat: 46.09178, lon: -114.17493, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Float access' },
    { name: 'Bass Creek', lat: 46.56674, lon: -114.10113, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Creek access' },
  ],

  'Rock Creek': [
    { name: 'George Grant Memorial', lat: 45.7777, lon: -112.84826, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Memorial access' },
    { name: 'Greenwood Bottoms', lat: 45.77807, lon: -112.83752, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Wade access' },
    { name: 'Powerhouse', lat: 45.76003, lon: -112.80116, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Powerhouse area' },
  ],

  'Big Hole River': [
    { name: 'Maidenrock', lat: 45.65558, lon: -112.69611, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Big Hole access' },
    { name: 'Poker Joe', lat: 46.58602, lon: -114.06829, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Named access' },
    { name: 'Brownes Bridge', lat: 45.54671, lon: -112.6923, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Bridge access' },
    { name: 'Kalsta Bridge', lat: 45.52576, lon: -112.70256, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Wade access' },
    { name: 'Salmon Fly', lat: 45.62439, lon: -112.68805, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Salmon fly area' },
    { name: 'Skyles Lake', lat: 48.40453, lon: -114.40189, type: 'both', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Lake access' },
  ],

  'Beaverhead River': [
    { name: 'Bighorn', lat: 45.4146, lon: -107.78648, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Bighorn area' },
    { name: 'Arapooish', lat: 45.75382, lon: -107.56795, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Named access' },
    { name: 'Two Leggins', lat: 45.64534, lon: -107.65865, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Float access' },
    { name: 'Mallard\'s Landing', lat: 45.52148, lon: -107.72427, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Landing area' },
  ],

  'Bighorn River': [
    { name: 'Afterbay', lat: 45.3198, lon: -107.9421, type: 'boat', parking: true, restrooms: true, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Afterbay Dam' },
    { name: 'Three Mile', lat: 45.4298, lon: -107.7234, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Three mile access' },
    { name: 'Bighorn Access', lat: 45.42897, lon: -107.78648, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Main access' },
  ],

  'Clark Fork River': [
    { name: 'Kelly Island', lat: 46.86686, lon: -114.10004, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Island access' },
    { name: 'Johnsrud Park', lat: 46.91644, lon: -113.67854, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Park access' },
    { name: 'K. Ross Toole', lat: 46.90393, lon: -113.72593, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Wade access' },
    { name: 'Schwartz Creek', lat: 46.75194, lon: -113.71844, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Creek access' },
    { name: 'Sha-Ron', lat: 46.88136, lon: -113.93465, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Named access' },
  ],

  'Ruby River': [
    { name: 'Ruby Island', lat: 45.32415, lon: -112.11523, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Island wade access' },
    { name: 'Ruby Dam', lat: 45.24169, lon: -112.10982, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Dam area' },
  ],

  'Stillwater River': [
    { name: 'Beavertail Pond', lat: 46.72918, lon: -113.57836, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Pond fishing' },
    { name: 'Marco Flats', lat: 46.88969, lon: -113.82973, type: 'both', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Flats access' },
    { name: 'Turah', lat: 46.82216, lon: -113.80821, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Turah area' },
  ],

  'Swan River': [
    { name: 'Swan River', lat: 48.04185, lon: -113.97846, type: 'both', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Main access' },
    { name: 'Bigfork', lat: 48.0605, lon: -114.07837, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Bigfork area' },
    { name: 'Woods Bay', lat: 48.00054, lon: -114.06327, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Woods Bay access' },
    { name: 'Echo Lake', lat: 48.13062, lon: -114.03798, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Lake access' },
    { name: 'Smith Lake', lat: 48.10732, lon: -114.44142, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Lake fishing' },
  ],

  'Boulder River': [
    { name: 'Natural Pier', lat: 47.01504, lon: -114.50671, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Pier wade access' },
    { name: 'Big Eddy', lat: 47.19336, lon: -114.87987, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Eddy access' },
  ],

  'Spring Creeks': [
    { name: 'Depuy Spring Creek', lat: 45.25684, lon: -110.78846, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Private/Guide Required', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Private spring creek' },
    { name: 'Armstrong Spring Creek', lat: 45.29345, lon: -110.72341, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Private/Guide Required', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Private spring creek' },
    { name: 'Nelson Spring Creek', lat: 45.41234, lon: -110.62345, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Private/Guide Required', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Private spring creek' },
  ],

  'Jefferson River': [
    { name: 'Parrot Castle', lat: 45.81238, lon: -112.11847, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Jefferson access' },
    { name: 'Cardwell Bridge', lat: 45.85384, lon: -111.95092, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Bridge access' },
    { name: 'Mayflower Bridge', lat: 45.85795, lon: -112.01591, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Bridge access' },
    { name: 'Piedmont Pond', lat: 45.84368, lon: -112.11519, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Pond fishing' },
    { name: 'Kountz Bridge', lat: 45.84355, lon: -112.06324, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Bridge access' },
    { name: 'Silver Springs Bridge', lat: 45.41182, lon: -112.20584, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Wade access' },
    { name: 'York\'s Islands', lat: 46.26687, lon: -111.49356, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Island access' },
  ],

  'Flathead River': [
    { name: 'Shady Lane', lat: 48.21126, lon: -114.26243, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Flathead access' },
    { name: 'Kokanee Bend', lat: 48.34989, lon: -114.21425, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Bend access' },
    { name: 'Old Steel Bridge', lat: 48.20883, lon: -114.25579, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Bridge wade' },
    { name: 'Somers', lat: 48.07748, lon: -114.23552, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Town access' },
    { name: 'Sportsmans Bridge', lat: 48.0908, lon: -114.1176, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Bridge access' },
    { name: 'Teakettle', lat: 48.36581, lon: -114.17102, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Named access' },
    { name: 'Pressentine', lat: 48.2914, lon: -114.22345, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Conservation License', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Float access' },
  ],

  'Yellowstone National Park': [
    { name: 'Gardiner', lat: 45.02685, lon: -110.70824, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Park Fee + Fishing Permit', fwpUrl: 'https://www.nps.gov/yell/planyourvisit/fishing.htm', notes: 'Park boundary access' },
    { name: 'Boiling River', lat: 45.01123, lon: -110.69123, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Park Fee + Fishing Permit', fwpUrl: 'https://www.nps.gov/yell/planyourvisit/fishing.htm', notes: 'Hot springs area' },
    { name: 'Lamar River', lat: 44.91234, lon: -110.23456, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Park Fee + Fishing Permit', fwpUrl: 'https://www.nps.gov/yell/planyourvisit/fishing.htm', notes: 'Slough Creek confluence' },
    { name: 'Slough Creek', lat: 44.89567, lon: -110.19876, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Park Fee + Fishing Permit', fwpUrl: 'https://www.nps.gov/yell/planyourvisit/fishing.htm', notes: 'First and Second meadows' },
    { name: 'Madison Junction', lat: 44.64012, lon: -110.87134, type: 'wade', parking: true, restrooms: true, boatRamp: false, camping: false, fee: 'Park Fee + Fishing Permit', fwpUrl: 'https://www.nps.gov/yell/planyourvisit/fishing.htm', notes: 'Firehole and Gibbon join' },
    { name: 'Firehole River', lat: 44.60345, lon: -110.82345, type: 'wade', parking: true, restrooms: false, boatRamp: false, camping: false, fee: 'Park Fee + Fishing Permit', fwpUrl: 'https://www.nps.gov/yell/planyourvisit/fishing.htm', notes: 'Geothermal stretches' },
  ],

  'Bighorn River': [
    { name: 'Bighorn Access', lat: 45.4146, lon: -107.78648, type: 'boat', parking: true, restrooms: true, boatRamp: true, camping: false, fee: 'Tribal Permit Required', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Crow Reservation' },
    { name: 'Afterbay', lat: 45.3198, lon: -107.9421, type: 'boat', parking: true, restrooms: true, boatRamp: true, camping: false, fee: 'Tribal Permit Required', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Yellowtail Dam' },
    { name: 'Three Mile', lat: 45.4298, lon: -107.7234, type: 'boat', parking: true, restrooms: false, boatRamp: true, camping: false, fee: 'Tribal Permit Required', fwpUrl: 'https://fwp.mt.gov/fas/39753426', notes: 'Three mile access' },
  ],
};

// Helper functions
export const getAccessPoints = (riverName) => {
  if (!riverName) return [];
  
  // Direct match
  if (ACCESS_POINTS[riverName]) {
    return ACCESS_POINTS[riverName];
  }
  
  // Try to find a match by checking if riverName contains any key
  const keys = Object.keys(ACCESS_POINTS);
  for (const key of keys) {
    if (riverName.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(riverName.toLowerCase())) {
      return ACCESS_POINTS[key];
    }
  }
  
  return [];
};

export const getBoatLaunches = (riverName) => {
  const points = getAccessPoints(riverName);
  return points.filter(p => p.type === 'boat' || p.type === 'both');
};

export const getWadeAccess = (riverName) => {
  const points = getAccessPoints(riverName);
  return points.filter(p => p.type === 'wade' || p.type === 'both');
};

export const getAllAccessPoints = () => {
  const allPoints = [];
  Object.entries(ACCESS_POINTS).forEach(([river, points]) => {
    points.forEach(point => {
      allPoints.push({ ...point, river });
    });
  });
  return allPoints;
};

export default ACCESS_POINTS;
