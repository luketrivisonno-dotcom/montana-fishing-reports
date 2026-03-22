/**
 * River Information Data for Montana Fishing Reports Mobile App
 * Mirror of server-side data for offline access
 */

export const RIVER_INFO = {
  'Upper Madison River': {
    description: 'The Upper Madison is one of the most famous trout streams in the world. Starting below Quake Lake, this tailwater flows through the Madison Valley with stunning mountain backdrops. The river is characterized by riffle-run structure with abundant aquatic insect life.',
    shortDescription: 'World-famous tailwater with consistent dry fly fishing',
    difficulty: 'Intermediate',
    difficultyExplanation: 'Easy wading but technical fishing. Trout see many flies and can be selective.',
    fishPerMile: 2000,
    fishCountSource: 'FWP 2023 survey',
    averageFishSize: '14-16 inches',
    bestSeasons: ['May-June', 'September-October'],
    peakHatches: ['Salmonflies (June)', 'PMDs (July)', 'Caddis (August)', 'Blue Winged Olives (Sept-Oct)'],
    species: ['Rainbow Trout (55%)', 'Brown Trout (35%)', 'Cutthroat Trout (5%)', 'Whitefish (5%)'],
    techniques: ['Dry fly during hatches', 'Nymphing in deeper runs', 'Streamers in low light'],
    wading: 'Easy to Moderate',
    wadingNotes: 'Mostly gravel bottom with some larger cobble. Wading boots with felt or rubber soles recommended.',
    accessPoints: ['Three Dollar Bridge', 'Valley Garden', 'Palisades Campground', 'Quake Lake Outlet', 'Raynolds Bridge', 'Varney Bridge'],
    accessTips: 'Numerous FAS sites along Hwy 287. Three Dollar Bridge is the most popular access.',
    regulations: 'Catch and release only from Quake Lake to MacAfee Bridge. Flies and lures only below Quake Lake.',
    limits: 'Catch and release below Quake Lake. Above: 5 trout/day, only 1 over 18"',
    flows: {
      optimal: '800-1500 CFS',
      tooLow: '<600 CFS - fish concentrated in deeper water',
      tooHigh: '>2000 CFS - dangerous wading, fish near banks'
    },
    localTips: [
      'Fish early morning for best dry fly action during summer',
      'The "Island Section" below Three Dollar Bridge holds the biggest fish',
      'September BWO hatches can be spectacular',
      'Bring rain gear - afternoon thunderstorms are common'
    ],
    nearbyServices: ['The Trout Shop (Three Forks)', 'Madison River Fishing Company (Ennis)', 'Slide Inn (Cameron)'],
    hazards: ['Sudden weather changes', 'Strong afternoon winds', 'Slippery rocks when wet'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: `• Beartooth Outfitters: 406-682-7525
• Dorothy's Shuttle Service: 406-682-4886
• Driftaway Shuttles (Rachel): 406-640-0433
• Meadowlark Shuttles (Connie): 406-682-4188 / 406-581-4626`
  },

  'Lower Madison River': {
    description: 'Below Ennis Dam, the Lower Madison becomes a warmer, slower-moving river that winds through agricultural land and cottonwood bottoms. Less technical than the upper section but can produce excellent fishing, especially in spring and fall.',
    shortDescription: 'Warmer water fishery with less pressured fish',
    difficulty: 'Beginner to Intermediate',
    difficultyExplanation: 'Easier fishing than the Upper but requires reading slower water.',
    fishPerMile: 1200,
    fishCountSource: 'FWP 2022 survey',
    averageFishSize: '12-15 inches',
    bestSeasons: ['March-May', 'October-November'],
    peakHatches: ['Skwalas (March)', 'Blue Winged Olives (April-May)', 'Caddis (May)'],
    species: ['Rainbow Trout (45%)', 'Brown Trout (40%)', 'Cutthroat Trout (10%)', 'Whitefish (5%)'],
    techniques: ['Streamer fishing in spring', 'Nymphing deeper pools', 'Hopper-dropper in late summer'],
    wading: 'Easy',
    wadingNotes: 'Sandy and gravel bottom makes for easy wading. Few large rocks.',
    accessPoints: ['Black\'s Ford FAS', 'Greycliff FAS', 'Missouri Headwaters State Park', 'Town of Ennis Access'],
    accessTips: 'Black\'s Ford is the most popular and has good parking. Can get crowded on weekends.',
    regulations: 'Standard Montana regulations. Bait allowed in most sections.',
    limits: 'Standard limits: 5 trout/day, 10 in possession',
    flows: {
      optimal: '1000-2000 CFS',
      tooLow: '<800 CFS - water can get warm in summer',
      tooHigh: '>3000 CFS - limited wading access'
    },
    localTips: [
      'Spring streamer fishing can produce trophy browns',
      'Fish the undercut banks during hopper season',
      'Early morning is best during hot summer months',
      'Less crowded than the Upper Madison'
    ],
    nearbyServices: ['Madison River Fishing Company (Ennis)', 'The River\'s Edge (Bozeman)'],
    hazards: ['Rattlesnakes in summer along banks', 'Poison ivy in riparian areas', 'Quick sand in some areas'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: `• Bob's Shuttle Service: 406-595-0587
• Floaters Shuttle Service: 406-586-2895
• Rivergal Shuttles (Bonnie): 406-685-3500
• The Space Shuttle: 406-518-1799`
  },

  'Missouri River': {
    description: 'The Missouri below Holter Dam is a legendary tailwater known for its clear water, challenging trout, and incredible dry fly fishing. The river flows through the Missouri River Breaks with spectacular scenery.',
    shortDescription: 'Technical tailwater with world-class dry fly fishing',
    difficulty: 'Advanced',
    difficultyExplanation: 'Extremely clear water makes trout spooky. Long, light leaders required.',
    fishPerMile: 5500,
    fishCountSource: 'FWP 2023 survey - highest trout density in Montana',
    averageFishSize: '16-18 inches',
    bestSeasons: ['April-May', 'September-November'],
    peakHatches: ['Blue Winged Olives (April-May, Sept-Oct)', 'PMDs (June-July)', 'Tricos (August)', 'Caddis (June)'],
    species: ['Rainbow Trout (65%)', 'Brown Trout (30%)', 'Cutthroat Trout (5%)'],
    techniques: ['Long leader dry fly', 'Indicator nymphing', 'Swinging soft hackles'],
    wading: 'Moderate to Difficult',
    wadingNotes: 'Slick algae-covered rocks are treacherous. Felt soles highly recommended.',
    accessPoints: ['Holter Dam', 'Craig FAS', 'Stickney Creek FAS', 'Cain Ranch FAS', 'Wolf Creek Bridge'],
    accessTips: 'Holter Dam access requires a short hike. Craig has the best boat ramp and amenities.',
    regulations: 'Catch and release only from Holter Dam to Cascade. Flies and lures only.',
    limits: 'Catch and release only from Holter Dam to Cascade',
    flows: {
      optimal: '4000-6000 CFS',
      tooLow: '<3000 CFS - fish spookier in low clear water',
      tooHigh: '>8000 CFS - limited wading, focus on edges'
    },
    localTips: [
      '12-foot leaders minimum, 14-16 feet better',
      'Fish are in the weeds - learn to cast to lanes',
      'Trico spinner falls require precise presentations',
      'Wind is your friend - fish are less spooky',
      'Book a guide for your first visit - worth every penny'
    ],
    nearbyServices: ['Headhunters Fly Shop (Craig)', 'CrossCurrents Fly Shop (Helena)', 'The Missouri River Ranch (Wolf Creek)'],
    hazards: ['Extremely slippery rocks', 'Sudden wind gusts', 'Lightning storms', 'Deceptive current speeds'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: `• Bob's Shuttle Service (Toston Dam to Townsend): 406-595-0587
• Headhunters Fly Shop: 406-235-3447
• Missouri River Trout Shop: 406-235-4474`
  },

  'Yellowstone River': {
    description: 'The longest free-flowing river in the lower 48, the Yellowstone flows from Yellowstone Lake through Paradise Valley and across the plains. Known for powerful flows, big fish, and scenic beauty.',
    shortDescription: 'Powerful freestone river with trophy trout potential',
    difficulty: 'Intermediate to Advanced',
    difficultyExplanation: 'Big water requires reading skills. Can be dangerous during runoff.',
    fishPerMile: 800,
    fishCountSource: 'FWP 2021 survey',
    averageFishSize: '15-18 inches (trophies to 25+)',
    bestSeasons: ['July-October'],
    peakHatches: ['Salmonflies (July)', 'Golden Stones (July)', 'PMDs (July-Aug)', 'Hoppers (Aug-Sept)'],
    species: ['Rainbow Trout (50%)', 'Brown Trout (35%)', 'Cutthroat Trout (10%)', 'Whitefish (5%)'],
    techniques: ['Drift fishing from boat', 'Streamer fishing', 'Dry-dropper rigs', 'Nymphing deep pools'],
    wading: 'Difficult',
    wadingNotes: 'Large river with powerful current. Wading limited to side channels and edges.',
    accessPoints: ['Gardiner (YNP)', 'Carbella FAS', 'Pine Creek FAS', 'Mayors Landing FAS', 'Greycliff FAS'],
    accessTips: 'Boat fishing is most effective. Wading anglers should focus on side channels and braids.',
    regulations: 'Closed to fishing March 1 - July 1 in some sections. Check FWP for specific closures.',
    limits: 'Varies by section. Standard: 5 trout/day. Some sections closed seasonally',
    flows: {
      optimal: '3000-6000 CFS (varies by section)',
      tooLow: '<2000 CFS - fish concentrated',
      tooHigh: '>10000 CFS - dangerous, fish near banks'
    },
    localTips: [
      'July Salmonfly hatch is legendary - book lodging early',
      'Streamer fishing at dawn produces big browns',
      'Fish the side channels during high water',
      'September hopper fishing can be exceptional',
      'Always check flow conditions before wading'
    ],
    nearbyServices: ['Blue Ribbon Flies (West Yellowstone)', 'Dan Bailey\'s (Livingston)', 'Park\'s Fly Shop (Gardiner)'],
    hazards: ['Dangerous wading conditions', 'Rapidly changing flows', 'Floating debris during runoff', 'Bears in Paradise Valley section'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: `• B & G River Shuttle (Toots): 406-222-3174 / 406-223-0626
• Big Sky Whitewater Rafting: 406-848-2112
• Hooters Shuttle: 406-223-2603
• Rapid Shuttle (Pelican to Sportsman Park): 406-321-3567
• The Space Shuttle: 406-518-1799`
  },

  'Gallatin River': {
    description: 'A classic mountain freestone stream flowing from Yellowstone National Park through the Gallatin Canyon to the Gallatin Valley. Clear, cold water with beautiful pocket water structure.',
    shortDescription: 'Picturesque mountain stream with pocket water fishing',
    difficulty: 'Beginner to Intermediate',
    difficultyExplanation: 'Technical pocket water fishing but forgiving for beginners.',
    fishPerMile: 1500,
    fishCountSource: 'FWP 2022 survey',
    averageFishSize: '10-14 inches',
    bestSeasons: ['June-September'],
    peakHatches: ['Salmonflies (June-July)', 'PMDs (July)', 'Caddis (July-Aug)', 'Hoppers (Aug-Sept)'],
    species: ['Rainbow Trout (55%)', 'Brown Trout (30%)', 'Cutthroat Trout (10%)', 'Mountain Whitefish (5%)'],
    techniques: ['High-stick nymphing', 'Dry fly in pockets', 'Bushy dries in faster water'],
    wading: 'Moderate',
    wadingNotes: 'Slick rocks in canyon section. Trekking poles helpful.',
    accessPoints: ['Gallatin Gateway', 'Spire Rock FAS', 'Storm Castle FAS', 'Deer Creek FAS', 'Axtell Bridge FAS'],
    accessTips: 'Highway 191 parallels the river with many turnouts. Canyon section has limited parking.',
    regulations: 'Standard Montana regulations. Special regs in YNP section.',
    limits: 'Standard: 5 trout/day, 10 in possession',
    flows: {
      optimal: '500-1200 CFS',
      tooLow: '<300 CFS - water gets warm, fish stressed',
      tooHigh: '>2000 CFS - limited wading access'
    },
    localTips: [
      'Fish the pockets behind boulders',
      'Short casts work better than long ones',
      'Early morning best during summer heat',
      'Look for fish in the "soft" water behind rocks',
      'September can have excellent BWO hatches'
    ],
    nearbyServices: ['Gallatin River Guides (Big Sky)', 'The River\'s Edge (Bozeman)', 'Montana Troutfitters (Bozeman)'],
    hazards: ['Heavy summer traffic on Hwy 191', 'Limited cell service in canyon', 'Flash flood potential'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: `• Bob's Shuttle Service: 406-595-0587
• The Space Shuttle: 406-518-1799`
  },

  'Bighorn River': {
    description: 'Below Yellowtail Dam, the Bighorn flows through the Crow Reservation offering consistent year-round fishing. High fish density and reliable flows make it a popular destination.',
    shortDescription: 'Consistent tailwater with high fish counts',
    difficulty: 'Intermediate',
    difficultyExplanation: 'Not as technical as the Missouri but still requires stealth.',
    fishPerMile: 1800,
    fishCountSource: 'FWP 2023 survey',
    averageFishSize: '15-17 inches',
    bestSeasons: ['Year-round'],
    peakHatches: ['Midges (year-round)', 'Blue Winged Olives (April-May)', 'PMDs (June-July)', 'Black Caddis (April)'],
    species: ['Rainbow Trout (55%)', 'Brown Trout (40%)', 'Cutthroat Trout (5%)'],
    techniques: ['Indicator nymphing', 'Dry fly during hatches', 'Streamer fishing'],
    wading: 'Easy to Moderate',
    wadingNotes: 'Gravel and sand bottom. Few large rocks.',
    accessPoints: ['Afterbay Dam', '3-Mile Access', 'Bighorn Access', 'Tongue River'],
    accessTips: 'Afterbay Dam is closest access from Fort Smith. 3-Mile is most popular.',
    regulations: 'Special regulations apply - check current FWP rules. Tribal permit required for some sections.',
    limits: 'Below Afterbay Dam: 5 trout/day, 10 in possession (no limit on brown trout size)',
    flows: {
      optimal: '2000-4000 CFS',
      tooLow: '<1500 CFS',
      tooHigh: '>5000 CFS'
    },
    localTips: [
      'Winter midging can be exceptional',
      'Sowbugs and scuds are always effective',
      'Fish the drop-offs and channels',
      'Less pressured than the Missouri',
      'Wind can be relentless - bring backup rods'
    ],
    nearbyServices: ['Bighorn Angler (Fort Smith)', 'Canyon Creek Lodge (Fort Smith)'],
    hazards: ['Severe winds', 'Summer heat', 'Limited shade'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: `• Bighorn Fly & Tackle: 406-666-2253
• Bighorn River View: 406-666-2550
• Bighorn Trout Shop: 406-666-2375
• Cottonwood Camp on the Bighorn: 406-666-2391`
  },

  'Bitterroot River': {
    description: 'The Bitterroot flows through the Bitterroot Valley with the dramatic mountain backdrop of the Bitterroot Range. Known for excellent Skwala stonefly fishing in spring.',
    shortDescription: 'Skwala capital of Montana with beautiful scenery',
    difficulty: 'Intermediate',
    difficultyExplanation: 'Braided river requires reading water. Variable flows.',
    fishPerMile: 1000,
    fishCountSource: 'FWP 2022 survey',
    averageFishSize: '12-15 inches',
    bestSeasons: ['March-April', 'June-July', 'October'],
    peakHatches: ['Skwalas (March-April)', 'March Browns (April-May)', 'Caddis (May-June)', 'Hoppers (Aug-Sept)'],
    species: ['Rainbow Trout (45%)', 'Cutthroat Trout (35%)', 'Brown Trout (15%)', 'Whitefish (5%)'],
    techniques: ['Skwala dry fly (March)', 'Dry-dropper rigs', 'Streamer fishing', 'Nymphing deep slots'],
    wading: 'Moderate',
    wadingNotes: 'Braided channels - wading can be tricky. Be careful of quicksand in side channels.',
    accessPoints: ['Stevensville FAS', 'Anglers\' Roost FAS', 'Tucker FAS', 'Woodside Bridge FAS'],
    accessTips: 'Highway 93 parallels the river. Numerous FAS sites with good access.',
    regulations: 'Standard Montana regulations. Check for Hoot Owl closures in summer.',
    limits: 'Standard: 5 trout/day, 10 in possession',
    flows: {
      optimal: '1000-2500 CFS',
      tooLow: '<800 CFS - water warms',
      tooHigh: '>4000 CFS - dangerous wading'
    },
    localTips: [
      'March Skwala fishing is the main attraction',
      'Fish move into side channels during high water',
      'Evening caddis hatches in June are spectacular',
      'Streamer fishing in spring produces big fish',
      'Less crowded than other western Montana rivers'
    ],
    nearbyServices: ['Grizzly Hackle (Missoula)', 'The Missoulian Angler (Missoula)', 'Kingfisher Fly Shop (Missoula)'],
    hazards: ['Quicksand in side channels', 'Rattlesnakes', 'Summer algae blooms'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: `• Four Rivers Shuttle: 406-370-5845
• Marty's Shuttle: 406-274-6331
• Pat Ellis: 406-370-2949
• Russ McAffee: bitterrootdeliveries@gmail.com`
  },

  'Blackfoot River': {
    description: 'Made famous by "A River Runs Through It," the Blackfoot is a beautiful freestone river flowing through the Garnet Mountains. Challenging wading but rewarding fishing.',
    shortDescription: 'Iconic river from "A River Runs Through It"',
    difficulty: 'Intermediate to Advanced',
    difficultyExplanation: 'Fast, turbulent water requires experienced wading.',
    fishPerMile: 600,
    fishCountSource: 'FWP 2021 survey',
    averageFishSize: '11-14 inches',
    bestSeasons: ['June-September', 'October'],
    peakHatches: ['Salmonflies (June-July)', 'Golden Stones (July)', 'Caddis (July-Aug)', 'October Caddis (Sept-Oct)'],
    species: ['Rainbow Trout (40%)', 'Cutthroat Trout (35%)', 'Brown Trout (20%)', 'Bull Trout (5%)'],
    techniques: ['Large dries during stonefly hatches', 'Stimulator fishing', 'Nymphing pocket water'],
    wading: 'Difficult',
    wadingNotes: 'Fast current and large boulders. Wading staff essential.',
    accessPoints: ['Johnsrud Park', 'Russell Gates FAS', 'River Junction FAS', 'Scotty Brown Bridge'],
    accessTips: 'River Road provides good access. Some sections require hiking.',
    regulations: 'Bull trout must be released immediately. Special regulations in some sections.',
    limits: 'Bull trout: Catch and release only. Others: 5 trout/day',
    flows: {
      optimal: '800-2000 CFS',
      tooLow: '<600 CFS',
      tooHigh: '>3000 CFS - very dangerous'
    },
    localTips: [
      'Salmonfly hatch in late June is the main event',
      'Fish the soft water behind boulders',
      'Stimulators work year-round',
      'Bull trout are protected - handle with care',
      'Early morning best during summer'
    ],
    nearbyServices: ['Blackfoot River Outfitters (Missoula)', 'Grizzly Hackle (Missoula)'],
    hazards: ['Difficult wading', 'Remote sections', 'Rapidly rising water', 'Bears in canyon sections'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: `• Four Rivers Shuttle: 406-370-5845
• Ovando River Shuttle (Ginger & Tony DeRonnebeck): 406-793-2568 / 406-210-2795
• Tommy Boyle: 406-370-5845`
  },

  'Clark Fork River': {
    description: 'The Clark Fork flows through the Missoula Valley and into the Alberton Gorge. Below the gorge, it becomes a large river with excellent fishing opportunities.',
    shortDescription: 'Diverse river with urban and wilderness sections',
    difficulty: 'Beginner to Intermediate',
    difficultyExplanation: 'Varies by section - urban fishing is easy, gorge requires experience.',
    fishPerMile: 700,
    fishCountSource: 'FWP 2022 survey',
    averageFishSize: '12-15 inches',
    bestSeasons: ['April-June', 'September-October'],
    peakHatches: ['Skwalas (March-April)', 'March Browns (April-May)', 'PMDs (June-July)'],
    species: ['Rainbow Trout (50%)', 'Cutthroat Trout (30%)', 'Brown Trout (20%)'],
    techniques: ['Dry fly during hatches', 'Nymphing runs', 'Streamers in deeper water'],
    wading: 'Moderate',
    wadingNotes: 'Varies by section. Alberton Gorge has difficult wading.',
    accessPoints: ['Missoula town sections', 'Turah FAS', 'Harper\'s Bridge FAS', 'Alberton Gorge'],
    accessTips: 'Town sections are easily accessible. Gorge requires hiking or boat.',
    regulations: 'Standard Montana regulations.',
    limits: 'Standard: 5 trout/day, 10 in possession',
    flows: {
      optimal: '2000-5000 CFS',
      tooLow: '<1500 CFS',
      tooHigh: '>8000 CFS'
    },
    localTips: [
      'Town section is great for quick sessions',
      'Alberton Gorge has bigger fish but harder access',
      'Spring skwalas can be good',
      'Fall streamer fishing produces trophies'
    ],
    nearbyServices: ['The Missoulian Angler (Missoula)', 'Grizzly Hackle (Missoula)'],
    hazards: ['Railroad traffic along gorge', 'Difficult wading in gorge', 'Urban debris in town sections'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: `• Four Rivers Shuttle: 406-370-5845
• Sonja's: 406-822-4358
• Superior Taxi Service: 406-396-9530`
  },

  'Beaverhead River': {
    description: 'The Beaverhead below Clark Canyon Dam is a technical tailwater with challenging fishing. Clear water and educated trout make it a test of skill. Note: USGS gauge is ice-affected and may not report data during winter months.',
    shortDescription: 'Technical tailwater below Clark Canyon Dam (Seasonal Gauge)',
    seasonalGauge: true,
    seasonalNote: 'USGS gauge is ice-affected during winter. Flow data may be unavailable Oct-Apr.',
    difficulty: 'Advanced',
    difficultyExplanation: 'Extremely clear water and selective trout. Long leaders required.',
    fishPerMile: 2000,
    fishCountSource: 'FWP 2022 survey',
    averageFishSize: '15-18 inches',
    bestSeasons: ['April-June', 'September-October'],
    peakHatches: ['Blue Winged Olives (April-May, Sept-Oct)', 'PMDs (June-July)', 'Tricos (Aug)'],
    species: ['Rainbow Trout (70%)', 'Brown Trout (30%)'],
    techniques: ['Long leader dry fly', 'Nymphing small flies', 'Midge fishing'],
    wading: 'Moderate',
    wadingNotes: 'Weed beds can make wading tricky.',
    accessPoints: ['Clark Canyon Dam', 'High Bridge', 'Pipe Organ', 'Barrett\'s Park'],
    accessTips: 'High Bridge is most popular access. Dam access requires hiking.',
    regulations: 'Special regulations - check current FWP rules.',
    limits: 'Special regulations - check current FWP rules',
    flows: {
      optimal: '150-300 CFS',
      tooLow: '<100 CFS - fish concentrated',
      tooHigh: '>400 CFS - limited access'
    },
    localTips: [
      'Size 22-24 midges often required',
      'Fish are in the weeds - learn to cast to lanes',
      'Trout sip dries in slow water - be patient',
      'Fall BWO hatches are exceptional'
    ],
    nearbyServices: ['The Stonefly Shop (Dillon)', 'Frontier Anglers (Dillon)'],
    hazards: ['Wind', 'Weed beds', 'Limited access points'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: `• Frontier Anglers: 406-683-5276`
  },

  'Rock Creek': {
    description: 'A beautiful tributary of the Clark Fork, Rock Creek flows through a scenic canyon with excellent dry fly fishing. Less crowded than many Montana streams.',
    shortDescription: 'Scenic canyon stream with great dry fly fishing',
    difficulty: 'Intermediate',
    difficultyExplanation: 'Technical pocket water but very fishable.',
    fishPerMile: 1200,
    fishCountSource: 'FWP 2021 survey',
    averageFishSize: '10-13 inches',
    bestSeasons: ['June-September'],
    peakHatches: ['Salmonflies (June-July)', 'Golden Stones (July)', 'PMDs (July)', 'Hoppers (Aug-Sept)'],
    species: ['Cutthroat Trout (50%)', 'Rainbow Trout (35%)', 'Brown Trout (15%)'],
    techniques: ['Dry fly fishing', 'Hopper-dropper', 'Bushy attractor patterns'],
    wading: 'Moderate',
    wadingNotes: 'Slick rocks in canyon.',
    accessPoints: ['Rock Creek FAS', 'Dalles FAS', 'Upstream sections via hiking'],
    accessTips: 'Highway 10 follows the lower creek. Upper sections require hiking.',
    regulations: 'Standard Montana regulations.',
    flows: {
      optimal: '200-500 CFS',
      tooLow: '<150 CFS',
      tooHigh: '>800 CFS'
    },
    localTips: [
      'July stonefly hatches are excellent',
      'Native cutthroats readily take dries',
      'Less crowded than other Missoula-area streams',
      'Beautiful camping nearby'
    ],
    nearbyServices: ['The Missoulian Angler (Missoula)'],
    hazards: ['Grizzly bears in upper sections', 'Remote location', 'Limited cell service'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: null
  },

  'Big Hole River': {
    description: 'The Big Hole is a classic western Montana freestone with diverse fishing opportunities. Known for the last native fluvial Arctic grayling population in the lower 48. Note: USGS gauge is ice-affected and may not report data during winter months.',
    shortDescription: 'Diverse freestone with native Arctic grayling (Seasonal Gauge)',
    seasonalGauge: true,
    seasonalNote: 'USGS gauge is ice-affected during winter. Flow data may be unavailable Nov-Apr.',
    difficulty: 'Intermediate',
    difficultyExplanation: 'Big river that requires reading water.',
    fishPerMile: 900,
    fishCountSource: 'FWP 2022 survey',
    averageFishSize: '12-15 inches',
    bestSeasons: ['June-September'],
    peakHatches: ['Salmonflies (June-July)', 'Golden Stones (July)', 'PMDs (July)', 'Hoppers (Aug)'],
    species: ['Rainbow Trout (40%)', 'Brown Trout (30%)', 'Arctic Grayling (20%)', 'Whitefish (10%)'],
    techniques: ['Dry fly during hatches', 'Nymphing runs', 'Streamer fishing'],
    wading: 'Moderate to Difficult',
    wadingNotes: 'Large river with variable bottom.',
    accessPoints: ['Divide Bridge', 'Moose FAS', 'Brown\'s Bridge', 'Glen FAS'],
    accessTips: 'Numerous access points along Hwy 43.',
    regulations: 'Special grayling regulations - check FWP. Catch and release for grayling.',
    limits: 'Arctic grayling: Catch and release only. Others: 5 trout/day',
    flows: {
      optimal: '1000-2000 CFS',
      tooLow: '<800 CFS',
      tooHigh: '>3000 CFS'
    },
    localTips: [
      'Grayling are catch-and-release only',
      'Upper river has best grayling fishing',
      'Salmonfly hatch can be good',
      'Beautiful scenery with mountain backdrop'
    ],
    nearbyServices: ['Sunrise Fly Shop (Melrose)', 'The Stonefly Shop (Dillon - seasonal)'],
    hazards: ['Bears', 'Remote sections', 'Variable flows'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: `• Great Divide Outfitters: 406-267-3346
• Sunrise Fly Shop: 406-835-3474`
  },

  'Ruby River': {
    description: 'The Ruby below Ruby Dam is a small tailwater with surprisingly good fishing. Less known than other Montana rivers, offering a more secluded experience. Note: USGS gauge is seasonal and may not report data during low-flow winter periods.',
    shortDescription: 'Small tailwater off the beaten path (Seasonal Gauge)',
    seasonalGauge: true,
    seasonalNote: 'USGS gauge is seasonal. Flow data may be limited during winter low-flow periods.',
    difficulty: 'Intermediate',
    difficultyExplanation: 'Small river requires stealth and accurate casting.',
    fishPerMile: 1400,
    fishCountSource: 'FWP 2021 survey',
    averageFishSize: '12-14 inches',
    bestSeasons: ['April-June', 'September-October'],
    peakHatches: ['Blue Winged Olives (April-May, Sept-Oct)', 'PMDs (June-July)'],
    species: ['Rainbow Trout (55%)', 'Brown Trout (40%)', 'Cutthroat Trout (5%)'],
    techniques: ['Dry fly', 'Nymphing', 'Small streamers'],
    wading: 'Easy',
    wadingNotes: 'Small river, easy wading.',
    accessPoints: ['Ruby Dam', 'Tillman Bridge', 'State Lands'],
    accessTips: 'Limited public access - check land ownership.',
    regulations: 'Special regulations - check current FWP rules.',
    flows: {
      optimal: '100-200 CFS',
      tooLow: '<80 CFS',
      tooHigh: '>300 CFS'
    },
    localTips: [
      'Best fishing in lower section below dam',
      'Small flies (18-22) often required',
      'Very limited access - research before going',
      'Beautiful ranch country'
    ],
    nearbyServices: ['Montana Angler (Ennis - seasonal trips)', 'The Stonefly Shop (Dillon)'],
    hazards: ['Private land', 'Limited access', 'Wind'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: null
  },

  'Stillwater River': {
    description: 'The Stillwater River flows from the Beartooth Mountains through the town of Columbus. A scenic freestone river with good trout fishing and excellent access.',
    shortDescription: 'Beartooth mountain freestone near Columbus',
    difficulty: 'Intermediate',
    difficultyExplanation: 'Typical freestone fishing. Can be challenging during runoff.',
    fishPerMile: 900,
    fishCountSource: 'FWP 2022 survey',
    averageFishSize: '12-15 inches',
    bestSeasons: ['June-September'],
    peakHatches: ['Salmonflies (June-July)', 'Golden Stones (July)', 'PMDs (July)', 'Hoppers (Aug-Sept)'],
    species: ['Rainbow Trout (45%)', 'Brown Trout (40%)', 'Cutthroat Trout (10%)', 'Whitefish (5%)'],
    techniques: ['Dry fly during hatches', 'Nymphing runs', 'Streamer fishing'],
    wading: 'Moderate',
    wadingNotes: 'Variable bottom - gravel to larger cobble. Wading staff helpful.',
    accessPoints: ['Graham Park FAS', 'Pine Creek FAS', 'Kruse FAS', 'Various bridge crossings'],
    accessTips: 'Good public access along Hwy 78. Multiple FAS sites.',
    regulations: 'Standard Montana regulations.',
    limits: 'Standard: 5 trout/day, 10 in possession',
    flows: {
      optimal: '500-1000 CFS',
      tooLow: '<300 CFS',
      tooHigh: '>1500 CFS - dangerous during runoff'
    },
    localTips: [
      'Salmonfly hatch in late June is excellent',
      'Fish the pocket water behind rocks',
      'Lower river has bigger fish',
      'Less crowded than other south-central Montana rivers',
      'Beautiful Beartooth mountain backdrop'
    ],
    nearbyServices: ['Beartooth Fly Shop (Columbus)', 'Montana Troutfitters (Billings)'],
    hazards: ['Runoff can be dangerous', 'Remote sections', 'Variable flows'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: null
  },

  'Swan River': {
    description: 'The Swan River flows through the Flathead Valley and Swan Valley. A beautiful mountain river with healthy cutthroat and bull trout populations. Note: USGS gauge is seasonal with limited winter reporting.',
    shortDescription: 'Flathead Valley mountain river (Seasonal Gauge)',
    seasonalGauge: true,
    seasonalNote: 'USGS gauge is seasonal. Flow data may be limited during winter.',
    difficulty: 'Intermediate',
    difficultyExplanation: 'Clear water requires stealth. Some technical sections.',
    fishPerMile: 700,
    fishCountSource: 'FWP 2021 survey',
    averageFishSize: '12-16 inches',
    bestSeasons: ['June-September'],
    peakHatches: ['Salmonflies (June-July)', 'Golden Stones (July)', 'PMDs (July-Aug)', 'Hoppers (Aug)'],
    species: ['Cutthroat Trout (50%)', 'Rainbow Trout (30%)', 'Bull Trout (15%)', 'Whitefish (5%)'],
    techniques: ['Dry fly during hatches', 'Nymphing deeper pools', 'Streamer fishing for bull trout'],
    wading: 'Moderate',
    wadingNotes: 'Slick rocks in some sections. Wading boots with felt recommended.',
    accessPoints: ['Bigfork FAS', 'Ferndale FAS', 'Swan River Access', 'Various bridge crossings'],
    accessTips: 'Hwy 83 follows much of the river. Good public access points.',
    regulations: 'Bull trout: Catch and release only. Check special regulations.',
    limits: 'Bull trout: Catch and release only. Others: 5 trout/day, 10 in possession',
    flows: {
      optimal: '800-1500 CFS',
      tooLow: '<500 CFS',
      tooHigh: '>2000 CFS'
    },
    localTips: [
      'Good cutthroat fishing throughout the summer',
      'Bull trout present - know how to identify them',
      'Upper river is more scenic with less pressure',
      'Salmonfly hatch can be excellent',
      'Connects to Flathead Lake - potential for lake-run fish'
    ],
    nearbyServices: ['Swan River Outfitters (Bigfork)', 'Lakestream Fly Shop (Whitefish)'],
    hazards: ['Bull trout must be released', 'Bears in the area', 'Can have strong flows'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: null
  },

  'Slough Creek': {
    description: 'Located in Yellowstone National Park, Slough Creek is famous for large, picky cutthroat trout that feed on dry flies in the meadows.',
    shortDescription: 'YNP meadow stream with large cutthroats',
    difficulty: 'Intermediate to Advanced',
    difficultyExplanation: 'Fish are educated and selective. Accurate casting essential.',
    fishPerMile: 300,
    fishCountSource: 'NPS estimates',
    averageFishSize: '14-18 inches',
    bestSeasons: ['July-September'],
    peakHatches: ['Pale Morning Duns (July)', 'Caddis (July-Aug)', 'Grasshoppers (Aug)'],
    species: ['Yellowstone Cutthroat Trout (95%)', 'Rainbow Trout (5%)'],
    techniques: ['Delicate dry fly presentations', 'Long leaders', 'Downstream drifts'],
    wading: 'Easy',
    wadingNotes: 'Meadow stream with easy wading.',
    accessPoints: ['Slough Creek Campground (hike in)', 'Second Meadow', 'Third Meadow'],
    accessTips: 'Requires hike from Slough Creek Campground. First Meadow is 1.5 miles, Second is 3 miles.',
    regulations: 'YNP regulations - catch and release, barbless hooks, flies only.',
    limits: 'YNP: Catch and release only, barbless hooks required',
    flows: {
      optimal: 'Spring-fed, consistent flows',
      tooLow: 'Not applicable - spring fed',
      tooHigh: 'Not applicable - spring fed'
    },
    localTips: [
      'Long leaders (12-15 feet) essential',
      'Downstream presentations often work best',
      'Fish sit right against grassy banks',
      'Bring bear spray - YNP grizzly country',
      'Camp at Slough Creek Campground for best access'
    ],
    nearbyServices: ['Park\'s Fly Shop (Gardiner)', 'Blue Ribbon Flies (West Yellowstone)'],
    hazards: ['Grizzly bears', 'Wolves', 'Remote location', 'Rapidly changing weather'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: null
  },

  'Soda Butte Creek': {
    description: 'Another beautiful YNP creek with excellent cutthroat fishing. Flows through Lamar Valley with stunning scenery. Note: USGS gauge is ice-affected and typically unavailable November through May.',
    shortDescription: 'YNP creek in Lamar Valley (Seasonal Gauge)',
    seasonalGauge: true,
    seasonalNote: 'USGS gauge is ice-affected during winter. Flow data typically unavailable Nov-May.',
    difficulty: 'Intermediate',
    difficultyExplanation: 'Clear water requires stealth.',
    fishPerMile: 400,
    fishCountSource: 'NPS estimates',
    averageFishSize: '12-16 inches',
    bestSeasons: ['July-September'],
    peakHatches: ['Pale Morning Duns', 'Caddis', 'Yellow Sallies'],
    species: ['Yellowstone Cutthroat Trout'],
    techniques: ['Dry fly fishing', 'Small nymphs'],
    wading: 'Easy to Moderate',
    wadingNotes: 'Varies by section.',
    accessPoints: ['Lamar Valley pullouts', 'Soda Butte picnic area'],
    accessTips: 'Roadside access in Lamar Valley.',
    regulations: 'YNP regulations - catch and release, barbless hooks.',
    limits: 'YNP: Catch and release only, barbless hooks required',
    flows: {
      optimal: 'Spring-fed, consistent',
      tooLow: 'Not applicable',
      tooHigh: 'Not applicable'
    },
    localTips: [
      'Fish the pocket water',
      'Wildlife viewing is exceptional',
      'Combine with Lamar River fishing',
      'Best in late summer'
    ],
    nearbyServices: ['Park\'s Fly Shop (Gardiner)'],
    hazards: ['Bears', 'Bison in valley', 'Remote location'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: null
  },

  'Lamar River': {
    description: 'The Lamar River flows through the Lamar Valley, often called "America\'s Serengeti" for its wildlife. Excellent cutthroat fishing in a stunning setting. Note: USGS gauge is ice-affected and typically unavailable November through May.',
    shortDescription: 'Iconic YNP river in Lamar Valley (Seasonal Gauge)',
    seasonalGauge: true,
    seasonalNote: 'USGS gauge is ice-affected during winter. Flow data typically unavailable Nov-May.',
    difficulty: 'Intermediate',
    difficultyExplanation: 'Big river for YNP. Reading water important.',
    fishPerMile: 350,
    fishCountSource: 'NPS estimates',
    averageFishSize: '13-17 inches',
    bestSeasons: ['July-September'],
    peakHatches: ['Pale Morning Duns', 'Caddis', 'Grasshoppers'],
    species: ['Yellowstone Cutthroat Trout'],
    techniques: ['Dry fly', 'Streamers', 'Nymphs'],
    wading: 'Moderate',
    wadingNotes: 'Bigger river, stronger current than other YNP streams.',
    accessPoints: ['Lamar Valley pullouts', 'Trailheads along road'],
    accessTips: 'Roadside access along Northeast Entrance Road.',
    regulations: 'YNP regulations - catch and release, barbless hooks.',
    flows: {
      optimal: 'Spring-fed',
      tooLow: 'Not applicable',
      tooHigh: 'Not applicable'
    },
    localTips: [
      'Best fishing above the falls',
      'Cutthroats take dries readily',
      'Amazing wildlife viewing',
      'Fish early morning to avoid wind'
    ],
    nearbyServices: ['Park\'s Fly Shop (Gardiner)'],
    hazards: ['Bears', 'Wolves', 'Bison crossings', 'Lightning storms'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: null
  },

  'Gardner River': {
    description: 'The Gardner flows from the park boundary near Mammoth to the Yellowstone River. Known for thermal features and unique fishing.',
    shortDescription: 'Thermal-influenced YNP river',
    difficulty: 'Intermediate',
    difficultyExplanation: 'Thermal features affect fish behavior.',
    fishPerMile: 250,
    fishCountSource: 'NPS estimates',
    averageFishSize: '10-14 inches',
    bestSeasons: ['Year-round (below Osprey Falls)'],
    peakHatches: ['Midges', 'Blue Winged Olives'],
    species: ['Rainbow Trout', 'Brown Trout', 'Whitefish'],
    techniques: ['Nymphing', 'Streamers', 'Small dries'],
    wading: 'Moderate to Difficult',
    wadingNotes: 'Some sections have thermal features.',
    accessPoints: ['Boiling River', 'Lava Creek', 'Various pullouts'],
    accessTips: 'Boiling River is most popular access.',
    regulations: 'YNP regulations. Year-round fishing below Osprey Falls.',
    limits: 'YNP: Catch and release only, barbless hooks required',
    flows: {
      optimal: 'Varies by section',
      tooLow: 'Not applicable',
      tooHigh: 'Not applicable'
    },
    localTips: [
      'Year-round fishing below Osprey Falls',
      'Unique thermal features',
      'Combine with Yellowstone River',
      'Winter fishing is possible'
    ],
    nearbyServices: ['Park\'s Fly Shop (Gardiner)'],
    hazards: ['Thermal features - water can be dangerously hot', 'Bears', 'Steep terrain'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: null
  },

  'Firehole River': {
    description: 'The Firehole is a unique thermal-influenced river in YNP. Warm water from geysers keeps it fishable when other rivers are frozen.',
    shortDescription: 'Thermal-influenced YNP river',
    difficulty: 'Intermediate',
    difficultyExplanation: 'Geothermal features create variable conditions.',
    fishPerMile: 400,
    fishCountSource: 'NPS estimates',
    averageFishSize: '10-13 inches',
    bestSeasons: ['May-June', 'September-October'],
    peakHatches: ['White Miller Caddis (July)', 'Blue Winged Olives (Sept-Oct)'],
    species: ['Rainbow Trout', 'Brown Trout', 'Brook Trout'],
    techniques: ['Small dries', 'Nymphing', 'Streamers'],
    wading: 'Moderate',
    wadingNotes: 'Some areas have hot springs - test water temperature.',
    accessPoints: ['Madison Junction', 'Fairy Falls trailhead', 'Various pullouts'],
    accessTips: 'Easy roadside access along Grand Loop Road.',
    regulations: 'YNP regulations. NEW: Opens May 1 (was Memorial Day).',
    limits: 'YNP: Catch and release only, barbless hooks required',
    flows: {
      optimal: 'Consistent - spring fed',
      tooLow: 'Not applicable',
      tooHigh: 'Not applicable'
    },
    localTips: [
      'NEW: Season opens May 1 (was Memorial Day)',
      'Can get too warm in mid-summer',
      'Best fishing is spring and fall',
      'Beautiful geyser basin scenery',
      'White Miller caddis hatch is famous'
    ],
    nearbyServices: ['Blue Ribbon Flies (West Yellowstone)', 'Park\'s Fly Shop (Gardiner)'],
    hazards: ['Thermal features - HOT water near geysers', 'Bison', 'Elk', 'Bears'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: `• B & G River Shuttle (Toots): 406-222-3174 / 406-223-0626
• Big Sky Whitewater Rafting: 406-848-2112
• Hooters Shuttle: 406-223-2603
• The Space Shuttle: 406-518-1799`
  },

  'Boulder River': {
    description: 'The Boulder River flows through the Absaroka-Beartooth Wilderness and the Boulder River Valley near Big Timber. Known for its beautiful canyon sections and healthy wild trout populations.',
    shortDescription: 'Wild trout stream near Big Timber',
    difficulty: 'Intermediate',
    difficultyExplanation: 'Technical pocket water fishing. Canyon sections can be challenging to access.',
    fishPerMile: 800,
    fishCountSource: 'FWP 2021 survey',
    averageFishSize: '10-13 inches',
    bestSeasons: ['June-September'],
    peakHatches: ['Salmonflies (June-July)', 'Golden Stones (July)', 'PMDs (July)', 'Hoppers (Aug-Sept)'],
    species: ['Rainbow Trout (50%)', 'Brown Trout (40%)', 'Cutthroat Trout (10%)'],
    techniques: ['Dry fly during hatches', 'High-stick nymphing', 'Streamers in deeper pools'],
    wading: 'Moderate to Difficult',
    wadingNotes: 'Slick rocks in canyon sections. Wading staff recommended.',
    accessPoints: ['Natural Bridge FAS', 'Boulder FAS', 'Private access points'],
    accessTips: 'Upper sections require hiking or horseback. Lower sections have better road access.',
    regulations: 'Standard Montana regulations. Some sections have special closures.',
    limits: 'Standard: 5 trout/day, 10 in possession',
    flows: {
      optimal: '200-500 CFS',
      tooLow: '<150 CFS',
      tooHigh: '>800 CFS - dangerous wading'
    },
    localTips: [
      'Upper river has wilder fish and less pressure',
      'Salmonfly hatch in late June can be spectacular',
      'Fish the pocket water behind boulders',
      'Beautiful scenery - camera recommended',
      'Check road conditions before going - can be rough'
    ],
    nearbyServices: ['Montana Troutfitters (Livingston)', 'Dan Bailey\'s (Livingston)'],
    hazards: ['Rough access roads', 'Remote location', 'Limited cell service', 'Bears'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: null
  },

  'Jefferson River': {
    description: 'The Jefferson is formed by the confluence of the Beaverhead and Big Hole rivers near Twin Bridges. A slower-moving river that warms in summer but offers good spring and fall fishing.',
    shortDescription: 'Confluence river with seasonal fishing',
    difficulty: 'Beginner to Intermediate',
    difficultyExplanation: 'Easy access and wading, but fish can be selective in clear water.',
    fishPerMile: 600,
    fishCountSource: 'FWP 2022 survey',
    averageFishSize: '12-15 inches',
    bestSeasons: ['April-June', 'September-October'],
    peakHatches: ['Skwalas (March-April)', 'March Browns (April-May)', 'Caddis (May-June)'],
    species: ['Rainbow Trout (40%)', 'Brown Trout (35%)', 'Cutthroat Trout (15%)', 'Whitefish (10%)'],
    techniques: ['Nymphing deeper runs', 'Streamer fishing', 'Dry fly during hatches'],
    wading: 'Easy',
    wadingNotes: 'Gravel and sand bottom makes for easy wading.',
    accessPoints: ['Twin Bridges area', 'Cardwell area', 'Various bridge crossings'],
    accessTips: 'Roadside access along Hwy 287. Multiple public access points.',
    regulations: 'Standard Montana regulations.',
    limits: 'Standard: 5 trout/day, 10 in possession',
    flows: {
      optimal: '500-1000 CFS',
      tooLow: '<300 CFS - water warms in summer',
      tooHigh: '>1500 CFS'
    },
    localTips: [
      'Spring fishing can be excellent before runoff',
      'Fish the confluence area with the Ruby',
      'Less crowded than other southwest Montana rivers',
      'Good access for wade anglers',
      'Summer fishing slows down - fish early morning'
    ],
    nearbyServices: ['The Stonefly Shop (Dillon)', 'Frontier Anglers (Dillon)'],
    hazards: ['Water quality can be poor after storms', 'Agricultural runoff', 'Summer algae'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: `• Bob's Shuttle Service: 406-595-0587
• The Space Shuttle: 406-518-1799`
  },

  'Spring Creeks': {
    description: 'The Paradise Valley spring creeks (DePuy\'s, Armstrong, and Nelson\'s) are legendary private waters known for challenging, technical fishing for large, selective trout.',
    shortDescription: 'World-class private spring creeks - "The Trio"',
    difficulty: 'Advanced',
    difficultyExplanation: 'Extremely technical fishing. Large trout are highly educated and selective.',
    fishPerMile: 300,
    fishCountSource: 'Estimates from outfitters',
    averageFishSize: '16-20 inches (trophies to 25+)',
    bestSeasons: ['April-June', 'September-October'],
    peakHatches: ['Blue Winged Olives (April-May, Sept-Oct)', 'PMDs (June-July)', 'Tricos (Aug)', 'Midges (year-round)'],
    species: ['Rainbow Trout (60%)', 'Brown Trout (40%)'],
    techniques: ['Long leader dry fly', 'Delicate presentations', 'Tiny midges', 'Sight fishing'],
    wading: 'Easy',
    wadingNotes: 'Spring-fed clear water with firm gravel bottom. Easy wading but stay low!',
    accessPoints: ['DePuy\'s Spring Creek (rod fee)', 'Armstrong Spring Creek (rod fee)', 'Nelson\'s Spring Creek (rod fee)'],
    accessTips: 'ALL THREE REQUIRE ROD FEES OR GUIDE ACCESS. Book through local outfitters.',
    regulations: 'Private property - rod fees required. Catch and release strongly encouraged.',
    limits: 'Private water - check with individual properties. Catch and release recommended.',
    flows: {
      optimal: 'Constant spring flow',
      tooLow: 'Not applicable - spring fed',
      tooHigh: 'Not applicable - spring fed'
    },
    localTips: [
      'Rod fees: ~$100-150/day per person',
      'Guides highly recommended for first-time anglers',
      'Bring 12-15 foot leaders and 6X-7X tippet',
      'These are sight-fishing waters - polarized glasses essential',
      'Book well in advance - limited daily anglers',
      'DePuy\'s is most famous, Armstrong has biggest fish',
      'Weather matters less on spring creeks'
    ],
    nearbyServices: ['Montana Angler (Livingston)', 'Blue Ribbon Flies (West Yellowstone)', 'Yellowstone Fly Fishing (Livingston)'],
    hazards: ['Expensive rod fees', 'Intimidating fishing', 'High expectations', 'Private property boundaries'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: null
  },

  'North Fork Flathead River': {
    description: 'The North Fork Flathead River flows directly south from the Canadian border, forming the western boundary of Glacier National Park for 58 miles until it meets the Middle Fork at Blankenship Bridge. This Wild and Scenic River is a gem of northwest Montana, offering exceptional dry fly fishing for native westslope cutthroat trout in a spectacular mountain setting. The clear, cold waters originate from pristine Canadian headwaters and flow through a broad glacial valley with stunning views of Glacier National Park.',
    shortDescription: 'Wild & Scenic river forming Glacier National Park\'s western border',
    difficulty: 'Intermediate',
    difficultyExplanation: 'Best fished from a drift boat. Wading possible but river is large and swift.',
    fishPerMile: 800,
    fishCountSource: 'FWP estimates',
    averageFishSize: '10-14 inches',
    bestSeasons: ['June-September'],
    peakHatches: ['Salmonflies (June-July)', 'Golden Stones (July)', 'PMDs (July)', 'Caddis (July-Aug)', 'Hoppers (Aug-Sept)'],
    species: ['Westlope Cutthroat Trout (70%)', 'Rainbow Trout (20%)', 'Bull Trout (10%)'],
    techniques: ['Dry fly fishing', 'Attractor dries', 'Terrestrials late summer', 'Streamers in high water'],
    wading: 'Moderate',
    wadingNotes: 'Large river, best fished from boat. Wade fishing possible at access points.',
    accessPoints: ['Canadian Border Put-in', 'Ford River Access', 'Polebridge Area', 'Blankenship Bridge Take-out'],
    accessTips: 'Float from Canadian border to Blankenship Bridge (58 miles). Multi-day trip.',
    regulations: 'Bull trout must be released immediately. Check Glacier National Park regs for river-left (park side).',
    limits: 'Standard: 5 trout/day, 10 in possession',
    flows: {
      optimal: '1000-3000 CFS',
      tooLow: '<800 CFS - fish concentrated',
      tooHigh: '>5000 CFS - dangerous floating'
    },
    localTips: [
      'Fish attractor dries like PMXs and Chubbies',
      'Terrestrial fishing excellent in August',
      'Multi-day floats require camping permits on park side',
      'Very limited fishing pressure compared to other Montana rivers',
      'Bear spray essential - grizzly country'
    ],
    nearbyServices: ['Bigfork Anglers (Bigfork)', 'Glacier Anglers (West Glacier)', 'Polebridge Mercantile'],
    hazards: ['Grizzly bears', 'Swift current', 'Cold glacial water', 'Remote location', 'Limited cell service'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: `• Flathead River Shuttle: 406-240-4700
• Shore Thing Shuttle: shorethingshuttle.com
• XCLSVE Transportation: 406-309-0135`
  },

  'Middle Fork Flathead River': {
    description: 'The Middle Fork Flathead River forms the southwestern boundary of Glacier National Park and was a major inspiration for the Wild and Scenic Rivers Act. Flowing approximately 92 miles from the Bob Marshall Wilderness Complex to its confluence with the North Fork, this river offers both whitewater and flatwater sections. The river parallels US Highway 2 through stunning canyon country, providing excellent access for day trips. The Middle Fork is renowned for its native westslope cutthroat trout fishery and breathtaking scenery.',
    shortDescription: 'Wild & Scenic river forming Glacier National Park\'s southern border',
    difficulty: 'Intermediate to Advanced',
    difficultyExplanation: 'Some sections have Class II-III whitewater. Technical canyon fishing.',
    fishPerMile: 900,
    fishCountSource: 'FWP estimates',
    averageFishSize: '10-14 inches',
    bestSeasons: ['June-September'],
    peakHatches: ['Salmonflies (June-July)', 'Golden Stones (July)', 'PMDs (July)', 'Caddis (July-Aug)', 'October Caddis (Sept-Oct)'],
    species: ['Westlope Cutthroat Trout (60%)', 'Rainbow Trout (30%)', 'Bull Trout (10%)'],
    techniques: ['Dry fly fishing', 'Nymphing deeper runs', 'Streamer fishing', 'Attractor dries'],
    wading: 'Moderate to Difficult',
    wadingNotes: 'Canyon sections can be challenging. Best fished from drift boat.',
    accessPoints: ['Schafer Meadows', 'Essex', 'Nyack', 'West Glacier', 'Blankenship Bridge'],
    accessTips: 'Commercial rafting trips available. Some access points require Forest Service fees.',
    regulations: 'Bull trout must be released immediately.',
    limits: 'Standard: 5 trout/day, 10 in possession',
    flows: {
      optimal: '800-2500 CFS',
      tooLow: '<600 CFS - fish concentrated in pools',
      tooHigh: '>4000 CFS - dangerous conditions'
    },
    localTips: [
      'Fish early morning during summer heat',
      'Look for rising fish in eddies below rapids',
      'Attractor patterns work well - fish are opportunistic',
      'Scenic float trips combine fishing with sightseeing',
      'Check road conditions - some access via rough roads'
    ],
    nearbyServices: ['Glacier Anglers (West Glacier)', 'Bigfork Anglers (Bigfork)', 'Glacier Raft Company'],
    hazards: ['Whitewater rapids', 'Grizzly bears', 'Cold water', 'Steep canyon walls', 'Limited exit points'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: `• Glacier Raft Company: 406-888-5454
• Bigfork Anglers: 406-837-4394`
  },

  'South Fork Flathead River': {
    description: 'The South Fork Flathead River originates in the Bob Marshall Wilderness Complex and flows through the Hungry Horse Reservoir before continuing as a tailwater fishery below the dam. The upper wilderness section requires horseback or hiking access and offers a true backcountry fishing experience. Below Hungry Horse Dam, the river provides excellent tailwater fishing for rainbow and cutthroat trout. Note: USGS gauge is seasonal (April 1 - October 31).',
    shortDescription: 'Wilderness river and tailwater (Seasonal Gauge: Apr-Oct)',
    seasonalGauge: true,
    seasonalNote: 'USGS gauge operates seasonally April 1 - October 31. No flow data available during winter months.',
    difficulty: 'Intermediate to Advanced',
    difficultyExplanation: 'Wilderness section requires backcountry skills. Tailwater section technical.',
    fishPerMile: 1000,
    fishCountSource: 'FWP estimates',
    averageFishSize: '12-16 inches',
    bestSeasons: ['June-September (tailwater)', 'July-August (wilderness)'],
    peakHatches: ['PMDs (June-July)', 'Caddis (July-Aug)', 'Golden Stones (July)', 'Tricos (Aug)'],
    species: ['Rainbow Trout (40%)', 'Cutthroat Trout (35%)', 'Bull Trout (15%)', 'Grayling (10%)'],
    techniques: ['Nymphing tailwater', 'Dry fly during hatches', 'Streamer fishing', 'Backcountry exploration'],
    wading: 'Moderate',
    wadingNotes: 'Tailwater section has stable flows. Wilderness section requires crossing streams.',
    accessPoints: ['Hungry Horse Dam (tailwater)', 'Spotted Bear Ranger Station (wilderness)', 'Various wilderness trailheads'],
    accessTips: 'Wilderness section requires pack trip or long hike. Tailwater easily accessible below dam.',
    regulations: 'Special regulations apply in wilderness. Bull trout must be released.',
    limits: 'Standard: 5 trout/day, 10 in possession',
    flows: {
      optimal: '500-1500 CFS (tailwater)',
      tooLow: '<300 CFS - tailwater too low',
      tooHigh: '>2500 CFS - dangerous conditions'
    },
    localTips: [
      'Tailwater fishes well year-round',
      'Wilderness section requires extensive planning',
      'Fish large dries in wilderness - fish are opportunistic',
      'Hungry Horse Dam releases can fluctuate',
      'Grayling present in upper sections'
    ],
    nearbyServices: ['Spotted Bear Ranger Station', 'Hungry Horse area shops', 'Kalispell fly shops'],
    hazards: ['Wilderness conditions', 'Grizzly bears', 'Fluctuating dam releases', 'Remote location', 'Difficult access'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: null
  },

  'Smith River': {
    description: 'The Smith River is considered the crown jewel of Montana floats - a 59-mile canyon trip between Camp Baker and Eden Bridge featuring towering limestone cliffs, abundant wildlife, and world-class trout fishing. This permit-required river flows through a remote limestone canyon and offers one of the most spectacular multi-day float experiences in the lower 48. The river is carefully managed through a lottery permit system to preserve its pristine condition and exceptional fishing. Note: USGS gauge is seasonal (April 1 - October 31).',
    shortDescription: 'Premier permit float (Seasonal Gauge: Apr-Oct)',
    seasonalGauge: true,
    seasonalNote: 'USGS gauge operates seasonally April 1 - October 31. No flow data available during winter months.',
    difficulty: 'Intermediate',
    difficultyExplanation: 'Permit required to float. Multi-day trip planning essential. Some technical rapids.',
    fishPerMile: 600,
    fishCountSource: 'FWP estimates',
    averageFishSize: '12-14 inches (browns to 20+)',
    bestSeasons: ['May-June (floating)'],
    peakHatches: ['Salmonflies (mid-May to early June)', 'Golden Stones (June)', 'PMDs (June-July)', 'Caddis (June)', 'Tricos (July-Aug)'],
    species: ['Brown Trout (50%)', 'Rainbow Trout (35%)', 'Whitefish (15%)'],
    techniques: ['Dry/dropper rigs', 'Stonefly patterns', 'Streamer fishing', 'Attractor dries'],
    wading: 'Limited',
    wadingNotes: 'Primarily a float trip. Limited wade access from campsites.',
    accessPoints: ['Camp Baker (put-in)', 'Eden Bridge (take-out)'],
    accessTips: 'Permit required for floating (lottery system Jan-Feb). 59-mile multi-day trip.',
    regulations: 'Special regulations in canyon section. Check current FWP rules.',
    limits: 'Standard: 5 trout/day, 10 in possession',
    flows: {
      optimal: '350-1000 CFS',
      tooLow: '<250 CFS - scraping bottom',
      tooHigh: '>1500 CFS - dangerous, muddy water'
    },
    localTips: [
      'Apply for permit lottery Jan-Feb each year',
      'Earliest salmonfly hatch in Montana',
      'Plan 4-5 days for full canyon float',
      '27 boat camps available - reserve preferred sites',
      'Dogs not allowed on float'
    ],
    nearbyServices: ['Montana River Outfitters (Great Falls)', 'CrossCurrents (White Sulphur Springs)', 'Local shuttle services'],
    hazards: ['Permit required', 'Multi-day commitment', 'Weather changes', 'Rattlesnakes in canyon', 'No dogs allowed'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: `• Amy's Think Wild Shuttle (Charles Rogerson): 406-547-2215 / 406-547-4297
• Montana River Outfitters: 406-761-1677
• Smith River Shuttle (Jody & Caroline Cox): 406-866-3522 / 866-500-3522`
  },

  'Dearborn River': {
    description: 'The Dearborn River is a hidden gem flowing from the Bob Marshall Wilderness to its confluence with the Missouri River near Craig. This medium-sized river offers approximately 65 miles of diverse fishing, from small wilderness headwaters to a dramatic canyon float below Highway 287. The lower canyon section is a bucket-list float for many anglers - a 19-mile journey through stunning limestone canyon walls with excellent brown trout fishing. However, the float season is very short, typically late May through mid-June, making timing critical. The Dearborn opens for fishing on the third Saturday in May.',
    shortDescription: 'Short-season canyon float with trophy brown trout potential',
    difficulty: 'Advanced',
    difficultyExplanation: 'Short float window. Canyon has technical rapids. Not for novice rowers.',
    fishPerMile: 500,
    fishCountSource: 'FWP estimates',
    averageFishSize: '12-16 inches (browns to 20+)',
    bestSeasons: ['Late May - mid June (floating)'],
    peakHatches: ['March Browns (May)', 'Golden Stones (late May-June)', 'PMDs (June)', 'Caddis (June)'],
    species: ['Brown Trout (50%)', 'Rainbow Trout (40%)', 'Cutthroat Trout (10%)'],
    techniques: ['Streamers in high water', 'Dry/dropper rigs', 'Attractor dries', 'Stonefly patterns'],
    wading: 'Limited',
    wadingNotes: 'Float trip river. Limited wade access at bridge crossings.',
    accessPoints: ['Highway 287 Bridge (canyon put-in)', 'Confluence with Missouri (take-out)', 'Upper access at Forest Service trails'],
    accessTips: 'Float season typically 3rd Saturday in May to mid-June. Ideal flows 500-800 CFS.',
    regulations: 'Opens 3rd Saturday in May. Standard regulations.',
    limits: 'Standard: 5 trout/day, 10 in possession',
    flows: {
      optimal: '500-800 CFS',
      tooLow: '<300 CFS - too low to float',
      tooHigh: '>1000 CFS - too pushy, dangerous'
    },
    localTips: [
      'Very short float window - plan accordingly',
      'Streamers effective in high/off-color water',
      'Large attractor dries with droppers standard setup',
      'Canyon has Class II-III rapids - experienced rowers only',
      'Fish early season before flows drop'
    ],
    nearbyServices: ['Headhunters Fly Shop (Craig)', 'Missouri River Trout Shop (Craig)', 'CrossCurrents (Helena)'],
    hazards: ['Short float season', 'Technical canyon rapids', 'Fluctuating flows', 'Private land along river', 'Cold water'],
    guidingServices: '📧 Want to be part of our network? Dhaul12@protonmail.com',
    shuttles: `• Headhunters Fly Shop: 406-235-3447
• Missouri River Trout Shop: 406-235-4474`
  }
};

/**
 * Get river information by name
 * @param {string} riverName - Name of the river
 * @returns {Object} River information object with defaults for missing data
 */
export function getRiverInfo(riverName) {
  const info = RIVER_INFO[riverName];
  
  if (!info) {
    return {
      description: 'Information coming soon for this river.',
      shortDescription: 'Information coming soon',
      difficulty: 'Unknown',
      difficultyExplanation: 'Check local reports for current conditions',
      fishPerMile: null,
      fishCountSource: null,
      averageFishSize: 'Unknown',
      bestSeasons: ['Check local reports'],
      peakHatches: ['Check local reports'],
      species: ['Trout'],
      techniques: ['Check local reports'],
      wading: 'Unknown',
      wadingNotes: 'Check local conditions',
      accessPoints: ['See map'],
      accessTips: 'Check with local fly shops',
      regulations: 'Check Montana FWP regulations',
      limits: 'Check Montana FWP regulations',
      flows: {
        optimal: 'Check USGS data',
        tooLow: 'Check USGS data',
        tooHigh: 'Check USGS data'
      },
      localTips: ['Check with local fly shops'],
      nearbyServices: ['Check local area'],
      hazards: ['Check local conditions']
    };
  }

  return info;
}

export default { RIVER_INFO, getRiverInfo };
