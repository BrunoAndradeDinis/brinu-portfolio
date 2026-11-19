export const ROUTE_BAND_SCRIPT = `(function () {
  var band = document.getElementById("route-band");
  if (!band || window.__brinuRouteBand) return;
  window.__brinuRouteBand = true;
  if (/^\\/(index\\.html)?$/.test(location.pathname)) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var english = false;
  try {
    english = window.localStorage.getItem("brinu_locale") === "en";
  } catch (error) {}
  if (english) {
    var name = band.querySelector("[data-route-band-name]");
    name.textContent = band.dataset.titleEn;
    name.style.setProperty("--chars", String(band.dataset.titleEn.length));
  }
  band.classList.add("is-out");
})();`;

export const CAREER_PANELS_SCRIPT = `document.querySelectorAll('[data-career-panel]:not([data-career-panel="info"])').forEach((panel) => { panel.hidden = true; });`;

export const INLINE_SCRIPTS = [ROUTE_BAND_SCRIPT, CAREER_PANELS_SCRIPT];

export const NOSCRIPT_PRELOADER_STYLE = '#intro-preloader { display: none !important; }';

export const INLINE_STYLES = [NOSCRIPT_PRELOADER_STYLE];
