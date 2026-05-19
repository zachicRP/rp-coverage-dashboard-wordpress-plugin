<?php
/**
 * Plugin Name: RP Coverage Dashboard
 * Description: Internal Reception Perception success vs. coverage dashboard for WordPress admin users.
 * Version: 1.0.0
 * Author: Reception Perception
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

define('RPCD_VERSION', '1.0.0');
define('RPCD_DIR', plugin_dir_path(__FILE__));
define('RPCD_URL', plugin_dir_url(__FILE__));

$GLOBALS['rpcd_admin_hook'] = null;

/**
 * Default access is any logged-in WordPress user who can access the dashboard.
 * To restrict to editors/admins, change the returned capability to edit_posts,
 * edit_others_posts, or manage_options via the rp_coverage_dashboard_capability filter.
 */
function rpcd_required_capability() {
    return apply_filters('rp_coverage_dashboard_capability', 'read');
}

add_action('admin_menu', function () {
    $GLOBALS['rpcd_admin_hook'] = add_menu_page(
        'RP Coverage Dashboard',
        'RP Coverage Dashboard',
        rpcd_required_capability(),
        'rp-coverage-dashboard',
        'rpcd_render_admin_page',
        'dashicons-chart-area',
        58
    );
});

function rpcd_render_admin_page() {
    if (!current_user_can(rpcd_required_capability())) {
        wp_die(esc_html__('You do not have permission to access this page.', 'rp-coverage-dashboard'));
    }

    $config = array(
        'sheetsEndpoint' => esc_url_raw(rest_url('rp-coverage-dashboard/v1/sheets')),
        'nonce'          => wp_create_nonce('wp_rest'),
    );

    echo '<div class="wrap rp-coverage-dashboard-admin">';
    echo '<h1>RP Coverage Dashboard</h1>';
    echo '<p>Paste a public Google Sheet URL in the dashboard editor, then export PNG or HTML for RP content.</p>';
    echo '<script>window.RPCoverageDashboard = ' . wp_json_encode($config, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) . ';</script>';
    echo '<div id="rp-coverage-dashboard-root"></div>';
    echo '</div>';
}

add_action('admin_enqueue_scripts', function ($hook_suffix) {
    if (empty($GLOBALS['rpcd_admin_hook']) || $hook_suffix !== $GLOBALS['rpcd_admin_hook']) {
        return;
    }

    $manifest_path = RPCD_DIR . 'dist/public/.vite/manifest.json';

    if (!file_exists($manifest_path)) {
        wp_add_inline_style(
            'wp-admin',
            '.rp-coverage-dashboard-admin:after{content:"Build files are missing. Rebuild the plugin package and upload it again.";display:block;margin-top:16px;padding:12px;border-left:4px solid #d63638;background:#fff;color:#1d2327;}'
        );
        return;
    }

    $manifest = json_decode((string) file_get_contents($manifest_path), true);

    if (!is_array($manifest)) {
        return;
    }

    $entry = isset($manifest['src/main.tsx']) ? $manifest['src/main.tsx'] : null;

    if (!$entry) {
        foreach ($manifest as $candidate) {
            if (!empty($candidate['isEntry'])) {
                $entry = $candidate;
                break;
            }
        }
    }

    if (empty($entry['file'])) {
        return;
    }

    if (!empty($entry['css']) && is_array($entry['css'])) {
        foreach ($entry['css'] as $index => $css_file) {
            wp_enqueue_style(
                'rp-coverage-dashboard-' . $index,
                RPCD_URL . 'dist/public/' . ltrim($css_file, '/'),
                array(),
                RPCD_VERSION
            );
        }
    }

    wp_enqueue_script(
        'rp-coverage-dashboard',
        RPCD_URL . 'dist/public/' . ltrim($entry['file'], '/'),
        array(),
        RPCD_VERSION,
        true
    );

    add_filter('script_loader_tag', function ($tag, $handle, $src) {
        if ($handle !== 'rp-coverage-dashboard') {
            return $tag;
        }

        return '<script type="module" src="' . esc_url($src) . '"></script>';
    }, 10, 3);
});

add_action('rest_api_init', function () {
    register_rest_route('rp-coverage-dashboard/v1', '/sheets', array(
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => 'rpcd_get_sheet_data',
        'permission_callback' => function () {
            return current_user_can(rpcd_required_capability());
        },
        'args'                => array(
            'url' => array(
                'required'          => true,
                'sanitize_callback' => 'esc_url_raw',
            ),
        ),
    ));
});

function rpcd_normalize_percent($raw) {
    $s = trim((string) $raw);

    if ($s === '' || $s === '-') {
        return '-';
    }

    if (substr($s, -1) === '%') {
        return $s;
    }

    if (!is_numeric($s)) {
        return $s;
    }

    $n = (float) $s;

    if (abs($n) < 1.5 && strpos($s, '.') !== false) {
        return number_format($n * 100, 1) . '%';
    }

    return rtrim(rtrim((string) $n, '0'), '.') . '%';
}

function rpcd_parse_csv($text) {
    $rows = array();
    $handle = fopen('php://temp', 'r+');

    if (!$handle) {
        return $rows;
    }

    fwrite($handle, (string) $text);
    rewind($handle);

    while (($data = fgetcsv($handle)) !== false) {
        $has_value = false;

        foreach ($data as $cell) {
            if (trim((string) $cell) !== '') {
                $has_value = true;
                break;
            }
        }

        if ($has_value) {
            $rows[] = array_map('trim', $data);
        }
    }

    fclose($handle);

    return $rows;
}

function rpcd_get_sheet_data(WP_REST_Request $request) {
    $sheet_url = esc_url_raw((string) $request->get_param('url'));

    if (!$sheet_url) {
        return new WP_Error(
            'rpcd_missing_sheet_url',
            'url query param is required',
            array('status' => 400)
        );
    }

    if (!preg_match('#spreadsheets/d/([a-zA-Z0-9-_]+)#', $sheet_url, $id_matches)) {
        return new WP_Error(
            'rpcd_bad_sheet_url',
            'Could not find a spreadsheet ID in that URL. Make sure you paste the full Google Sheets URL.',
            array('status' => 400)
        );
    }

    $sheet_id = $id_matches[1];
    $gid = '0';

    if (preg_match('/[#?&]gid=(\d+)/', $sheet_url, $gid_matches)) {
        $gid = $gid_matches[1];
    }

    $csv_url = add_query_arg(
        array(
            'format' => 'csv',
            'gid'    => $gid,
        ),
        'https://docs.google.com/spreadsheets/d/' . rawurlencode($sheet_id) . '/export'
    );

    $response = wp_safe_remote_get($csv_url, array(
        'timeout'             => 20,
        'redirection'         => 5,
        'limit_response_size' => 1048576,
    ));

    if (is_wp_error($response)) {
        return new WP_Error(
            'rpcd_sheet_fetch_failed',
            'Network error while fetching the sheet.',
            array('status' => 500)
        );
    }

    $status = (int) wp_remote_retrieve_response_code($response);

    if ($status < 200 || $status >= 300) {
        return new WP_Error(
            'rpcd_sheet_unavailable',
            'Could not access the sheet. Make sure it is set to "Anyone with the link can view".',
            array('status' => 400)
        );
    }

    $csv_text = (string) wp_remote_retrieve_body($response);

    if ($csv_text === '' || preg_match('/<\s*html/i', $csv_text)) {
        return new WP_Error(
            'rpcd_sheet_unavailable',
            'Could not read CSV data from the sheet. Make sure it is public and accessible as a Google Sheet.',
            array('status' => 400)
        );
    }

    $rows = rpcd_parse_csv($csv_text);
    $data_rows = array_values(array_filter(array_slice($rows, 1), function ($row) {
        foreach ($row as $cell) {
            if (trim((string) $cell) !== '') {
                return true;
            }
        }

        return false;
    }));

    if (empty($data_rows)) {
        return new WP_Error(
            'rpcd_empty_sheet',
            'The sheet appears to be empty.',
            array('status' => 400)
        );
    }

    $player_name = isset($data_rows[0][4]) ? sanitize_text_field($data_rows[0][4]) : '';
    $coverage_rows = array();

    foreach (array_slice($data_rows, 0, 4) as $row) {
        $coverage_rows[] = array(
            'label'        => isset($row[0]) ? strtoupper(sanitize_text_field($row[0])) : '',
            'routePercent' => isset($row[1]) ? rpcd_normalize_percent($row[1]) : '-',
            'successRate'  => isset($row[2]) ? rpcd_normalize_percent($row[2]) : '-',
            'percentile'   => isset($row[3]) && trim((string) $row[3]) !== '' ? sanitize_text_field($row[3]) : '-',
        );
    }

    return rest_ensure_response(array(
        'playerName' => $player_name,
        'rows'       => $coverage_rows,
    ));
}
