# RP Coverage Dashboard WordPress Plugin

This repo contains the editable source for the RP Coverage Dashboard WordPress plugin.

## What to edit

- WordPress/backend logic: `rp-coverage-dashboard.php`
- React/frontend UI: `client/src/`
- Shared types: `shared/`
- Build config: `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`
- Production assets served by WordPress: `dist/public/`

## First-time setup

From this folder:

```powershell
npm install
```

## Build frontend assets

```powershell
npm run build
```

## Create an installable WordPress plugin zip on Windows

```powershell
.\scripts\build-plugin.ps1
```

The plugin zip will be created at:

```txt
release/rp-coverage-dashboard.zip
```

Upload that zip in WordPress:

```txt
WP Admin -> Plugins -> Add New -> Upload Plugin
```

## Normal Git workflow

```powershell
git status
git add .
git commit -m "Describe the change"
git push
```

## Notes

The Google Sheet must remain public with "Anyone with the link can view" because the importer reads Google's CSV export.
