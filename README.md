# el-ina.github.io

My personal portfolio site: a terminal-themed page about my work, education, talks, skills, and projects.

**Live site:** https://el-ina.github.io

It's written in plain HTML, CSS, and JavaScript, with no frameworks or dependencies. GitHub Pages serves the files in this repository exactly as they are.

---

## Contents

- [Project structure](#project-structure)
- [How the pages are built](#how-the-pages-are-built)
- [How the styling works](#how-the-styling-works)
- [How the JavaScript works](#how-the-javascript-works)
- [Link previews](#link-previews)
- [Running it locally](#running-it-locally)
- [Updating the content](#updating-the-content)
- [Accessibility](#accessibility)
- [How this was built](#how-this-was-built)
- [Credits](#credits)

---

## Project structure

```
.
├── index.html      Main page: hero, about, experience, education, talks, skills, contact
├── projects.html   Projects page: a grid of project cards
├── 404.html        "Page not found" page, shown by GitHub Pages for any broken URL
├── style.css       All styles for every page
├── script.js       All interactive behavior (theme, menu, scroll effects, skill filter)
├── favicon.svg     The >_ icon shown in the browser tab
├── og-image.png    1200×630 image shown when the site is shared as a link
└── README.md       This file
```

Every page loads the same `style.css` and `script.js`, so the whole site shares one look and one set of behaviors.

---

## How the pages are built

The HTML is **semantic**: each part of the page uses the element that describes what it is, not just a `<div>`.

| Element | Used for |
|---|---|
| `<header>` + `<nav>` | The top bar with the logo, links, and buttons |
| `<main>` | The page content |
| `<section id="...">` | Each part of the page (`#about`, `#experience`, ...). The `id` is what the nav links jump to |
| `<article>` | One self-contained item: a job, a degree, a talk, or a project |
| `<aside>` | The `~/status.json` card, which is extra info next to the intro |
| `<dl>` / `<dt>` / `<dd>` | The skills list (a label and its values) |
| `<footer>` | The bottom line with the copyright and "back to top" |

Class names describe **what something is**, not how it looks: `.entry-title`, `.status-key`, and `.project-card`, not `.big-bold-text`. That keeps the HTML readable and lets the design change without touching the markup.

### The terminal theme in the content

The terminal look is in the text as well as the styles:

- The logo is a shell prompt: `elina@portfolio:~$`
- The intro starts with `$ whoami`
- Every section heading starts with `#`, like a Markdown heading
- Experience is written as `$ git log --career`, with each job as a "commit" and the current one tagged `(HEAD -> main)`
- The 404 page answers `bash: cd: no such file or directory`

---

## How the styling works

`style.css` is split into numbered sections, each with a comment header:

| # | Section | What it styles |
|---|---|---|
| 1 | Design tokens | Colors, fonts, and sizes as CSS variables, plus the light theme |
| 2 | Base styles | `body`, links, focus outlines, and resets |
| 3 | Header & navigation | Logo, nav links, theme and menu buttons, mobile menu |
| 4–12 | Page parts | Container, hero, buttons, status card, sections, entry cards, skills, contact, footer |
| 13 | Projects page | The card grid and tags |
| 14 | Fade-in on scroll | Start and end states of the fade-in animation |
| 15 | Skill filter | Clickable skill chips and the highlight and dim effect |
| 16 | Small screens | Adjustments for phones |

### Design tokens (CSS variables)

All colors and fonts are defined once at the top of the file:

```css
:root {
  --color-bg: #0E1116;
  --color-accent: #C9B3FF;   /* the lavender accent */
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  ...
}
```

Every other rule uses these variables, for example `color: var(--color-accent)`, instead of hard-coded values. So changing the accent color across the whole site means editing one line.

### Light and dark theme

The light theme only redefines the color variables:

```css
:root[data-theme="light"] {
  --color-bg: #F6F8FA;
  --color-accent: #6E40C9;   /* darker purple so it stays readable on white */
  ...
}
```

When `script.js` sets `data-theme="light"` on the `<html>` element, every rule that uses those variables switches automatically. No other CSS is needed for the second theme.

### Layout

- **Flexbox** handles rows that wrap: the nav, the hero (intro next to the status card), the skill chips, and the buttons.
- **CSS Grid** handles the project cards: `repeat(auto-fill, minmax(300px, 1fr))` fits as many columns of at least 300px as the screen allows, then wraps.
- The hero uses `flex: 999 1 480px` on the intro and `flex: 1 1 auto` on the status card. The intro takes almost all the free space, the card is as wide as its longest line, and on narrow screens the card wraps below the intro.
- `clamp(36px, 8vw, 56px)` lets the big name shrink smoothly on small screens.

### Responsive design

The site is built mobile-friendly from the start (flex-wrap, grid, `clamp`), and three media queries handle the rest:

- **Below 980px:** the nav links move behind a `menu` button.
- **Below 600px:** smaller spacing, one project per row, and skill labels above their chips.
- **Below 480px:** the theme button shows only `dark` or `light`, without "theme:", so the header fits on one row.

---

## How the JavaScript works

`script.js` is made of five independent parts. Each one is wrapped in its own function, an IIFE: `(function () { ... })();`. That way its variables don't leak into the rest of the page or clash with each other.

`script.js` is loaded in `<head>` **without** `defer`. Some parts must run before the page is drawn, for example applying the saved theme so the page never flashes the wrong colors. Everything that needs the page's elements waits for the `DOMContentLoaded` event.

### 1. Theme toggle

- Reads the saved theme from `localStorage` (default: `dark`) and sets `data-theme` on `<html>` right away.
- When the `theme:` button is clicked, it switches the theme, saves the choice, and updates:
  - the button text (`theme: dark` / `theme: light`)
  - the button's `aria-label` for screen readers ("Switch to light theme")
  - the `<meta name="theme-color">` tag, so the phone's browser bar matches the page
- Every `localStorage` access is wrapped in `try/catch`, because some browsers block it in private mode. The toggle still works there, it just isn't remembered.

### 2. Mobile menu

- Adds a `has-js` class to `<html>`. The CSS only hides the nav links behind the button when that class is present, so **without JavaScript the links are always visible**.
- The `menu` button toggles an `is-open` class on the nav, switches its text between `menu` and `close`, and updates `aria-expanded` so screen readers know whether the menu is open.
- The menu closes when a link is chosen or Escape is pressed.

### 3. Scroll spy

Highlights the nav link of the section you're currently reading.

- On every scroll (at most once per animation frame, using `requestAnimationFrame`), it finds the last section whose top has passed an imaginary line 35% down the screen.
- At the very bottom of the page it picks the last section (contact), which is too short to reach that line.
- When you click a nav link, that link stays highlighted until scrolling stops. Otherwise a section near the bottom, like skills, could never be highlighted.
- It only runs on pages whose nav links point to `#sections` on the same page, so it does nothing on `projects.html`.

### 4. Fade-in on scroll

Cards fade in and slide up slightly the first time they appear.

- Uses an **IntersectionObserver**, a browser API that reports when an element enters the screen, which is more efficient than checking positions on every scroll.
- Adds a `js-reveal` class to `<html>` immediately, so the CSS can start the cards hidden before the page is drawn.
- Cards that appear at the same moment get a small, growing `transition-delay` (0, 80, 160ms...), so they come in one after another.
- After the animation, each card gets a `reveal-done` class that hands it back to its normal styles, so hover effects keep their own speed.
- It's skipped completely if the visitor has **"reduce motion"** turned on (`prefers-reduced-motion`) or the browser doesn't support IntersectionObserver.

### 5. Skill filter

Click a skill to see where it was used.

- Every job, degree, talk, and project lists its skills in a `data-skills` attribute:
  ```html
  <article class="entry" data-skills="react, typescript, javascript, firebase">
  ```
- On `index.html`, skill chips that appear in at least one `data-skills` are turned into `<button>`s. Skills nothing is tagged with stay as plain text.
- Clicking a skill:
  - adds `is-match` to the matching entries and `is-filtering` to `<main>`, so CSS highlights the matches and dims the rest
  - shows a result line like `$ grep -r "React" ./career → 4 matches`
  - points the **projects** button to `projects.html?skill=React`
- `projects.html` reads the `?skill=` part of the address with `URLSearchParams` and highlights matching projects. **show all** removes it from the address with `history.replaceState`.
- The result line is built with `textContent` and `createElement`, never `innerHTML`. The skill name can come from the URL, and this way no one can inject HTML into the page through a crafted link.

---

## Link previews

When the site is shared on LinkedIn, Slack, Discord, or in a chat, it shows a card with a title, a description, and `og-image.png`. That comes from **Open Graph** tags in each page's `<head>`:

```html
<meta property="og:title" content="Elina Malchinikolova | Portfolio">
<meta property="og:image" content="https://el-ina.github.io/og-image.png">
<meta name="twitter:card" content="summary_large_image">
```

The image URL must be the full `https://...` address, because these apps read the page from their own servers. LinkedIn's Post Inspector (https://www.linkedin.com/post-inspector/) shows how the preview looks and refreshes LinkedIn's cached copy.

---

## Running it locally

Opening `index.html` directly in a browser works for almost everything. To match GitHub Pages exactly, including the 404 page, which uses paths starting with `/`, run a small local server from the repository folder:

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

After pushing, the live site updates within a minute or two. If an old version still shows, do a hard refresh (**Ctrl+Shift+R**, or **Cmd+Shift+R** on a Mac) so the browser reloads `style.css` and `script.js`.

---

## Updating the content

**Add a job, degree, or talk:** copy an existing `<article class="entry" ...>` in `index.html` and change its text. Put the newest one first. Fill in `data-skills` so the skill filter finds it.

**Add a project:** copy an existing `<article class="project-card" ...>` in `projects.html`. Update the path, title, description, tags, and `data-skills`.

**Add a skill:** add a `<span class="chip">` to the right group in the skills section. It becomes clickable automatically as soon as an entry or project lists it in `data-skills`.

**`data-skills` rules:** lowercase, comma-separated, and spelled exactly like the chip, for example `"react, asp.net mvc, html & css"` (`&` is written as `&amp;` in HTML).

**Change colors:** edit the variables at the top of `style.css`. The dark theme is in `:root` and the light theme in `:root[data-theme="light"]`.

---

## Accessibility

- Semantic elements and one `<h1>` per page, so screen readers can navigate by headings and landmarks.
- Real `<button>`s and `<a>` links, so everything works with the keyboard (Tab, Enter, Space, and Escape for the menu).
- Visible focus outlines (`:focus-visible`) in the accent color.
- `aria-label`, `aria-expanded`, `aria-pressed`, and `aria-current` tell screen readers what the buttons and links do and what state they're in.
- `aria-live` on the skill filter result, so its "4 matches" is read out.
- Text colors chosen for readable contrast in both themes.
- Buttons are at least 44px tall, which is comfortable to tap.
- Animations are turned off for visitors who ask for reduced motion.
- Without JavaScript, all content and links are still visible.

---

## How this was built

This site started as a Git course assignment: create a GitHub Pages site and commit to it every day for five days. The goal was practicing Git daily with `git status`, `git log`, `git diff`, partial staging with `git add -p`, and meaningful commit messages.

| Day | What was added |
|---|---|
| 1 | "Hello world" page, the full page structure from my CV, and the terminal-themed stylesheet |
| 2 | Projects page, practicing `git add -p` to split unrelated changes into separate commits |
| 3 | Favicon, light/dark theme toggle, custom 404 page, and a wider status card |
| 4 | Scroll spy (nav highlights the current section) and fade-in on scroll |
| 5 | Mobile menu, link previews, clickable skills, and this README |

The full history is in the commit log:

```bash
git log --oneline
```

The site will keep growing after the course, with one commit per change.

---

## Credits

- Fonts: [JetBrains Mono](https://www.jetbrains.com/lp/mono/) and [Inter](https://rsms.me/inter/), both via Google Fonts
- Hosting: [GitHub Pages](https://pages.github.com/)