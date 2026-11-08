<?php
/**
 * Shared helpers for suggest.php. Not reachable from the web (.htaccess blocks /includes/).
 */
declare(strict_types=1);
define('CODESHIRE', true);

function cs_config(): array
{
    static $cfg = null;
    if ($cfg === null) {
        $cfg = require __DIR__ . '/config.php';
    }
    return $cfg;
}

/** Storage folder, created on first use with its own deny-all rules. */
function cs_storage(): string
{
    $dir = rtrim((string) cs_config()['storage_dir'], '/');
    if (!is_dir($dir) && !@mkdir($dir, 0750, true) && !is_dir($dir)) {
        throw new RuntimeException('Storage folder cannot be created: ' . $dir);
    }
    if (!is_file($dir . '/.htaccess')) {
        @file_put_contents($dir . '/.htaccess', "Require all denied\n");
    }
    if (!is_file($dir . '/index.html')) {
        @file_put_contents($dir . '/index.html', '');
    }
    if (!is_writable($dir)) {
        throw new RuntimeException('Storage folder is not writable: ' . $dir);
    }
    return $dir;
}

/** Per-install secret used to sign form tokens and hash IPs. Generated once. */
function cs_secret(): string
{
    $file = cs_storage() . '/secret.key';
    $key = is_file($file) ? trim((string) file_get_contents($file)) : '';
    if (strlen($key) < 64) {
        $key = bin2hex(random_bytes(32));
        file_put_contents($file, $key, LOCK_EX);
        @chmod($file, 0600);
    }
    return $key;
}

function cs_client_ip(): string
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    if (!empty(cs_config()['behind_cloudflare']) && !empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        $cf = (string) $_SERVER['HTTP_CF_CONNECTING_IP'];
        if (filter_var($cf, FILTER_VALIDATE_IP)) {
            $ip = $cf;
        }
    }
    return $ip;
}

/** Token = issued-at time + random nonce + HMAC. Proves the form was loaded from this site. */
function cs_make_token(): string
{
    $payload = time() . '.' . bin2hex(random_bytes(8));
    return $payload . '.' . hash_hmac('sha256', $payload, cs_secret());
}

function cs_check_token(string $token): bool
{
    $parts = explode('.', $token);
    if (count($parts) !== 3 || !ctype_digit($parts[0]) || !ctype_xdigit($parts[1])) {
        return false;
    }
    $expected = hash_hmac('sha256', $parts[0] . '.' . $parts[1], cs_secret());
    if (!hash_equals($expected, $parts[2])) {
        return false;
    }
    $age = time() - (int) $parts[0];
    return $age >= 3 && $age <= 7200; // humans take at least 3 s; tokens expire after 2 h
}

/** Trim, drop control characters (keeps new lines), cap length. */
function cs_clean(string $value, int $max, bool $multiline = false): string
{
    $value = str_replace(["\r\n", "\r"], "\n", $value);
    $value = (string) preg_replace($multiline ? '/[^\P{C}\n]/u' : '/\p{C}/u', '', $value);
    $value = trim($value);
    if ($multiline) {
        $value = (string) preg_replace("/\n{3,}/", "\n\n", $value);
    }
    return function_exists('mb_substr') ? mb_substr($value, 0, $max) : substr($value, 0, $max);
}

function cs_len(string $s): int
{
    return function_exists('mb_strlen') ? mb_strlen($s) : strlen($s);
}

/**
 * File-based rate limiting with locking: N per IP per hour and a global daily cap.
 * IPs are stored only as keyed hashes. Returns true if this request may proceed.
 */
function cs_rate_ok(): bool
{
    $cfg = cs_config();
    $file = cs_storage() . '/ratelimit.json';
    $fh = fopen($file, 'c+');
    if ($fh === false) {
        return false;
    }
    try {
        flock($fh, LOCK_EX);
        $raw = stream_get_contents($fh);
        $data = json_decode($raw ?: '{}', true);
        if (!is_array($data)) {
            $data = [];
        }
        $now = time();
        $ipKey = substr(hash_hmac('sha256', cs_client_ip(), cs_secret()), 0, 32);
        $day = gmdate('Y-m-d');

        // forget old entries
        $ips = [];
        foreach (($data['ips'] ?? []) as $k => $times) {
            $recent = array_values(array_filter((array) $times, static fn($t) => is_int($t) && $t > $now - 3600));
            if ($recent) {
                $ips[$k] = $recent;
            }
        }
        $daily = (($data['day'] ?? '') === $day) ? (int) ($data['count'] ?? 0) : 0;

        $mine = $ips[$ipKey] ?? [];
        if (count($mine) >= (int) $cfg['max_per_ip_per_hour'] || $daily >= (int) $cfg['max_per_day_total']) {
            return false;
        }
        $mine[] = $now;
        $ips[$ipKey] = $mine;
        $data = ['ips' => $ips, 'day' => $day, 'count' => $daily + 1];

        ftruncate($fh, 0);
        rewind($fh);
        fwrite($fh, (string) json_encode($data));
        fflush($fh);
        return true;
    } finally {
        flock($fh, LOCK_UN);
        fclose($fh);
    }
}

function cs_json(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body);
    exit;
}
