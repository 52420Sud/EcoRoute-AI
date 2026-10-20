import 'dustbin_model.dart';

enum RouteScopeFilter {
  criticalOnly,
  criticalThenMedium,
  allPriority,
}

class OptimizedStopModel {
  final int stopNumber;
  final DustbinModel dustbin;
  final double distanceFromPreviousKm;
  final double priorityScore;
  final double cumulativeDistanceKm;
  final int estimatedArrivalMins;
  bool collected;
  final String tier; // 'Critical', 'Medium', 'Low'

  OptimizedStopModel({
    required this.stopNumber,
    required this.dustbin,
    required this.distanceFromPreviousKm,
    required this.priorityScore,
    required this.cumulativeDistanceKm,
    required this.estimatedArrivalMins,
    this.collected = false,
    required this.tier,
  });
}

class RoutePlanModel {
  final String routeId;
  final String vehicleNumber;
  final String driverName;
  final List<OptimizedStopModel> stops;
  final double totalDistanceKm;
  final int estimatedDurationMins;
  String status;

  RoutePlanModel({
    required this.routeId,
    required this.vehicleNumber,
    required this.driverName,
    required this.stops,
    required this.totalDistanceKm,
    required this.estimatedDurationMins,
    this.status = 'Draft',
  });

  int get completedStopsCount => stops.where((s) => s.collected).length;
  bool get isAllCompleted => stops.isNotEmpty && stops.every((s) => s.collected);

  int get criticalCount => stops.where((s) => s.tier == 'Critical').length;
  int get mediumCount => stops.where((s) => s.tier == 'Medium').length;
  int get lowCount => stops.where((s) => s.tier == 'Low').length;
}
