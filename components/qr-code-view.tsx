"use client";

import { useRef, useState } from "react";
import QRCode from "react-qr-code";
import { Download, Loader2 } from "lucide-react";
import { downloadQRCodeFromSvg } from "@/lib/qr-code";

export interface QRCodeViewProps {
  data: string;
  width?: number;
  height?: number;
  size?: number;
  showDownload?: boolean;
  fileName?: string;
  className?: string;
  bgColor?: string;
  fgColor?: string;
  level?: "L" | "M" | "Q" | "H";
  overrides?: Record<string, any>;
}

export function QRCodeView({
  data,
  size = 280,
  showDownload = false,
  fileName = "eventkey-pass",
  className = "",
  bgColor = "#FFFFFF",
  fgColor = "#000000",
  level = "Q",
}: QRCodeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const qrSize = size || 280;

  const handleDownload = async () => {
    if (!data || !containerRef.current) return;
    const svgElement = containerRef.current.querySelector("svg");
    if (!svgElement) return;

    setDownloading(true);
    try {
      await downloadQRCodeFromSvg(svgElement, fileName, 500);
    } catch (err) {
      console.error("Failed to download QR code:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl ${className}`}
    >
      <div className="relative flex items-center justify-center">
        <div ref={containerRef} className="rounded-xl overflow-hidden bg-white p-2">
          {data ? (
            <QRCode
              value={data}
              size={qrSize}
              bgColor={bgColor}
              fgColor={fgColor}
              level={level}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-xs text-muted-foreground">
              No Data
            </div>
          )}
        </div>
      </div>

      {showDownload && (
        <button
          onClick={handleDownload}
          disabled={!data || downloading}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 active:scale-95 transition-all rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Download QR Pass
        </button>
      )}
    </div>
  );
}

