import { useState } from "react";
import { Link2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { DashboardData, CoverageRow } from "../CoverageDashboard";

declare global {
  interface Window {
    RPCoverageDashboard?: {
      sheetsEndpoint: string;
      nonce?: string;
    };
  }
}

const getSheetsEndpoint = () =>
  window.RPCoverageDashboard?.sheetsEndpoint ?? "/api/sheets";

const getWpHeaders = (): Record<string, string> => {
  const nonce = window.RPCoverageDashboard?.nonce;
  return nonce ? { "X-WP-Nonce": nonce } : {};
};

interface Props {
  data: DashboardData;
  onChange: (data: DashboardData) => void;
}

const headerCell =
  "px-3 py-2 text-left text-[9.5px] font-bold tracking-[1.5px] text-[#faf6ec] [font-family:'Gotham-Bold',Helvetica] bg-[#3d5851]";
const inputClass =
  "w-full bg-transparent text-[12px] text-[#1f1a14] [font-family:'Gotham-Medium',Helvetica] outline-none border border-transparent focus:border-[#dda13b] focus:bg-[#fdf9f0] rounded px-1.5 py-1 transition-colors placeholder:text-[#bbb]";

export const DataInputPanel = ({ data, onChange }: Props): JSX.Element => {
  const [sheetUrl, setSheetUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  const [importMessage, setImportMessage] = useState("");

  const updateRow = (index: number, field: keyof CoverageRow, value: string) => {
    const newRows = data.rows.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );
    onChange({ ...data, rows: newRows });
  };

  const updatePlayerName = (value: string) => {
    onChange({ ...data, playerName: value });
  };

  const handleImportSheet = async () => {
    const url = sheetUrl.trim();
    if (!url) return;
    setImporting(true);
    setImportStatus("idle");
    setImportMessage("");
    try {
      const sheetsEndpoint = getSheetsEndpoint();
      const separator = sheetsEndpoint.includes("?") ? "&" : "?";
      const res = await fetch(
        `${sheetsEndpoint}${separator}url=${encodeURIComponent(url)}`,
        { headers: getWpHeaders() }
      );
      const json = await res.json();
      if (!res.ok) {
        setImportStatus("error");
        setImportMessage(json.error ?? "Unknown error");
      } else {
        onChange({
          playerName: json.playerName || data.playerName,
          rows: json.rows?.length ? json.rows : data.rows,
        });
        setImportStatus("success");
        setImportMessage(
          `Imported ${json.rows?.length ?? 0} rows${json.playerName ? ` for ${json.playerName}` : ""}.`
        );
      }
    } catch {
      setImportStatus("error");
      setImportMessage("Could not reach the server. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[900px]">

      {/* Google Sheet Import strip */}
      <div className="mb-4 rounded-[4px] border border-[#c4cdaf] bg-[#f5f2ea] px-3 py-2.5">
        <div className="mb-1.5 flex items-center gap-1.5">
          <Link2 size={11} className="text-[#6b6357]" />
          <span className="text-[9.5px] font-bold tracking-[1.8px] text-[#6b6357] [font-family:'Gotham-Bold',Helvetica]">
            IMPORT FROM GOOGLE SHEET
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            data-testid="input-sheet-url"
            type="text"
            value={sheetUrl}
            onChange={(e) => {
              setSheetUrl(e.target.value);
              setImportStatus("idle");
              setImportMessage("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleImportSheet()}
            placeholder="Paste your public Google Sheet URL here…"
            className="flex-1 rounded border border-[#c9b89a] bg-white px-2 py-1.5 text-[12px] text-[#1f1a14] [font-family:'Gotham-Medium',Helvetica] outline-none focus:border-[#3d5851] placeholder:text-[#bbb]"
          />
          <button
            data-testid="button-import-sheet"
            onClick={handleImportSheet}
            disabled={importing || !sheetUrl.trim()}
            className="inline-flex items-center gap-1.5 rounded bg-[#3d5851] px-3 py-1.5 text-[10px] font-bold tracking-[1.2px] text-[#faf6ec] hover:bg-[#2e433d] disabled:opacity-50 transition-colors [font-family:'Gotham-Bold',Helvetica] whitespace-nowrap"
          >
            {importing ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Link2 size={12} />
            )}
            {importing ? "IMPORTING…" : "IMPORT"}
          </button>
        </div>
        {importStatus !== "idle" && (
          <div className={`mt-1.5 flex items-center gap-1.5 text-[10.5px] [font-family:'Gotham-Medium',Helvetica] ${
            importStatus === "success" ? "text-[#609c63]" : "text-[#d15650]"
          }`}>
            {importStatus === "success"
              ? <CheckCircle2 size={12} />
              : <AlertCircle size={12} />}
            {importMessage}
          </div>
        )}
        <p className="mt-1.5 text-[9px] text-[#9b8f82] [font-family:'Gotham-Medium',Helvetica]">
          Sheet must be set to <strong>Anyone with the link can view</strong>. Expected columns: A = Coverage Type, B = % of Routes, C = Success Rate, D = Percentile, E = Player name (row 2).
        </p>
      </div>

      {/* Manual input */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-[2px] text-[#6b6357] [font-family:'Gotham-Bold',Helvetica]">
          MANUAL INPUT
        </span>
        <div className="flex items-center gap-2">
          <label className="text-[10px] tracking-[1.5px] text-[#6b6357] [font-family:'Gotham-Medium',Helvetica]">
            PLAYER:
          </label>
          <input
            data-testid="input-player-name"
            type="text"
            value={data.playerName}
            onChange={(e) => updatePlayerName(e.target.value)}
            className="rounded border border-[#c9b89a] bg-white px-2 py-1 text-[12px] text-[#1f1a14] [font-family:'Gotham-Medium',Helvetica] outline-none focus:border-[#dda13b] w-[180px]"
            placeholder="Player name"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-[4px] border border-[#c9b89a]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={`${headerCell} w-[140px]`}>COVERAGE TYPE</th>
              <th className={`${headerCell} w-[160px]`}>% OF ROUTES</th>
              <th className={`${headerCell} w-[160px]`}>SUCCESS RATE</th>
              <th className={`${headerCell} w-[120px]`}>PERCENTILE</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-[#faf8f3]"}>
                <td className="border-t border-[#e8dfc8] px-3 py-2">
                  <span className="text-[12px] font-medium text-[#3d5851] [font-family:'Gotham-Medium',Helvetica]">
                    {row.label}
                  </span>
                </td>
                <td className="border-t border-[#e8dfc8] px-3 py-1.5">
                  <input
                    data-testid={`input-route-${row.label.toLowerCase()}`}
                    type="text"
                    value={row.routePercent}
                    onChange={(e) => updateRow(i, "routePercent", e.target.value)}
                    className={inputClass}
                    placeholder="e.g. 28.7%"
                  />
                </td>
                <td className="border-t border-[#e8dfc8] px-3 py-1.5">
                  <input
                    data-testid={`input-success-${row.label.toLowerCase()}`}
                    type="text"
                    value={row.successRate}
                    onChange={(e) => updateRow(i, "successRate", e.target.value)}
                    className={inputClass}
                    placeholder="e.g. 71.1%"
                  />
                </td>
                <td className="border-t border-[#e8dfc8] px-3 py-1.5">
                  <input
                    data-testid={`input-percentile-${row.label.toLowerCase()}`}
                    type="text"
                    value={row.percentile}
                    onChange={(e) => updateRow(i, "percentile", e.target.value)}
                    className={inputClass}
                    placeholder="e.g. 65th or -"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[9.5px] tracking-[0.5px] text-[#9b8f82] [font-family:'Gotham-Medium',Helvetica]">
        Changes update the dashboard in real time.
      </p>
    </div>
  );
};
