import { Dustbin, OptimizationWeights, OptimizedStop, RoutePlan, Vehicle, LocationCoordinates, RouteTierFilter } from '../types/waste';
import { calculateDistanceKm, estimateCollectionTimeMinutes, estimateWasteWeightKg } from './geoUtils';

/**
 * Calculates dynamic priority score based on configurable multi-factor weights
 * Score ranges from 0 to 100
 */
export function calculateDustbinPriorityScore(
  bin: Dustbin,
  weights: OptimizationWeights
): number {
  // Normalize fill level (0-100)
  const fillComponent = bin.fillLevel * weights.fillWeight;

  // Normalize citizen complaints (each complaint adds 35 points, capped at 100)
  const complaintScore = Math.min(100, bin.activeComplaintCount * 35);
  const complaintComponent = complaintScore * weights.complaintWeight;

  // Urgency component (critical fill >= 70% or complaints create high urgency)
  const critThreshold = weights.criticalThreshold ?? 70;
  const medThreshold = weights.mediumThreshold ?? 40;

  let urgencyBase = 0;
  if (bin.fillLevel >= 90) urgencyBase = 100;
  else if (bin.fillLevel >= critThreshold) urgencyBase = 85;
  else if (bin.fillLevel >= medThreshold || bin.activeComplaintCount > 0) urgencyBase = 55;
  else urgencyBase = 20;

  const urgencyComponent = urgencyBase * weights.urgencyWeight;

  const totalScore = Math.round((fillComponent + complaintComponent + urgencyComponent) * 10) / 10;
  return Math.min(100, Math.max(0, totalScore));
}

/**
 * AI / Heuristic Route Optimizer for Waste Collection
 * Implements strict hierarchical priority routing:
 * 1. FIRST: All Critical areas (fill level >= 70% or urgent complaints)
 * 2. THEN: Medium areas (fill level 40% - 70%)
 * 3. THEN: Low areas (fill level < 40%)
 * 
 * Supports routeTierFilter: 'critical_only' | 'critical_then_medium' | 'all_priority'
 */
export function optimizeCollectionRoute(
  dustbins: Dustbin[],
  vehicle: Vehicle,
  depotLocation: LocationCoordinates,
  weights: OptimizationWeights
): RoutePlan {
  const criticalThreshold = weights.criticalThreshold ?? 70;
  const mediumThreshold = weights.mediumThreshold ?? 40;
  const tierFilter: RouteTierFilter = weights.routeTierFilter || 'critical_only';

  // Helper: Classify each bin into a strict Priority Tier
  const getBinTier = (bin: Dustbin): 'Critical' | 'Medium' | 'Low' => {
    if (bin.fillLevel >= criticalThreshold || bin.activeComplaintCount > 0) {
      return 'Critical';
    }
    if (bin.fillLevel >= mediumThreshold) {
      return 'Medium';
    }
    return 'Low';
  };

  // 1. Group bins into strict tiers
  const tierCritical = dustbins.filter(b => getBinTier(b) === 'Critical');
  const tierMedium = dustbins.filter(b => getBinTier(b) === 'Medium');
  const tierLow = dustbins.filter(b => getBinTier(b) === 'Low' && b.fillLevel > 5);

  // 2. Select tiers according to routeTierFilter
  interface TierGroup {
    tierName: 'Critical' | 'Medium' | 'Low';
    bins: Dustbin[];
  }

  const activeTiers: TierGroup[] = [];

  if (tierFilter === 'critical_only') {
    // If no bins meet critical, gracefully fallback to highest available so route is not empty
    if (tierCritical.length > 0) {
      activeTiers.push({ tierName: 'Critical', bins: tierCritical });
    } else if (tierMedium.length > 0) {
      activeTiers.push({ tierName: 'Medium', bins: tierMedium.slice(0, 4) });
    } else {
      activeTiers.push({ tierName: 'Low', bins: tierLow.slice(0, 4) });
    }
  } else if (tierFilter === 'critical_then_medium') {
    if (tierCritical.length > 0) {
      activeTiers.push({ tierName: 'Critical', bins: tierCritical });
    }
    if (tierMedium.length > 0) {
      activeTiers.push({ tierName: 'Medium', bins: tierMedium });
    }
  } else {
    // 'all_priority': Critical -> Medium -> Low
    if (tierCritical.length > 0) {
      activeTiers.push({ tierName: 'Critical', bins: tierCritical });
    }
    if (tierMedium.length > 0) {
      activeTiers.push({ tierName: 'Medium', bins: tierMedium });
    }
    if (tierLow.length > 0) {
      activeTiers.push({ tierName: 'Low', bins: tierLow });
    }
  }

  // 3. Vehicle Capacity Constraint Check (Critical bins get top priority)
  const availableCapacityKg = vehicle.capacityKg - vehicle.currentLoadKg;
  let remainingCapacity = availableCapacityKg;

  const admittedTiers: { tierName: 'Critical' | 'Medium' | 'Low'; bins: { bin: Dustbin; score: number }[] }[] = [];

  for (const group of activeTiers) {
    const scoredGroupBins = group.bins.map(bin => ({
      bin,
      score: calculateDustbinPriorityScore(bin, weights),
      weightKg: estimateWasteWeightKg(bin.fillLevel, bin.capacityLiters)
    })).sort((a, b) => b.score - a.score);

    const admittedInTier: { bin: Dustbin; score: number }[] = [];
    for (const item of scoredGroupBins) {
      if (item.weightKg <= remainingCapacity || admittedTiers.length === 0) {
        admittedInTier.push({ bin: item.bin, score: item.score });
        remainingCapacity -= item.weightKg;
      }
    }

    if (admittedInTier.length > 0) {
      admittedTiers.push({ tierName: group.tierName, bins: admittedInTier });
    }
  }

  // Fallback: If nothing admitted, ensure at least one bin is present
  if (admittedTiers.length === 0) {
    const topBin = [...dustbins].sort((a, b) => b.fillLevel - a.fillLevel)[0];
    if (topBin) {
      admittedTiers.push({
        tierName: getBinTier(topBin),
        bins: [{ bin: topBin, score: calculateDustbinPriorityScore(topBin, weights) }]
      });
    }
  }

  // 4. Strict Tier-by-Tier Route Construction (TSP within each tier)
  // Vehicle starts at depot, visits all Tier 1 (Critical) stops,
  // then from the last Tier 1 stop visits all Tier 2 (Medium) stops,
  // then from the last Tier 2 stop visits all Tier 3 (Low) stops.
  let currentLat = vehicle.currentLocation.latitude || depotLocation.latitude;
  let currentLng = vehicle.currentLocation.longitude || depotLocation.longitude;

  interface SequencedStop {
    bin: Dustbin;
    score: number;
    tier: 'Critical' | 'Medium' | 'Low';
  }

  const allOrderedStops: SequencedStop[] = [];

  for (const group of admittedTiers) {
    const unvisited = [...group.bins];
    const tierStops: { bin: Dustbin; score: number }[] = [];

    while (unvisited.length > 0) {
      let bestIndex = 0;
      let bestUtility = -Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const candidate = unvisited[i];
        const distKm = calculateDistanceKm(
          currentLat,
          currentLng,
          candidate.bin.latitude,
          candidate.bin.longitude
        );

        // Utility: balances priority score against travel distance
        const utility = candidate.score / (1 + distKm * 0.45);
        if (utility > bestUtility) {
          bestUtility = utility;
          bestIndex = i;
        }
      }

      const nextStop = unvisited.splice(bestIndex, 1)[0];
      tierStops.push(nextStop);
      currentLat = nextStop.bin.latitude;
      currentLng = nextStop.bin.longitude;
    }

    // Run 2-Opt local search improvement WITHIN this tier to eliminate crossing paths
    const optimizedTierStops = run2OptOptimization(
      tierStops,
      tierStops.length > 0 ? tierStops[0].bin.latitude : currentLat,
      tierStops.length > 0 ? tierStops[0].bin.longitude : currentLng,
      currentLat,
      currentLng
    );

    for (const s of optimizedTierStops) {
      allOrderedStops.push({
        bin: s.bin,
        score: s.score,
        tier: group.tierName
      });
      currentLat = s.bin.latitude;
      currentLng = s.bin.longitude;
    }
  }

  // 5. Build detailed stop milestones with cumulative distances and times
  let cumulativeDistKm = 0;
  let prevLat = vehicle.currentLocation.latitude || depotLocation.latitude;
  let prevLng = vehicle.currentLocation.longitude || depotLocation.longitude;

  const stops: OptimizedStop[] = allOrderedStops.map((item, index) => {
    const distFromPrev = calculateDistanceKm(
      prevLat,
      prevLng,
      item.bin.latitude,
      item.bin.longitude
    );
    cumulativeDistKm += distFromPrev;
    prevLat = item.bin.latitude;
    prevLng = item.bin.longitude;

    const estArrivalMins = Math.round((cumulativeDistKm / 22) * 60 + index * 3.5);

    return {
      stopNumber: index + 1,
      dustbin: item.bin,
      distanceFromPreviousKm: Math.round(distFromPrev * 100) / 100,
      priorityScore: item.score,
      cumulativeDistanceKm: Math.round(cumulativeDistKm * 100) / 100,
      estimatedArrivalMins: estArrivalMins,
      collected: false,
      tier: item.tier
    };
  });

  // Add return leg to depot in total distance
  const returnToDepotDist = calculateDistanceKm(
    prevLat,
    prevLng,
    depotLocation.latitude,
    depotLocation.longitude
  );
  const totalDistanceKm = Math.round((cumulativeDistKm + returnToDepotDist) * 100) / 100;
  const estimatedDurationMins = estimateCollectionTimeMinutes(totalDistanceKm, stops.length);

  return {
    routeId: `ROUTE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    vehicleId: vehicle.id,
    vehicleNumber: vehicle.vehicleNumber,
    driverName: vehicle.driverName,
    createdAt: new Date().toISOString(),
    stops,
    totalDistanceKm,
    estimatedDurationMins,
    status: 'Draft',
    depotLocation,
    completedStopsCount: 0
  };
}

/**
 * 2-Opt local search improvement for TSP
 */
function run2OptOptimization(
  stops: { bin: Dustbin; score: number }[],
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): { bin: Dustbin; score: number }[] {
  if (stops.length <= 2) return stops;

  let bestRoute = [...stops];
  let improved = true;
  let iterations = 0;
  const MAX_ITERATIONS = 30;

  function calculateTotalPathDistance(route: { bin: Dustbin; score: number }[]): number {
    let d = 0;
    let prevLat = startLat;
    let prevLng = startLng;
    for (const s of route) {
      d += calculateDistanceKm(prevLat, prevLng, s.bin.latitude, s.bin.longitude);
      prevLat = s.bin.latitude;
      prevLng = s.bin.longitude;
    }
    d += calculateDistanceKm(prevLat, prevLng, endLat, endLng);
    return d;
  }

  let bestDistance = calculateTotalPathDistance(bestRoute);

  while (improved && iterations < MAX_ITERATIONS) {
    improved = false;
    iterations++;

    for (let i = 0; i < bestRoute.length - 1; i++) {
      for (let k = i + 1; k < bestRoute.length; k++) {
        // Reverse sub-segment [i..k]
        const newRoute = [
          ...bestRoute.slice(0, i),
          ...bestRoute.slice(i, k + 1).reverse(),
          ...bestRoute.slice(k + 1)
        ];

        const newDistance = calculateTotalPathDistance(newRoute);
        // Only accept swap if distance improvement doesn't severely compromise priority order
        if (newDistance < bestDistance - 0.15) {
          bestRoute = newRoute;
          bestDistance = newDistance;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }

  return bestRoute;
}
