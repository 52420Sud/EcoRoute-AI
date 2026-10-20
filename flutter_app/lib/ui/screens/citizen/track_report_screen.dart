import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/report_model.dart';
import '../../../providers/waste_provider.dart';

class TrackReportScreen extends StatefulWidget {
  final String? initialReportId;
  const TrackReportScreen({super.key, this.initialReportId});

  @override
  State<TrackReportScreen> createState() => _TrackReportScreenState();
}

class _TrackReportScreenState extends State<TrackReportScreen> {
  final TextEditingController _searchController = TextEditingController();
  PublicReportModel? _foundReport;
  bool _hasSearched = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialReportId != null) {
      _searchController.text = widget.initialReportId!;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _searchReport();
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _searchReport() {
    final query = _searchController.text.trim().toLowerCase();
    if (query.isEmpty) return;

    final provider = Provider.of<WasteProvider>(context, listen: false);
    PublicReportModel? match;

    for (final r in provider.reports) {
      if (r.id.toLowerCase() == query || r.reporterPhone.contains(query)) {
        match = r;
        break;
      }
    }

    setState(() {
      _foundReport = match;
      _hasSearched = true;
    });
  }

  Future<void> _generatePdfReceipt(PublicReportModel report) async {
    final pdf = pw.Document();

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        build: (pw.Context context) {
          return pw.Container(
            padding: const pw.EdgeInsets.all(32),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text(
                          'MUNICIPAL WASTE MANAGEMENT AUTHORITY',
                          style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold, color: PdfColors.teal900),
                        ),
                        pw.SizedBox(height: 4),
                        pw.Text(
                          'EcoRoute AI Smart Waste & Dynamic Routing System',
                          style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700),
                        ),
                      ],
                    ),
                    pw.Container(
                      padding: const pw.EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: pw.BoxDecoration(
                        color: PdfColors.teal50,
                        border: pw.Border.all(color: PdfColors.teal800),
                        borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
                      ),
                      child: pw.Text(
                        report.status.toUpperCase(),
                        style: pw.TextStyle(color: PdfColors.teal900, fontWeight: pw.FontWeight.bold, fontSize: 11),
                      ),
                    ),
                  ],
                ),
                pw.Divider(thickness: 1.5, color: PdfColors.teal800),
                pw.SizedBox(height: 16),

                pw.Text('CITIZEN GRIEVANCE ACKNOWLEDGEMENT RECEIPT', style: pw.TextStyle(fontSize: 13, fontWeight: pw.FontWeight.bold)),
                pw.SizedBox(height: 12),

                pw.Table(
                  border: pw.TableBorder.all(color: PdfColors.grey300),
                  children: [
                    pw.TableRow(
                      decoration: const pw.BoxDecoration(color: PdfColors.grey100),
                      children: [
                        pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text('Field', style: pw.TextStyle(fontWeight: pw.FontWeight.bold))),
                        pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text('Details', style: pw.TextStyle(fontWeight: pw.FontWeight.bold))),
                      ],
                    ),
                    _pdfRow('Report ID', report.id),
                    _pdfRow('Filed Date & Time', report.submittedAt),
                    _pdfRow('Complainant Name', report.reporterName),
                    _pdfRow('Complainant Phone', '+91 ${report.reporterPhone} (OTP Verified: Yes)'),
                    _pdfRow('Dustbin Identifier', report.dustbinId ?? 'Unassigned Area'),
                    _pdfRow('Location / Ward', report.location),
                    _pdfRow('Issue Category', report.issueType),
                    _pdfRow('Status', report.status),
                    _pdfRow('Remarks / Notes', report.description.isEmpty ? 'N/A' : report.description),
                  ],
                ),

                pw.SizedBox(height: 24),
                pw.Text('IoT Sensor & Action Tracking:', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 11)),
                pw.SizedBox(height: 8),
                pw.Bullet(text: 'Assigned to Municipal Dynamic Route Optimizer (Hierarchical Nearest Neighbor).'),
                pw.Bullet(text: 'ESP32 Ultrasonic Telemetry calibrated with 30.0 cm base depth threshold.'),
                pw.Bullet(text: 'Fleet collection vehicle dispatched upon critical fill trigger (>70%).'),

                pw.Spacer(),
                pw.Divider(color: PdfColors.grey400),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('EcoRoute AI Autonomous System Receipt', style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey600)),
                    pw.Text('Generated: ${DateFormat('yyyy-MM-dd HH:mm').format(DateTime.now())}', style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey600)),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
      name: 'Grievance_Receipt_${report.id}.pdf',
    );
  }

  pw.TableRow _pdfRow(String label, String value) {
    return pw.TableRow(
      children: [
        pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text(label, style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey800))),
        pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text(value, style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold))),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<WasteProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Track Grievance Status'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Search Input
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      labelText: 'Report ID or Phone Number',
                      hintText: 'e.g. REP-82914 or 9876543210',
                      prefixIcon: const Icon(Icons.search, color: AppTheme.emerald),
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () => _searchController.clear(),
                      ),
                    ),
                    onSubmitted: (_) => _searchReport(),
                  ),
                ),
                const SizedBox(width: 10),
                SizedBox(
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _searchReport,
                    style: ElevatedButton.styleFrom(backgroundColor: AppTheme.emerald),
                    child: const Text('Track'),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),

            if (_foundReport != null) ...[
              _buildReportDetailsCard(_foundReport!),
              const SizedBox(height: 16),
              _buildTimelineCard(_foundReport!),
            ] else if (_hasSearched) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppTheme.cardDark,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Column(
                  children: [
                    Icon(Icons.search_off, size: 48, color: AppTheme.textSecondary),
                    SizedBox(height: 12),
                    Text('No Grievance Record Found', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    SizedBox(height: 4),
                    Text('Check the Report ID or verify your 10-digit mobile number.', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12), textAlign: TextAlign.center),
                  ],
                ),
              ),
            ] else ...[
              const Text('ACTIVE GRIEVANCES', style: TextStyle(color: AppTheme.emerald, fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 1.2)),
              const SizedBox(height: 10),
              if (provider.reports.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(
                    child: Text('No grievances registered in this session.', style: TextStyle(color: AppTheme.textSecondary)),
                  ),
                )
              else
                ...provider.reports.map((rep) => Card(
                      color: AppTheme.cardDark,
                      margin: const EdgeInsets.only(bottom: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: rep.status == 'Resolved' ? AppTheme.emerald.withOpacity(0.2) : AppTheme.amberWarning.withOpacity(0.2),
                          child: Icon(
                            rep.status == 'Resolved' ? Icons.check : Icons.access_time,
                            color: rep.status == 'Resolved' ? AppTheme.emerald : AppTheme.amberWarning,
                            size: 18,
                          ),
                        ),
                        title: Text(rep.id, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                        subtitle: Text('${rep.location} • ${rep.issueType}', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                        trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: AppTheme.textSecondary),
                        onTap: () {
                          setState(() {
                            _foundReport = rep;
                            _searchController.text = rep.id;
                            _hasSearched = true;
                          });
                        },
                      ),
                    )),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildReportDetailsCard(PublicReportModel report) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.cardDark,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.emerald.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                report.id,
                style: const TextStyle(
                  color: AppTheme.emerald,
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                  letterSpacing: 1.2,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: (report.status == 'Resolved' ? AppTheme.emerald : AppTheme.amberWarning).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  report.status.toUpperCase(),
                  style: TextStyle(
                    color: report.status == 'Resolved' ? AppTheme.emerald : AppTheme.amberWarning,
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(report.location, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 4),
          Text('Submitted: ${report.submittedAt}', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
          const Divider(height: 24, color: AppTheme.borderDark),

          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Citizen Name', style: TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
                    const SizedBox(height: 2),
                    Text(report.reporterName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Phone (OTP Verified)', style: TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
                    const SizedBox(height: 2),
                    Text('+91 ${report.reporterPhone}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Issue Category', style: TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
                    const SizedBox(height: 2),
                    Text(report.issueType, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Assigned Dustbin', style: TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
                    const SizedBox(height: 2),
                    Text(report.dustbinId ?? 'Nearby Container', style: const TextStyle(color: AppTheme.emerald, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ],
          ),

          if (report.description.isNotEmpty) ...[
            const SizedBox(height: 12),
            const Text('Citizen Remarks', style: TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
            const SizedBox(height: 2),
            Text(report.description, style: const TextStyle(color: Colors.white70, fontSize: 13)),
          ],

          const SizedBox(height: 16),

          // Download / Print PDF button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => _generatePdfReceipt(report),
              icon: const Icon(Icons.picture_as_pdf),
              label: const Text('Download Official PDF Receipt'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.emerald,
                foregroundColor: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineCard(PublicReportModel report) {
    final stages = [
      {'title': 'Grievance Submitted', 'desc': 'Direct camera photo & OTP verified', 'done': true},
      {'title': 'Verified & Triaged', 'desc': 'Prioritized by Municipal Route Optimizer', 'done': true},
      {'title': 'Driver Route Dispatched', 'desc': 'Included in dynamic nearest-neighbor collection run', 'done': report.status != 'Submitted'},
      {'title': 'Bin Empty & Cleaned', 'desc': 'Driver completed 1-tap collection and telemetry reset', 'done': report.status == 'Resolved'},
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.cardDark,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('PROGRESS TIMELINE', style: TextStyle(color: AppTheme.emerald, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.2)),
          const SizedBox(height: 16),
          ...stages.asMap().entries.map((entry) {
            final idx = entry.key;
            final stage = entry.value;
            final isDone = stage['done'] as bool;
            final isLast = idx == stages.length - 1;

            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isDone ? AppTheme.emerald : AppTheme.surfaceDark,
                        border: Border.all(color: isDone ? AppTheme.emerald : AppTheme.borderDark),
                      ),
                      child: Icon(
                        isDone ? Icons.check : Icons.circle,
                        size: isDone ? 14 : 8,
                        color: isDone ? Colors.white : AppTheme.textSecondary,
                      ),
                    ),
                    if (!isLast)
                      Container(
                        width: 2,
                        height: 36,
                        color: isDone ? AppTheme.emerald : AppTheme.borderDark,
                      ),
                  ],
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        stage['title'] as String,
                        style: TextStyle(
                          color: isDone ? Colors.white : AppTheme.textSecondary,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        stage['desc'] as String,
                        style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                      ),
                      const SizedBox(height: 12),
                    ],
                  ),
                ),
              ],
            );
          }),
        ],
      ),
    );
  }
}
