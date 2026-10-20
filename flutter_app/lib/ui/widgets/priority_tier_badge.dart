import 'package:flutter/material.dart';

class PriorityTierBadge extends StatelessWidget {
  final String tier;
  final bool isCompact;

  const PriorityTierBadge({
    Key? key,
    required this.tier,
    this.isCompact = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    Color border;
    String label;
    IconData icon;

    switch (tier) {
      case 'Critical':
        bg = const Color(0xFFFFE4E6);
        fg = const Color(0xFFBE123C);
        border = const Color(0xFFFDA4AF);
        label = isCompact ? 'Critical' : '1: Critical (>70%)';
        icon = Icons.warning_rounded;
        break;
      case 'Medium':
        bg = const Color(0xFFFEF3C7);
        fg = const Color(0xFFB45309);
        border = const Color(0xFFFCD34D);
        label = isCompact ? 'Medium' : '2: Medium (40-70%)';
        icon = Icons.schedule_rounded;
        break;
      default:
        bg = const Color(0xFFD1FAE5);
        fg = const Color(0xFF047857);
        border = const Color(0xFF6EE7B7);
        label = isCompact ? 'Low' : '3: Low (<40%)';
        icon = Icons.check_circle_rounded;
    }

    return Container(
      padding: EdgeInsets.symmetric(horizontal: isCompact ? 8 : 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: isCompact ? 12 : 14, color: fg),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: isCompact ? 10 : 11,
              fontWeight: FontWeight.bold,
              color: fg,
            ),
          ),
        ],
      ),
    );
  }
}
