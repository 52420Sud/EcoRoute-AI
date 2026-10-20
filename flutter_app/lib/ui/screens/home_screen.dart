import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/api_constants.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/waste_provider.dart';
import 'authority/authority_dashboard_screen.dart';
import 'authority/route_optimizer_screen.dart';
import 'citizen/citizen_report_screen.dart';
import 'driver/driver_console_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    CitizenReportScreen(),
    AuthorityDashboardScreen(),
    RouteOptimizerScreen(),
    DriverConsoleScreen(),
  ];

  void _showServerConfigDialog(BuildContext context) {
    final controller = TextEditingController(text: ApiConstants.baseUrl);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cardDark,
        title: const Row(
          children: [
            Icon(Icons.wifi_tethering, color: AppTheme.emerald),
            SizedBox(width: 8),
            Text('IoT Cloud & Network Host', style: TextStyle(color: Colors.white, fontSize: 16)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Set the host IP of the EcoRoute Node.js / IoT backend so this app can connect from any physical phone, Wi-Fi or cellular network.',
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: const InputDecoration(
                labelText: 'Backend Base URL',
                hintText: ApiConstants.productionBaseUrl,
                prefixIcon: Icon(Icons.cloud_done, color: AppTheme.emerald),
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 6,
              children: [
                ActionChip(
                  avatar: const Icon(Icons.cloud, size: 14, color: AppTheme.emerald),
                  label: const Text('Live Cloud (Render)', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white)),
                  backgroundColor: AppTheme.emerald.withOpacity(0.3),
                  onPressed: () => controller.text = ApiConstants.productionBaseUrl,
                ),
                ActionChip(
                  label: const Text('Local Wi-Fi / ESP32', style: TextStyle(fontSize: 10)),
                  onPressed: () => controller.text = 'http://10.24.177.25:5000/api',
                ),
                ActionChip(
                  label: const Text('Localhost (5000)', style: TextStyle(fontSize: 10)),
                  onPressed: () => controller.text = ApiConstants.localhostBaseUrl,
                ),
                ActionChip(
                  label: const Text('Android Emul (10.0.2.2)', style: TextStyle(fontSize: 10)),
                  onPressed: () => controller.text = ApiConstants.emulatorBaseUrl,
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.textSecondary)),
          ),
            ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              Provider.of<WasteProvider>(context, listen: false).updateBackendUrl(controller.text.trim());
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Connecting to: ${controller.text.trim()}'),
                  backgroundColor: AppTheme.emerald,
                ),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.emerald),
            child: const Text('Save & Reconnect'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<WasteProvider>(context);
    final criticalCount = provider.criticalDustbinsCount;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppTheme.emerald.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.recycling, color: AppTheme.emerald, size: 20),
            ),
            const SizedBox(width: 8),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'EcoRoute AI',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
                ),
                Text(
                  'Smart Waste & IoT Network',
                  style: TextStyle(fontSize: 10, color: AppTheme.textSecondary),
                ),
              ],
            ),
          ],
        ),
        actions: [
          // Telemetry heartbeat pill
          Container(
            margin: const EdgeInsets.symmetric(vertical: 12),
            padding: const EdgeInsets.symmetric(horizontal: 8),
            decoration: BoxDecoration(
              color: AppTheme.cardDark,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.borderDark),
            ),
            child: Row(
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppTheme.emerald,
                  ),
                ),
                const SizedBox(width: 6),
                const Text('IoT Live', style: TextStyle(fontSize: 10, color: Colors.white70)),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.settings_ethernet, size: 20),
            tooltip: 'Network / IoT Host Settings',
            onPressed: () => _showServerConfigDialog(context),
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) {
          setState(() => _currentIndex = index);
        },
        backgroundColor: AppTheme.cardDark,
        indicatorColor: AppTheme.emerald.withOpacity(0.2),
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.campaign_outlined),
            selectedIcon: Icon(Icons.campaign, color: AppTheme.emerald),
            label: 'Citizen',
          ),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: criticalCount > 0,
              label: Text('$criticalCount'),
              child: const Icon(Icons.admin_panel_settings_outlined),
            ),
            selectedIcon: Badge(
              isLabelVisible: criticalCount > 0,
              label: Text('$criticalCount'),
              child: const Icon(Icons.admin_panel_settings, color: AppTheme.emerald),
            ),
            label: 'Authority',
          ),
          const NavigationDestination(
            icon: Icon(Icons.alt_route_outlined),
            selectedIcon: Icon(Icons.alt_route, color: AppTheme.emerald),
            label: 'Optimizer',
          ),
          const NavigationDestination(
            icon: Icon(Icons.local_shipping_outlined),
            selectedIcon: Icon(Icons.local_shipping, color: AppTheme.emerald),
            label: 'Driver',
          ),
        ],
      ),
    );
  }
}
