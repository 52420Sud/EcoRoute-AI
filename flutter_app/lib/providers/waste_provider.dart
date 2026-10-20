import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:latlong2/latlong.dart';
import '../core/constants/api_constants.dart';
import '../data/models/dustbin_model.dart';
import '../data/models/report_model.dart';
import '../data/models/route_plan_model.dart';
import '../data/services/api_service.dart';

class WasteProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<DustbinModel> _dustbins = [];
  List<PublicReportModel> _reports = [];
  RoutePlanModel? _activeRoute;
  bool _isLoading = false;
  bool _isBackendConnected = false;
  Timer? _pollingTimer;

  // Selected Scope for Route Optimizer (Default: Critical Only > 70%)
  RouteScopeFilter _routeScope = RouteScopeFilter.criticalOnly;

  // Central Municipal Depot Location (City Center)
  final LatLng depotLocation = const LatLng(13.3440, 74.7430);

  List<DustbinModel> get dustbins => _dustbins;
  List<PublicReportModel> get reports => _reports;
  RoutePlanModel? get activeRoute => _activeRoute;
  bool get isLoading => _isLoading;
  bool get isBackendConnected => _isBackendConnected;
  RouteScopeFilter get routeScope => _routeScope;

  // Metric Getters
  int get totalDustbinsCount => _dustbins.length;
  int get criticalDustbinsCount => _dustbins.where((b) => b.tier == 'Critical').length;
  int get mediumDustbinsCount => _dustbins.where((b) => b.tier == 'Medium').length;
  int get normalDustbinsCount => _dustbins.where((b) => b.tier == 'Low').length;

  WasteProvider() {
    init();
  }

  void init() {
    fetchInitialData();
    // Real-time telemetry background polling every 4 seconds
    _pollingTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      refreshDataSilently();
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  void setRouteScope(RouteScopeFilter scope) {
    _routeScope = scope;
    generateRoute();
    notifyListeners();
  }

  void updateBackendUrl(String url) {
    ApiConstants.baseUrl = url;
    fetchInitialData();
  }

  Future<void> fetchInitialData() async {
    _isLoading = true;
    notifyListeners();

    _isBackendConnected = await _apiService.checkHealth();
    final bins = await _apiService.getDustbins();
    final reps = await _apiService.getReports();

    if (bins.isNotEmpty) {
      _dustbins = bins;
    } else {
      _dustbins = _generateMockDustbins();
    }

    _reports = reps;
    _isLoading = false;

    // Generate initial optimal route plan
    generateRoute();
    notifyListeners();
  }

  Future<void> refreshDataSilently() async {
    final health = await _apiService.checkHealth();
    if (health != _isBackendConnected) {
      _isBackendConnected = health;
      notifyListeners();
    }

    if (_isBackendConnected) {
      final bins = await _apiService.getDustbins();
      if (bins.isNotEmpty) {
        _dustbins = bins;
        notifyListeners();
      }
    }
  }

  // Hierarchical Tiered Route Optimizer (PRD Section 10 & 11)
  // Routes strictly: 1. Critical (>70%) -> 2. Medium (40-70%) -> 3. Low (<40%)
  void generateRoute() {
    if (_dustbins.isEmpty) return;

    final criticalBins = _dustbins.where((b) => b.tier == 'Critical').toList();
    final mediumBins = _dustbins.where((b) => b.tier == 'Medium').toList();
    final lowBins = _dustbins.where((b) => b.tier == 'Low' && b.fillLevel > 15).toList();

    List<DustbinModel> selectedBins = [];

    switch (_routeScope) {
      case RouteScopeFilter.criticalOnly:
        selectedBins = criticalBins.isNotEmpty ? criticalBins : (mediumBins.isNotEmpty ? mediumBins.take(4).toList() : _dustbins.take(3).toList());
        break;
      case RouteScopeFilter.criticalThenMedium:
        selectedBins = [...criticalBins, ...mediumBins];
        break;
      case RouteScopeFilter.allPriority:
        selectedBins = [...criticalBins, ...mediumBins, ...lowBins];
        break;
    }

    // Sequence by priority tier: Critical first, then Medium, then Low
    final List<OptimizedStopModel> stops = [];
    double currentLat = depotLocation.latitude;
    double currentLng = depotLocation.longitude;
    double cumulativeKm = 0.0;
    int stopNumber = 1;

    void processTier(List<DustbinModel> tierBins, String tierName) {
      final unvisited = List<DustbinModel>.from(tierBins);

      while (unvisited.isNotEmpty) {
        int bestIdx = 0;
        double bestDist = double.infinity;

        for (int i = 0; i < unvisited.length; i++) {
          final d = _calculateDistanceKm(currentLat, currentLng, unvisited[i].latitude, unvisited[i].longitude);
          if (d < bestDist) {
            bestDist = d;
            bestIdx = i;
          }
        }

        final nextBin = unvisited.removeAt(bestIdx);
        cumulativeKm += bestDist;
        currentLat = nextBin.latitude;
        currentLng = nextBin.longitude;

        final estArrival = (cumulativeKm / 22 * 60).round() + (stopNumber * 3);

        stops.add(OptimizedStopModel(
          stopNumber: stopNumber++,
          dustbin: nextBin,
          distanceFromPreviousKm: double.parse(bestDist.toStringAsFixed(2)),
          priorityScore: nextBin.fillLevel.toDouble(),
          cumulativeDistanceKm: double.parse(cumulativeKm.toStringAsFixed(2)),
          estimatedArrivalMins: estArrival,
          tier: tierName,
        ));
      }
    }

    if (_routeScope == RouteScopeFilter.criticalOnly) {
      processTier(selectedBins, 'Critical');
    } else if (_routeScope == RouteScopeFilter.criticalThenMedium) {
      processTier(criticalBins, 'Critical');
      processTier(mediumBins, 'Medium');
    } else {
      processTier(criticalBins, 'Critical');
      processTier(mediumBins, 'Medium');
      processTier(lowBins, 'Low');
    }

    // Return to depot
    final returnDist = _calculateDistanceKm(currentLat, currentLng, depotLocation.latitude, depotLocation.longitude);
    final totalKm = double.parse((cumulativeKm + returnDist).toStringAsFixed(2));
    final totalMins = (totalKm / 22 * 60).round() + (stops.length * 4);

    _activeRoute = RoutePlanModel(
      routeId: 'ROUTE-${DateTime.now().year}-${Random().nextInt(9000) + 1000}',
      vehicleNumber: 'KA-20-EA-4412',
      driverName: 'Ramesh Kumar',
      stops: stops,
      totalDistanceKm: totalKm,
      estimatedDurationMins: totalMins,
      status: 'Active',
    );

    notifyListeners();
  }

  // Driver marks bin as collected -> syncs to backend and updates state
  Future<void> markStopCollected(String dustbinId) async {
    final idx = _dustbins.indexWhere((b) => b.id == dustbinId);
    if (idx != -1) {
      final bin = _dustbins[idx];
      _dustbins[idx] = DustbinModel(
        id: bin.id,
        name: bin.name,
        zone: bin.zone,
        latitude: bin.latitude,
        longitude: bin.longitude,
        fillLevel: 0,
        status: 'Normal',
        capacityLiters: bin.capacityLiters,
        batteryLevel: bin.batteryLevel,
        sensorHealth: bin.sensorHealth,
        lastUpdated: DateTime.now().toIso8601String(),
        lastCollected: DateTime.now().toIso8601String(),
        activeComplaintCount: 0,
        address: bin.address,
      );
    }

    if (_activeRoute != null) {
      for (var s in _activeRoute!.stops) {
        if (s.dustbin.id == dustbinId) {
          s.collected = true;
        }
      }
      if (_activeRoute!.isAllCompleted) {
        _activeRoute!.status = 'Completed';
      }
    }

    notifyListeners();
    await _apiService.markCollected(dustbinId);
  }

  // 1-Click Depth Calibration to 30 cm
  Future<bool> calibrateDepth(String dustbinId) async {
    final success = await _apiService.calibrateDepth(dustbinId, ApiConstants.defaultBinDepthCm);
    if (success) {
      refreshDataSilently();
    }
    return success;
  }

  // Submit citizen grievance report
  Future<String?> submitCitizenReport({
    required String location,
    required double latitude,
    required double longitude,
    required String issueType,
    required String description,
    required String reporterName,
    required String reporterPhone,
    required String photoBase64,
    String? dustbinId,
  }) async {
    final id = 'REP-${Random().nextInt(9000) + 1000}';
    final report = PublicReportModel(
      id: id,
      photo: photoBase64,
      location: location,
      latitude: latitude,
      longitude: longitude,
      dustbinId: dustbinId,
      issueType: issueType,
      description: description,
      reporterName: reporterName,
      reporterPhone: reporterPhone,
      status: 'Submitted',
      submittedAt: DateTime.now().toIso8601String(),
      otpVerified: true,
    );

    _reports.insert(0, report);
    notifyListeners();

    final serverId = await _apiService.submitReport(report);
    return serverId ?? id;
  }

  double _calculateDistanceKm(double lat1, double lon1, double lat2, double lon2) {
    const p = 0.017453292519943295;
    final a = 0.5 - cos((lat2 - lat1) * p) / 2 + cos(lat1 * p) * cos(lat2 * p) * (1 - cos((lon2 - lon1) * p)) / 2;
    return 12742 * asin(sqrt(a));
  }

  List<DustbinModel> _generateMockDustbins() {
    return [
      DustbinModel(
        id: 'DB-001',
        name: 'Main Bus Terminal',
        zone: 'Transit Sector',
        latitude: 13.3445,
        longitude: 74.7435,
        fillLevel: 89,
        status: 'Critical',
        capacityLiters: 480,
        batteryLevel: 94,
        sensorHealth: 'Optimal',
        lastUpdated: DateTime.now().toIso8601String(),
        activeComplaintCount: 2,
        address: 'Platform 1 Departure Bay, Main Bus Terminal',
      ),
      DustbinModel(
        id: 'DB-002',
        name: 'Municipal Market East',
        zone: 'Commercial District',
        latitude: 13.3420,
        longitude: 74.7450,
        fillLevel: 94,
        status: 'Critical',
        capacityLiters: 480,
        batteryLevel: 91,
        sensorHealth: 'Optimal',
        lastUpdated: DateTime.now().toIso8601String(),
        activeComplaintCount: 3,
        address: 'East Produce Alley, Municipal Market',
      ),
      DustbinModel(
        id: 'DB-003',
        name: 'Central Hospital Gate',
        zone: 'Healthcare Zone',
        latitude: 13.3409,
        longitude: 74.7421,
        fillLevel: 80,
        status: 'Critical',
        capacityLiters: 480,
        batteryLevel: 98,
        sensorHealth: 'Optimal',
        lastUpdated: DateTime.now().toIso8601String(),
        activeComplaintCount: 1,
        address: 'Emergency Casualty Entrance, District Hospital',
      ),
      DustbinModel(
        id: 'DB-004',
        name: 'Govt Primary School',
        zone: 'Educational Zone',
        latitude: 13.3480,
        longitude: 74.7410,
        fillLevel: 38,
        status: 'Normal',
        capacityLiters: 360,
        batteryLevel: 96,
        sensorHealth: 'Optimal',
        lastUpdated: DateTime.now().toIso8601String(),
        activeComplaintCount: 0,
        address: 'Main Gate, Govt Primary School Campus',
      ),
      DustbinModel(
        id: 'DB-005',
        name: 'Railway Station Plaza',
        zone: 'Transit Sector',
        latitude: 13.3470,
        longitude: 74.7510,
        fillLevel: 85,
        status: 'Critical',
        capacityLiters: 480,
        batteryLevel: 88,
        sensorHealth: 'Optimal',
        lastUpdated: DateTime.now().toIso8601String(),
        activeComplaintCount: 2,
        address: 'West Wing Auto Stand, Railway Station',
      ),
      DustbinModel(
        id: 'DB-006',
        name: 'Town Hall Square',
        zone: 'Civic Center',
        latitude: 13.3450,
        longitude: 74.7480,
        fillLevel: 60,
        status: 'Nearly Full',
        capacityLiters: 360,
        batteryLevel: 95,
        sensorHealth: 'Optimal',
        lastUpdated: DateTime.now().toIso8601String(),
        activeComplaintCount: 0,
        address: 'Town Hall Circle North Promenade',
      ),
      DustbinModel(
        id: 'DB-007',
        name: 'Community Park North',
        zone: 'Public Gardens',
        latitude: 13.3390,
        longitude: 74.7390,
        fillLevel: 25,
        status: 'Normal',
        capacityLiters: 240,
        batteryLevel: 97,
        sensorHealth: 'Optimal',
        lastUpdated: DateTime.now().toIso8601String(),
        activeComplaintCount: 0,
        address: 'Jogging Track Gate 2, Community Park',
      ),
      DustbinModel(
        id: 'DB-008',
        name: 'Vegetable Mandi Rd',
        zone: 'Commercial District',
        latitude: 13.3415,
        longitude: 74.7335,
        fillLevel: 97,
        status: 'Critical',
        capacityLiters: 480,
        batteryLevel: 85,
        sensorHealth: 'Optimal',
        lastUpdated: DateTime.now().toIso8601String(),
        activeComplaintCount: 4,
        address: 'Auction Bay 2, Wholesale Vegetable Yard',
      ),
    ];
  }
}
