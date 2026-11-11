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
<title>Codeshire: The Six Shards</title>
<meta name="description" content="A pixel-art coding adventure. Walk a world map across six regions, beat six bosses and recover the six shards by answering coding challenges.">
<meta name="theme-color" content="#070d1c">
<meta property="og:title" content="Codeshire: The Six Shards">
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
        <a href="#adventure">Adventure</a>
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
        <p class="tag">Six shards. Six regions. One soldier.</p>
        <p class="lede">The Source Crystal has shattered and monsters roam Codeshire. Leave Farmer Tom's farm, cross the woods, catacombs, river, kingdom, forge and abyss, and win every fight with code. Your sword only swings when your code is right.</p>
        <div class="ctas">
          <button class="btn gold" data-go="select">Start the adventure</button>
          <a class="btn ghost" href="#how" style="display:inline-flex;align-items:center;text-decoration:none">How it works</a>
        </div>
        <p class="fine">JavaScript · Python · Java · C · 6 chapters · 6 bosses · Quick battles · plays in your browser</p>
      </div>
      <div class="island">
        <canvas id="island" class="px" width="352" height="256" aria-label="A small pixel island with a cottage, a field, a dock and an orc rowing in. Click to play."></canvas>
        <span class="tap">TAP THE ISLAND</span>
      </div>
    </div>
  </section>

  <section class="sec" id="adventure">
    <h2>A whole world to cross</h2>
    <p>Story mode is a journey across one map. Clear a chapter and a new road opens; your soldier walks on to the next region, meets a new ally and faces a new boss.</p>
    <div class="mapwrap"><canvas id="landmap" class="px" aria-label="World map of Codeshire: Tom's farm, the Whispering Woods, the Bugged Catacombs, Slimewater Crossing, the Forked Kingdom, Mount Prod and the Abyssal Stack."></canvas></div>
    <div class="agrid" id="agrid"></div>
    <div><button class="btn gold" data-go="select">Begin the journey</button></div>
  </section>

  <section class="sec" id="challenges">
    <h2>Six ways to fight, one per chapter</h2>
    <p>Pick the challenge you're best at, or the one you need to practise. Each orc you face brings a new question of that type.</p>
    <div class="cgrid" id="cgrid"></div>
  </section>

  <section class="sec" id="seasons">
    <h2>Quick battle: four seasons on the farm</h2>
    <p>Clear three orcs and the season turns. The clock gets shorter every level, and the Orc Chief waits at the end of winter.</p>
    <div class="sgrid" id="sgrid"></div>
  </section>

  <section class="sec" id="how">
    <h2>How it works</h2>
    <div class="cgrid">
      <div class="cinfo"><h3>1 · Pick a language</h3><p>JavaScript, Python, Java, C, or all of them. Then start Story mode, or jump into a Quick battle of one challenge type.</p></div>
      <div class="cinfo"><h3>2 · Beat the clock</h3><p>When an orc reaches you, its question appears beside the battlefield. Right answers strike; wrong or slow ones cost a heart.</p></div>
      <div class="cinfo"><h3>3 · Walk the map</h3><p>Each chapter has three stages and a boss. Clearing a stage gives back a heart; clearing a chapter opens the road to the next one.</p></div>
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
      <p style="margin:6px 0 0;color:var(--muted)">Pick a language, then start the story or a quick battle.</p>
    </div>
    <p class="qwarn" id="qwarn" hidden></p>
    <div>
      <h2 class="step">1 · Language</h2>
      <div class="langs" id="langs" role="group" aria-label="Language"></div>
    </div>
    <div>
      <h2 class="step">2 · Story mode</h2>
      <div id="advslot"></div>
    </div>
    <div>
      <h2 class="step">3 · Or a quick battle on the farm</h2>
      <div class="selgrid" id="selgrid"></div>
    </div>
    <div>
      <h2 class="pix" style="margin:0 0 10px;font-size:22px;color:var(--leaf)">Quick battle seasons</h2>
      <div class="journey" id="journey"></div>
    </div>
  </div>
  <footer class="foot">
  <nav class="footlinks" aria-label="Footer"><a href="./">Home</a><a href="#suggest">Suggestions &amp; credits</a></nav>
  <p>&copy; <?= date('Y') ?> Codeshire. All rights reserved.</p>
  <p class="footsmall">Pixel art and fonts are by their original creators and used under their licences. See <a href="#suggest">credits</a>.</p>
</footer>
</div>

<!-- ================= WORLD MAP ================= -->
<div id="map" hidden>
  <header class="ghud maphud">
    <div class="left">
      <button class="iconbtn" data-go="select" aria-label="Back to menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button>
      <span class="pix maptitle">The Six Shards</span>
      <span class="chipx" id="maplang">All languages</span>
    </div>
    <div class="shards" id="shards" aria-label="Shards recovered"></div>
  </header>
  <div class="mapbody">
    <div class="mapview">
      <canvas id="mapcv" class="px" aria-label="World map. Click a region you have unlocked to walk there."></canvas>
      <div class="maptoast" id="maptoast" hidden></div>
      <p class="maphint">Click a place on the road to walk there. Clear a chapter to open the next road.</p>
    </div>
    <aside class="mapside" id="mapside"></aside>
  </div>
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
          <strong>Tiny RPG Character Asset Pack 02 (Free Demon &amp; Blood Monster)</strong>
          <span>by Zerie. Null the demon, the Abyss demons and the Mount Prod blood monsters.</span>
          <a href="https://zerie.itch.io/tiny-rpg-character-asset-pack" target="_blank" rel="noopener noreferrer">zerie.itch.io/tiny-rpg-character-asset-pack</a>
        </div>
        <div class="credit">
          <strong>pixel_16_woods (free)</strong>
          <span>Trees, mushrooms, flowers, rocks and pond pieces of the Whispering Woods.</span>
        </div>
        <div class="credit">
          <strong>0x72 Dungeon Tileset II</strong>
          <span>by 0x72. Catacomb and abyss floors, walls, doors, columns, plus the allies, goblins, skeletons, imps, ogre and necromancer.</span>
          <a href="https://0x72.itch.io/dungeontileset-ii" target="_blank" rel="noopener noreferrer">0x72.itch.io/dungeontileset-ii</a>
        </div>
        <div class="credit">
          <strong>Cute Fantasy RPG (free version)</strong>
          <span>by Kenmi. River, meadow and kingdom tiles, house, oak trees, bridge, fences, decor, slimes, skeletons, sheep, pig and Pip. Free version: non-commercial use only.</span>
          <a href="https://kenmi-art.itch.io/cute-fantasy-rpg" target="_blank" rel="noopener noreferrer">kenmi-art.itch.io/cute-fantasy-rpg</a>
        </div>
        <div class="credit">
          <strong>Super Pixel Effects Gigapack (free version)</strong>
          <span>Pixel Art Assets - Will Tice / unTied Games. Hits, explosions, lightning, fire, sparkles, fireworks and warps.</span>
          <a href="https://untiedgames.itch.io/super-pixel-effects-gigapack" target="_blank" rel="noopener noreferrer">untiedgames.itch.io/super-pixel-effects-gigapack</a>
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
      <span><span class="lbl" id="foeLbl">Orc </span><strong id="orcs">1/3</strong></span>
      <span><span class="lbl">Streak </span><strong id="streak" class="hl">×1</strong></span>
      <span><span class="lbl">Score </span><strong id="score">0</strong></span>
    </div>
  </header>
  <div class="gbody">
    <div class="gview" id="gview">
      <canvas id="cv" class="px" aria-label="Battlefield: your soldier guards the farm as orcs approach"></canvas>
      <div class="dlg" id="dlg" hidden role="dialog" aria-live="polite">
        <canvas id="dlgp" class="px" width="40" height="40" aria-hidden="true"></canvas>
        <div class="dtext"><strong id="dlgn"></strong><p id="dlgt"></p></div>
        <div class="dbtns"><span class="mono dcount" id="dlgc"></span><button class="btn ghost small" id="dlgskip">Skip</button><button class="btn small" id="dlgnext">Next ▸</button></div>
      </div>
      <div class="overlay" id="ov" hidden><div class="ocard" id="ocard"></div></div>
    </div>
    <section class="panel" id="panel" aria-live="polite"></section>
  </div>
</div>

<noscript><p style="padding:20px;text-align:center;color:#fff">Codeshire needs JavaScript to run.</p></noscript>
<script type="application/json" id="questions-data"><?= questions_json() ?></script>
<script src="<?= asset('assets/js/story.js') ?>" defer></script>
<script src="<?= asset('assets/js/worldmap.js') ?>" defer></script>
<script src="<?= asset('assets/js/app.js') ?>" defer></script>
</body>
</html>
