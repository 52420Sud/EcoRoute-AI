import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/dustbin_model.dart';
import '../../../providers/waste_provider.dart';
import '../../widgets/priority_tier_badge.dart';

class LiveMapScreen extends StatefulWidget {
  const LiveMapScreen({super.key});

  @override
  State<LiveMapScreen> createState() => _LiveMapScreenState();
}

class _LiveMapScreenState extends State<LiveMapScreen> {
  final MapController _mapController = MapController();
  final LatLng _defaultCenter = const LatLng(13.3440, 74.7430); // City Center

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<WasteProvider>(context);
    final dustbins = provider.dustbins;

    final criticalCount = provider.criticalDustbinsCount;
    final mediumCount = provider.mediumDustbinsCount;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Live IoT Dustbin Map'),
        actions: [
          IconButton(
            icon: const Icon(Icons.my_location),
            tooltip: 'Center on Municipal Area',
            onPressed: () {
              _mapController.move(_defaultCenter, 13.5);
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh Telemetry',
            onPressed: () => provider.fetchInitialData(),
          ),
        ],
      ),
      body: Stack(
        children: [
          // FlutterMap OpenStreetMap (Free, offline caching supported, no API keys needed)
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _defaultCenter,
              initialZoom: 13.5,
              minZoom: 10,
              maxZoom: 18,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.ecoroute.waste_management',
              ),
              MarkerLayer(
                markers: dustbins.map((bin) {
                  return Marker(
                    point: LatLng(bin.latitude, bin.longitude),
                    width: 50,
                    height: 56,
                    child: GestureDetector(
                      onTap: () => _showBinDetailsSheet(context, bin),
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                            decoration: BoxDecoration(
                              color: _getMarkerColor(bin),
                              borderRadius: BorderRadius.circular(10),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.4),
                                  blurRadius: 4,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Text(
                              '${bin.fillLevel}%',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 10,
                              ),
                            ),
                          ),
                          Icon(
                            Icons.location_on,
                            size: 32,
                            color: _getMarkerColor(bin),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ),

          // Top Status Summary Pill
          Positioned(
            top: 16,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: AppTheme.cardDark.withOpacity(0.92),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.borderDark),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 8),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _statusIndicator('Total Bins', '${dustbins.length}', Colors.white),
                  _statusIndicator('Critical (>70%)', '$criticalCount', AppTheme.criticalRed),
                  _statusIndicator('Medium (40-70%)', '$mediumCount', AppTheme.amberWarning),
                  _statusIndicator('Base Depth', '30.0 cm', AppTheme.emerald),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getMarkerColor(DustbinModel bin) {
    if (bin.fillLevel >= 70) return AppTheme.criticalRed;
    if (bin.fillLevel >= 40) return AppTheme.amberWarning;
    return AppTheme.emerald;
  }

  Widget _statusIndicator(String label, String value, Color color) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(value, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 10)),
      ],
    );
  }

  void _showBinDetailsSheet(BuildContext context, DustbinModel bin) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.cardDark,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return Consumer<WasteProvider>(
          builder: (context, provider, _) {
            final currentBin = provider.dustbins.firstWhere((b) => b.id == bin.id, orElse: () => bin);

            return Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(currentBin.id, style: const TextStyle(color: AppTheme.emerald, fontWeight: FontWeight.bold, fontSize: 16)),
                          const SizedBox(height: 2),
                          Text(currentBin.name, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      PriorityTierBadge(tier: currentBin.tier),
                    ],
                  ),
                  const Divider(height: 24, color: AppTheme.borderDark),

                  // Progress Bar & Stats
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Fill Percentage', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                      Text('${currentBin.fillLevel}%', style: TextStyle(color: _getMarkerColor(currentBin), fontWeight: FontWeight.bold, fontSize: 15)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: currentBin.fillLevel / 100,
                      backgroundColor: AppTheme.surfaceDark,
                      valueColor: AlwaysStoppedAnimation<Color>(_getMarkerColor(currentBin)),
                      minHeight: 8,
                    ),
                  ),

                  const SizedBox(height: 16),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _telemetryItem('Ultrasonic Reading', '${currentBin.ultrasonicDistanceCm.toStringAsFixed(1)} cm / 30.0 cm', Icons.sensors),
                      _telemetryItem('Battery Level', '${currentBin.batteryLevel}%', Icons.battery_charging_full),
                      _telemetryItem('Status', currentBin.status, Icons.health_and_safety),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Action Buttons: 30 cm Calibrate & 1-Tap Collect
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () async {
                            final success = await provider.calibrateDepth(currentBin.id);
                            if (ctx.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(success ? 'Calibrated ${currentBin.id} to 30.0 cm base depth' : 'Calibration sent to ESP32'),
                                  backgroundColor: AppTheme.emerald,
                                ),
                              );
                            }
                          },
                          icon: const Icon(Icons.tune, size: 16),
                          label: const Text('Calibrate 30cm', style: TextStyle(fontSize: 12)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () async {
                            await provider.markStopCollected(currentBin.id);
                            if (ctx.mounted) {
                              Navigator.pop(ctx);
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('${currentBin.id} emptied! Fill reset to 0%'),
                                  backgroundColor: AppTheme.emerald,
                                ),
                              );
                            }
                          },
                          icon: const Icon(Icons.done_all, size: 16),
                          label: const Text('1-Tap Empty', style: TextStyle(fontSize: 12)),
                          style: ElevatedButton.styleFrom(backgroundColor: AppTheme.emerald),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _telemetryItem(String label, String value, IconData icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 14, color: AppTheme.textSecondary),
            const SizedBox(width: 4),
            Text(label, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
          ],
        ),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
      ],
    );
  }
}
