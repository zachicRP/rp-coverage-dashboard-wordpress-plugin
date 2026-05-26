=== RP Coverage Dashboard ===
Contributors: receptionperception
Tags: reception perception, dashboard, admin, google sheets
Requires at least: 6.0
Requires PHP: 7.4
Stable tag: 1.0.0
License: MIT

Internal WordPress Admin dashboard for Reception Perception success vs. coverage graphics.

== Installation ==
1. Upload rp-coverage-dashboard.zip in WordPress Admin > Plugins > Add New > Upload Plugin.
2. Activate the plugin.
3. Open WordPress Admin > RP Coverage Dashboard.

== Access ==
By default, users need the edit_posts capability. To restrict to admins only, add this in a small site plugin or theme functions.php:

add_filter('rpcd_required_capability', function () {
    return 'manage_options';
});

== Google Sheets Import ==
The Google Sheet must be public with "Anyone with the link can view" enabled.
Expected columns:
A = Coverage Type
B = % of Routes
C = Success Rate
D = Percentile
E = Player name on the first data row
