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
    const startBtn = dz.querySelector(".js-start-upload");
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
      hiddenInput.addEventListener("change", () => simulateUpload(hiddenInput.files));
    }
    if (startBtn) startBtn.addEventListener("click", () => simulateUpload([{}]));
  }
  ns.upload = { initUploadUI };

  /* ================= Init (DOM Ready) ================= */
  document.addEventListener("DOMContentLoaded", () => {
    // Initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
    initTheme();
    initOrgSwitcher();
    initUploadUI();
    document
      .querySelectorAll("form.js-validate")
      .forEach((f) => attachValidation(f));
  });
})();
