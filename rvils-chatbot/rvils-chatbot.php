<?php
/**
 * Plugin Name: RVILS Institutional Chatbot & Command Center
 * Plugin URI: https://rvils.edu.in
 * Description: Enterprise conversational AI chatbot and dual-write behavioral analytics platform for MKPM RV Institute of Legal Studies (RVILS). Features zero-cloud-AI-cost deterministic client-side NLP, admissions guidance, moot court assistant, faculty directory, and an integrated Command Center.
 * Version: 3.1.0
 * Author: RVILS Legal Informatics Team & RSST
 * Author URI: https://rvils.edu.in
 * License: GPL-2.0+
 * Text Domain: rvils-chatbot
 */

if (!defined('ABSPATH')) {
    exit;
}

define('RVILS_CHATBOT_VERSION', '3.1.0');
define('RVILS_CHATBOT_DIR_PATH', plugin_dir_path(__FILE__));
define('RVILS_CHATBOT_DIR_URL', plugin_dir_url(__FILE__));

/**
 * 1. Database Table Installation on Plugin Activation
 */
function rvils_chatbot_activate() {
    global $wpdb;
    $charset_collate = $wpdb->get_charset_collate();

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

    // Leads Table
    $table_leads = $wpdb->prefix . 'rvils_chatbot_leads';
    $sql_leads = "CREATE TABLE $table_leads (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        session_id varchar(100) NOT NULL,
        name varchar(150) NOT NULL,
        phone varchar(50) NOT NULL,
        email varchar(150) NOT NULL,
        program varchar(100) NOT NULL,
        city varchar(100) DEFAULT '',
        status varchar(30) DEFAULT 'new',
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        KEY session_id (session_id)
    ) $charset_collate;";
    dbDelta($sql_leads);

    // Sessions Table
    $table_sessions = $wpdb->prefix . 'rvils_chatbot_sessions';
    $sql_sessions = "CREATE TABLE $table_sessions (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        session_id varchar(100) NOT NULL UNIQUE,
        start_time datetime DEFAULT CURRENT_TIMESTAMP,
        last_active datetime DEFAULT CURRENT_TIMESTAMP,
        duration_seconds int(11) DEFAULT 0,
        page_views int(11) DEFAULT 1,
        message_count int(11) DEFAULT 0,
        device_type varchar(50) DEFAULT 'desktop',
        referrer text,
        PRIMARY KEY  (id),
        KEY session_id (session_id)
    ) $charset_collate;";
    dbDelta($sql_sessions);

    // Events & Telemetry Table
    $table_events = $wpdb->prefix . 'rvils_chatbot_events';
    $sql_events = "CREATE TABLE $table_events (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        session_id varchar(100) NOT NULL,
        event_type varchar(80) NOT NULL,
        event_data longtext,
        page_url text,
        timestamp bigint(20) NOT NULL,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        KEY session_id (session_id),
        KEY event_type (event_type)
    ) $charset_collate;";
    dbDelta($sql_events);

    // Default Options
    add_option('rvils_chatbot_enabled', '1');
    add_option('rvils_chatbot_primary_color', '#7B371C');
    add_option('rvils_chatbot_secondary_color', '#C07A3A');
    add_option('rvils_chatbot_vercel_url', 'http://localhost:3001');
}
register_activation_hook(__FILE__, 'rvils_chatbot_activate');

/**
 * 2. Enqueue Frontend Scripts & Styles
 */
function rvils_chatbot_enqueue_assets() {
    if (is_admin()) return;

    $enabled = get_option('rvils_chatbot_enabled', '1');
    if ($enabled !== '1') return;

    // Styles
    wp_enqueue_style(
        'rvils-chatbot-css',
        RVILS_CHATBOT_DIR_URL . 'assets/style.css',
        array(),
        RVILS_CHATBOT_VERSION
    );

    // Telemetry Engine
    wp_enqueue_script(
        'rvils-telemetry-js',
        RVILS_CHATBOT_DIR_URL . 'assets/telemetry.js',
        array(),
        RVILS_CHATBOT_VERSION,
        true
    );

    // Chatbot NLP Engine
    wp_enqueue_script(
        'rvils-chatbot-js',
        RVILS_CHATBOT_DIR_URL . 'assets/script.js',
        array('rvils-telemetry-js'),
        RVILS_CHATBOT_VERSION,
        true
    );

    // Localize Script Configuration
    $vercel_url = rtrim(get_option('rvils_chatbot_vercel_url', 'http://localhost:3001'), '/');
    wp_localize_script('rvils-telemetry-js', 'rvilsChatbotConfig', array(
        'wpRestUrl' => esc_url_raw(rest_url('rvils/v1/telemetry')),
        'vercelUrl' => !empty($vercel_url) ? esc_url_raw($vercel_url . '/api/telemetry/events') : '',
        'instituteId' => 'RVILS_BLR'
    ));
}
add_action('wp_enqueue_scripts', 'rvils_chatbot_enqueue_assets');

/**
 * 3. Shortcode: [rvils_chatbot]
 */
function rvils_chatbot_shortcode() {
    return '<!-- RVILS Chatbot Widget Injected by Shortcode -->';
}
add_shortcode('rvils_chatbot', 'rvils_chatbot_shortcode');

/**
 * 4. Register REST API Endpoints
 */
function rvils_chatbot_register_rest_routes() {
    register_rest_route('rvils/v1', '/telemetry', array(
        'methods' => 'POST',
        'callback' => 'rvils_chatbot_rest_telemetry',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('rvils/v1', '/lead', array(
        'methods' => 'POST',
        'callback' => 'rvils_chatbot_rest_lead',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('rvils/v1', '/stats', array(
        'methods' => 'GET',
        'callback' => 'rvils_chatbot_rest_stats',
        'permission_callback' => function () {
            return current_user_can('manage_options');
        }
    ));
}
add_action('rest_api_init', 'rvils_chatbot_register_rest_routes');

/**
 * REST Handler: Ingest Telemetry Events
 */
function rvils_chatbot_rest_telemetry($request) {
    global $wpdb;
    $params = $request->get_json_params();

    if (empty($params['events']) || !is_array($params['events'])) {
        return new WP_REST_Response(array('status' => 'ignored', 'reason' => 'empty events'), 200);
    }

    $table_events = $wpdb->prefix . 'rvils_chatbot_events';
    $table_sessions = $wpdb->prefix . 'rvils_chatbot_sessions';

    foreach ($params['events'] as $e) {
        $sid = sanitize_text_field($e['sessionId'] ?? '');
        $type = sanitize_text_field($e['eventType'] ?? '');
        $time = (int)($e['timestamp'] ?? time() * 1000);
        $url = esc_url_raw($e['pageUrl'] ?? '');
        $data_json = wp_json_encode($e['data'] ?? array());

        if (empty($sid)) continue;

        // Insert event
        $wpdb->insert($table_events, array(
            'session_id' => $sid,
            'event_type' => $type,
            'event_data' => $data_json,
            'page_url' => $url,
            'timestamp' => $time
        ));

        // Update or insert session
        $existing = $wpdb->get_row($wpdb->prepare("SELECT id, message_count FROM $table_sessions WHERE session_id = %s", $sid));
        if ($existing) {
            $msg_inc = ($type === 'user_message') ? 1 : 0;
            $wpdb->query($wpdb->prepare(
                "UPDATE $table_sessions SET last_active = NOW(), message_count = message_count + %d WHERE session_id = %s",
                $msg_inc, $sid
            ));
        } else {
            $wpdb->insert($table_sessions, array(
                'session_id' => $sid,
                'device_type' => 'browser',
                'referrer' => esc_url_raw($e['referrer'] ?? '')
            ));
        }
    }

    return new WP_REST_Response(array('status' => 'ok', 'saved' => count($params['events'])), 200);
}

/**
 * REST Handler: Save Lead
 */
function rvils_chatbot_rest_lead($request) {
    global $wpdb;
    $params = $request->get_json_params();
    $lead = $params['lead'] ?? array();

    $table_leads = $wpdb->prefix . 'rvils_chatbot_leads';
    $wpdb->insert($table_leads, array(
        'session_id' => sanitize_text_field($params['sessionId'] ?? 'anonymous'),
        'name' => sanitize_text_field($lead['name'] ?? ''),
        'phone' => sanitize_text_field($lead['phone'] ?? ''),
        'email' => sanitize_email($lead['email'] ?? ''),
        'program' => sanitize_text_field($lead['program'] ?? ''),
        'city' => sanitize_text_field($lead['city'] ?? ''),
        'status' => 'new'
    ));

    return new WP_REST_Response(array('status' => 'success', 'lead_id' => $wpdb->insert_id), 200);
}

/**
 * REST Handler: Dashboard Statistics
 */
function rvils_chatbot_rest_stats() {
    global $wpdb;
    $table_leads = $wpdb->prefix . 'rvils_chatbot_leads';
    $table_sessions = $wpdb->prefix . 'rvils_chatbot_sessions';
    $table_events = $wpdb->prefix . 'rvils_chatbot_events';

    $total_leads = (int)$wpdb->get_var("SELECT COUNT(*) FROM $table_leads");
    $total_sessions = (int)$wpdb->get_var("SELECT COUNT(*) FROM $table_sessions");
    $total_events = (int)$wpdb->get_var("SELECT COUNT(*) FROM $table_events");
    $recent_leads = $wpdb->get_results("SELECT * FROM $table_leads ORDER BY id DESC LIMIT 10", ARRAY_A);

    return new WP_REST_Response(array(
        'totalLeads' => $total_leads,
        'totalSessions' => $total_sessions,
        'totalEvents' => $total_events,
        'recentLeads' => $recent_leads
    ), 200);
}

/**
 * 5. WP-Admin Menu & Command Center Router
 */
function rvils_chatbot_admin_menu() {
    add_menu_page(
        __('RVILS Chatbot', 'rvils-chatbot'),
        __('RVILS Chatbot', 'rvils-chatbot'),
        'manage_options',
        'rvils-chatbot',
        'rvils_chatbot_settings_view',
        'dashicons-hammer',
        85
    );

    add_submenu_page(
        'rvils-chatbot',
        __('Command Center', 'rvils-chatbot'),
        __('Command Center', 'rvils-chatbot'),
        'manage_options',
        'rvils-chatbot-dashboard',
        'rvils_chatbot_command_center_view'
    );
}
add_action('admin_menu', 'rvils_chatbot_admin_menu');

/**
 * Render Settings Page
 */
function rvils_chatbot_settings_view() {
    if (isset($_POST['rvils_save_settings']) && check_admin_referer('rvils_settings_verify')) {
        update_option('rvils_chatbot_enabled', isset($_POST['rvils_chatbot_enabled']) ? '1' : '0');
        update_option('rvils_chatbot_vercel_url', esc_url_raw($_POST['rvils_chatbot_vercel_url']));
        echo '<div class="notice notice-success is-dismissible"><p>Settings successfully saved!</p></div>';
    }

    $enabled = get_option('rvils_chatbot_enabled', '1');
    $vercel_url = get_option('rvils_chatbot_vercel_url', 'http://localhost:3001');
    ?>
    <div class="wrap" style="max-width: 800px;">
        <h1>⚖️ RVILS Chatbot & Virtual Assistant Settings</h1>
        <p>Configure the official conversational AI widget and telemetry endpoints for MKPM RV Institute of Legal Studies.</p>

        <form method="post" action="">
            <?php wp_nonce_field('rvils_settings_verify'); ?>
            <table class="form-table">
                <tr>
                    <th scope="row">Enable Chatbot Widget</th>
                    <td>
                        <label>
                            <input type="checkbox" name="rvils_chatbot_enabled" value="1" <?php checked($enabled, '1'); ?>>
                            Display chatbot launcher on all public pages
                        </label>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Central Vercel / Node Hub URL</th>
                    <td>
                        <input type="url" name="rvils_chatbot_vercel_url" value="<?php echo esc_attr($vercel_url); ?>" class="regular-text">
                        <p class="description">Central ingestion server for external telemetry (e.g. <code>http://localhost:3001</code> or <code>https://rvils-dashboard.vercel.app</code>).</p>
                    </td>
                </tr>
            </table>
            <?php submit_button('Save Chatbot Settings', 'primary', 'rvils_save_settings'); ?>
        </form>
    </div>
    <?php
}

/**
 * Render Command Center View
 */
function rvils_chatbot_command_center_view() {
    $tab = isset($_GET['tab']) ? sanitize_text_field($_GET['tab']) : 'index';
    $file_path = RVILS_CHATBOT_DIR_PATH . 'dashboard/' . $tab . '.php';

    if (file_exists($file_path)) {
        include $file_path;
    } else {
        include RVILS_CHATBOT_DIR_PATH . 'dashboard/index.php';
    }
}

