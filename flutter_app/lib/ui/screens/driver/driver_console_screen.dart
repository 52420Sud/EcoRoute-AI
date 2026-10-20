import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/route_plan_model.dart';
import '../../../providers/waste_provider.dart';
import '../../widgets/priority_tier_badge.dart';

class DriverConsoleScreen extends StatefulWidget {
  const DriverConsoleScreen({super.key});

  @override
  State<DriverConsoleScreen> createState() => _DriverConsoleScreenState();
}

class _DriverConsoleScreenState extends State<DriverConsoleScreen> {
  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<WasteProvider>(context);
    final routePlan = provider.activeRoute;

    if (routePlan == null || routePlan.stops.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Driver Collection Console')),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.local_shipping_outlined, size: 64, color: AppTheme.textSecondary),
              const SizedBox(height: 16),
              const Text('No Active Route Dispatched', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              const Text('Optimize and dispatch a route from the Route Optimizer first.', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: () => provider.generateRoute(),
                icon: const Icon(Icons.alt_route),
                label: const Text('Generate Dynamic Route'),
                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.emerald),
              ),
            ],
          ),
        ),
      );
    }

    final collectionStops = routePlan.stops;
    final totalStops = collectionStops.length;
    final completedCount = routePlan.completedStopsCount;

    // Find first uncollected stop
    final nextPendingStop = collectionStops.firstWhere(
      (s) => !s.collected,
      orElse: () => collectionStops.last,
    );

    final isRouteFullyCompleted = routePlan.isAllCompleted;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Driver Collection Console'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh Status',
            onPressed: () => provider.fetchInitialData(),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Vehicle & Shift Status Banner
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.cardDark,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.borderDark),
              ),
              child: Row(
                children: [
                  const CircleAvatar(
                    backgroundColor: AppTheme.surfaceDark,
                    child: Icon(Icons.local_shipping, color: AppTheme.emerald),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Vehicle #${routePlan.vehicleNumber}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                        const SizedBox(height: 2),
                        Text('Driver: ${routePlan.driverName} • Shift Active', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.emerald.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      routePlan.status.toUpperCase(),
                      style: const TextStyle(color: AppTheme.emerald, fontWeight: FontWeight.bold, fontSize: 11),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Progress Bar
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.cardDark,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Shift Collection Progress', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                      Text('$completedCount of $totalStops collected', style: const TextStyle(color: AppTheme.emerald, fontWeight: FontWeight.bold, fontSize: 12)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: totalStops > 0 ? (completedCount / totalStops) : 0,
                      backgroundColor: AppTheme.surfaceDark,
                      valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.emerald),
                      minHeight: 8,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            if (isRouteFullyCompleted) ...[
              // Congratulations Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppTheme.emerald.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.emerald),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.check_circle_outline, size: 56, color: AppTheme.emerald),
                    const SizedBox(height: 12),
                    const Text('Route Completed!', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    const Text('All designated priority bins have been emptied and synced with municipal database.', textAlign: TextAlign.center, style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () {
                        provider.generateRoute();
                      },
                      style: ElevatedButton.styleFrom(backgroundColor: AppTheme.emerald),
                      child: const Text('Recheck Critical Bins'),
                    ),
                  ],
                ),
              ),
            ] else ...[
              // NEXT ACTIVE STOP CARD (Highlight)
              const Text('NEXT ACTIONABLE STOP', style: TextStyle(color: AppTheme.emerald, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.2)),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppTheme.emerald.withOpacity(0.2),
                      AppTheme.cardDark,
                    ],
                  ),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.emerald, width: 1.5),
                  boxShadow: [
                    BoxShadow(color: AppTheme.emerald.withOpacity(0.15), blurRadius: 10),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        CircleAvatar(
                          backgroundColor: AppTheme.emerald,
                          radius: 16,
                          child: Text('${nextPendingStop.stopNumber}', style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                        ),
                        PriorityTierBadge(tier: nextPendingStop.tier),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      nextPendingStop.dustbin.name,
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Bin ID: ${nextPendingStop.dustbin.id} • Distance: ${nextPendingStop.distanceFromPreviousKm} km • Fill: ${nextPendingStop.dustbin.fillLevel}%',
                      style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                    ),

                    const SizedBox(height: 16),

                    // Big 1-Tap Collection Button
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton.icon(
                        onPressed: () async {
                          await provider.markStopCollected(nextPendingStop.dustbin.id);
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Collected & emptied ${nextPendingStop.dustbin.id}! Sensor reset to 30.0 cm / 0% fill.'),
                                backgroundColor: AppTheme.emerald,
                              ),
                            );
                          }
                        },
                        icon: const Icon(Icons.check_circle, size: 24),
                        label: const Text(
                          '1-Tap Mark Collected & Empty Bin',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.emerald,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 24),

            // Route Manifest Checklist
            const Text('ROUTE MANIFEST CHECKLIST', style: TextStyle(color: AppTheme.emerald, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.2)),
            const SizedBox(height: 10),

            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: collectionStops.length,
              itemBuilder: (context, idx) {
                final stop = collectionStops[idx];
                final isDone = stop.collected;

                return Card(
                  color: isDone ? AppTheme.surfaceDark.withOpacity(0.5) : AppTheme.cardDark,
                  margin: const EdgeInsets.only(bottom: 8),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                    side: BorderSide(
                      color: isDone ? AppTheme.emerald.withOpacity(0.4) : AppTheme.borderDark,
                    ),
                  ),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: isDone ? AppTheme.emerald : AppTheme.surfaceDark,
                      child: Icon(
                        isDone ? Icons.check : Icons.local_shipping,
                        size: 16,
                        color: isDone ? Colors.white : AppTheme.textSecondary,
                      ),
                    ),
                    title: Text(
                      stop.dustbin.name,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: isDone ? Colors.white60 : Colors.white,
                        decoration: isDone ? TextDecoration.lineThrough : null,
                      ),
                    ),
                    subtitle: Text('${stop.dustbin.id} • ${stop.distanceFromPreviousKm} km', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                    trailing: isDone
                        ? const Text('COLLECTED', style: TextStyle(color: AppTheme.emerald, fontWeight: FontWeight.bold, fontSize: 11))
                        : PriorityTierBadge(tier: stop.tier),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
