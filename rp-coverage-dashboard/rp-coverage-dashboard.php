<?php
/**
 * Plugin Name: RP Coverage Dashboard
 * Description: Internal Reception Perception success vs. coverage dashboard for WordPress Admin.
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
 * Default access is any logged-in user who can create/edit posts.
 * Change with: add_filter('rpcd_required_capability', fn() => 'manage_options');
 */
function rpcd_required_capability() {
    return apply_filters('rpcd_required_capability', 'edit_posts');
}

function rpcd_manifest_path() {
    $vite_manifest = RPCD_DIR . 'dist/public/.vite/manifest.json';
    $legacy_manifest = RPCD_DIR . 'dist/public/manifest.json';

    if (file_exists($vite_manifest)) {
        return $vite_manifest;
    }

    if (file_exists($legacy_manifest)) {
        return $legacy_manifest;
    }

    return '';
}

function rpcd_get_manifest() {
    $path = rpcd_manifest_path();

    if (!$path || !file_exists($path)) {
        return array();
    }

    $manifest = json_decode(file_get_contents($path), true);

    return is_array($manifest) ? $manifest : array();
}

function rpcd_get_manifest_entry($manifest) {
    if (isset($manifest['src/main.tsx']) && is_array($manifest['src/main.tsx'])) {
        return $manifest['src/main.tsx'];
    }

    if (isset($manifest['index.html']) && is_array($manifest['index.html'])) {
        return $manifest['index.html'];
    }

    foreach ($manifest as $entry) {
        if (is_array($entry) && !empty($entry['isEntry'])) {
            return $entry;
        }
    }

    return null;
}

function rpcd_assets_available() {
    $manifest = rpcd_get_manifest();
    $entry = rpcd_get_manifest_entry($manifest);

    return is_array($entry) && !empty($entry['file']);
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
    echo '<h1>' . esc_html__('RP Coverage Dashboard', 'rp-coverage-dashboard') . '</h1>';

    if (!rpcd_assets_available()) {
        echo '<div class="notice notice-error"><p>';
        echo esc_html__('The dashboard assets are missing. Rebuild the React app and include dist/public in this plugin.', 'rp-coverage-dashboard');
        echo '</p></div>';
        echo '</div>';
        return;
    }

    echo '<script>';
    echo 'window.RPCoverageDashboard = ' . wp_json_encode($config) . ';';
    echo '</script>';

    echo '<div id="rp-coverage-dashboard-root"></div>';
    echo '</div>';
}

add_action('admin_enqueue_scripts', function ($hook_suffix) {
    if (empty($GLOBALS['rpcd_admin_hook']) || $hook_suffix !== $GLOBALS['rpcd_admin_hook']) {
        return;
    }

    $manifest = rpcd_get_manifest();
    $entry = rpcd_get_manifest_entry($manifest);

    if (!is_array($entry) || empty($entry['file'])) {
        return;
    }

    if (!empty($entry['css']) && is_array($entry['css'])) {
        foreach ($entry['css'] as $index => $css_file) {
            $css_path = RPCD_DIR . 'dist/public/' . ltrim($css_file, '/');
            wp_enqueue_style(
                'rp-coverage-dashboard-' . (int) $index,
                RPCD_URL . 'dist/public/' . ltrim($css_file, '/'),
                array(),
                file_exists($css_path) ? filemtime($css_path) : RPCD_VERSION
            );
        }
    }

    $script_file = ltrim($entry['file'], '/');
    $script_path = RPCD_DIR . 'dist/public/' . $script_file;
    $script_url = RPCD_URL . 'dist/public/' . $script_file;
    $version = file_exists($script_path) ? filemtime($script_path) : RPCD_VERSION;

    if (function_exists('wp_enqueue_script_module')) {
        wp_enqueue_script_module(
            'rp-coverage-dashboard',
            $script_url,
            array(),
            $version
        );
        return;
    }

    wp_enqueue_script(
        'rp-coverage-dashboard',
        $script_url,
        array(),
        $version,
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
        'methods'             => 'GET',
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

    fwrite($handle, $text);
    rewind($handle);

    while (($data = fgetcsv($handle)) !== false) {
        $has_content = false;

        foreach ($data as $cell) {
            if (trim((string) $cell) !== '') {
                $has_content = true;
                break;
            }
        }

        if ($has_content) {
            $rows[] = array_map('trim', $data);
        }
    }

    fclose($handle);

    return $rows;
}

function rpcd_get_sheet_data(WP_REST_Request $request) {
    $sheet_url = esc_url_raw($request->get_param('url'));

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
        'timeout'     => 15,
        'redirection' => 3,
    ));

    if (is_wp_error($response)) {
        return new WP_Error(
            'rpcd_sheet_fetch_failed',
            'Network error while fetching the sheet.',
            array('status' => 500)
        );
    }

    $status = wp_remote_retrieve_response_code($response);

    if ($status < 200 || $status >= 300) {
        return new WP_Error(
            'rpcd_sheet_unavailable',
            'Could not access the sheet. Make sure it is set to "Anyone with the link can view".',
            array('status' => 400)
        );
    }

    $csv_text = wp_remote_retrieve_body($response);
    $rows = rpcd_parse_csv($csv_text);
    $data_rows = array();

    foreach (array_slice($rows, 1) as $row) {
        foreach ($row as $cell) {
            if (trim((string) $cell) !== '') {
                $data_rows[] = $row;
                break;
            }
        }
    }

    if (empty($data_rows)) {
        return new WP_Error(
            'rpcd_empty_sheet',
            'The sheet appears to be empty.',
            array('status' => 400)
        );
    }

    $player_name = isset($data_rows[0][4])
        ? sanitize_text_field($data_rows[0][4])
        : '';

    $coverage_rows = array();

    foreach (array_slice($data_rows, 0, 4) as $row) {
        $coverage_rows[] = array(
            'label'        => isset($row[0]) ? strtoupper(sanitize_text_field($row[0])) : '',
            'routePercent' => isset($row[1]) ? rpcd_normalize_percent($row[1]) : '-',
            'successRate'  => isset($row[2]) ? rpcd_normalize_percent($row[2]) : '-',
            'percentile'   => isset($row[3]) && trim((string) $row[3]) !== ''
                ? sanitize_text_field($row[3])
                : '-',
        );
    }

    return rest_ensure_response(array(
        'playerName' => $player_name,
        'rows'       => $coverage_rows,
    ));
}
