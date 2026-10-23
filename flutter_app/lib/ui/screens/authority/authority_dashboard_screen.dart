import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../providers/waste_provider.dart';
import '../../widgets/dustbin_card.dart';
import 'live_map_screen.dart';
import 'route_optimizer_screen.dart';

class AuthorityDashboardScreen extends StatefulWidget {
  const AuthorityDashboardScreen({super.key});

  @override
  State<AuthorityDashboardScreen> createState() => _AuthorityDashboardScreenState();
}

class _AuthorityDashboardScreenState extends State<AuthorityDashboardScreen> {
  String _selectedFilter = 'All';
  final TextEditingController _searchController = TextEditingController();
  bool _isCalibratingAll = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _calibrateAllBins(WasteProvider provider) async {
    setState(() => _isCalibratingAll = true);
    int successCount = 0;
    for (final bin in provider.dustbins) {
      final ok = await provider.calibrateDepth(bin.id);
      if (ok) successCount++;
    }
    setState(() => _isCalibratingAll = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Successfully calibrated $successCount ESP32 bins to 30.0 cm base depth!'),
          backgroundColor: AppTheme.emerald,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<WasteProvider>(context);
    final dustbins = provider.dustbins;

    final avgFill = dustbins.isNotEmpty
        ? (dustbins.fold<int>(0, (sum, b) => sum + b.fillLevel) / dustbins.length).round()
        : 0;

    // Filter dustbins
    final filteredBins = dustbins.where((bin) {
      final matchesSearch = bin.name.toLowerCase().contains(_searchController.text.toLowerCase()) ||
          bin.id.toLowerCase().contains(_searchController.text.toLowerCase()) ||
          bin.zone.toLowerCase().contains(_searchController.text.toLowerCase());

      if (!matchesSearch) return false;

      switch (_selectedFilter) {
        case 'Critical (>70%)':
          return bin.tier == 'Critical';
        case 'Medium (40-70%)':
          return bin.tier == 'Medium';
        case 'Normal (<40%)':
          return bin.tier == 'Low';
        default:
          return true;
      }
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Municipal Authority Console'),
        actions: [
          IconButton(
            icon: const Icon(Icons.map_outlined),
            tooltip: 'Open Live GIS Map',
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const LiveMapScreen()));
            },
          ),
          IconButton(
            icon: const Icon(Icons.alt_route),
            tooltip: 'Route Optimizer',
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const RouteOptimizerScreen()));
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh Telemetry',
            onPressed: () => provider.fetchInitialData(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => provider.fetchInitialData(),
        color: AppTheme.emerald,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // IoT Live Polling Status Pill
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppTheme.cardDark,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.borderDark),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppTheme.emerald,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      'ESP32 IoT Real-Time Network Active (4s telemetry cycle)',
                      style: TextStyle(color: Colors.white70, fontSize: 11),
                    ),
                    const Spacer(),
                    Text(
                      '${provider.dustbins.length} Active Nodes',
                      style: const TextStyle(color: AppTheme.emerald, fontWeight: FontWeight.bold, fontSize: 11),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // KPI Statistics Grid
              Row(
                children: [
                  _kpiCard(
                    title: 'Total Bins',
                    value: '${provider.totalDustbinsCount}',
                    icon: Icons.delete_outline,
                    color: Colors.white,
                  ),
                  const SizedBox(width: 8),
                  _kpiCard(
                    title: 'Critical (>70%)',
                    value: '${provider.criticalDustbinsCount}',
                    icon: Icons.warning_rounded,
                    color: AppTheme.criticalRed,
                  ),
                  const SizedBox(width: 8),
                  _kpiCard(
                    title: 'Medium (40-70%)',
                    value: '${provider.mediumDustbinsCount}',
                    icon: Icons.info_outline,
                    color: AppTheme.amberWarning,
                  ),
                  const SizedBox(width: 8),
                  _kpiCard(
                    title: 'Avg Fill',
                    value: '$avgFill%',
                    icon: Icons.pie_chart_outline,
                    color: AppTheme.emerald,
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Hardware Ultrasonic Calibration Action Banner (30.0 cm base depth)
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppTheme.emerald.withOpacity(0.12),
                      AppTheme.surfaceDark,
                    ],
                  ),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.emerald.withOpacity(0.35)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.settings_input_antenna, color: AppTheme.emerald, size: 28),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Ultrasonic Depth Calibration: 30.0 cm',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Calibrates standard physical container depth across all deployed ESP32 nodes.',
                            style: TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: _isCalibratingAll ? null : () => _calibrateAllBins(provider),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.emerald,
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      ),
                      child: _isCalibratingAll
                          ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('Calibrate All', style: TextStyle(fontSize: 11)),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Search Bar
              TextField(
                controller: _searchController,
                onChanged: (_) => setState(() {}),
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Search dustbins by name, landmark or ID',
                  prefixIcon: const Icon(Icons.search, color: AppTheme.emerald),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, size: 18),
                          onPressed: () {
                            _searchController.clear();
                            setState(() {});
                          },
                        )
                      : null,
                ),
              ),

              const SizedBox(height: 12),

              // Filter Chips
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: ['All', 'Critical (>70%)', 'Medium (40-70%)', 'Normal (<40%)'].map((filter) {
                    final isSelected = _selectedFilter == filter;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(filter, style: TextStyle(fontSize: 12, color: isSelected ? Colors.white : AppTheme.textSecondary)),
                        selected: isSelected,
                        selectedColor: AppTheme.emerald,
                        backgroundColor: AppTheme.cardDark,
                        onSelected: (val) {
                          if (val) setState(() => _selectedFilter = filter);
                        },
                      ),
                    );
                  }).toList(),
                ),
              ),

              const SizedBox(height: 16),

              // Dustbin List Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'TELEMETRY MONITORING (${filteredBins.length})',
                    style: const TextStyle(
                      color: AppTheme.emerald,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                      letterSpacing: 1.2,
                    ),
                  ),
                  TextButton.icon(
                    onPressed: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const LiveMapScreen()));
                    },
                    icon: const Icon(Icons.map, size: 14, color: AppTheme.emerald),
                    label: const Text('Map View', style: TextStyle(color: AppTheme.emerald, fontSize: 12)),
                  ),
                ],
              ),

              const SizedBox(height: 8),

              // Dustbins
              if (filteredBins.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(32),
                  child: const Center(
                    child: Text('No dustbins match the current filter criteria.', style: TextStyle(color: AppTheme.textSecondary)),
                  ),
                )
              else
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: filteredBins.length,
                  itemBuilder: (context, idx) {
                    final bin = filteredBins[idx];
                    return DustbinCard(
                      dustbin: bin,
                      onCalibrate: () async {
                        final ok = await provider.calibrateDepth(bin.id);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(ok ? '${bin.id} calibrated to 30.0 cm base depth' : 'Calibration transmitted to ESP32'),
                              backgroundColor: ok ? AppTheme.emerald : AppTheme.criticalRed,
                            ),
                          );
                        }
                      },
                      onCollect: () async {
                        await provider.markStopCollected(bin.id);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('${bin.id} emptied! Fill reset to 0%'),
                              backgroundColor: AppTheme.emerald,
                            ),
                          );
                        }
                      },
                    );
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _kpiCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: AppTheme.cardDark,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppTheme.borderDark),
        ),
        child: Column(
          children: [
            Icon(icon, size: 18, color: color),
            const SizedBox(height: 6),
            Text(value, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 2),
            Text(title, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 10), overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }
}
