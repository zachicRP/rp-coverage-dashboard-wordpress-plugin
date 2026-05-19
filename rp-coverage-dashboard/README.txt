RP Coverage Dashboard WordPress Plugin
======================================

Install:
1. In WordPress Admin, go to Plugins > Add New > Upload Plugin.
2. Upload rp-coverage-dashboard-wordpress-plugin.zip.
3. Activate the plugin.
4. Open WP Admin > RP Coverage Dashboard.

Access:
- By default, any logged-in WordPress user with backend access can use it.
- Developers can restrict access with the rp_coverage_dashboard_capability filter.

Google Sheets import:
- The sheet must be public: Anyone with the link can view.
- Expected columns are:
  A = Coverage Type
  B = % of Routes
  C = Success Rate
  D = Percentile
  E = Player name, from row 2

Exports:
- PNG export happens in the browser.
- HTML export downloads an inline HTML block for use in content.
