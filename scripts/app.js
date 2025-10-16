/*
  Global JS Utilities for UniNest
  - Theme toggle (persisted)
  - Form validation helper
  - Password strength meter (hook-based)

  Architecture principles:
  * No framework assumptions
  * Progressive enhancement; safe to load at end of body
  * Small, pure helpers exported to window.UniNest for future extension
*/
(function () {
  const ns = (window.UniNest = window.UniNest || {});

  /* ================= Theme ================= */
  const THEME_KEY = "uninest-theme";
  // Two-state theme only (light/dark)

  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === "dark") root.setAttribute("data-theme", "dark");
    else if (theme === "light") root.setAttribute("data-theme", "light");
    else root.setAttribute("data-theme", "light");
    updateThemeToggle();
  }
  function storedTheme() {
    return localStorage.getItem(THEME_KEY);
  }
  function setStoredTheme(val) {
    localStorage.setItem(THEME_KEY, val);
  }
  function cycleTheme() {
    const current =
      document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "dark" ? "light" : "dark";
    setStoredTheme(next);
    applyTheme(next);
  }
  function updateThemeToggle() {
    const btn = document.querySelector(".js-theme-toggle");
    if (!btn) return;
    const theme =
      document.documentElement.getAttribute("data-theme") || "light";
    const labelEl = btn.querySelector(".c-theme-toggle__label");
    const iconEl = btn.querySelector(".c-theme-toggle__icon");
    let iconName = "",
      text = "";
    if (theme === "dark") {
      iconName = "moon";
      text = "Dark";
      btn.setAttribute("aria-pressed", "true");
    } else {
      iconName = "sun";
      text = "Light";
      btn.setAttribute("aria-pressed", "false");
    }
    if (iconEl && window.lucide) {
      iconEl.innerHTML = `<i data-lucide="${iconName}"></i>`;
      window.lucide.createIcons();
    }
    if (labelEl) labelEl.textContent = text;
  }
  function initTheme() {
    const btn = document.querySelector(".js-theme-toggle");
    if (btn) {
      btn.addEventListener("click", cycleTheme);
      const stored = storedTheme();
      if (stored) applyTheme(stored);
      else applyTheme("light");
    }
  }

  ns.theme = { applyTheme, cycleTheme };

  /* ================= Form Validation ================= */
  function validateForm(form) {
    let valid = true;
    form.querySelectorAll(".c-field").forEach((fieldEl) => {
      const input = fieldEl.querySelector("input,textarea,select");
      const errorEl = fieldEl.querySelector(".c-field__error");
      if (input && !input.checkValidity()) {
        valid = false;
        if (errorEl) errorEl.textContent = input.validationMessage;
        fieldEl.classList.add("is-invalid");
      } else if (errorEl) {
        errorEl.textContent = "";
        fieldEl.classList.remove("is-invalid");
      }
    });
    return valid;
  }
  function attachValidation(form) {
    form.addEventListener("submit", (e) => {
      if (!validateForm(form)) e.preventDefault();
    });
  }
  ns.forms = { validateForm, attachValidation };

  /* ================= Password Strength ================= */
  function passwordScore(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  }
  function initPasswordMeter(inputSelector, meterSelector) {
    const input = document.querySelector(inputSelector);
    const meter = document.querySelector(meterSelector);
    if (!input || !meter) return;
    const label = meter.querySelector(".js-password-strength-label");
    input.addEventListener("input", () => {
      const val = input.value.trim();
      const score = passwordScore(val);
      const pct = (score / 4) * 100 + "%";
      meter.style.setProperty("--meter-pct", pct);
      meter.setAttribute("data-strength", String(score));
      const words = ["Very weak", "Weak", "Fair", "Good", "Strong"];
      if (label) label.textContent = words[score];
    });
  }
  ns.password = { passwordScore, initPasswordMeter };

  /* ================= Organization Switcher ================= */
  const ORG_KEY = "uninest-active-org";
  function getActiveOrg() {
    return localStorage.getItem(ORG_KEY) || "Default University";
  }
  function setActiveOrg(org) {
    localStorage.setItem(ORG_KEY, org);
  }
  function initOrgSwitcher() {
    document.querySelectorAll(".js-org-select").forEach((sel) => {
      const current = getActiveOrg();
      // If the current value exists in options, select it; otherwise keep first
      Array.from(sel.options).forEach((opt) => {
        if (opt.value === current) sel.value = current;
      });
      sel.addEventListener("change", () => {
        setActiveOrg(sel.value);
        // Optional: emit a custom event for components to react
        document.dispatchEvent(
          new CustomEvent("uninest:org-changed", { detail: { org: sel.value } })
        );
      });
    });
    // Reflect active org into any placeholder nodes
    const orgNodes = document.querySelectorAll(".js-active-org");
    orgNodes.forEach((n) => (n.textContent = getActiveOrg()));
  }
  ns.org = { initOrgSwitcher, getActiveOrg, setActiveOrg };

  /* ================= Upload UI (Dropzone + Progress) ================= */
  function initUploadUI() {
    const dz = document.querySelector(".js-upload-dropzone");
    if (!dz) return;
    const browseBtn = dz.querySelector(".js-browse-files");
    const hiddenInput = dz.querySelector(".js-hidden-file");
    const wrapper = document.querySelector(".js-upload-progress");
    const bar = wrapper ? wrapper.querySelector(".c-progress") : null;
    const pctText = wrapper ? wrapper.querySelector(".js-progress-text") : null;

    function setProgress(pct) {
      if (!bar) return;
      bar.style.setProperty("--progress", pct + "%");
      if (pctText) pctText.textContent = pct + "%";
    }

    function simulateUpload(files) {
      if (!files || !files.length) return;
      if (wrapper) wrapper.hidden = false;
      let pct = 0;
      setProgress(0);
      const id = setInterval(() => {
        pct = Math.min(100, pct + Math.round(Math.random() * 12 + 4));
        setProgress(pct);
        if (pct >= 100) clearInterval(id);
      }, 300);
    }

    ["dragenter", "dragover"].forEach((ev) => {
      dz.addEventListener(ev, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dz.classList.add("is-dragover");
      });
    });
    ["dragleave", "drop"].forEach((ev) => {
      dz.addEventListener(ev, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dz.classList.remove("is-dragover");
      });
    });
    dz.addEventListener("drop", (e) => {
      const files = e.dataTransfer?.files;
      simulateUpload(files);
    });
    if (browseBtn && hiddenInput) {
      browseBtn.addEventListener("click", () => hiddenInput.click());
      // Make entire dropzone clickable (excluding when clicking the button already triggers)
      dz.addEventListener("click", (e) => {
        const isBtn = e.target.closest(".js-browse-files");
        if (!isBtn) hiddenInput.click();
      });
      hiddenInput.addEventListener("change", () =>
        simulateUpload(hiddenInput.files)
      );
    }
  }
  ns.upload = { initUploadUI };

  /* ================= Upload Mode Tabs (file | link) ================= */
  function initUploadTabs() {
    const tablist = document.querySelector(".js-upload-tabs");
    if (!tablist) return;
    const filePane = document.querySelector(".js-mode-file");
    const linkPane = document.querySelector(".js-mode-link");
    const linkInput = document.querySelector(".js-link-input");
    function setMode(mode) {
      const tabs = tablist.querySelectorAll(".c-tabs__link");
      tabs.forEach((t) => {
        const active = t.getAttribute("data-mode") === mode;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", active ? "true" : "false");
      });
      const fileActive = mode === "file";
      if (filePane) filePane.hidden = !fileActive;
      if (linkPane) linkPane.hidden = fileActive;
      // Scope required attributes
      if (linkInput) linkInput.required = !fileActive;
    }
    tablist.addEventListener("click", (e) => {
      const btn = e.target.closest(".c-tabs__link");
      if (!btn) return;
      e.preventDefault();
      const mode = btn.getAttribute("data-mode");
      if (mode) setMode(mode);
    });
    setMode("file");
  }
  ns.uploadTabs = { initUploadTabs };

  /* ================= Init (DOM Ready) ================= */
  document.addEventListener("DOMContentLoaded", () => {
    // Initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
    initTheme();
    initOrgSwitcher();
    initUploadUI();
    initUploadTabs();
    // Rating chips (feedback page)
    const chipGroup = document.querySelector(".js-rating-chips");
    if (chipGroup) {
      chipGroup.addEventListener("click", (e) => {
        const chip = e.target.closest(".js-rating-chip");
        if (!chip) return;
        chipGroup
          .querySelectorAll(".js-rating-chip")
          .forEach((c) => c.classList.remove("is-active"));
        chip.classList.add("is-active");
        chipGroup.setAttribute(
          "data-rating",
          chip.getAttribute("data-rating") || ""
        );
      });
    }
    document
      .querySelectorAll("form.js-validate")
      .forEach((f) => attachValidation(f));
  });
})();

// Initialize user avatars (initial + soft background color)
function avatarColorFromChar(ch) {
  // Map A-Z to distinct hues across the color wheel
  const A = "A".charCodeAt(0);
  const idx = Math.max(0, (ch.toUpperCase().charCodeAt(0) - A) % 26);
  const hue = Math.round((360 / 26) * idx); // step around the wheel
  // Soft pastel background + stronger foreground for the letter
  const bg = `hsl(${hue} 85% 92%)`;
  const fg = `hsl(${hue} 60% 35%)`;
  return { bg, fg };
}
function firstAlpha(name) {
  if (!name) return "U";
  const normalized = name.normalize("NFD").replace(/\p{Diacritic}+/gu, "");
  const match = normalized.match(/[A-Za-z]/);
  return match ? match[0].toUpperCase() : "U";
}
document.querySelectorAll(".c-user-cell").forEach((row) => {
  const nameEl = row.querySelector(".c-user-cell__name");
  const avatarEl = row.querySelector(".c-user-cell__avatar");
  if (!nameEl || !avatarEl) return;
  const name = nameEl.textContent.trim();
  const first = firstAlpha(name);
  const { bg, fg } = avatarColorFromChar(first);
  avatarEl.style.setProperty("--avatar-bg", bg);
  avatarEl.style.setProperty("--avatar-fg", fg);
  avatarEl.textContent = first;
});
