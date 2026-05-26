# Reception Perception — Coverage Dashboard

Interactive web tool for visualizing a receiver's success rate by coverage type
(MAN / ZONE / PRESS / DOUBLE). Built to produce shareable social assets.

## Features

- Visualizes route share and success rate per coverage type with quartile-colored bars and donut charts
- Import data directly from a public Google Sheet, or edit it inline
- Export to a 4K PNG (transparent rounded corners) or a self-contained HTML file

## Stack

- Vite + React 18 + TypeScript (client)
- Express 5 (server — serves the API and the app on a single port)
- Tailwind CSS + shadcn/ui
- `html2canvas` for PNG export

## Run

```
npm install
npm run dev
```

Opens at http://localhost:5000.

## Build

```
npm run build
npm run start
```

## Google Sheets import

`GET /api/sheets?url=<sheet-url>` reads a public sheet ("Anyone with the link can view")
with this column order:

| A (Coverage) | B (% of Routes) | C (Success Rate) | D (Percentile) | E (Player) |
|---|---|---|---|---|
| MAN | 47.5% | 68.4% | 44th | Luther Burden III |

Percentages accept `0.475`, `47.5`, or `47.5%`. The player name is read from row 2, column E.

## Standalone preview

`preview/index.html` is a self-contained version of the dashboard (no build step) —
open it directly in a browser for quick edits and exports.
