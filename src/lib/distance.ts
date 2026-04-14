/**
 * Calculates the great-circle distance between two GPS coordinates using the Haversine formula.
 * @returns Distance in kilometers
 */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Estimates delivery time in minutes based on distance.
 * Assumes average city speed of 20 km/h + 5 min prep buffer.
 */
export function estimateDeliveryMinutes(distanceKm: number): number {
  const travelTime = (distanceKm / 20) * 60; // minutes at 20 km/h
  return Math.round(travelTime + 5);
}
