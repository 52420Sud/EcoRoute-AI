import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../data/models/dustbin_model.dart';
import '../../providers/waste_provider.dart';
import 'priority_tier_badge.dart';

class DustbinCard extends StatelessWidget {
  final DustbinModel dustbin;
  final VoidCallback? onTap;
  final VoidCallback? onCalibrate;
  final VoidCallback? onCollect;

  const DustbinCard({
    Key? key,
    required this.dustbin,
    this.onTap,
    this.onCalibrate,
    this.onCollect,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<WasteProvider>(context, listen: false);
    final isCritical = dustbin.tier == 'Critical';
    final isMedium = dustbin.tier == 'Medium';

    Color progressColor = isCritical
        ? const Color(0xFFF43F5E)
        : isMedium
            ? const Color(0xFFF59E0B)
            : const Color(0xFF10B981);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Bar: ID + Tier Badge
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: progressColor.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(Icons.delete_outline_rounded, color: progressColor, size: 20),
                      ),
                      const SizedBox(width: 10),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            dustbin.id,
                            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
                          ),
                          Text(
                            dustbin.name,
                            style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                          ),
                        ],
                      ),
                    ],
                  ),
                  PriorityTierBadge(tier: dustbin.tier),
                ],
              ),
              const SizedBox(height: 14),

              // Fill Level Bar
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Fill Level: ${dustbin.fillLevel}%',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: progressColor),
                  ),
                  Text(
                    'Depth: ${dustbin.ultrasonicDistanceCm.toStringAsFixed(1)} cm / 30 cm',
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 11, fontWeight: FontWeight.w500),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: dustbin.fillLevel / 100.0,
                  minHeight: 8,
                  backgroundColor: Colors.grey.shade200,
                  valueColor: AlwaysStoppedAnimation<Color>(progressColor),
                ),
              ),
              const SizedBox(height: 12),

              // Bottom Info: Location, Battery, Complaints
              Row(
                children: [
                  Icon(Icons.location_on_outlined, size: 14, color: Colors.grey.shade500),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      dustbin.address,
                      style: TextStyle(color: Colors.grey.shade700, fontSize: 11),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(Icons.battery_charging_full_rounded, size: 14, color: Colors.grey.shade500),
                  Text(' ${dustbin.batteryLevel}%', style: TextStyle(color: Colors.grey.shade700, fontSize: 11)),
                ],
              ),
              const SizedBox(height: 10),

              // Action Buttons: 1-Click Calibrate (30 cm) and Collect
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  OutlinedButton.icon(
                    onPressed: onCalibrate ?? () async {
                      final ok = await provider.calibrateDepth(dustbin.id);
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(ok
                                ? '✅ Depth calibrated to 30.0 cm for ${dustbin.id}'
                                : '⚠️ Calibration ping sent locally to 30.0 cm'),
                            backgroundColor: const Color(0xFF0F172A),
                            duration: const Duration(seconds: 2),
                          ),
                        );
                      }
                    },
                    icon: const Icon(Icons.straighten_rounded, size: 14),
                    label: const Text('Calibrate (30 cm)', style: TextStyle(fontSize: 11)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      side: BorderSide(color: Colors.grey.shade300),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton.icon(
                    onPressed: onCollect ?? () => provider.markStopCollected(dustbin.id),
                    icon: const Icon(Icons.check_rounded, size: 14),
                    label: const Text('Collect', style: TextStyle(fontSize: 11)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F172A),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
