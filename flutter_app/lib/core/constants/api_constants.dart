class ApiConstants {
  // Update this to your computer's local Wi-Fi IP or Cloud backend URL
  // e.g., 'http://10.241.198.76:5000/api' or 'http://10.0.2.2:5000/api' for Android Emulator
  static String baseUrl = 'http://10.241.198.76:5000/api';
  static const String emulatorBaseUrl = 'http://10.0.2.2:5000/api';
  static const String localhostBaseUrl = 'http://localhost:5000/api';

  // Hardware Calibration
  static const double defaultBinDepthCm = 30.0;
  static const int criticalThreshold = 70; // Critical areas above 70%
  static const int mediumThreshold = 40;   // Medium areas 40% - 70%

  // Endpoints
  static String get health => '$baseUrl/health';
  static String get dustbins => '$baseUrl/dustbins';
  static String get reports => '$baseUrl/reports';
  static String get alerts => '$baseUrl/alerts';
  static String get sendOtp => '$baseUrl/otp/send';
  static String get verifyOtp => '$baseUrl/otp/verify';
  static String get calibrate => '$baseUrl/sensors/calibrate';
  static String get telemetry => '$baseUrl/sensors/telemetry';

  static String dustbinCollect(String id) => '$baseUrl/dustbins/$id/collect';
  static String dustbinFill(String id) => '$baseUrl/dustbins/$id/fill';
}
