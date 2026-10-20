/**
 * Geographical utilities and distance calculations using Haversine formula
 */

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 100) / 100; // 2 decimal places
}

/**
 * Estimates driving and collection duration in minutes.
 * Average city collection vehicle speed: 22 km/h plus ~3.5 minutes per dustbin servicing.
 */
export function estimateCollectionTimeMinutes(
  distanceKm: number,
  stopsCount: number
): number {
  const drivingTimeMins = (distanceKm / 22) * 60;
  const collectionHandlingMins = stopsCount * 3.5;
  return Math.round(drivingTimeMins + collectionHandlingMins);
}

/**
 * Calculates estimated kilograms of waste from fill level & capacity liters.
 * Standard municipal mixed waste density ~ 0.28 kg per liter.
 */
export function estimateWasteWeightKg(fillLevel: number, capacityLiters: number): number {
  const litersFilled = (fillLevel / 100) * capacityLiters;
  return Math.round(litersFilled * 0.28);
}
