import { useRef, useState, useCallback } from "react";
import html2canvas from "html2canvas";
import { CoverageMetricsSection } from "./sections/CoverageMetricsSection";
import { DataInputPanel } from "./sections/DataInputPanel";
import { generateDashboardHtml } from "@/lib/generateHtml";
import { Download, FileCode, TableProperties } from "lucide-react";

export interface CoverageRow {
  label: string;
  routePercent: string;
  successRate: string;
  percentile: string;
}

export interface DashboardData {
  playerName: string;
  rows: CoverageRow[];
}

const defaultData: DashboardData = {
  playerName: "Luther Burden III",
  rows: [
    { label: "MAN", routePercent: "47.5%", successRate: "68.4%", percentile: "44th" },
    { label: "ZONE", routePercent: "47.5%", successRate: "68.4%", percentile: "44th" },
    { label: "PRESS", routePercent: "47.5%", successRate: "68.4%", percentile: "44th" },
    { label: "DOUBLE", routePercent: "47.5%", successRate: "68.4%", percentile: "44th" },
  ],
};

function clipRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.clip();
}

export const CoverageDashboard = (): JSX.Element => {
  const [data, setData] = useState<DashboardData>(defaultData);
  const [panelOpen, setPanelOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const handleExport = useCallback(async () => {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const source = await html2canvas(exportRef.current, {
        backgroundColor: null,
        scale: 4,
        useCORS: true,
        logging: false,
      });

      const TW = 3840;
      const TH = 2560;
      const RADIUS = 128;

      const out = document.createElement("canvas");
      out.width = TW;
      out.height = TH;
      const ctx = out.getContext("2d")!;

      // Transparent rounded-corner clip
      clipRoundRect(ctx, 0, 0, TW, TH, RADIUS);

      // Background fill inside the clip
      ctx.fillStyle = "#faf6ec";
      ctx.fillRect(0, 0, TW, TH);

      // Scale + center source content
      const scale = Math.min(TW / source.width, TH / source.height);
      const drawW = source.width * scale;
      const drawH = source.height * scale;
      ctx.drawImage(source, (TW - drawW) / 2, (TH - drawH) / 2, drawW, drawH);

      const link = document.createElement("a");
      const safeName = data.playerName.replace(/\s+/g, "_").toUpperCase();
      link.download = `${safeName}_coverage.png`;
      link.href = out.toDataURL("image/png");
      link.click();
    } finally {
      setExporting(false);
    }
  }, [data.playerName]);

  const handleExportHtml = useCallback(() => {
    const html = generateDashboardHtml(data);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const link = document.createElement("a");
    const safeName = data.playerName.replace(/\s+/g, "_").toUpperCase();
    link.download = `${safeName}_coverage.html`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }, [data]);

  return (
    <div className="min-h-screen bg-[#faf6ec]">
      <div className="sticky top-0 z-20 flex items-center justify-end gap-2 bg-[#faf6ec]/90 backdrop-blur px-4 py-2 border-b border-[#e8dfc8]">
        <button
          data-testid="button-toggle-input"
          onClick={() => setPanelOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-md bg-[#3d5851] px-3 py-1.5 text-[11px] font-medium tracking-[1.2px] text-[#faf6ec] hover:bg-[#2e433d] transition-colors [font-family:'Gotham-Medium',Helvetica]"
        >
          <TableProperties size={14} />
          {panelOpen ? "HIDE DATA" : "EDIT DATA"}
        </button>
        <button
          data-testid="button-export-png"
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-md bg-[#dda13b] px-3 py-1.5 text-[11px] font-medium tracking-[1.2px] text-[#2a1f0e] hover:bg-[#c8912e] transition-colors disabled:opacity-60 [font-family:'Gotham-Medium',Helvetica]"
        >
          <Download size={14} />
          {exporting ? "EXPORTING…" : "EXPORT PNG"}
        </button>
        <button
          data-testid="button-export-html"
          onClick={handleExportHtml}
          className="inline-flex items-center gap-2 rounded-md bg-[#4a6fa5] px-3 py-1.5 text-[11px] font-medium tracking-[1.2px] text-white hover:bg-[#3b5a8a] transition-colors [font-family:'Gotham-Medium',Helvetica]"
        >
          <FileCode size={14} />
          EXPORT HTML
        </button>
      </div>

      {panelOpen && (
        <div className="border-b border-[#e8dfc8] bg-white px-4 py-4">
          <DataInputPanel data={data} onChange={setData} />
        </div>
      )}

      <div className="flex justify-center bg-[#faf6ec]">
        <div ref={exportRef} className="w-full max-w-[960px] bg-[#faf6ec]">
          <main className="w-full">
            <div className="flex w-full flex-col items-center gap-5 px-6 py-10 md:px-12">
              <section className="w-full" aria-label="Coverage metrics">
                <CoverageMetricsSection rows={data.rows} />
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
