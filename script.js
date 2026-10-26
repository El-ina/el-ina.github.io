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
      button.textContent = 'theme: ' + theme;
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
