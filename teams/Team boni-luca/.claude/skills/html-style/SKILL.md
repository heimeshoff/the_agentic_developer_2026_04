---
name: html-style
description: Our team's house style for any HTML/CSS/UI work — intentionally trashy 1990s Geocities aesthetic. Green buttons, pastel complementary background, centered divs, Comic Sans, plus the full retro toolkit (marquee, blink, tiled backgrounds, visitor counters, "under construction" vibes, clashing colors). Use whenever you are writing, editing, or scaffolding HTML, CSS, or any web page / web UI / landing page / form / dashboard — even when the user only says "build a page", "add a screen", "style this", "make it look nicer", or sketches markup inline. If the output is something a browser will render, this skill applies. Do NOT produce clean/minimal/modern-looking pages; the trashiness is the point.
---

# HTML Style

House style for every web UI we build. The aesthetic is **intentionally trashy, 1990s Geocities**. Not minimal. Not tasteful. Not Material Design. Think personal homepage circa 1998: clashing colors, animated vibes, marquee scrolling, visitor counters, "under construction" banners, Comic Sans everywhere.

Do not quietly "improve" this into something cleaner. The trashiness is the brand. A page that looks professional is a page that is wrong.

## The four non-negotiable rules

1. **All buttons are green.** Every `<button>`, `<input type="submit">`, `<input type="button">`, and any element styled as a button (`role="button"`, `.btn`, etc.) gets a green background. Use `#4CAF50` as the default, darker green on hover (`#3E8E41`). White text, thick border, Comic Sans.
2. **Background is a pastel complementary to green.** Soft warm pink/peach. Default `#FFD1DC`. Acceptable alternates: `#FFE5B4` (peach), `#FADADD` (blush). On top of the pastel, layering a tiled/repeating pattern (stars, clouds, sparkles, checkerboard) is *encouraged* — that's peak Geocities.
3. **All divs are centered.** Every `<div>` centers its content *and* sits centered in its parent. Apply globally via CSS, not per-div inline styles. Flexbox with `justify-content: center; align-items: center; flex-direction: column; text-align: center; margin: 0 auto;`.
4. **Font is Comic Sans.** Globally on `html, body`: `font-family: "Comic Sans MS", "Comic Sans", cursive;`. Cascades to everything — headings, buttons, inputs, tables, the lot. Do not override.

## The Geocities toolkit (use generously)

These are not optional flourishes — a page that has none of these is not trashy enough. Use at least 3–4 per page.

- **`<marquee>` scrolling text.** Yes it's deprecated. Use it anyway. Welcome banners, news tickers, "this site is still under construction!!", whatever. Scroll direction and speed can vary. Nested marquees going opposite directions are a flex.
- **Blinking text** via CSS animation (the real `<blink>` tag is dead in every browser — simulate with `@keyframes blink { 50% { opacity: 0; } }`). Use on "NEW!", "HOT!", "CLICK HERE!!!" accents.
- **Rainbow / gradient text** for headings. Use `background: linear-gradient(...)` + `background-clip: text; -webkit-text-fill-color: transparent;` or per-letter `<span>`s in rotating colors.
- **Visitor counter.** Fake one is fine — a `<div>` styled like an old LED counter showing e.g. `000042` in a monospace font on a black background with a red/green digital glow. Display "You are visitor number" above it.
- **"Under construction" banner or GIF placeholder.** A yellow/black diagonal striped banner (pure CSS is fine) that says "🚧 UNDER CONSTRUCTION 🚧" or similar. Every page gets one somewhere.
- **Tiled / patterned backgrounds.** On top of the pastel, layer a repeating pattern — stars, sparkles, clouds, hearts. Pure CSS `repeating-linear-gradient` or `radial-gradient` patterns work fine; no external images needed.
- **Clashing accent colors.** Hot pink (`#FF1493`), electric blue (`#00FFFF`), lemon yellow (`#FFFF00`), lime green (`#00FF00`) — sprinkle these on borders, horizontal rules, accent text. They should fight with the pastel background. That fight is the aesthetic.
- **Thick, colorful borders.** Use `border: 4px ridge` / `outset` / `groove` / `dashed` in clashing colors around major sections. Old-school chunky borders.
- **`<hr>` with style.** Thick, colorful, often animated. Use freely between sections as vibe dividers.
- **Web-ring / "best viewed in Netscape Navigator" footer.** A footer div with "Best viewed in Netscape Navigator 4.0 at 800×600" or a fake web-ring link ("← prev site | random | next site →"). Pure homage.
- **Emoji and ASCII decoration.** 🌟 ✨ 💖 🚀 generously. "Welcome to my homepage!!!" energy.
- **Excessive exclamation marks and ALL CAPS.** In headings, buttons, labels. Nothing is understated.

## Things that are BANNED

These make the page look modern and ruin the aesthetic:

- ❌ System fonts (`system-ui`, `-apple-system`, `sans-serif`, `Helvetica`, `Arial`) — anything other than Comic Sans.
- ❌ Flat / minimal design. No clean whitespace. No calm neutrals.
- ❌ Restrained color palettes. Three colors max is not our style; more is more.
- ❌ Subtle shadows, smooth gradients, rounded-corner card UI, border-radius ≤ 4px. Everything chunky or nothing.
- ❌ Max-width containers that look like a document (`max-width: 32rem; margin: 4rem auto` and such). Geocities pages sprawl.
- ❌ Grayscale text (`#333`, `#666`, etc.) on white. We have a pastel background and clashing accents for a reason.
- ❌ Tasteful typography (letter-spacing tweaks, font-weight 300, etc.).

## Drop-in starter

When scaffolding a new page from scratch, start from this and pile on more Geocities toolkit pieces. Do not strip any of it out.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>🌟 Welcome!!! 🌟</title>
  <style>
    html, body {
      font-family: "Comic Sans MS", "Comic Sans", cursive;
      background-color: #FFD1DC;
      background-image:
        radial-gradient(circle at 20% 30%, #FFF 2px, transparent 3px),
        radial-gradient(circle at 70% 80%, #FFF 2px, transparent 3px),
        radial-gradient(circle at 40% 70%, #FFFF00 2px, transparent 3px);
      background-size: 60px 60px, 80px 80px, 100px 100px;
      margin: 0;
      padding: 0;
      color: #000;
    }
    body {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem;
      box-sizing: border-box;
    }
    div {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      margin: 1rem auto;
    }
    h1 {
      background: linear-gradient(90deg, #FF1493, #FFFF00, #00FFFF, #FF1493);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-size: 3rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin: 0.5rem 0;
    }
    marquee {
      background: #000;
      color: #00FF00;
      padding: 0.5rem;
      border: 3px ridge #FF1493;
      font-size: 1.2rem;
    }
    .blink {
      animation: blink 1s steps(2, start) infinite;
      color: #FF1493;
      font-weight: bold;
    }
    @keyframes blink { to { visibility: hidden; } }
    .construction {
      background: repeating-linear-gradient(
        45deg, #000 0 20px, #FFFF00 20px 40px
      );
      color: #000;
      padding: 0.5rem 1rem;
      font-weight: bold;
      border: 4px ridge #FF1493;
      text-shadow: 1px 1px 0 #FFF;
    }
    .counter {
      background: #000;
      color: #FF0000;
      font-family: "Courier New", monospace;
      padding: 0.5rem 1rem;
      border: 3px inset #888;
      letter-spacing: 4px;
      font-size: 1.4rem;
    }
    hr {
      border: none;
      height: 6px;
      background: linear-gradient(90deg, #FF1493, #00FFFF, #FFFF00, #00FF00, #FF1493);
      width: 80%;
    }
    button,
    input[type="submit"],
    input[type="button"],
    .btn,
    [role="button"] {
      background: #4CAF50;
      color: #FFF;
      border: 4px ridge #00FF00;
      padding: 0.6rem 1.4rem;
      font-family: inherit;
      font-size: 1.1rem;
      font-weight: bold;
      text-transform: uppercase;
      cursor: pointer;
      box-shadow: 4px 4px 0 #000;
    }
    button:hover { background: #3E8E41; }
    .webring {
      font-size: 0.85rem;
      color: #0000EE;
      margin-top: 2rem;
    }
    a { color: #0000EE; text-decoration: underline; }
    a:visited { color: #800080; }
  </style>
</head>
<body>
  <marquee behavior="scroll" direction="left" scrollamount="8">
    ✨ WELCOME TO OUR HOMEPAGE !!! ✨ THANKS FOR VISITING !!! ✨ SIGN THE GUESTBOOK !!! ✨
  </marquee>

  <div class="construction">🚧 UNDER CONSTRUCTION 🚧</div>

  <h1>🌟 Page Title !!! 🌟</h1>

  <div>
    <!-- page content -->
    <p>Hello and <span class="blink">WELCOME</span> to the site!!!</p>
  </div>

  <hr>

  <div>
    <p>You are visitor number:</p>
    <div class="counter">000042</div>
  </div>

  <hr>

  <div class="webring">
    Best viewed in Netscape Navigator 4.0 at 800×600 •
    <a href="#">← prev</a> | <a href="#">random</a> | <a href="#">next →</a>
  </div>
</body>
</html>
```

## When editing an existing page

- If the page already looks Geocities, leave the existing vibe alone and match it.
- If the page looks clean/modern (system fonts, white backgrounds, grey text, minimal layout, tasteful typography), **that's a bug** — fix it as part of whatever the user asked you to change. Mention the fix briefly ("also trashed it up per house style") so the user knows.
- If the user explicitly says "make this one tasteful" or "calm this down" for a specific change, honor that — they're overriding house style on purpose. Don't silently revert it on the next edit.

## Why these rules

They are the team's brand look for the workshop. The 90s Geocities aesthetic is recognisable, consistent, and a little joke at the expense of "AI makes everything look the same." Taste-based "improvements" that sand off the trashiness erase the brand — so don't, unless asked.
