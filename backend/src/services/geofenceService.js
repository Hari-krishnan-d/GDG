require('dotenv').config();

/**
 * Calculates the great-circle distance between two lat/lng points
 * using the Haversine formula.
 * @returns distance in meters
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Checks if the given coordinates are within GEOFENCE_RADIUS_METERS
 * of the facility's fixed location.
 */
function isWithinGeofence(userLat, userLng) {
  const facilityLat = parseFloat(process.env.FACILITY_LAT || '28.6139');
  const facilityLng = parseFloat(process.env.FACILITY_LNG || '77.2090');
  const radiusMeters = parseFloat(process.env.GEOFENCE_RADIUS_METERS || '200');

  const distance = haversineDistance(facilityLat, facilityLng, userLat, userLng);
  return {
    isInside: distance <= radiusMeters,
    distanceMeters: Math.round(distance),
    radiusMeters,
  };
}

module.exports = { isWithinGeofence, haversineDistance };
