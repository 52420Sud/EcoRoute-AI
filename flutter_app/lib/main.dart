import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'providers/waste_provider.dart';
import 'ui/screens/home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const EcoRouteWasteManagementApp());
}

class EcoRouteWasteManagementApp extends StatelessWidget {
  const EcoRouteWasteManagementApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => WasteProvider()),
      ],
      child: MaterialApp(
        title: 'EcoRoute AI Smart Waste Management',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.darkTheme,
        home: const HomeScreen(),
      ),
    );
  }
}
