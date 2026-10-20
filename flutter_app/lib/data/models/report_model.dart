class PublicReportModel {
  final String id;
  final String photo;
  final String location;
  final double latitude;
  final double longitude;
  final String? dustbinId;
  final String issueType;
  final String description;
  final String reporterName;
  final String reporterPhone;
  final String status;
  final String submittedAt;
  final bool otpVerified;

  PublicReportModel({
    required this.id,
    required this.photo,
    required this.location,
    required this.latitude,
    required this.longitude,
    this.dustbinId,
    required this.issueType,
    required this.description,
    required this.reporterName,
    required this.reporterPhone,
    required this.status,
    required this.submittedAt,
    this.otpVerified = false,
  });

  factory PublicReportModel.fromJson(Map<String, dynamic> json) {
    return PublicReportModel(
      id: json['id'] ?? '',
      photo: json['photo'] ?? '',
      location: json['location'] ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 13.3440,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 74.7430,
      dustbinId: json['dustbin_id'],
      issueType: json['issue_type'] ?? 'Overflowing Dustbin',
      description: json['description'] ?? '',
      reporterName: json['reporter_name'] ?? '',
      reporterPhone: json['reporter_phone'] ?? '',
      status: json['status'] ?? 'Submitted',
      submittedAt: json['submitted_at'] ?? DateTime.now().toIso8601String(),
      otpVerified: json['otp_verified'] == 1 || json['otp_verified'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'photo': photo,
      'location': location,
      'latitude': latitude,
      'longitude': longitude,
      'dustbin_id': dustbinId,
      'issue_type': issueType,
      'description': description,
      'reporter_name': reporterName,
      'reporter_phone': reporterPhone,
      'status': status,
      'submitted_at': submittedAt,
      'otp_verified': otpVerified ? 1 : 0,
    };
  }
}
