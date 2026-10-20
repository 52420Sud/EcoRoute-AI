import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/constants/api_constants.dart';
import '../models/dustbin_model.dart';
import '../models/report_model.dart';

class ApiService {
  final http.Client _client = http.Client();

  // Health check
  Future<bool> checkHealth() async {
    try {
      final res = await _client.get(Uri.parse(ApiConstants.health)).timeout(const Duration(seconds: 4));
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  // Fetch all dustbins
  Future<List<DustbinModel>> getDustbins() async {
    try {
      final res = await _client.get(Uri.parse(ApiConstants.dustbins)).timeout(const Duration(seconds: 6));
      if (res.statusCode == 200) {
        final List<dynamic> data = json.decode(res.body);
        return data.map((json) => DustbinModel.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('ApiService.getDustbins error: $e');
      return [];
    }
  }

  // Fetch citizen reports
  Future<List<PublicReportModel>> getReports() async {
    try {
      final res = await _client.get(Uri.parse(ApiConstants.reports)).timeout(const Duration(seconds: 6));
      if (res.statusCode == 200) {
        final List<dynamic> data = json.decode(res.body);
        return data.map((json) => PublicReportModel.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('ApiService.getReports error: $e');
      return [];
    }
  }

  // Submit new report
  Future<String?> submitReport(PublicReportModel report) async {
    try {
      final res = await _client.post(
        Uri.parse(ApiConstants.reports),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(report.toJson()),
      ).timeout(const Duration(seconds: 8));

      if (res.statusCode == 200 || res.statusCode == 201) {
        final data = json.decode(res.body);
        return data['id'] ?? data['reportId'];
      }
      return null;
    } catch (e) {
      print('ApiService.submitReport error: $e');
      return null;
    }
  }

  // Request 6-digit real OTP
  Future<Map<String, dynamic>> sendOtp(String phone) async {
    try {
      final res = await _client.post(
        Uri.parse(ApiConstants.sendOtp),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'phone': phone}),
      ).timeout(const Duration(seconds: 6));

      if (res.statusCode == 200) {
        return json.decode(res.body);
      }
      return {'success': false, 'error': 'Failed to send OTP'};
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  // Verify OTP
  Future<bool> verifyOtp(String phone, String otp) async {
    try {
      final res = await _client.post(
        Uri.parse(ApiConstants.verifyOtp),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'phone': phone, 'otp': otp}),
      ).timeout(const Duration(seconds: 6));

      if (res.statusCode == 200) {
        final data = json.decode(res.body);
        return data['verified'] == true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  // 1-Click Depth Calibration (30 cm default)
  Future<bool> calibrateDepth(String dustbinId, double emptyHeightCm) async {
    try {
      final res = await _client.post(
        Uri.parse(ApiConstants.calibrate),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'dustbin_id': dustbinId,
          'empty_height_cm': emptyHeightCm,
        }),
      ).timeout(const Duration(seconds: 6));

      return res.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // Mark dustbin as collected
  Future<bool> markCollected(String dustbinId, {String? driverName, String? vehicleNumber}) async {
    try {
      final res = await _client.post(
        Uri.parse(ApiConstants.dustbinCollect(dustbinId)),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'driver_name': driverName ?? 'Ramesh Kumar',
          'vehicle_number': vehicleNumber ?? 'KA-20-EA-4412',
        }),
      ).timeout(const Duration(seconds: 6));

      return res.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}
