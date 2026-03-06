const HATCH_CHARTS = {
  'Madison River': [
    { month: 'Jan', hatches: ['Midges'] },
    { month: 'Feb', hatches: ['Midges'] },
    { month: 'Mar', hatches: ['Midges', 'Blue Winged Olives'] },
    { month: 'Apr', hatches: ['Blue Winged Olives', 'March Browns'] },
    { month: 'May', hatches: ['March Browns', 'Salmonflies', 'Golden Stones'] },
    { month: 'Jun', hatches: ['Salmonflies', 'Golden Stones', 'PMDs', 'Yellow Sallies'] },
    { month: 'Jul', hatches: ['PMDs', 'Yellow Sallies', 'Caddis', 'Hoppers'] },
    { month: 'Aug', hatches: ['Hoppers', 'Tricos', 'Caddis'] },
    { month: 'Sep', hatches: ['Tricos', 'Mahogany Duns', 'Baetis'] },
    { month: 'Oct', hatches: ['Baetis', 'October Caddis'] },
    { month: 'Nov', hatches: ['Baetis', 'Midges'] },
    { month: 'Dec', hatches: ['Midges'] }
  ],
  'Yellowstone River': [
    { month: 'Mar', hatches: ['Midges'] },
    { month: 'Apr', hatches: ['Midges', 'Blue Winged Olives'] },
    { month: 'May', hatches: ['March Browns', 'Salmonflies'] },
    { month: 'Jun', hatches: ['Salmonflies', 'Golden Stones', 'PMDs'] },
    { month: 'Jul', hatches: ['PMDs', 'Yellow Sallies', 'Caddis', 'Hoppers'] },
    { month: 'Aug', hatches: ['Hoppers', 'Tricos'] },
    { month: 'Sep', hatches: ['Tricos', 'Mahogany Duns'] },
    { month: 'Oct', hatches: ['Baetis', 'October Caddis'] },
    { month: 'Nov', hatches: ['Midges', 'Baetis'] },
    { month: 'Dec', hatches: ['Midges'] }
  ],
  'Gallatin River': [
    { month: 'Mar', hatches: ['Midges'] },
    { month: 'Apr', hatches: ['Midges', 'Blue Winged Olives'] },
    { month: 'May', hatches: ['Blue Winged Olives', 'March Browns'] },
    { month: 'Jun', hatches: ['March Browns', 'Salmonflies', 'PMDs'] },
    { month: 'Jul', hatches: ['PMDs', 'Yellow Sallies', 'Caddis'] },
    { month: 'Aug', hatches: ['Hoppers', 'Tricos', 'Caddis'] },
    { month: 'Sep', hatches: ['Tricos', 'Mahogany Duns'] },
    { month: 'Oct', hatches: ['Baetis'] },
    { month: 'Nov', hatches: ['Midges', 'Baetis'] },
    { month: 'Dec', hatches: ['Midges'] }
  ],
  'Missouri River': [
    { month: 'Mar', hatches: ['Midges'] },
    { month: 'Apr', hatches: ['Midges', 'Blue Winged Olives', 'Caddis'] },
    { month: 'May', hatches: ['Blue Winged Olives', 'Caddis', 'PMDs'] },
    { month: 'Jun', hatches: ['PMDs', 'Caddis', 'Yellow Sallies'] },
    { month: 'Jul', hatches: ['PMDs', 'Caddis', 'Tricos'] },
    { month: 'Aug', hatches: ['Tricos', 'Hoppers'] },
    { month: 'Sep', hatches: ['Tricos', 'Mahogany Duns', 'Baetis'] },
    { month: 'Oct', hatches: ['Baetis'] },
    { month: 'Nov', hatches: ['Midges', 'Baetis'] },
    { month: 'Dec', hatches: ['Midges'] }
  ],
  'Bighorn River': [
    { month: 'Jan', hatches: ['Midges'] },
    { month: 'Feb', hatches: ['Midges'] },
    { month: 'Mar', hatches: ['Midges', 'Blue Winged Olives'] },
    { month: 'Apr', hatches: ['Blue Winged Olives', 'Caddis'] },
    { month: 'May', hatches: ['Caddis', 'PMDs'] },
    { month: 'Jun', hatches: ['PMDs', 'Yellow Sallies', 'Caddis'] },
    { month: 'Jul', hatches: ['PMDs', 'Caddis', 'Tricos'] },
    { month: 'Aug', hatches: ['Tricos', 'Hoppers'] },
    { month: 'Sep', hatches: ['Tricos', 'Pseudos', 'Baetis'] },
    { month: 'Oct', hatches: ['Baetis', 'Midges'] },
    { month: 'Nov', hatches: ['Midges', 'Baetis'] },
    { month: 'Dec', hatches: ['Midges'] }
  ]
};

function getCurrentHatches(riverName) {
  const month = new Date().toLocaleString('en-US', { month: 'short' });
  const river = HATCH_CHARTS[riverName];
  if (!river) return [];
  return river.find(h => h.month === month)?.hatches || [];
}

function getHatchChart(riverName) {
  return HATCH_CHARTS[riverName] || null;
}

module.exports = { getCurrentHatches, getHatchChart, HATCH_CHARTS };
