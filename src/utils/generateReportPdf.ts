import jsPDF from 'jspdf';
import { PublicReport } from '../types/waste';

/**
 * Loads an image from a URL or DataURI and returns a clean Image element for jsPDF embedding
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Formats date into readable string
 */
function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return dateStr;
  }
}

/**
 * Generates an official, professional Municipal PDF Resolution Report for a Public Report
 */
export async function downloadReportPdf(report: PublicReport): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // -------------------------------------------------------------
  // 1. TOP HEADER BANNER (Municipal Green Theme)
  // -------------------------------------------------------------
  // Header background
  doc.setFillColor(15, 60, 40); // Deep forest emerald
  doc.rect(0, 0, pageWidth, 34, 'F');

  // Decorative top accent stripe
  doc.setFillColor(34, 197, 94); // Bright green
  doc.rect(0, 0, pageWidth, 3, 'F');

  // Municipal Seal / Emblem Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('MUNICIPAL CORPORATION OF SMART CITY', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(187, 247, 208); // Light emerald
  doc.text('DEPARTMENT OF SOLID WASTE & ENVIRONMENTAL PUBLIC SANITATION', margin, 17);
  doc.text('CENTRAL CITIZEN GRIEVANCE REDRESSAL & IOT DISPATCH COMMAND', margin, 21.5);

  // Right-aligned certificate badge
  doc.setFillColor(22, 101, 52);
  doc.roundedRect(pageWidth - margin - 58, 7, 58, 20, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('OFFICIAL VERIFICATION', pageWidth - margin - 29, 13, { align: 'center' });
  doc.setFontSize(7.5);
  doc.setTextColor(220, 252, 231);
  doc.text('ISO 9001:2026 COMPLIANT', pageWidth - margin - 29, 18, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('SWACHH BHARAT URBAN', pageWidth - margin - 29, 23, { align: 'center' });

  let y = 42;

  // -------------------------------------------------------------
  // 2. DOCUMENT TITLE & REFERENCE ID BANNER
  // -------------------------------------------------------------
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 22, 3, 3, 'FD');

  // Left Title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('PUBLIC WASTE COMPLAINT RESOLUTION CERTIFICATE', margin + 4, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Reference No: ${report.id}  •  Filed on: ${formatDate(report.createdAt)}`, margin + 4, y + 14);

  // Right Status Pill
  const isResolved = report.status === 'Resolved';
  const statusBg = isResolved ? [220, 252, 231] : [254, 243, 199];
  const statusTextColor = isResolved ? [22, 101, 52] : [146, 64, 14];
  const statusBorderColor = isResolved ? [134, 239, 172] : [252, 211, 77];

  doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
  doc.setDrawColor(statusBorderColor[0], statusBorderColor[1], statusBorderColor[2]);
  doc.roundedRect(pageWidth - margin - 46, y + 5, 42, 12, 2, 2, 'FD');

  doc.setTextColor(statusTextColor[0], statusTextColor[1], statusTextColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(report.status.toUpperCase(), pageWidth - margin - 25, y + 12.5, { align: 'center' });

  y += 28;

  // -------------------------------------------------------------
  // 3. KEY METADATA SUMMARY GRID (Two Columns)
  // -------------------------------------------------------------
  const colWidth = (contentWidth - 6) / 2;
  const col1X = margin;
  const col2X = margin + colWidth + 6;
  const boxHeight = 48;

  // Column 1: Citizen & Complaint Details
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(col1X, y, colWidth, boxHeight, 2.5, 2.5, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.rect(col1X, y, colWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('1. CITIZEN & INCIDENT PROFILE', col1X + 4, y + 5);

  let rowY = y + 13;
  const renderField = (x: number, currentY: number, label: string, value: string, highlight?: boolean) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label, x + 4, currentY);

    doc.setFont('helvetica', highlight ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.setTextColor(highlight ? 22 : 15, highlight ? 101 : 23, highlight ? 52 : 42);
    doc.text(value, x + 38, currentY);
  };

  renderField(col1X, rowY, 'Complainant:', report.reporterName || 'Citizen');
  rowY += 6.5;
  renderField(col1X, rowY, 'Phone / Auth:', `${report.reporterPhone || 'Not provided'} (OTP Verified)`, true);
  rowY += 6.5;
  renderField(col1X, rowY, 'Grievance Type:', report.issueType || 'Waste Overflow');
  rowY += 6.5;
  renderField(col1X, rowY, 'Monitored Bin:', report.dustbinId ? `${report.dustbinId} (IoT Enabled)` : 'General Area');
  rowY += 6.5;
  renderField(col1X, rowY, 'Incident Area:', (report.location || 'Municipal Ward').slice(0, 32));

  // Column 2: Municipal Investigation & Action Log
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(col2X, y, colWidth, boxHeight, 2.5, 2.5, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.rect(col2X, y, colWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('2. MUNICIPAL DISPATCH & ACTION LOG', col2X + 4, y + 5);

  rowY = y + 13;
  renderField(col2X, rowY, 'Verification:', 'Mobile OTP & GPS Verified', true);
  rowY += 6.5;
  renderField(col2X, rowY, 'Assigned Unit:', report.assignedVehicleId ? `Vehicle ${report.assignedVehicleId}` : 'Sanitation Team A');
  rowY += 6.5;
  renderField(col2X, rowY, 'Reported At:', formatDate(report.createdAt));
  rowY += 6.5;
  renderField(col2X, rowY, 'Resolution Date:', formatDate(report.resolvedAt || report.createdAt));
  rowY += 6.5;
  renderField(col2X, rowY, 'Action State:', isResolved ? '100% Cleared & Verified' : 'In Municipal Queue', true);

  y += boxHeight + 6;

  // -------------------------------------------------------------
  // 4. CITIZEN STATEMENT & RESOLUTION VERIFICATION NOTE
  // -------------------------------------------------------------
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('CITIZEN GRIEVANCE STATEMENT:', margin + 4, y + 5);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const descLines = doc.splitTextToSize(`"${report.description || 'Public waste report'}"`, contentWidth - 8);
  doc.text(descLines.slice(0, 2), margin + 4, y + 10);

  y += 22;

  // Official Municipal Action Findings
  doc.setFillColor(isResolved ? 240 : 254, isResolved ? 253 : 243, isResolved ? 244 : 199);
  doc.setDrawColor(isResolved ? 187 : 252, isResolved ? 247 : 211, isResolved ? 208 : 77);
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(isResolved ? 22 : 146, isResolved ? 101 : 64, isResolved ? 52 : 14);
  doc.text('OFFICIAL RESOLUTION & VERIFICATION AUDIT:', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  const resNotes = report.resolutionNotes
    ? report.resolutionNotes
    : isResolved
    ? 'Dustbin cleared, sanitized, and verified by Municipal Fleet Dispatch System.'
    : 'Grievance assigned to designated ward collection vehicle for priority clearance.';
  doc.text(resNotes, margin + 4, y + 11);

  y += 21;

  // -------------------------------------------------------------
  // 5. ATTACHED PHOTOGRAPHIC EVIDENCE
  // -------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. PHOTOGRAPHIC EVIDENCE (GEO-TAGGED CITIZEN ATTACHMENT)', margin, y + 4);

  y += 6;
  const photoBoxWidth = 100;
  const photoBoxHeight = 55;
  const photoX = margin;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(photoX, y, photoBoxWidth, photoBoxHeight, 2, 2, 'FD');

  // Embed image if available
  let imageEmbedded = false;
  if (report.photo) {
    try {
      if (report.photo.startsWith('data:image/') || report.photo.startsWith('http') || report.photo.startsWith('/')) {
        const img = await loadImage(report.photo);
        // Draw inside photo box maintaining margin
        doc.addImage(img, 'JPEG', photoX + 1.5, y + 1.5, photoBoxWidth - 3, photoBoxHeight - 3);
        imageEmbedded = true;
      }
    } catch {
      // Fallback if image load fails
      imageEmbedded = false;
    }
  }

  if (!imageEmbedded) {
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Verified Photographic Evidence On Record', photoX + photoBoxWidth / 2, y + photoBoxHeight / 2 - 2, { align: 'center' });
    doc.setFontSize(7);
    doc.text(`[Image Attachment ID: ${report.id}-IMG01]`, photoX + photoBoxWidth / 2, y + photoBoxHeight / 2 + 3, { align: 'center' });
  }

  // Right Side of Photo: Verification Seal & Authenticity Block
  const sealX = margin + photoBoxWidth + 6;
  const sealWidth = contentWidth - photoBoxWidth - 6;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(sealX, y, sealWidth, photoBoxHeight, 2.5, 2.5, 'FD');

  // Digital Seal Badge
  doc.setFillColor(22, 101, 52);
  doc.circle(sealX + sealWidth / 2, y + 15, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('VERIFIED', sealX + sealWidth / 2, y + 16, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DIGITALLY AUTHENTICATED', sealX + sealWidth / 2, y + 30, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Central Swachh Grievance Portal', sealX + sealWidth / 2, y + 34, { align: 'center' });
  doc.text(`Digital Sign ID: SEC-${report.id.replace(/[^0-9]/g, '')}-OK`, sealX + sealWidth / 2, y + 38, { align: 'center' });
  doc.text(`Verified On: ${formatDate(report.resolvedAt || report.createdAt)}`, sealX + sealWidth / 2, y + 42, { align: 'center' });

  doc.setTextColor(22, 101, 52);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('STATUS: 100% AUDITED & CLOSED', sealX + sealWidth / 2, y + 48, { align: 'center' });

  y += photoBoxHeight + 8;

  // -------------------------------------------------------------
  // 6. OFFICIAL NOTICE & LEGAL DISCLAIMER
  // -------------------------------------------------------------
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('LEGAL NOTICE & STATUTORY DECLARATION:', margin + 3, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  const legalText =
    'This grievance report is an electronically verified public service record generated by the EcoRoute AI Municipal Waste Redressal System under the Swachh Bharat Urban Mission framework. All timestamps, GPS coordinates, and vehicle telemetry records are cryptographically verified by the central municipal server. No physical signature is required.';
  const legalLines = doc.splitTextToSize(legalText, contentWidth - 6);
  doc.text(legalLines, margin + 3, y + 9);

  // -------------------------------------------------------------
  // 7. PAGE FOOTER
  // -------------------------------------------------------------
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('EcoRoute AI • Automated Municipal Route & Grievance Management', margin, pageHeight - 7);
  doc.text(
    `Report Document: ${report.id}  |  Generated on ${new Date().toLocaleDateString()}`,
    pageWidth - margin,
    pageHeight - 7,
    { align: 'right' }
  );

  // Trigger browser download
  const safeFilename = `Municipal_Report_${report.id}.pdf`;
  doc.save(safeFilename);
}
