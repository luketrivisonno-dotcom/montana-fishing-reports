// Montana FWP Fishing Access Sites (FAS) Data
// Coordinates and information from Montana Fish, Wildlife & Parks
// https://fwp.mt.gov/fish/fishing-guide

export const ACCESS_POINTS = {
  'Madison River': [
    // Upper Madison - Between Quake Lake and Ennis Lake
    {
      id: 'fwp-raynolds-pass',
      name: 'Raynolds Pass FAS',
      lat: 44.6711,
      lon: -111.2389,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'First access below Quake Lake. Wade fishing only.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/upper-madison'
    },
    {
      id: 'fwp-three-dollar-bridge',
      name: 'Three Dollar Bridge FAS',
      lat: 44.8247,
      lon: -111.4156,
      type: 'wade',
      parking: true,
      restrooms: true,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Popular walk-in access. Toilet available.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/upper-madison'
    },
    {
      id: 'fwp-horse-butte',
      name: 'Horse Butte FAS',
      lat: 44.7833,
      lon: -111.4500,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Between $3 Bridge and Palisades.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/upper-madison'
    },
    {
      id: 'fwp-palisades',
      name: 'Palisades FAS',
      lat: 44.7361,
      lon: -111.4828,
      type: 'boat',
      parking: true,
      restrooms: false,
      boatRamp: true,
      camping: false,
      fee: false,
      notes: 'First legal boat put-in below Quake Lake.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/upper-madison'
    },
    {
      id: 'fwp-indian-creek',
      name: 'Indian Creek FAS',
      lat: 44.7200,
      lon: -111.5100,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Walk-in only access.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/upper-madison'
    },
    {
      id: 'fwp-varney-bridge',
      name: 'Varney Bridge FAS',
      lat: 44.7000,
      lon: -111.5300,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Popular wade fishing access.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/upper-madison'
    },
    {
      id: 'fwp-eight-mile',
      name: 'Eight Mile FAS',
      lat: 44.6800,
      lon: -111.5400,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Near Varney Bridge.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/upper-madison'
    },
    {
      id: 'fwp-lyons-bridge',
      name: 'Lyons Bridge FAS',
      lat: 44.6678,
      lon: -111.5456,
      type: 'both',
      parking: true,
      restrooms: true,
      boatRamp: true,
      camping: false,
      fee: false,
      notes: 'Paved boat ramp. Excellent access.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/upper-madison'
    },
    {
      id: 'fwp-ruby-creek',
      name: 'Ruby Creek FAS',
      lat: 44.6500,
      lon: -111.5500,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Walk-in access only.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/upper-madison'
    },
    {
      id: 'fwp-ennis-bridge',
      name: 'Ennis Bridge FAS',
      lat: 45.3492,
      lon: -111.5236,
      type: 'wade',
      parking: true,
      restrooms: true,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Town access. Toilet available.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/upper-madison'
    },
    // Lower Madison - Below Ennis Lake
    {
      id: 'fwp-mcallister',
      name: 'McAllister FAS',
      lat: 45.4578,
      lon: -111.5733,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Below Ennis Dam.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/lower-madison'
    },
    {
      id: 'fwp-valley-garden',
      name: 'Valley Garden FAS',
      lat: 45.5200,
      lon: -111.6000,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Walk-in access.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/lower-madison'
    },
    {
      id: 'fwp-cameron-bridge',
      name: 'Cameron Bridge FAS',
      lat: 45.2847,
      lon: -111.4753,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Near Belgrade.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/lower-madison'
    },
    {
      id: 'fwp-blacks-ford',
      name: 'Black\'s Ford FAS',
      lat: 45.6000,
      lon: -111.6500,
      type: 'both',
      parking: true,
      restrooms: false,
      boatRamp: true,
      camping: false,
      fee: false,
      notes: 'Near Three Forks. Boat access.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/lower-madison'
    },
    {
      id: 'fwp-greycliff',
      name: 'Greycliff FAS',
      lat: 45.7500,
      lon: -111.6800,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Lower river access.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/lower-madison'
    }
  ],

  'Yellowstone River': [
    {
      id: 'fwp-gardiner',
      name: 'Gardiner River Walk',
      lat: 45.0319,
      lon: -110.7056,
      type: 'wade',
      parking: true,
      restrooms: true,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Town access at Yellowstone Park north entrance.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/yellowstone'
    },
    {
      id: 'fwp-mcconnell',
      name: 'McConnell FAS',
      lat: 45.0600,
      lon: -110.7200,
      type: 'boat',
      parking: true,
      restrooms: false,
      boatRamp: true,
      camping: false,
      fee: false,
      notes: 'Sand/gravel launch.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/yellowstone'
    },
    {
      id: 'fwp-carbella',
      name: 'Carbella FAS',
      lat: 45.2000,
      lon: -110.7900,
      type: 'both',
      parking: true,
      restrooms: true,
      boatRamp: true,
      camping: false,
      fee: false,
      notes: 'End of Yankee Jim Canyon. Concrete ramp.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/yellowstone'
    },
    {
      id: 'fwp-point-of-rocks',
      name: 'Point of Rocks FAS',
      lat: 45.2200,
      lon: -110.8000,
      type: 'both',
      parking: true,
      restrooms: false,
      boatRamp: true,
      camping: false,
      fee: false,
      notes: 'Concrete ramp in Paradise Valley.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/yellowstone'
    },
    {
      id: 'fwp-sundance',
      name: 'Sundance FAS',
      lat: 45.2800,
      lon: -110.8100,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Walk-in access.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/yellowstone'
    },
    {
      id: 'fwp-spring-creek',
      name: 'Spring Creek FAS',
      lat: 45.3200,
      lon: -110.8150,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Near Chico Hot Springs.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/yellowstone'
    },
    {
      id: 'fwp-emigrant',
      name: 'Emigrant FAS',
      lat: 45.3700,
      lon: -110.8200,
      type: 'both',
      parking: true,
      restrooms: true,
      boatRamp: true,
      camping: false,
      fee: false,
      notes: 'Sand launch. Restrooms nearby.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/yellowstone'
    },
    {
      id: 'fwp-grey-owl',
      name: 'Grey Owl FAS',
      lat: 45.4000,
      lon: -110.8300,
      type: 'boat',
      parking: true,
      restrooms: false,
      boatRamp: true,
      camping: false,
      fee: false,
      notes: 'Concrete ramp.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/yellowstone'
    },
    {
      id: 'fwp-pine-creek',
      name: 'Pine Creek FAS',
      lat: 45.6500,
      lon: -110.5500,
      type: 'both',
      parking: true,
      restrooms: true,
      boatRamp: true,
      camping: false,
      fee: false,
      notes: 'End of Paradise Valley.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/yellowstone'
    },
    {
      id: 'fwp-carters-bridge',
      name: 'Carters Bridge FAS',
      lat: 45.6700,
      lon: -110.5300,
      type: 'both',
      parking: true,
      restrooms: false,
      boatRamp: true,
      camping: false,
      fee: false,
      notes: 'Cobble ramp near Livingston.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/yellowstone'
    }
  ],

  'Gallatin River': [
    {
      id: 'fwp-deer-creek',
      name: 'Deer Creek FAS',
      lat: 45.3800,
      lon: -111.2800,
      type: 'both',
      parking: true,
      restrooms: true,
      boatRamp: true,
      camping: false,
      fee: false,
      notes: 'Popular launch in Gallatin Canyon.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/gallatin'
    },
    {
      id: 'fwp-moose-creek',
      name: 'Moose Creek Flat FAS',
      lat: 45.4200,
      lon: -111.2500,
      type: 'both',
      parking: true,
      restrooms: true,
      boatRamp: true,
      camping: true,
      fee: false,
      notes: 'USFS campground with access.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/gallatin'
    },
    {
      id: 'fwp-storm-castle',
      name: 'Storm Castle FAS',
      lat: 45.4800,
      lon: -111.2200,
      type: 'both',
      parking: true,
      restrooms: false,
      boatRamp: true,
      camping: false,
      fee: false,
      notes: 'USFS access site.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/gallatin'
    },
    {
      id: 'fwp-lava-lake',
      name: 'Lava Lake Trailhead',
      lat: 45.5200,
      lon: -111.2000,
      type: 'both',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Trailhead access.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/gallatin'
    },
    {
      id: 'fwp-spanish-creek',
      name: 'Spanish Creek FAS',
      lat: 45.5500,
      lon: -111.1800,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'End of canyon section.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/gallatin'
    },
    {
      id: 'fwp-axtell-bridge',
      name: 'Axtell Bridge FAS',
      lat: 45.3200,
      lon: -111.2200,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Bridge access.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/gallatin'
    },
    {
      id: 'fwp-gallatin-gateway',
      name: 'Gallatin Gateway FAS',
      lat: 45.2602,
      lon: -111.1951,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Highway access.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/gallatin'
    }
  ],

  'Missouri River': [
    {
      id: 'fwp-holter-dam',
      name: 'Holter Dam FAS',
      lat: 47.0527,
      lon: -111.8316,
      type: 'both',
      parking: true,
      restrooms: true,
      boatRamp: true,
      camping: false,
      fee: false,
      notes: 'Below Holter Dam. Excellent put-in.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/missouri'
    },
    {
      id: 'fwp-wolf-creek-bridge',
      name: 'Wolf Creek Bridge FAS',
      lat: 47.1000,
      lon: -111.9000,
      type: 'both',
      parking: true,
      restrooms: true,
      boatRamp: true,
      camping: false,
      fee: false,
      notes: 'Very popular access point.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/missouri'
    },
    {
      id: 'fwp-craig',
      name: 'Craig FAS',
      lat: 47.0700,
      lon: -111.8500,
      type: 'both',
      parking: true,
      restrooms: true,
      boatRamp: true,
      camping: false,
      fee: false,
      notes: 'Town access. Restrooms nearby.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/missouri'
    },
    {
      id: 'fwp-stickney-creek',
      name: 'Stickney Creek FAS',
      lat: 47.1500,
      lon: -112.0000,
      type: 'both',
      parking: true,
      restrooms: true,
      boatRamp: true,
      camping: true,
      fee: false,
      notes: 'Campground with access.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/missouri'
    },
    {
      id: 'fwp-prewett-creek',
      name: 'Prewett Creek FAS',
      lat: 47.3000,
      lon: -111.7000,
      type: 'both',
      parking: true,
      restrooms: true,
      boatRamp: true,
      camping: false,
      fee: false,
      notes: 'North of Craig.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/missouri'
    },
    {
      id: 'fwp-cascade',
      name: 'Cascade FAS',
      lat: 47.2700,
      lon: -111.7000,
      type: 'boat',
      parking: true,
      restrooms: true,
      boatRamp: true,
      camping: false,
      fee: false,
      notes: 'End of trout section.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/missouri'
    }
  ],

  'Bighorn River': [
    {
      id: 'fwp-afterbay',
      name: 'Afterbay Dam Access',
      lat: 45.4200,
      lon: -107.8800,
      type: 'both',
      parking: true,
      restrooms: true,
      boatRamp: true,
      camping: false,
      fee: false,
      notes: 'Primary put-in below Yellowtail Dam.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/bighorn'
    },
    {
      id: 'fwp-three-mile',
      name: 'Three Mile Access',
      lat: 45.4500,
      lon: -107.8700,
      type: 'both',
      parking: true,
      restrooms: false,
      boatRamp: true,
      camping: false,
      fee: false,
      notes: 'Wade paradise - walk and wade area.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/bighorn'
    },
    {
      id: 'fwp-bighorn',
      name: 'Bighorn FAS',
      lat: 45.4605,
      lon: -107.8745,
      type: 'both',
      parking: true,
      restrooms: true,
      boatRamp: true,
      camping: false,
      fee: false,
      notes: 'End of upper 13 miles. Restrooms.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/bighorn'
    },
    {
      id: 'fwp-mallards-landing',
      name: 'Mallards Landing',
      lat: 45.3500,
      lon: -107.9200,
      type: 'boat',
      parking: true,
      restrooms: false,
      boatRamp: true,
      camping: false,
      fee: false,
      notes: 'Lower section access.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/bighorn'
    }
  ],

  'Beaverhead River': [
    {
      id: 'fwp-clark-canyon',
      name: 'Clark Canyon Dam',
      lat: 44.9500,
      lon: -112.8500,
      type: 'boat',
      parking: true,
      restrooms: true,
      boatRamp: true,
      camping: true,
      fee: false,
      notes: 'Reservoir boat launch.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/beaverhead'
    },
    {
      id: 'fwp-high-bridge',
      name: 'High Bridge FAS',
      lat: 45.2500,
      lon: -112.7000,
      type: 'wade',
      parking: false,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Limited parking. Wade access only.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/beaverhead'
    },
    {
      id: 'fwp-barretts',
      name: 'Barretts Park FAS',
      lat: 45.1800,
      lon: -112.6000,
      type: 'wade',
      parking: true,
      restrooms: true,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Very popular access. Restrooms.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/beaverhead'
    },
    {
      id: 'fwp-dillon',
      name: 'Dillon FAS',
      lat: 45.2181,
      lon: -112.6550,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Town access.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/beaverhead'
    }
  ],

  'Big Hole River': [
    {
      id: 'fwp-wisdom',
      name: 'Wisdom FAS',
      lat: 45.6200,
      lon: -113.4500,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Upper river access.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/bighole'
    },
    {
      id: 'fwp-jackson',
      name: 'Jackson FAS',
      lat: 45.3500,
      lon: -113.3000,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Mid-river access.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/bighole'
    },
    {
      id: 'fwp-brownes-bridge',
      name: 'Brownes Bridge FAS',
      lat: 45.2200,
      lon: -113.3500,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Popular access.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/bighole'
    },
    {
      id: 'fwp-melrose',
      name: 'Melrose FAS',
      lat: 45.1847,
      lon: -113.4081,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Lower river access.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/bighole'
    }
  ],

  'Bitterroot River': [
    {
      id: 'fwp-florence',
      name: 'Florence Bridge FAS',
      lat: 46.6300,
      lon: -114.0800,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'North valley access.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/bitterroot'
    },
    {
      id: 'fwp-stevensville',
      name: 'Stevensville FAS',
      lat: 46.5000,
      lon: -114.0900,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Bridge access.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/bitterroot'
    },
    {
      id: 'fwp-hamilton',
      name: 'Hamilton FAS',
      lat: 46.2500,
      lon: -114.1500,
      type: 'boat',
      parking: true,
      restrooms: true,
      boatRamp: true,
      camping: false,
      fee: false,
      notes: 'Boat launch. Restrooms.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/bitterroot'
    },
    {
      id: 'fwp-darby',
      name: 'Darby FAS',
      lat: 46.0200,
      lon: -114.1800,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'South end access.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/bitterroot'
    }
  ],

  'Blackfoot River': [
    {
      id: 'fwp-russell-gates',
      name: 'Russell Gates FAS',
      lat: 46.9000,
      lon: -112.4000,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Scenic canyon section.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/blackfoot'
    },
    {
      id: 'fwp-bonner',
      name: 'Bonner FAS',
      lat: 46.8771,
      lon: -113.9140,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Near Missoula.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/blackfoot'
    }
  ],

  'Rock Creek': [
    {
      id: 'fwp-rock-creek-clinton',
      name: 'Rock Creek FAS',
      lat: 46.5100,
      lon: -113.8000,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Primary access off I-90.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/rock-creek'
    },
    {
      id: 'fwp-dalles',
      name: 'Dalles FAS',
      lat: 46.6000,
      lon: -113.7000,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Upper creek access.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/rock-creek'
    }
  ],

  'Clark Fork River': [
    {
      id: 'fwp-alberton-gorge',
      name: 'Alberton Gorge Access',
      lat: 47.0025,
      lon: -114.4784,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Scenic gorge section.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/clark-fork'
    },
    {
      id: 'fwp-missoula',
      name: 'Missoula Area Access',
      lat: 46.8721,
      lon: -113.9940,
      type: 'wade',
      parking: true,
      restrooms: true,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Multiple access points in town.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/clark-fork'
    }
  ],

  'Jefferson River': [
    {
      id: 'fwp-parrot-castle',
      name: 'Parrot Castle FAS',
      lat: 45.9200,
      lon: -111.4800,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Walk-in access.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/jefferson'
    },
    {
      id: 'fwp-twin-bridges',
      name: 'Twin Bridges FAS',
      lat: 45.8933,
      lon: -111.5053,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Town access.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/jefferson'
    }
  ],

  'Ruby River': [
    {
      id: 'fwp-ruby-dam',
      name: 'Ruby Dam FAS',
      lat: 45.3500,
      lon: -112.2000,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Below reservoir.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/ruby'
    },
    {
      id: 'fwp-alder',
      name: 'Alder FAS',
      lat: 45.3295,
      lon: -112.1076,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Town access.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/ruby'
    }
  ],

  'Stillwater River': [
    {
      id: 'fwp-absarokee',
      name: 'Absarokee FAS',
      lat: 45.5291,
      lon: -109.4229,
      type: 'wade',
      parking: true,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Town access.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/stillwater'
    }
  ],

  'Boulder River': [
    {
      id: 'fwp-natural-bridge',
      name: 'Natural Bridge FAS',
      lat: 45.9000,
      lon: -110.2000,
      type: 'wade',
      parking: false,
      restrooms: false,
      boatRamp: false,
      camping: false,
      fee: false,
      notes: 'Limited parking. Geologic feature.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/boulder'
    },
    {
      id: 'fwp-west-boulder',
      name: 'West Boulder Campground',
      lat: 45.8000,
      lon: -110.1000,
      type: 'wade',
      parking: true,
      restrooms: true,
      boatRamp: false,
      camping: true,
      fee: false,
      notes: 'USFS campground with river access.',
      fwpUrl: 'https://fwp.mt.gov/fish/fishing-guide/boulder'
    }
  ]
};

// Helper functions
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

export const getAccessPointsWithRestrooms = (riverName) => {
  const points = ACCESS_POINTS[riverName] || [];
  return points.filter(p => p.restrooms);
};

export const getTotalAccessPoints = () => {
  return Object.values(ACCESS_POINTS).reduce((total, points) => total + points.length, 0);
};

export const getAllRiversWithAccess = () => {
  return Object.keys(ACCESS_POINTS);
};
