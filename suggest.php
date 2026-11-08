<?php
/**
 * Suggestion box endpoint.
 *   GET  suggest.php  -> {"token": "..."}  (fresh signed token for the form)
 *   POST suggest.php  -> stores one suggestion, returns {"ok": true} or {"error": "..."}
 * Suggestions are appended to storage/suggestions.jsonl (one JSON object per line),
 * which is never shown on the site, so nothing a visitor submits is rendered to others.
 */
declare(strict_types=1);
require __DIR__ . '/includes/bootstrap.php';

header_remove('X-Powered-By');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
header('Referrer-Policy: no-referrer');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($method === 'GET') {
        cs_json(200, ['token' => cs_make_token()]);
    }
    if ($method !== 'POST') {
        header('Allow: GET, POST');
        cs_json(405, ['error' => 'Method not allowed.']);
    }

    // Reject oversized bodies early (the form is tiny).
    if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 8192) {
        cs_json(413, ['error' => 'That message is too long.']);
    }

    // Only accept submissions made from this site's own pages.
    $site = $_SERVER['HTTP_SEC_FETCH_SITE'] ?? '';
    if ($site !== '' && $site !== 'same-origin') {
        cs_json(403, ['error' => 'Please send suggestions from the Codeshire page.']);
    }
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== parse_url('http://' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST)) {
        cs_json(403, ['error' => 'Please send suggestions from the Codeshire page.']);
    }

    $in = static fn(string $k): string => is_string($_POST[$k] ?? null) ? $_POST[$k] : '';

    // Honeypot: real people never see or fill the "website" field. Pretend success for bots.
    if (trim($in('website')) !== '') {
        cs_json(200, ['ok' => true]);
    }

    if (!cs_check_token($in('token'))) {
        cs_json(400, ['error' => 'The form expired. Please reload the page and try again.']);
    }

    $categories = ['idea' => 'Game idea', 'question' => 'New question', 'bug' => 'Bug report', 'other' => 'Other'];
    $category = $in('category');
    if (!isset($categories[$category])) {
        cs_json(400, ['error' => 'Please choose a topic.']);
    }

    $message = cs_clean($in('message'), 1000, true);
    $name = cs_clean($in('name'), 60);
    $email = cs_clean($in('email'), 120);

    if (cs_len($message) < 10) {
        cs_json(400, ['error' => 'Please write at least 10 characters.']);
    }
    if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        cs_json(400, ['error' => 'That email address does not look right.']);
    }

    if (!cs_rate_ok()) {
        cs_json(429, ['error' => 'Thanks! You have sent several suggestions already. Please try again later.']);
    }

    $dir = cs_storage();
    $file = $dir . '/suggestions.jsonl';
    $maxBytes = (int) cs_config()['max_storage_mb'] * 1024 * 1024;
    if (is_file($file) && filesize($file) > $maxBytes) {
        error_log('Codeshire: suggestions.jsonl reached its size limit; new suggestions are refused.');
        cs_json(503, ['error' => 'The suggestion box is full right now. Please try again later.']);
    }

    $record = [
        'time' => gmdate('c'),
        'topic' => $categories[$category],
        'name' => $name,
        'email' => $email,
        'message' => $message,
    ];
    $line = json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
    if (file_put_contents($file, $line, FILE_APPEND | LOCK_EX) === false) {
        throw new RuntimeException('Could not write suggestions.jsonl');
    }
    @chmod($file, 0600);

    // Optional email notification. Visitor text only ever goes in the body, never in headers.
    $to = (string) cs_config()['notify_email'];
    if ($to !== '' && filter_var($to, FILTER_VALIDATE_EMAIL)) {
        $host = preg_replace('/[^a-z0-9.-]/i', '', (string) ($_SERVER['HTTP_HOST'] ?? 'localhost'));
        $body = "New Codeshire suggestion\n\nTopic: {$record['topic']}\nName: " . ($name ?: '-') . "\nEmail: " . ($email ?: '-') . "\n\n{$message}\n";
        @mail($to, 'New Codeshire suggestion', $body, "From: Codeshire <no-reply@{$host}>\r\nContent-Type: text/plain; charset=utf-8");
    }

    cs_json(200, ['ok' => true]);
} catch (Throwable $e) {
    error_log('Codeshire suggest.php: ' . $e->getMessage());
    cs_json(500, ['error' => 'Something went wrong on our side. Please try again later.']);
}
