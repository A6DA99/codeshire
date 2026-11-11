# Editing the questions: `questions.json`

All questions live in **one file**: `public_html/questions.json`.
To change them, edit or replace that file through cPanel → File Manager. No code changes needed.

- Changes appear for new visitors within **5 minutes** (the page is cached briefly for speed;
  if you use Cloudflare, purge its cache to see changes instantly).
- The file can't be downloaded directly from your site (it returns 403); the server reads it and
  puts it into the page.
- **Safe to get wrong:** if the file has a JSON syntax error, the game shows a notice instead of
  crashing, and the reason goes to cPanel → *Errors* (the PHP error log). If only **one question** is
  wrong (missing field, wrong answer number, unknown language), just that question is skipped;
  the rest still work. Skipped questions are listed in the browser console (F12 → Console).
- Before uploading, paste the file into **jsonlint.com** to catch missing commas or quotes.

## File layout

```json
{
  "_help": "any note for yourself, ignored by the game",
  "languages": [
    { "id": "javascript", "name": "JavaScript" },
    { "id": "python",     "name": "Python" },
    { "id": "java",       "name": "Java" },
    { "id": "c",          "name": "C" }
  ],
  "questions": {
    "output": [ ... ],
    "bug":    [ ... ],
    "regex":  [ ... ],
    "merge":  [ ... ],
    "prod":   [ ... ],
    "dive":   [ ... ]
  }
}
```

### Languages

`languages` controls the buttons players see. **To add a language** (say Go), add
`{ "id": "go", "name": "Go" }` and give questions `"lang": "go"`.
Every question has a `lang`: one of the ids above, or `"any"` to show it for **every** language
(good for regex, servers/devops, git, SQL).

If a language has no questions for a challenge type, that card is greyed out for that language.
Aim for **at least 15 questions per type per language**: one story chapter asks about 14 questions of a single type
(3 stages of foes plus a boss), and Quick battle asks 13. The bank currently has 382 questions.

### JSON gotchas

- Text goes in `"double quotes"`. Inside text, write `\"` for a quote and `\\` for a backslash.
- New line inside code: `\n`.
- No comma after the last item in a list or object.
- `"a"` is the **position of the correct answer, counting from 0** (first option = 0, second = 1…).

## Question formats (one example each)

### `output`: Guess the Output
```json
{
  "lang": "python",
  "code": "print(10 // 3)",
  "opts": ["3", "3.33", "4", "Error"],
  "a": 0,
  "why": "// is floor division."
}
```
`opts`: 2–6 answers. `why` is shown after answering (optional, but recommended).

### `bug`: Spot the Bug
```json
{
  "lang": "java",
  "file": "Menu.java",
  "lines": ["String input = scanner.nextLine();", "if (input == \"yes\") {", "    startGame();", "}"],
  "a": 1,
  "why": "Use \"yes\".equals(input)."
}
```
One string per line of code (2–30 lines), indentation with spaces. `a` = the buggy line, counting from 0.

### `regex`: Regex Defuse
```json
{
  "lang": "any",
  "rule": "Match 24-hour times HH:MM",
  "yes": ["09:30", "23:59"],
  "no":  ["24:00", "9:30"],
  "answer": "^([01]\\d|2[0-3]):[0-5]\\d$"
}
```
Players must match everything in `yes` and nothing in `no`. `answer` is one correct regex, shown
if they fail. **Double every backslash** in JSON (`\d` becomes `\\d`).

### `merge`: Merge Conflict
```json
{
  "lang": "javascript",
  "file": "src/config.js",
  "ours":   { "branch": "feature/ui · \"local testing\"", "code": "const API = \"http://localhost:3000\";" },
  "theirs": { "branch": "main · \"use env config\"",      "code": "const API = process.env.API_URL;" },
  "opts": ["Keep ours", "Keep theirs", "Keep both lines"],
  "a": 1,
  "why": "Hard-coded localhost breaks production."
}
```
`opts`: 2–4 choices.

### `prod`: Prod Is Down
```json
{
  "lang": "any",
  "alert": "Deploy pipeline stuck",
  "log": "$ ./deploy.sh\nbash: ./deploy.sh: Permission denied",
  "commands": ["chmod +x deploy.sh", "chmod 000 deploy.sh", "sudo rm deploy.sh"],
  "a": 0,
  "why": "The script lacks the execute bit."
}
```
`commands`: 2–8 options shown as buttons; players can also type. A typed answer must exactly
match the correct command (extra spaces are ignored).

### `dive`: Stack Dive
```json
{
  "lang": "any",
  "ask": "Name a {git} command",
  "strip": "^git\\s+",
  "tiers": {
    "common":    "commit push pull add status",
    "uncommon":  "rebase stash diff",
    "rare":      "bisect reflog blame",
    "legendary": "rerere fsck"
  }
}
```
- `ask`: the prompt. Wrap the highlighted word in `{curly braces}`.
- `tiers`: space-separated accepted answers. Points: common 50, uncommon 120, rare 250,
  legendary 450 (rare and legendary are critical hits). You can leave tiers out, but keep at least one.
  Answers are case-insensitive.
- `strip` (optional): a regex removed from the player's answer before checking, so
  `git bisect` is accepted as `bisect`. Use `""` for none.
