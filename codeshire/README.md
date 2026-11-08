# Codeshire: Farm Defense: deployment guide

A pixel-art coding game that runs entirely in the player's browser.
Players choose a language (JavaScript, Python, Java, C, or all) and one of six challenge types.
There is also a Suggestions & credits page where visitors can send you ideas.
There are no accounts, database or saved data: lose, and you start again.

## What's in this package

```
README.md          ← this file (do NOT upload it)
QUESTIONS-GUIDE.md ← how to edit the questions (do NOT upload it)
public_html/       ← upload the CONTENTS of this folder to your site
  index.php        the page (PHP 7.4 – 8.3)
  suggest.php      receives suggestions from the form (the only part that accepts input)
  includes/
    config.php     ★ settings: notification email, storage folder, abuse limits
    bootstrap.php  helpers (blocked from the web)
  questions.json   ★ ALL questions + the language list. Edit/replace this to change questions
  .htaccess        security rules, caching, compression
  404.html         not-found page
  robots.txt
  favicon.png
  assets/
    css/app.css    styles
    js/app.js      the game
    img/           sprites
    fonts/         self-hosted fonts + their OFL licences
```

## Install on cPanel (about 5 minutes)

1. **cPanel → File Manager → public_html.** Upload `codeshire-public_html.zip` and click **Extract**.
   Make sure `index.php` and `.htaccess` end up directly inside `public_html`
   (turn on *Settings → Show Hidden Files* to see `.htaccess`).
2. **cPanel → MultiPHP Manager.** Pick any PHP 7.4 or newer for the domain (8.2+ recommended).
3. **cPanel → SSL/TLS Status.** Run AutoSSL so the domain gets a free certificate.
4. Once `https://yourdomain` loads, open `.htaccess` and **uncomment**:
   - the three `RewriteCond/RewriteRule` lines under *Force HTTPS*
   - the `Strict-Transport-Security` header line
5. Visit the site, open **Suggest** in the menu and send a test suggestion.
   The first visit to that page creates a `storage/` folder automatically. If it says
   "Something went wrong", make sure `public_html` is writable by your account (it normally is).

## Reading suggestions

Suggestions are saved to **`public_html/storage/suggestions.jsonl`**: one suggestion per line
(time, topic, name, email, message). Open or download it from cPanel → File Manager.
The whole `storage/` folder is blocked from the web, and nothing visitors send is ever shown on the site.

Optional settings in **`includes/config.php`**:
- `notify_email`: put your address there to get an email for each new suggestion
  (an address on your own domain is least likely to be marked as spam).
- `storage_dir`: for extra safety, move storage **outside** `public_html`,
  e.g. `/home/YOURUSER/codeshire-data` (create the folder first).
- `behind_cloudflare`: set to `true` only if you put Cloudflare in front of the site.
- Limits: 5 suggestions per visitor per hour, 300 per day in total, and the file stops growing at 10 MB.

**Installing in a subfolder** (e.g. `yourdomain.com/game/`): upload into that folder instead, then in
`.htaccess` change `ErrorDocument 404 /404.html` (and the 403 line) to `/game/404.html`.

**Changing questions:** edit or replace `questions.json` only. See `QUESTIONS-GUIDE.md`.
New visitors see the change within 5 minutes. A broken file shows a notice instead of crashing the site.

**Updating the game itself:** replace the changed files. CSS, JS and images get a `?v=` version from their
modification time automatically, so players get the new version without clearing their cache.

## Security

The server side was designed to have nothing to attack:

- `index.php` reads **no user input**, uses no database, sessions, cookies or file writes.
  It reads `questions.json` from disk, checks it, and re-encodes it so nothing in the file can
  inject script into the page (tested with `</script>` and `onerror=` payloads). The file itself
  can't be downloaded directly (403).
  It only allows `GET`/`HEAD` (anything else gets 405/403).
- **Suggestion box (`suggest.php`)**, the only endpoint that accepts input, is protected by:
  a signed, expiring form token (forms submitted under 3 seconds are rejected as bots); a hidden
  honeypot field; same-site checks (Origin / Sec-Fetch-Site), so other websites can't post to it;
  size limits (8 KB request, 1,000-character message); strict validation of every field;
  control characters stripped; rate limits per visitor (IPs are stored only as keyed hashes)
  and per day; a file-size cap; file locking for simultaneous submissions; and the email
  notification never puts visitor text in email headers (no header injection).
- `.htaccess` blocks: directory listings, the `includes/` and `storage/` folders, hidden files (`.git`, `.env`…), running **any** PHP
  file other than `index.php` and `suggest.php`, any script inside `assets/`, docs/backups/config
  files, and every HTTP method except GET/HEAD (POST is allowed only to `suggest.php`).
- Strict **Content-Security-Policy**: scripts, fonts and images load only from your own domain
  (no inline scripts, no third-party CDNs, no Google Fonts calls), the page can't be framed
  (clickjacking), plus `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `COOP/CORP`.
- In the game, everything a player types is escaped before display, input lengths are capped,
  and invalid regexes are caught.

These rules were tested on Apache: `/.git/config`, stray `.php` files, a planted
`assets/img/evil.php`, `README.md`, `includes/config.php`, `storage/*`, directory listing and
`POST /` all return 403. The suggestion box was tested against missing/forged/too-fast tokens,
honeypot bots, cross-site posts, oversized bodies, array injection, invalid fields, script tags in
messages, and rate-limit flooding (the 6th message within an hour gets 429).

**One thing to know:** the questions and answers ship inside `app.js` (that's what makes the
game instant and serverless). A curious player could read them, but with no accounts or
leaderboard there's nothing to gain and nothing to harm. If you later add a **global leaderboard**,
answers must be checked on the server and score submissions rate-limited. Ask before adding one.

## Performance & high load

- Each visit = **1 tiny PHP run + ~330 KB of static files** (gzip-compressed, cached for a year).
  After that, **gameplay makes zero server requests**, so 10 players or 10,000 cost the server the same per visit.
- Local test (Apache + PHP 8.3, 2 CPU cores, 100 concurrent connections, ApacheBench):
  about **10,700 page requests/second with 0 failures**. Your real numbers depend on your host's plan.
- Shared cPanel hosting typically caps concurrent processes/entry processes (often 20–100).
  Because the page is cheap and everything else is cached static files, that is rarely reached.
  For big traffic spikes (Reddit, Product Hunt), put the free **Cloudflare** plan in front of the
  domain: the page sends `Cache-Control: public` headers, so Cloudflare can serve most requests
  without touching your server.
- In the browser: one small canvas loop that pauses when the tab is hidden; runs fine on phones.

## Credits & licences

All sources are listed on the site's **Suggestions & credits** page.
- Farm art: “Farm RPG: Tiny Asset Pack” (free 16x16), https://maevedevs.itch.io/farm-rpg.
  Summer/autumn/winter tiles are recolours of the free spring pack.
- Characters: “Tiny RPG Character Asset Pack (Free Soldier & Orc)” by Zerie,
  https://zerie.itch.io/tiny-rpg-character-asset-pack
- Fonts: Pixelify Sans, Space Grotesk, JetBrains Mono (SIL Open Font License, included).

Neither art pack shipped a licence file. Check each creator's itch.io page for credit and
commercial-use terms before you release publicly. The footer says “All rights reserved” for
Codeshire itself and points to the credits for third-party art and fonts.
