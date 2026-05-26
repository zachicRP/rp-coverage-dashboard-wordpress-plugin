import type { DashboardData, CoverageRow } from "@/pages/CoverageDashboard";

const getQuartileColor = (value: number): string => {
  if (value >= 75) return "#609c63";
  if (value >= 50) return "#e3ca61";
  if (value >= 25) return "#e4a345";
  return "#d15650";
};

const getQuartileTrackColor = (value: number): string => {
  if (value >= 75) return "#cad7b1";
  if (value >= 50) return "#f0e9a0";
  if (value >= 25) return "#f5ddb0";
  return "#f0c0be";
};

const parsePercent = (val: string): number => {
  const n = parseFloat(val.replace("%", ""));
  return isNaN(n) ? 0 : Math.min(100, Math.max(0, n));
};

const hasPercent = (val: string): boolean => !isNaN(parseFloat(val.replace("%", "")));

const parsePercentile = (val: string): number => {
  const match = val.match(/\d+/);
  if (!match) return -1;
  return Math.min(100, Math.max(0, parseInt(match[0], 10)));
};

const formatPercentile = (val: string): string => {
  if (!val || val.trim() === "-") return "-";
  return val.toUpperCase();
};

const svgRing = (value: number, color: string): string => {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const track = getQuartileTrackColor(value);
  return `
    <svg viewBox="0 0 100 100" width="120" height="120" style="display:block;">
      <g transform="rotate(-90 50 50)">
        <circle cx="50" cy="50" r="${r}" fill="none" stroke="${track}" stroke-width="9"/>
        <circle cx="50" cy="50" r="${r}" fill="none" stroke="${color}" stroke-width="9"
          stroke-dasharray="${circ.toFixed(2)}" stroke-dashoffset="${isNaN(offset) ? circ.toFixed(2) : offset.toFixed(2)}"
          stroke-linecap="round"/>
      </g>
      <text x="50" y="50" text-anchor="middle" dominant-baseline="central"
        fill="${color}" font-size="12" font-family="Helvetica,Arial,sans-serif" font-weight="600">${value.toFixed(1)}%</text>
    </svg>`;
};

const tableRow = (row: CoverageRow, idx: number): string => {
  const routeVal = parsePercent(row.routePercent);
  const successVal = parsePercent(row.successRate);
  const pctileNum = parsePercentile(row.percentile);
  const pctileColor = pctileNum >= 0 ? getQuartileColor(pctileNum) : "#c9b89a";
  const borderTop = idx > 0 ? "border-top:1px solid #f0e8d8;" : "";

  return `
    <div style="display:flex;align-items:center;padding:12px 22px;${borderTop}">
      <div style="flex:0 0 120px;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#1f1a14;">${row.label}</div>
      <div style="flex:2.1;display:flex;align-items:center;gap:14px;padding-right:18px;">
        <div style="flex:1;display:flex;height:8px;border-radius:4px;overflow:hidden;background:${getQuartileTrackColor(routeVal)};">
          <div style="width:${routeVal}%;background:${getQuartileColor(routeVal)};border-radius:4px;flex-shrink:0;"></div>
        </div>
        <span style="font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;color:${getQuartileColor(routeVal)};min-width:42px;">${row.routePercent}</span>
      </div>
      <div style="flex:2.1;display:flex;align-items:center;gap:14px;padding-left:18px;border-left:1px solid #c9b89a;">
        ${hasPercent(row.successRate)
          ? `<div style="flex:1;display:flex;height:8px;border-radius:4px;overflow:hidden;background:${getQuartileTrackColor(successVal)};">
          <div style="width:${successVal}%;background:${getQuartileColor(successVal)};border-radius:4px;flex-shrink:0;"></div>
        </div>
        <span style="font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;color:${getQuartileColor(successVal)};min-width:42px;">${row.successRate}</span>`
          : `<span style="font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;color:#c9b89a;">-</span>`}
      </div>
      <div style="flex:0 0 80px;display:flex;justify-content:flex-end;">
        ${pctileNum >= 0
          ? `<span style="background:${pctileColor};color:#fff;border-radius:999px;padding:5px 10px;display:inline-flex;align-items:center;justify-content:center;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;">${formatPercentile(row.percentile)}</span>`
          : `<span style="font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;color:#c9b89a;">-</span>`}
      </div>
    </div>`;
};

const card = (row: CoverageRow): string => {
  const routeVal = parsePercent(row.routePercent);
  const successVal = parsePercent(row.successRate);
  const ringColor = getQuartileColor(routeVal);
  const successColor = getQuartileColor(successVal);
  const successTrack = getQuartileTrackColor(successVal);

  return `
    <div style="background:#ffffff;border-radius:6px;border:1.5px solid rgba(61,88,81,0.24);padding:12px 14px;">
      <div style="text-align:center;margin-bottom:8px;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#1f1a14;">${row.label}</div>
      <div style="text-align:center;margin-bottom:14px;">${svgRing(routeVal, ringColor)}</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:1.5px;color:#6b6357;margin-bottom:4px;">SUCCESS RATE</div>
      ${hasPercent(row.successRate)
        ? `<div style="display:flex;align-items:center;gap:8px;">
        <div style="flex:1;height:7px;border-radius:4px;overflow:hidden;background:${successTrack};">
          <div style="width:${successVal}%;height:100%;background:${successColor};border-radius:4px;"></div>
        </div>
        <span style="font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;color:${successColor};min-width:36px;text-align:right;">${row.successRate}</span>
      </div>`
        : `<div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;color:#c9b89a;">-</div>`}
    </div>`;
};

const sectionHeading = (): string => `
  <div style="display:flex;flex-direction:column;align-items:center;gap:16px;margin-bottom:40px;">
    <div style="text-align:center;line-height:0.9;">
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:60px;font-weight:500;color:#3d584e;letter-spacing:-2px;">SUCCESS RATE</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:60px;font-weight:900;color:#3d584e;letter-spacing:-2px;">VS. COVERAGE</div>
    </div>
    <div style="height:2px;width:52px;background:#b9aed3;border-radius:2px;"></div>
  </div>`;

export const generateDashboardHtml = (data: DashboardData): string => {
  const rows = data.rows.map((row, i) => tableRow(row, i)).join("");
  const cards = data.rows.map((row) => card(row)).join("");

  return `<!-- Coverage Dashboard: ${data.playerName} -->
<div style="background:#faf6ec;max-width:960px;margin:0 auto;padding:40px 48px 32px;box-sizing:border-box;">

  ${sectionHeading()}

  <!-- Table -->
  <div style="border:1.5px solid rgba(61,88,81,0.24);border-radius:6px;overflow:hidden;margin-bottom:40px;">
    <div style="display:flex;align-items:center;background:#3d5851;padding:0 22px;min-height:45px;">
      <div style="flex:0 0 120px;font-family:Helvetica,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.8px;color:#faf6ec;">COVERAGE</div>
      <div style="flex:2.1;font-family:Helvetica,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.8px;color:#faf6ec;">% OF ROUTES</div>
      <div style="flex:2.1;font-family:Helvetica,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.8px;color:#faf6ec;">SUCCESS RATE</div>
      <div style="flex:0 0 80px;font-family:Helvetica,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.8px;color:#faf6ec;text-align:right;">PCTILE</div>
    </div>
    <div style="background:#ffffff;">${rows}</div>
  </div>

  <!-- Cards -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:11px;">${cards}</div>

</div>
<!-- End Coverage Dashboard -->`;
};
