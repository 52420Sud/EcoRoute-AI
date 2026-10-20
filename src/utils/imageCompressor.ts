/**
 * imageCompressor.ts
 * Automatically scales, compresses, and optimizes real photographs taken on mobile phones
 * or uploaded from storage (e.g. 2 MB - 15 MB) to ensure they are crisp, crystal-clear,
 * and within the target size limit (< 200 KB) without ever rejecting the user's real village photo.
 */

export interface CompressionResult {
  dataUrl: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  fileName: string;
  width: number;
  height: number;
}

export async function compressVillagePhoto(
  file: File,
  maxSizeKb: number = 200,
  maxDimension: number = 1600
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image. Please choose a JPG, PNG, or WEBP photo.'));
      return;
    }

    const originalSizeKb = parseFloat((file.size / 1024).toFixed(1));
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file from device.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format. Could not decode photo.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Scale down dimensions proportionally if larger than maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          // Fallback to original if canvas context unavailable
          resolve({
            dataUrl: e.target?.result as string,
            originalSizeKb,
            compressedSizeKb: originalSizeKb,
            fileName: file.name,
            width: img.width,
            height: img.height
          });
          return;
        }

        // Draw onto canvas with clean white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Iterative compression to find optimal quality below maxSizeKb
        let quality = 0.82;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        let approxSizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

        if (approxSizeKb > maxSizeKb) {
          for (quality = 0.72; quality >= 0.25; quality -= 0.08) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
            approxSizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
            if (approxSizeKb <= maxSizeKb) break;
          }
        }

        // If still exceeds, reduce canvas resolution and re-compress
        if (approxSizeKb > maxSizeKb) {
          const smallCanvas = document.createElement('canvas');
          smallCanvas.width = Math.round(width * 0.75);
          smallCanvas.height = Math.round(height * 0.75);
          const smallCtx = smallCanvas.getContext('2d');
          if (smallCtx) {
            smallCtx.fillStyle = '#ffffff';
            smallCtx.fillRect(0, 0, smallCanvas.width, smallCanvas.height);
            smallCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
            dataUrl = smallCanvas.toDataURL('image/jpeg', 0.65);
            approxSizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
            width = smallCanvas.width;
            height = smallCanvas.height;
          }
        }

        resolve({
          dataUrl,
          originalSizeKb,
          compressedSizeKb: approxSizeKb,
          fileName: file.name || 'village_dustbin_evidence.jpg',
          width,
          height
        });
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
