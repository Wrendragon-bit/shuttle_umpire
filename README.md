# 🏸 Shuttle Umpire

A responsive web app that keeps badminton score with official **rally-point rules** and uses the **camera** to follow the shuttle and call IN / OUT. Works on phones, tablets and desktops. No build step, no dependencies.

## Features

- Rally-point scoring: 21 points, win by 2, cap at 30, best of 3 games
- Server and court tracking (right court on even scores, left on odd), singles and doubles
- Interval at 11, change of ends after each game and at 11 in game 3, game point / match point banner
- Camera shuttle tracking from **any angle** (side, corner, behind, low or high)
- 4-corner court calibration with a homography, so IN / OUT uses real court dimensions (6.1 m × 13.4 m, net at 6.7 m)
- Auto-score or suggest-only mode, Undo, "Other team" correction, point history
- Optional spoken score, editable team names, light and dark theme
- Simulate mode: tap the video to drop a shuttle and test the rules without a camera

## Project structure

```
index.html   page structure
style.css    layout, colours, responsive rules
app.js       scoring rules, court geometry, camera tracking, AI helpers
.nojekyll    tells GitHub Pages to serve files as they are
README.md    this file
LICENSE      MIT license
```

## Run locally

The camera needs **HTTPS or localhost**, so don't open the file by double-clicking. Start a small server instead:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Deploy to GitHub Pages

1. Create a new GitHub repository and upload all files in this folder.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then **Save**.
4. After about a minute your site is live at `https://<your-username>.github.io/<repository-name>/` (HTTPS, so the camera works on phones).

## How to use

1. Tap **Start camera** and allow access. Place the camera anywhere with the whole court in view.
2. Tap **Calibrate court** and tap the 4 outer (doubles) corners: the two corners of one end line first, then go around the court. Drag any orange corner until the drawn lines match the real ones.
3. Rally. The app follows the shuttle and decides where it landed:
   - landed **inside** the lines (touching a line is in): the side whose half it landed on loses the rally
   - landed **outside**: the side that hit it loses the rally
4. Use **Undo** or **Other team** if a call is wrong, and the **+1** buttons for faults and lets the camera can't see.

## Customise

| What | Where |
|---|---|
| Colours and dark mode | `:root` variables at the top of `style.css` |
| Layout breakpoints | `@media (min-width:900px)` in `style.css` |
| Fonts | `<link>` in `index.html` and `font:` rules in `style.css` |
| Default team names | `value="Team A"` in `index.html` and `names=[...]` in `app.js` |
| Score limits (21, 30, best of 3) | `point()` and `winsNext()` in `app.js` |
| Court size and net position | `CW`, `CL`, `NET` and `inCourt()` in `app.js` |
| Detection sensitivity, blob size, cooldown | `process()` and `finish()` in `app.js` |

## Limits

- Detection is motion tracking in the browser, not a trained neural network. Poor light, a shuttle that blends into the background, or fast smashes can cause wrong calls. Use Undo and the correction buttons.
- Service faults, foot faults and lets are not detected.
- Treat it as an assistant for casual play, not an official line-judging system.

## AI helpers (optional)

The buttons **AI: find court**, **AI check** and **Ask AI** use `window.claude`, which only exists when the page runs as a published page on claude.ai. On GitHub Pages they stay hidden automatically and everything else works normally.

To enable AI on your own domain, add a small server (for example a Cloudflare Worker) that calls the Claude API with your key kept private, and replace the `AI` calls near the end of `app.js` with `fetch` requests to it. Never put an API key in the browser code.

## License

MIT, see `LICENSE`.
