/* ==========================================================
   Theme toggle
   - Dark is the default theme.
   - The visitor's choice is saved in localStorage, so it is
     remembered on the next visit and on every page.
   - This file is loaded in <head> (without defer) so the saved
     theme is applied before the page is drawn: no flash of the
     wrong colors.
   ========================================================== */

(function () {
  const root = document.documentElement;   // the <html> element
  const STORAGE_KEY = 'theme';

  // localStorage can be blocked (e.g. private mode), so guard every access
  function getSavedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
      // Not saved; the toggle still works for this page view
    }
  }

  // Sets data-theme on <html>; the CSS variables in style.css react to it
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);

    // Match the mobile browser bar to the page background
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'light' ? '#F6F8FA' : '#0E1116');
    }

    // Update the button's text and its label for screen readers
    const button = document.querySelector('.theme-toggle');
    if (button) {
      const next = theme === 'light' ? 'dark' : 'light';
      // "theme: " sits in its own span so CSS can hide it on very small screens
      button.innerHTML = '<span class="theme-label">theme: </span>' + theme;
      button.setAttribute('aria-label', 'Switch to ' + next + ' theme');
    }
  }

  // 1. Runs immediately, before the body exists
  applyTheme(getSavedTheme() || 'dark');

  // 2. Runs once the HTML is loaded and the button exists
  document.addEventListener('DOMContentLoaded', function () {
    const button = document.querySelector('.theme-toggle');
    if (!button) return;

    applyTheme(root.getAttribute('data-theme'));   // sync the button text

    button.addEventListener('click', function () {
      const current = root.getAttribute('data-theme');
      const next = current === 'light' ? 'dark' : 'light';
      applyTheme(next);
      saveTheme(next);
    });
  });
})();


/* ==========================================================
   Mobile menu
   On narrow screens the nav links are tucked behind a "menu"
   button. Without JavaScript they simply stay visible, because
   the CSS only hides them when <html> has the "has-js" class.
   ========================================================== */

(function () {
  document.documentElement.classList.add('has-js');   // runs in <head>, before drawing

  document.addEventListener('DOMContentLoaded', function () {
    const nav = document.querySelector('.nav');
    const button = document.querySelector('.menu-toggle');
    if (!nav || !button) return;   // e.g. the 404 page has no menu

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', String(open));
      button.textContent = open ? 'close' : 'menu';
    }

    button.addEventListener('click', function () {
      setOpen(!nav.classList.contains('is-open'));
    });

    // Close the menu after choosing a link...
    nav.querySelectorAll('.nav-links a').forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });

    // ...or when Escape is pressed
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        button.focus();
      }
    });
  });
})();


/* ==========================================================
   Scroll spy
   Highlights the nav link of the section you're currently
   reading. Only runs on pages whose nav links point to
   sections on the same page (#about, #experience, ...).
   ========================================================== */

(function () {
  document.addEventListener('DOMContentLoaded', function () {
    const links = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
    const sections = links
      .map(function (link) { return document.querySelector(link.getAttribute('href')); })
      .filter(Boolean);

    if (sections.length === 0) return;   // e.g. projects.html

    // When a nav link is clicked, keep it highlighted until the page stops
    // scrolling. Otherwise a section near the bottom (like skills) could
    // never be highlighted, because the page can't scroll it up to the line.
    let clicked = null;
    let unlockTimer = null;

    links.forEach(function (link) {
      link.addEventListener('click', function () {
        clicked = document.querySelector(link.getAttribute('href'));
        update();
      });
    });

    function update() {
      const marker = window.innerHeight * 0.35;   // an imaginary line 35% down the screen
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

      // The current section is the last one whose top has passed the line
      let current = null;
      sections.forEach(function (section) {
        if (section.getBoundingClientRect().top <= marker) {
          current = section;
        }
      });

      // The last section is short, so it may never reach the line:
      // treat "scrolled to the very bottom" as reading it
      if (atBottom) {
        current = sections[sections.length - 1];
      }

      if (clicked) {
        current = clicked;
      }

      links.forEach(function (link) {
        const isActive = current !== null && link.getAttribute('href') === '#' + current.id;
        link.classList.toggle('is-active', isActive);
      });
    }

    // Run update() at most once per frame while scrolling
    let ticking = false;
    window.addEventListener('scroll', function () {
      if (clicked) {
        // Release the clicked link 150ms after the scrolling stops
        clearTimeout(unlockTimer);
        unlockTimer = setTimeout(function () { clicked = null; }, 150);
        return;
      }
      if (!ticking) {
        window.requestAnimationFrame(function () {
          update();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', update);
    update();
  });
})();


/* ==========================================================
   Fade-in on scroll
   Cards fade and slide up slightly the first time they come
   into view. Skipped for visitors who turned on "reduce
   motion" in their system settings, and for old browsers.
   ========================================================== */

(function () {
  const supported = 'IntersectionObserver' in window;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!supported || reduceMotion) return;

  // Added right away, in <head>, so the cards start hidden
  // and never flash on screen before the animation
  document.documentElement.classList.add('js-reveal');

  const SELECTOR = '.status-card, .about-text, .entry, .project-card, .skill-group, .contact-links';

  document.addEventListener('DOMContentLoaded', function () {
    const observer = new IntersectionObserver(function (entries) {
      let delay = 0;

      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        const element = entry.target;
        const myDelay = delay;
        delay = Math.min(delay + 80, 320);   // cards that appear together come in one after another

        element.style.transitionDelay = myDelay + 'ms';
        element.classList.add('is-visible');
        observer.unobserve(element);           // only animate once

        // When the fade is over, hand the element back to its normal
        // styles so hover effects keep their own speed
        setTimeout(function () {
          element.classList.add('reveal-done');
          element.style.transitionDelay = '';
        }, 600 + myDelay);
      });
    }, { threshold: 0.1 });

    document.querySelectorAll(SELECTOR).forEach(function (element) {
      observer.observe(element);
    });
  });
})();


/* ==========================================================
   Skill filter
   Roles, talks and projects list their skills in a
   data-skills="react, typescript, ..." attribute.
   - index.html: skill chips that appear in some data-skills
     become buttons. Clicking one highlights the matching
     entries and dims the rest.
   - projects.html?skill=React: highlights matching projects.
   ========================================================== */

(function () {
  function normalize(text) {
    return text.trim().toLowerCase();
  }

  function skillsOf(element) {
    return (element.getAttribute('data-skills') || '')
      .split(',')
      .map(normalize)
      .filter(Boolean);
  }

  document.addEventListener('DOMContentLoaded', function () {
    const items = Array.from(document.querySelectorAll('[data-skills]'));
    const panel = document.querySelector('.skill-filter');
    if (items.length === 0 || !panel) return;

    const main = document.querySelector('main');
    const command = panel.querySelector('.skill-filter-command');
    const jumpButton = panel.querySelector('.skill-filter-jump');
    const projectsLink = panel.querySelector('.skill-filter-projects');
    const clearButton = panel.querySelector('.skill-filter-clear');
    const onProjectsPage = document.querySelector('.project-grid') !== null;

    // Every skill used by at least one item
    const knownSkills = new Set();
    items.forEach(function (item) {
      skillsOf(item).forEach(function (skill) { knownSkills.add(skill); });
    });

    let matches = [];

    // Highlight the items that use `label` (or clear everything when it's null)
    function applyFilter(label) {
      const skill = label === null ? null : normalize(label);

      matches = items.filter(function (item) {
        const isMatch = skill !== null && skillsOf(item).includes(skill);
        item.classList.toggle('is-match', isMatch);
        return isMatch;
      });

      main.classList.toggle('is-filtering', skill !== null);
      panel.hidden = skill === null;

      document.querySelectorAll('.chip-button').forEach(function (chip) {
        chip.setAttribute('aria-pressed', String(normalize(chip.textContent) === skill));
      });

      if (skill === null) return;

      // Build the terminal-style result line with DOM methods (no innerHTML),
      // because on projects.html the label comes from the URL
      const count = matches.length;
      const result = document.createElement('span');
      result.className = 'skill-filter-count';
      result.textContent = count + (count === 1 ? ' match' : ' matches');

      command.textContent = onProjectsPage
        ? '$ ls ~/projects | grep "' + label + '"  → '
        : '$ grep -r "' + label + '" ./career  → ';
      command.appendChild(result);

      if (jumpButton) jumpButton.hidden = count === 0;
      if (projectsLink) projectsLink.href = 'projects.html?skill=' + encodeURIComponent(label);
    }

    // index.html: turn matching chips into buttons
    let activeLabel = null;
    document.querySelectorAll('.skill-group .chip').forEach(function (chip) {
      if (!knownSkills.has(normalize(chip.textContent))) return;   // e.g. Tailwind CSS: nothing tagged yet

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chip chip-button';
      button.textContent = chip.textContent;
      button.setAttribute('aria-pressed', 'false');

      button.addEventListener('click', function () {
        activeLabel = activeLabel === button.textContent ? null : button.textContent;
        applyFilter(activeLabel);
      });

      chip.replaceWith(button);
    });

    const hint = document.querySelector('.skill-hint');
    if (hint && document.querySelector('.chip-button')) hint.hidden = false;

    if (jumpButton) {
      jumpButton.addEventListener('click', function () {
        if (matches.length > 0) {
          matches[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }

    clearButton.addEventListener('click', function () {
      activeLabel = null;
      applyFilter(null);
      if (onProjectsPage) {
        history.replaceState(null, '', 'projects.html');   // drop ?skill= from the address
      }
    });

    // projects.html?skill=React
    const fromUrl = new URLSearchParams(window.location.search).get('skill');
    if (onProjectsPage && fromUrl) {
      applyFilter(fromUrl);
    }
  });
})();