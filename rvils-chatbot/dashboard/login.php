<?php
if (!defined('ABSPATH')) exit;
// Admin authentication is handled by WordPress core capabilities
wp_safe_redirect(admin_url('admin.php?page=rvils-chatbot-dashboard&tab=index'));
exit;

