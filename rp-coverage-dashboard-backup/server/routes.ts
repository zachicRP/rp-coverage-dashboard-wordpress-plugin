import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// Simple CSV parser that handles quoted fields
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    const cols: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        cols.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    cols.push(cur.trim());
    rows.push(cols);
  }
  return rows;
}

// Ensure percent values always have a % suffix and are displayable
function normalizePercent(raw: string): string {
  const s = raw.trim();
  if (!s || s === "-") return "-";
  // Already has % sign
  if (s.endsWith("%")) return s;
  const n = parseFloat(s);
  if (isNaN(n)) return s;
  // Google Sheets sometimes exports as decimal (0.287 = 28.7%)
  if (Math.abs(n) < 1.5 && s.indexOf(".") !== -1 && !s.includes("%")) {
    return `${(n * 100).toFixed(1)}%`;
  }
  return `${n}%`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // GET /api/sheets?url=<google-sheets-url>
  // Fetches and parses a public Google Sheet as CSV, returns dashboard data
  app.get("/api/sheets", async (req, res) => {
    const sheetUrl = (req.query.url as string) || "";
    if (!sheetUrl) {
      return res.status(400).json({ error: "url query param is required" });
    }

    const idMatch = sheetUrl.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!idMatch) {
      return res.status(400).json({ error: "Could not find a spreadsheet ID in that URL. Make sure you paste the full Google Sheets URL." });
    }

    const sheetId = idMatch[1];
    const gidMatch = sheetUrl.match(/[#?&]gid=(\d+)/);
    const gid = gidMatch ? gidMatch[1] : "0";

    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

    let csvText: string;
    try {
      const response = await fetch(csvUrl);
      if (!response.ok) {
        return res.status(400).json({
          error: `Could not access the sheet (HTTP ${response.status}). Make sure the sheet is set to "Anyone with the link can view".`,
        });
      }
      csvText = await response.text();
    } catch {
      return res.status(500).json({ error: "Network error while fetching the sheet." });
    }

    const rows = parseCSV(csvText);
    // Need at least a header + 1 data row
    const dataRows = rows.slice(1).filter((r) => r.some((c) => c !== ""));
    if (dataRows.length === 0) {
      return res.status(400).json({ error: "The sheet appears to be empty." });
    }

    // Player name: column E (index 4) of the first data row
    const playerName = dataRows[0]?.[4]?.trim() || "";

    // Coverage rows: col A = label, B = routePercent, C = successRate, D = percentile
    const coverageRows = dataRows.slice(0, 4).map((row) => ({
      label: (row[0] ?? "").toUpperCase().trim(),
      routePercent: normalizePercent(row[1] ?? ""),
      successRate: normalizePercent(row[2] ?? ""),
      percentile: (row[3] ?? "").trim() || "-",
    }));

    return res.json({ playerName, rows: coverageRows });
  });

  return httpServer;
}
