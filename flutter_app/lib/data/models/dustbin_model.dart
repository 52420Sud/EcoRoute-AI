class DustbinModel {
  final String id;
  final String name;
  final String zone;
  final double latitude;
  final double longitude;
  final int fillLevel;
  final String status;
  final int capacityLiters;
  final int batteryLevel;
  final String sensorHealth;
  final String lastUpdated;
  final String? lastCollected;
  final int activeComplaintCount;
  final String address;

  DustbinModel({
    required this.id,
    required this.name,
    required this.zone,
    required this.latitude,
    required this.longitude,
    required this.fillLevel,
    required this.status,
    required this.capacityLiters,
    required this.batteryLevel,
    required this.sensorHealth,
    required this.lastUpdated,
    this.lastCollected,
    required this.activeComplaintCount,
    required this.address,
  });

  // Priority Tier
  String get tier {
    if (fillLevel >= 70 || activeComplaintCount > 0 || status == 'Critical') {
      return 'Critical';
    }
    if (fillLevel >= 40) {
      return 'Medium';
    }
    return 'Low';
  }

  // Ultrasonic distance in cm (30 cm calibrated depth)
  double get ultrasonicDistanceCm {
    return 30.0 * (1.0 - (fillLevel / 100.0));
  }

  factory DustbinModel.fromJson(Map<String, dynamic> json) {
    return DustbinModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      zone: json['zone'] ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 13.3440,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 74.7430,
      fillLevel: (json['fill_level'] as num?)?.toInt() ?? 0,
      status: json['status'] ?? 'Normal',
      capacityLiters: (json['capacity_liters'] as num?)?.toInt() ?? 480,
      batteryLevel: (json['battery_level'] as num?)?.toInt() ?? 95,
      sensorHealth: json['sensor_health'] ?? 'Optimal',
      lastUpdated: json['last_updated'] ?? DateTime.now().toIso8601String(),
      lastCollected: json['last_collected'],
      activeComplaintCount: (json['active_complaint_count'] as num?)?.toInt() ?? 0,
      address: json['address'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'zone': zone,
      'latitude': latitude,
      'longitude': longitude,
      'fill_level': fillLevel,
      'status': status,
      'capacity_liters': capacityLiters,
      'battery_level': batteryLevel,
      'sensor_health': sensorHealth,
      'last_updated': lastUpdated,
      'last_collected': lastCollected,
      'active_complaint_count': activeComplaintCount,
      'address': address,
    };
  }
}
