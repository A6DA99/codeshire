<?php
/**
 * Codeshire settings. Edit the values below, nothing else.
 */
defined('CODESHIRE') || exit;

return [
    // Where suggestions, rate-limit data and the secret key are stored.
    // The default folder is blocked from the web by .htaccess. For extra safety you can
    // point this at a folder OUTSIDE public_html, e.g. '/home/YOURUSER/codeshire-data'.
    'storage_dir' => __DIR__ . '/../storage',

    // Optional: get an email for every new suggestion. Leave '' to disable.
    // Tip: use an address on your own domain so it isn't marked as spam.
    'notify_email' => '',

    // Set to true ONLY if the site is behind Cloudflare, so rate limits use the
    // visitor's real IP instead of Cloudflare's. Leave false otherwise.
    'behind_cloudflare' => false,

    // Abuse limits
    'max_per_ip_per_hour' => 5,
    'max_per_day_total'   => 300,
    'max_storage_mb'      => 10,
];
