export interface QRCodeOptions {
  data: string;
  size?: number;
  width?: number;
  height?: number;
  bgColor?: string;
  fgColor?: string;
  level?: "L" | "M" | "Q" | "H";
}

/**
 * Utility to download an SVG QR Code element as a PNG image.
 */
export async function downloadQRCodeFromSvg(
  svgElement: SVGElement,
  fileName: string = "eventkey-pass",
  exportSize: number = 500
): Promise<void> {
  if (typeof window === "undefined" || !svgElement) return;

  const svgData = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = exportSize;
        canvas.height = exportSize;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, exportSize, exportSize);
          ctx.drawImage(img, 0, 0, exportSize, exportSize);
          const pngUrl = canvas.toDataURL("image/png");
          const a = document.createElement("a");
          const name = fileName.endsWith(".png") ? fileName : `${fileName}.png`;
          a.download = name;
          a.href = pngUrl;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        URL.revokeObjectURL(url);
        resolve();
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

