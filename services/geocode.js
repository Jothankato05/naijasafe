// Static gazetteer for the areas NaijaSafe already knows about (matches the
// AREA_GUIDES keys in services/alerts.js). No external geocoding API/key
// needed — deterministic and free. Coordinates are [lng, lat] (GeoJSON order).
const KNOWN_AREAS = {
  'airport': [3.3212, 6.5774],              // Murtala Mohammed Airport, Lagos
  'murtala mohammed airport lagos': [3.3212, 6.5774],
  'oshodi': [3.3512, 6.5555],
  'oshodi lagos': [3.3512, 6.5555],
  'ikeja': [3.3515, 6.6018],
  'ikeja lagos': [3.3515, 6.6018],
  'wuse': [7.4839, 9.0723],
  'wuse market abuja': [7.4839, 9.0723],
  'wuse abuja': [7.4839, 9.0723],
  'lekki': [3.5852, 6.4479],
  'lekki lagos': [3.5852, 6.4479],
  'abuja': [7.4951, 9.0579],
  'lagos': [3.3792, 6.5244],
  'kubwa abuja': [7.3195, 9.1547],
  'kubwa': [7.3195, 9.1547],
  'victoria island': [3.4219, 6.4281],
  'ikoyi': [3.4344, 6.4531],
  'maitama': [7.4951, 9.0937],
  'garki': [7.4898, 9.0333],
  'yaba': [3.3792, 6.5158],
  'surulere': [3.3541, 6.5027],
};

// Best-effort match: exact key, then substring match against the location
// string (mirrors the matching style already used by getAreaGuide/getAlertsByLocation).
function geocodeArea(location) {
  if (!location) return null;
  const loc = location.trim().toLowerCase();
  if (KNOWN_AREAS[loc]) return KNOWN_AREAS[loc];
  for (const key in KNOWN_AREAS) {
    if (loc.includes(key)) return KNOWN_AREAS[key];
  }
  return null;
}

// Attach a GeoJSON Point to a plain alert/subscriber object if we can
// resolve the area name. Returns { type: 'Point', coordinates } or undefined.
function toGeoPoint(location) {
  const coords = geocodeArea(location);
  if (!coords) return undefined;
  return { type: 'Point', coordinates: coords };
}

module.exports = { geocodeArea, toGeoPoint, KNOWN_AREAS };
