/**
 * Rasterize an SVG string to a PNG data URL via canvas.
 * Used for scramble thumbnails so sizing is controlled by CSS on <img>.
 */
export function svgToPngUrl(svg: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(svgUrl);
        reject(new Error('Canvas 2d context not available'));
        return;
      }
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      ctx.drawImage(img, 0, 0);
      const pngBase64 = canvas.toDataURL('image/png');
      URL.revokeObjectURL(svgUrl);
      resolve(pngBase64);
    };

    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error('Error loading SVG image'));
    };

    img.src = svgUrl;
  });
}
