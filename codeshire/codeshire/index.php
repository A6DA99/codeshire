<?php
/**
 * Codeshire: Farm Defense
 * Single entry point. The game runs entirely in the browser: this file reads no
 * user input, touches no database and writes nothing to disk, so there is
 * nothing server-side for a visitor to exploit.
 */
declare(strict_types=1);

// Only GET and HEAD make sense for this page.
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'GET' && $method !== 'HEAD') {
    http_response_code(405);
    header('Allow: GET, HEAD');
    exit;
}

header_remove('X-Powered-By');
header('Content-Type: text/html; charset=utf-8');
header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'");
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()');
header('Cross-Origin-Opener-Policy: same-origin');
header('Cross-Origin-Resource-Policy: same-origin');
// The page is identical for everyone, so browsers and CDNs may cache it briefly.
header('Cache-Control: public, max-age=300, stale-while-revalidate=600');

/** Cache-busting URL for a static file: changes whenever the file changes. */
function asset(string $path): string
{
    $file = __DIR__ . '/' . $path;
    $v = is_file($file) ? (string) filemtime($file) : '1';
    return htmlspecialchars($path . '?v=' . $v, ENT_QUOTES, 'UTF-8');
}

/**
 * Load the question bank from questions.json. The file is checked here; if it is
 * missing, too large or not valid JSON, the game shows a notice instead of breaking,
 * and the reason is written to the PHP error log.
 */
function questions_json(): string
{
    $file = __DIR__ . '/questions.json';
    if (!is_file($file) || !is_readable($file)) {
        error_log('Codeshire: questions.json not found');
        return 'null';
    }
    if (filesize($file) > 2 * 1024 * 1024) {
        error_log('Codeshire: questions.json is larger than 2 MB');
        return 'null';
    }
    $data = json_decode((string) file_get_contents($file), true);
    if (!is_array($data) || !isset($data['questions']) || !is_array($data['questions'])) {
        error_log('Codeshire: questions.json is invalid: ' . json_last_error_msg());
        return 'null';
    }
    // Re-encode so nothing in the file can break out of the <script> data block.
    $json = json_encode($data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    return $json === false ? 'null' : $json;
}

if ($method === 'HEAD') {
    exit;
}
?><!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Codeshire: Farm Defense</title>
<meta name="description" content="A tiny pixel-art browser game for developers. Defend the farm from orcs by answering coding challenges across four seasons.">
<meta name="theme-color" content="#070d1c">
<meta property="og:title" content="Codeshire: Farm Defense">
<meta property="og:description" content="Defend the farm from orcs with your coding skills. Six challenge types, four seasons, no signup.">
<meta property="og:type" content="website">
<link rel="icon" type="image/png" href="<?= asset('favicon.png') ?>">
<link rel="preload" href="assets/fonts/pixelify-sans-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="<?= asset('assets/css/app.css') ?>">
</head>
<body>

<!-- ================= LANDING ================= -->
<div id="landing">
  <section class="hero">
    <header class="nav">
      <a class="brand" href="./">Codeshire</a>
      <nav aria-label="Main">
        <a href="#challenges">Challenges</a>
        <a href="#seasons">Seasons</a>
        <a href="#how">How it works</a>
        <a href="#suggest">Suggest</a>
        <button class="btn gold small" data-go="select">Play</button>
      </nav>
    </header>
    <div class="herogrid">
      <div class="copy">
        <h1 class="logo">Codeshire</h1>
        <p class="tag">A little farm worth defending.</p>
        <p class="lede">Orcs are marching on Farmer Tom's island. You're the only soldier on the dock, and your sword only swings when your code is right.</p>
        <div class="ctas">
          <button class="btn gold" data-go="select">Defend the farm</button>
          <a class="btn ghost" href="#how" style="display:inline-flex;align-items:center;text-decoration:none">How it works</a>
        </div>
        <p class="fine">JavaScript · Python · Java · C · 6 challenge types · 4 seasons · plays in your browser</p>
      </div>
      <div class="island">
        <canvas id="island" class="px" width="352" height="256" aria-label="A small pixel island with a cottage, a field, a dock and an orc rowing in. Click to play."></canvas>
        <span class="tap">TAP THE ISLAND</span>
      </div>
    </div>
  </section>

  <section class="sec" id="challenges">
    <h2>Six ways to fight</h2>
    <p>Pick the challenge you're best at, or the one you need to practise. Each orc you face brings a new question of that type.</p>
    <div class="cgrid" id="cgrid"></div>
  </section>

  <section class="sec" id="seasons">
    <h2>Four seasons, four levels</h2>
    <p>Clear three orcs and the season turns. The clock gets shorter every level, and the Orc Chief waits at the end of winter.</p>
    <div class="sgrid" id="sgrid"></div>
  </section>

  <section class="sec" id="how">
    <h2>How it works</h2>
    <div class="cgrid">
      <div class="cinfo"><h3>1 · Choose a challenge</h3><p>Guess the Output, Spot the Bug, Regex Defuse, Merge Conflict, Prod Is Down, Stack Dive, or Mixed.</p></div>
      <div class="cinfo"><h3>2 · Beat the clock</h3><p>When an orc reaches you, its question appears beside the battlefield. Right answers strike; wrong or slow ones cost a heart.</p></div>
      <div class="cinfo"><h3>3 · Survive the seasons</h3><p>Every season you clear gives back a heart. Streaks multiply your score up to ×3.</p></div>
    </div>
    <div><button class="btn gold" data-go="select">Play now</button></div>
  </section>

  <footer class="foot">
  <nav class="footlinks" aria-label="Footer"><a href="./">Home</a><a href="#suggest">Suggestions &amp; credits</a></nav>
  <p>&copy; <?= date('Y') ?> Codeshire. All rights reserved.</p>
  <p class="footsmall">Pixel art and fonts are by their original creators and used under their licences. See <a href="#suggest">credits</a>.</p>
</footer>
</div>

<!-- ================= SELECT ================= -->
<div id="select" hidden>
  <div class="selwrap">
    <div class="seltop">
      <button class="btn ghost small" data-go="landing">← Home</button>
      <span class="pix" style="color:var(--leaf);font-size:22px">Codeshire</span>
    </div>
    <div>
      <h1 class="pix" style="margin:0;font-size:clamp(30px,5vw,44px)">Choose your battle</h1>
      <p style="margin:6px 0 0;color:var(--muted)">Pick a language, then the kind of challenge every orc will bring.</p>
    </div>
    <p class="qwarn" id="qwarn" hidden></p>
    <div>
      <h2 class="step">1 · Language</h2>
      <div class="langs" id="langs" role="group" aria-label="Language"></div>
    </div>
    <div>
      <h2 class="step">2 · Challenge</h2>
      <div class="selgrid" id="selgrid"></div>
    </div>
    <div>
      <h2 class="pix" style="margin:0 0 10px;font-size:22px;color:var(--leaf)">Your journey</h2>
      <div class="journey" id="journey"></div>
    </div>
  </div>
  <footer class="foot">
  <nav class="footlinks" aria-label="Footer"><a href="./">Home</a><a href="#suggest">Suggestions &amp; credits</a></nav>
  <p>&copy; <?= date('Y') ?> Codeshire. All rights reserved.</p>
  <p class="footsmall">Pixel art and fonts are by their original creators and used under their licences. See <a href="#suggest">credits</a>.</p>
</footer>
</div>

<!-- ================= SUGGESTIONS & CREDITS ================= -->
<div id="suggest" hidden>
  <div class="selwrap">
    <div class="seltop">
      <button class="btn ghost small" data-go="landing">← Home</button>
      <span class="pix" style="color:var(--leaf);font-size:22px">Codeshire</span>
    </div>
    <div>
      <h1 class="pix" style="margin:0;font-size:clamp(30px,5vw,44px)">Suggestions &amp; credits</h1>
      <p style="margin:6px 0 0;color:var(--muted)">Got an idea, a question you'd like to see in the game, or found a bug? Tell us.</p>
    </div>

    <div class="sgwrap">
      <form class="sgform" id="sgform" novalidate>
        <h2 class="step">Send a suggestion</h2>
        <label class="fl" for="sg-topic">Topic</label>
        <select class="inp sel" id="sg-topic" name="category" required>
          <option value="idea">Game idea</option>
          <option value="question">New question</option>
          <option value="bug">Bug report</option>
          <option value="other">Other</option>
        </select>
        <label class="fl" for="sg-msg">Your suggestion <span class="sub" id="sg-count">0 / 1000</span></label>
        <textarea class="inp area" id="sg-msg" name="message" rows="6" maxlength="1000" required placeholder="At least 10 characters"></textarea>
        <div class="two">
          <div><label class="fl" for="sg-name">Name <span class="sub">(optional)</span></label><input class="inp" id="sg-name" name="name" maxlength="60" autocomplete="nickname"></div>
          <div><label class="fl" for="sg-email">Email <span class="sub">(optional, only to reply)</span></label><input class="inp" id="sg-email" name="email" type="email" maxlength="120" autocomplete="email"></div>
        </div>
        <div class="hp" aria-hidden="true"><label for="sg-web">Website</label><input id="sg-web" name="website" tabindex="-1" autocomplete="off"></div>
        <input type="hidden" name="token" id="sg-token">
        <p class="sub" style="margin:0">Please don't include passwords or other private information.</p>
        <div><button class="btn" id="sg-send" type="submit">Send suggestion</button></div>
        <p class="sgmsg" id="sg-status" role="status" aria-live="polite"></p>
      </form>

      <section class="credits" aria-labelledby="credits-h">
        <h2 class="step" id="credits-h">Credits &amp; sources</h2>
        <p class="sub" style="margin:0 0 6px">Codeshire is built with these free resources. Thank you to their creators.</p>
        <div class="credit">
          <strong>Farm RPG: Tiny Asset Pack (free 16×16)</strong>
          <span>Grass tiles, cottage, crops, fences, trees, chest, cow, chickens and the farmer. The summer, autumn and winter colours are recolours of the free spring pack made for Codeshire.</span>
          <a href="https://maevedevs.itch.io/farm-rpg" target="_blank" rel="noopener noreferrer">maevedevs.itch.io/farm-rpg</a>
        </div>
        <div class="credit">
          <strong>Tiny RPG Character Asset Pack (Free Soldier &amp; Orc)</strong>
          <span>by Zerie. The soldier and orc characters and their animations.</span>
          <a href="https://zerie.itch.io/tiny-rpg-character-asset-pack" target="_blank" rel="noopener noreferrer">zerie.itch.io/tiny-rpg-character-asset-pack</a>
        </div>
        <div class="credit">
          <strong>Pixelify Sans</strong>
          <span>by Stefie Justprince. Logo and headings. SIL Open Font License.</span>
          <a href="https://fonts.google.com/specimen/Pixelify+Sans" target="_blank" rel="noopener noreferrer">fonts.google.com/specimen/Pixelify+Sans</a>
        </div>
        <div class="credit">
          <strong>Space Grotesk</strong>
          <span>by Florian Karsten. Body text. SIL Open Font License.</span>
          <a href="https://fonts.google.com/specimen/Space+Grotesk" target="_blank" rel="noopener noreferrer">fonts.google.com/specimen/Space+Grotesk</a>
        </div>
        <div class="credit">
          <strong>JetBrains Mono</strong>
          <span>by JetBrains. Code and numbers. SIL Open Font License.</span>
          <a href="https://www.jetbrains.com/lp/mono/" target="_blank" rel="noopener noreferrer">jetbrains.com/lp/mono</a>
        </div>
        <div class="credit">
          <strong>Fontsource</strong>
          <span>Packaged font files, self-hosted on this site.</span>
          <a href="https://fontsource.org" target="_blank" rel="noopener noreferrer">fontsource.org</a>
        </div>
      </section>
    </div>
  </div>
  <footer class="foot">
  <nav class="footlinks" aria-label="Footer"><a href="./">Home</a><a href="#suggest">Suggestions &amp; credits</a></nav>
  <p>&copy; <?= date('Y') ?> Codeshire. All rights reserved.</p>
  <p class="footsmall">Pixel art and fonts are by their original creators and used under their licences. See <a href="#suggest">credits</a>.</p>
</footer>
</div>

<!-- ================= GAME ================= -->
<div id="game" hidden>
  <header class="ghud">
    <div class="left">
      <button class="iconbtn" id="quit" aria-label="Back to challenge select"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button>
      <span class="chipx" id="modeChip">Mixed</span>
      <span class="chipx" id="seasonChip" style="color:var(--leaf)">Lv1 · Spring</span>
    </div>
    <div class="stats">
      <span class="hearts" id="hearts" role="img" aria-label="lives"></span>
      <span><span class="lbl">Orc </span><strong id="orcs">1/3</strong></span>
      <span><span class="lbl">Streak </span><strong id="streak" class="hl">×1</strong></span>
      <span><span class="lbl">Score </span><strong id="score">0</strong></span>
    </div>
  </header>
  <div class="gbody">
    <div class="gview" id="gview">
      <canvas id="cv" class="px" aria-label="Battlefield: your soldier guards the farm as orcs approach"></canvas>
      <div class="overlay" id="ov" hidden><div class="ocard" id="ocard"></div></div>
    </div>
    <section class="panel" id="panel" aria-live="polite"></section>
  </div>
</div>

<noscript><p style="padding:20px;text-align:center;color:#fff">Codeshire needs JavaScript to run.</p></noscript>
<script type="application/json" id="questions-data"><?= questions_json() ?></script>
<script src="<?= asset('assets/js/app.js') ?>" defer></script>
</body>
</html>
