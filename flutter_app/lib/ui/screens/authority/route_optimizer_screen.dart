import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/route_plan_model.dart';
import '../../../providers/waste_provider.dart';
import '../../widgets/priority_tier_badge.dart';

class RouteOptimizerScreen extends StatefulWidget {
  const RouteOptimizerScreen({super.key});

  @override
  State<RouteOptimizerScreen> createState() => _RouteOptimizerScreenState();
}

class _RouteOptimizerScreenState extends State<RouteOptimizerScreen> {
  final MapController _mapController = MapController();

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<WasteProvider>(context);
    final routePlan = provider.activeRoute;
    final scope = provider.routeScope;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Priority Route Optimizer'),
        actions: [
          IconButton(
            icon: const Icon(Icons.alt_route),
            tooltip: 'Recompute Route',
            onPressed: () => provider.generateRoute(),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Scope Selector Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              color: AppTheme.cardDark,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'PRIORITY ROUTING STRATEGY',
                        style: TextStyle(
                          color: AppTheme.emerald,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                          letterSpacing: 1.2,
                        ),
                      ),
                      Text(
                        'Critical >70% First',
                        style: TextStyle(
                          color: AppTheme.criticalRed,
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // 3-Segment Scope Control
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _scopeButton(
                          title: 'Critical Only (>70%)',
                          count: provider.criticalDustbinsCount,
                          isSelected: scope == RouteScopeFilter.criticalOnly,
                          color: AppTheme.criticalRed,
                          onTap: () => provider.setRouteScope(RouteScopeFilter.criticalOnly),
                        ),
                        const SizedBox(width: 8),
                        _scopeButton(
                          title: 'Critical -> Medium',
                          count: provider.criticalDustbinsCount + provider.mediumDustbinsCount,
                          isSelected: scope == RouteScopeFilter.criticalThenMedium,
                          color: AppTheme.amberWarning,
                          onTap: () => provider.setRouteScope(RouteScopeFilter.criticalThenMedium),
                        ),
                        const SizedBox(width: 8),
                        _scopeButton(
                          title: 'All Priority Tiers',
                          count: provider.dustbins.length,
                          isSelected: scope == RouteScopeFilter.allPriority,
                          color: AppTheme.emerald,
                          onTap: () => provider.setRouteScope(RouteScopeFilter.allPriority),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            if (routePlan != null) ...[
              // KPI Statistics Grid
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    _kpiTile('Stops', '${routePlan.stops.length}', Icons.pin_drop, Colors.white),
                    const SizedBox(width: 8),
                    _kpiTile('Distance', '${routePlan.totalDistanceKm} km', Icons.route, AppTheme.emerald),
                    const SizedBox(width: 8),
                    _kpiTile('Est. Time', '${routePlan.estimatedDurationMins} min', Icons.schedule, AppTheme.amberWarning),
                    const SizedBox(width: 8),
                    _kpiTile('Fuel Saved', '${(routePlan.totalDistanceKm * 0.28).toStringAsFixed(1)} L', Icons.eco, AppTheme.emerald),
                  ],
                ),
              ),

              // Mini Map with Route Polyline
              Container(
                height: 220,
                margin: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.borderDark),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: FlutterMap(
                    mapController: _mapController,
                    options: MapOptions(
                      initialCenter: provider.depotLocation,
                      initialZoom: 12.8,
                    ),
                    children: [
                      TileLayer(
                        urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                        userAgentPackageName: 'com.ecoroute.waste_management',
                      ),
                      // Polyline showing TSP route
                      PolylineLayer(
                        polylines: [
                          Polyline(
                            points: [
                              provider.depotLocation,
                              ...routePlan.stops.map((s) => LatLng(s.dustbin.latitude, s.dustbin.longitude)),
                              provider.depotLocation,
                            ],
                            color: AppTheme.emerald,
                            strokeWidth: 3.5,
                          ),
                        ],
                      ),
                      // Markers for stops
                      MarkerLayer(
                        markers: [
                          // Depot Marker
                          Marker(
                            point: provider.depotLocation,
                            width: 32,
                            height: 32,
                            child: Container(
                              decoration: BoxDecoration(
                                color: Colors.black87,
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 2),
                              ),
                              child: const Center(
                                child: Text('D', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                              ),
                            ),
                          ),
                          // Stop Markers
                          ...routePlan.stops.map((stop) {
                            return Marker(
                              point: LatLng(stop.dustbin.latitude, stop.dustbin.longitude),
                              width: 30,
                              height: 30,
                              child: Container(
                                decoration: BoxDecoration(
                                  color: stop.tier == 'Critical'
                                      ? AppTheme.criticalRed
                                      : (stop.tier == 'Medium' ? AppTheme.amberWarning : AppTheme.emerald),
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.white, width: 2),
                                ),
                                child: Center(
                                  child: Text(
                                    '${stop.stopNumber}',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                    ),
                                  ),
                                ),
                              ),
                            );
                          }),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Stops Sequence Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'OPTIMIZED NAVIGATION SEQUENCE',
                      style: TextStyle(
                        color: AppTheme.emerald,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                        letterSpacing: 1.2,
                      ),
                    ),
                    ElevatedButton.icon(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Route successfully dispatched to Driver Console!'),
                            backgroundColor: AppTheme.emerald,
                          ),
                        );
                      },
                      icon: const Icon(Icons.send, size: 14),
                      label: const Text('Dispatch to Driver', style: TextStyle(fontSize: 12)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.emerald,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // Stop List
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: routePlan.stops.length,
                itemBuilder: (context, idx) {
                  final stop = routePlan.stops[idx];
                  return Card(
                    color: AppTheme.cardDark,
                    margin: const EdgeInsets.only(bottom: 8),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                      side: BorderSide(
                        color: stop.tier == 'Critical' ? AppTheme.criticalRed.withOpacity(0.5) : AppTheme.borderDark,
                      ),
                    ),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: stop.tier == 'Critical'
                            ? AppTheme.criticalRed
                            : (stop.tier == 'Medium' ? AppTheme.amberWarning : AppTheme.emerald),
                        child: Text(
                          '#${stop.stopNumber}',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                      ),
                      title: Text(
                        stop.dustbin.name,
                        style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14),
                      ),
                      subtitle: Text(
                        '${stop.dustbin.id} • ${stop.distanceFromPreviousKm} km from prev stop',
                        style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                      ),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          PriorityTierBadge(tier: stop.tier),
                          const SizedBox(width: 8),
                          Text(
                            '${stop.dustbin.fillLevel}%',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: stop.dustbin.fillLevel >= 70 ? AppTheme.criticalRed : AppTheme.amberWarning,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 24),
            ] else ...[
              const Padding(
                padding: EdgeInsets.all(32),
                child: Center(
                  child: CircularProgressIndicator(color: AppTheme.emerald),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _scopeButton({
    required String title,
    required int count,
    required bool isSelected,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? color.withOpacity(0.2) : AppTheme.surfaceDark,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: isSelected ? color : AppTheme.borderDark, width: 1.5),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              title,
              style: TextStyle(
                color: isSelected ? color : AppTheme.textSecondary,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                fontSize: 12,
              ),
            ),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: isSelected ? color : AppTheme.cardDark,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '$count',
                style: TextStyle(
                  color: isSelected ? Colors.white : AppTheme.textSecondary,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _kpiTile(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: AppTheme.cardDark,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppTheme.borderDark),
        ),
        child: Column(
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 10), overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }
}
