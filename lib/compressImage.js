/**
 * Compress and resize an image file client-side using the Canvas API.
 *
 * Resizes to at most `maxPx` on the longest side, then re-encodes as JPEG.
 * Falls back to the original file if anything goes wrong.
 *
 * @param {File} file
 * @param {{ maxPx?: number, quality?: number }} options
 * @returns {Promise<{ file: File, originalSize: number, compressedSize: number }>}
 */
export function compressImage(file, { maxPx = 1200, quality = 0.82 } = {}) {
  return new Promise((resolve) => {
    const originalSize = file.size;

    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Only scale down, never up
      if (width > maxPx || height > maxPx) {
        if (width >= height) {
          height = Math.round((height / width) * maxPx);
          width  = maxPx;
        } else {
          width  = Math.round((width / height) * maxPx);
          height = maxPx;
        }
      }

      const canvas  = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({ file, originalSize, compressedSize: originalSize });
            return;
          }

          // Preserve original filename, but always .jpg after compression
          const baseName = file.name.replace(/\.[^.]+$/, "");
          const compressed = new File([blob], `${baseName}.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          resolve({
            file:           compressed,
            originalSize,
            compressedSize: compressed.size,
          });
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Fallback — return the original file unchanged
      resolve({ file, originalSize, compressedSize: originalSize });
    };

    img.src = objectUrl;
  });
}

/** Format bytes as a human-readable string: "3.2 MB", "420 KB" */
export function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024)        return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}
