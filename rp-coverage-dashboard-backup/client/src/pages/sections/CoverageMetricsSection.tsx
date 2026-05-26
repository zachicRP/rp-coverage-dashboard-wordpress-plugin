import type { CoverageRow } from "../CoverageDashboard";

interface Props {
  rows: CoverageRow[];
}

export const getQuartileColor = (value: number): string => {
  if (value >= 75) return "#609c63";
  if (value >= 50) return "#e3ca61";
  if (value >= 25) return "#e4a345";
  return "#d15650";
};

export const getQuartileTrackColor = (value: number): string => {
  if (value >= 75) return "#cad7b1";
  if (value >= 50) return "#f0e9a0";
  if (value >= 25) return "#f5ddb0";
  return "#f0c0be";
};

const parsePercent = (val: string): number => {
  const n = parseFloat(val.replace("%", ""));
  return isNaN(n) ? 0 : Math.min(100, Math.max(0, n));
};

const parsePercentile = (val: string): number => {
  const match = val.match(/\d+/);
  if (!match) return -1;
  return Math.min(100, Math.max(0, parseInt(match[0], 10)));
};

const formatPercentile = (val: string): string => {
  if (!val || val.trim() === "-") return "-";
  return val.toUpperCase();
};

// SVG ring — circles rotated via SVG attribute (not CSS transform, which html2canvas mishandles)
// Text lives outside the rotating <g> so it stays perfectly centered
const CircularRing = ({ value, color }: { value: number; color: string }) => {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const track = getQuartileTrackColor(value);
  return (
    <svg
      viewBox="0 0 100 100"
      width="120"
      height="120"
      style={{ display: "block", margin: "0 auto" }}
    >
      {/* SVG attribute transform — html2canvas handles this correctly */}
      <g transform="rotate(-90 50 50)">
        <circle cx="50" cy="50" r={r} fill="none" stroke={track} strokeWidth="9" />
        <circle
          cx="50" cy="50" r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeDasharray={circ}
          strokeDashoffset={isNaN(offset) ? circ : offset}
          strokeLinecap="round"
        />
      </g>
      {/* Text outside the rotating group — always centered, no transform needed */}
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize="12"
        fontFamily="Helvetica, Arial, sans-serif"
        fontWeight="600"
      >
        {value.toFixed(1)}%
      </text>
    </svg>
  );
};

// Simple progress bar — no absolute positioning
const QuartileBar = ({ value }: { value: number }) => {
  const color = getQuartileColor(value);
  const track = getQuartileTrackColor(value);
  return (
    <div style={{ display: "flex", height: "8px", borderRadius: "4px", overflow: "hidden", backgroundColor: track, width: "100%" }}>
      <div style={{ width: `${value}%`, backgroundColor: color, borderRadius: "4px", flexShrink: 0 }} />
    </div>
  );
};

const SectionHeading = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
    <div style={{ textAlign: "center", lineHeight: "0.9" }}>
      <div style={{ fontSize: "42px", letterSpacing: "-1px", color: "#3d584e", fontFamily: "'Gotham-Medium', Helvetica, Arial, sans-serif", fontWeight: 500 }}>
        SUCCESS RATE
      </div>
      <div style={{ fontSize: "42px", letterSpacing: "-1px", color: "#3d584e", fontFamily: "'Gotham-Black', Helvetica, Arial, sans-serif", fontWeight: 900 }}>
        VS. COVERAGE
      </div>
    </div>
    <div style={{ height: "2px", width: "52px", borderRadius: "2px", backgroundColor: "#b9aed3" }} />
  </div>
);

export const CoverageMetricsSection = ({ rows }: Props): JSX.Element => {
  return (
    <section style={{ width: "100%" }}>
      <div style={{ margin: "0 auto", width: "100%", maxWidth: "900px", display: "flex", flexDirection: "column", alignItems: "center", gap: "40px" }}>

        <SectionHeading />

        {/* Table — real border, html2canvas-safe */}
        <div style={{ width: "100%", border: "1.5px solid rgba(61,88,81,0.24)", borderRadius: "6px", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", backgroundColor: "#3d5851", padding: "0 22px", minHeight: "45px" }}>
            <div style={{ flex: "0 0 120px", fontFamily: "Helvetica, Arial, sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "1.8px", color: "#faf6ec" }}>COVERAGE</div>
            <div style={{ flex: "2.1", fontFamily: "Helvetica, Arial, sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "1.8px", color: "#faf6ec" }}>% OF ROUTES</div>
            <div style={{ flex: "2.1", fontFamily: "Helvetica, Arial, sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "1.8px", color: "#faf6ec" }}>SUCCESS RATE</div>
            <div style={{ flex: "0 0 80px", fontFamily: "Helvetica, Arial, sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "1.8px", color: "#faf6ec", textAlign: "right" }}>PCTILE</div>
          </div>
          {/* Rows */}
          <div style={{ backgroundColor: "#ffffff" }}>
            {rows.map((row, idx) => {
              const routeVal = parsePercent(row.routePercent);
              const successVal = parsePercent(row.successRate);
              const pctileNum = parsePercentile(row.percentile);
              const pctileColor = pctileNum >= 0 ? getQuartileColor(pctileNum) : "#c9b89a";
              const borderTop = idx > 0 ? "1px solid #f0e8d8" : "none";
              return (
                <div key={row.label} style={{ display: "flex", alignItems: "center", padding: "12px 22px", borderTop }}>
                  <div style={{ flex: "0 0 120px", fontFamily: "Helvetica, Arial, sans-serif", fontSize: "15px", fontWeight: 600, color: "#1f1a14" }}>
                    {row.label}
                  </div>
                  <div style={{ flex: "2.1", display: "flex", alignItems: "center", gap: "14px", paddingRight: "18px" }}>
                    <div style={{ flex: 1 }}><QuartileBar value={routeVal} /></div>
                    <div style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "13px", fontWeight: 600, color: getQuartileColor(routeVal), minWidth: "42px" }}>
                      {row.routePercent}
                    </div>
                  </div>
                  <div style={{ flex: "2.1", display: "flex", alignItems: "center", gap: "14px", paddingLeft: "18px", borderLeft: "1px solid #c9b89a" }}>
                    <div style={{ flex: 1 }}><QuartileBar value={successVal} /></div>
                    <div style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "13px", fontWeight: 600, color: getQuartileColor(successVal), minWidth: "42px" }}>
                      {row.successRate}
                    </div>
                  </div>
                  <div style={{ flex: "0 0 80px", display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ backgroundColor: pctileColor, borderRadius: "999px", padding: "5px 10px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "11px", fontWeight: 700, color: "#ffffff" }}>
                        {formatPercentile(row.percentile)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Donut cards */}
        <div style={{ display: "grid", width: "100%", gridTemplateColumns: "repeat(4, 1fr)", gap: "11px" }}>
          {rows.map((row) => {
            const routeVal = parsePercent(row.routePercent);
            const successVal = parsePercent(row.successRate);
            const ringColor = getQuartileColor(routeVal);
            const successColor = getQuartileColor(successVal);
            const successTrack = getQuartileTrackColor(successVal);
            return (
              <div
                key={row.label}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "6px",
                  border: "1.5px solid rgba(61,88,81,0.24)",
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "14px",
                }}
              >
                {/* Label + ring */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", width: "100%" }}>
                  <div style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "15px", fontWeight: 600, color: "#1f1a14", textAlign: "center" }}>
                    {row.label}
                  </div>
                  <CircularRing value={routeVal} color={ringColor} />
                </div>
                {/* Success rate bar */}
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", color: "#6b6357" }}>
                    SUCCESS RATE
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", height: "7px", borderRadius: "4px", overflow: "hidden", backgroundColor: successTrack }}>
                        <div style={{ width: `${successVal}%`, backgroundColor: successColor, borderRadius: "4px", flexShrink: 0 }} />
                      </div>
                    </div>
                    <div style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "11px", fontWeight: 600, color: successColor, minWidth: "36px", textAlign: "right" }}>
                      {row.successRate}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
