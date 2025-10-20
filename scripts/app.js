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

    // Users table enhancements (sorting, toolbar count, delete modal/toast)
    initUsersTable();
    // Organizations: confirm-only modals + avatar coloring and counts
    initOrgConfirm();
    initOrgAvatars();
    // Resources: file-type thumbnails
    initResourceThumbnails();
    // Subjects: grid thumbnails with code coloring
    initSubjectThumbnails();
    // Sessions calendar
    initCalendar();
    // Community votes
    initCommunityVotes();
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

/* ================= Users Table (sorting + delete) ================= */
function initUsersTable() {
  const table = document.getElementById("users-table");
  if (!table) return;
  const tbody = table.querySelector("tbody");
  const countEl = document.querySelector(".js-user-count");
  const sortButtons = table.querySelectorAll(".js-sort");
  const modal = document.getElementById("confirm-modal");
  const toasts = document.querySelector(".c-toasts");
  let pendingDeleteRow = null;

  // Update count initially
  updateCount();

  // Sorting
  sortButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const th = btn.closest("th");
      const key = btn.getAttribute("data-key");
      if (!th || !key) return;
      // Toggle sort state
      const current = th.getAttribute("aria-sort") || "none";
      const next = current === "ascending" ? "descending" : "ascending";
      // Reset others to none
      table.querySelectorAll("thead th").forEach((oth) => {
        if (oth !== th) oth.setAttribute("aria-sort", "none");
      });
      th.setAttribute("aria-sort", next);
      sortRows(key, next === "ascending");
    });
  });

  function sortRows(key, asc) {
    const rows = Array.from(tbody.querySelectorAll("tr"));
    const getVal = (row) => {
      switch (key) {
        case "name": {
          const el = row.querySelector(".c-user-cell__name");
          return el ? el.textContent.trim().toLowerCase() : "";
        }
        case "email": {
          const el = row.querySelector("td:nth-child(2)");
          return el ? el.textContent.trim().toLowerCase() : "";
        }
        case "year": {
          const el = row.querySelector("td:nth-child(3)");
          if (!el) return 0;
          const m = el.textContent.match(/(\d+)/);
          return m ? parseInt(m[1], 10) : 0;
        }
        case "university": {
          const el = row.querySelector("td:nth-child(4)");
          return el ? el.textContent.trim().toLowerCase() : "";
        }
        case "organization": {
          const el = row.querySelector("td:nth-child(5)");
          return el ? el.textContent.trim().toLowerCase() : "";
        }
        default:
          return "";
      }
    };
    rows.sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      if (typeof va === "number" && typeof vb === "number") {
        return asc ? va - vb : vb - va;
      }
      return asc ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    // Re-append in order
    rows.forEach((r) => tbody.appendChild(r));
  }

  // Delete flow: open modal on delete icon
  tbody.addEventListener("click", (e) => {
    const delBtn = e.target.closest(".c-icon-btn[aria-label='Delete user']");
    if (!delBtn) return;
    pendingDeleteRow = delBtn.closest("tr");
    openModal();
  });

  function openModal() {
    if (!modal) return;
    modal.hidden = false;
    const confirmBtn = modal.querySelector(".js-confirm-delete");
    confirmBtn?.focus();
  }
  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
  }
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target.matches("[data-close]")) {
        closeModal();
      }
    });
    const confirmBtn = modal.querySelector(".js-confirm-delete");
    confirmBtn?.addEventListener("click", () => {
      if (pendingDeleteRow) {
        pendingDeleteRow.remove();
        updateCount();
        showToast("User deleted");
        pendingDeleteRow = null;
      }
      closeModal();
    });
    // Escape to close
    document.addEventListener("keydown", (e) => {
      if (!modal.hidden && e.key === "Escape") closeModal();
    });
  }

  function updateCount() {
    if (!countEl) return;
    const count = tbody.querySelectorAll("tr").length;
    countEl.textContent = String(count);
  }

  function showToast(msg) {
    if (!toasts) return;
    const item = document.createElement("div");
    item.className = "c-toast";
    item.textContent = msg;
    toasts.appendChild(item);
    setTimeout(() => {
      item.remove();
    }, 2500);
  }
}

/* ================= Organizations: confirm-only + avatars & count ================= */
function initOrgConfirm() {
  const modal = document.getElementById("confirm-modal");
  if (!modal) return;
  document.addEventListener("click", (e) => {
    const approve = e.target.closest && e.target.closest(".js-org-approve");
    const reject = e.target.closest && e.target.closest(".js-org-reject");
    const del = e.target.closest && e.target.closest(".js-org-delete");
    const trigger = approve || reject || del;
    if (!trigger) return;
    const titleText = approve
      ? "Approve organization"
      : reject
      ? "Reject organization"
      : "Delete organization";
    const title = modal.querySelector("#confirm-title");
    if (title) title.textContent = titleText;
    modal.hidden = false;
    modal.querySelector(".js-confirm-delete")?.focus();
  });
  modal.addEventListener("click", (e) => {
    if (e.target.matches("[data-close]")) modal.hidden = true;
  });
  document.addEventListener("keydown", (e) => {
    if (!modal.hidden && e.key === "Escape") modal.hidden = true;
  });
}

function initOrgAvatars() {
  // Colorize avatars and set counts per table
  document
    .querySelectorAll("table.c-table[data-org-table]")
    .forEach((table) => {
      const countEl = table.closest("section")?.querySelector(".js-org-count");
      const rows = table.querySelectorAll("tbody tr");
      if (countEl) countEl.textContent = String(rows.length);
      table.querySelectorAll(".c-comm-cell").forEach((row) => {
        const titleEl = row.querySelector(".c-comm-cell__title");
        const avatarEl = row.querySelector(".c-comm-cell__avatar");
        if (!titleEl || !avatarEl) return;
        const title = titleEl.textContent.trim();
        const first = firstAlpha(title);
        const { bg, fg } = avatarColorFromChar(first);
        avatarEl.style.setProperty("--avatar-bg", bg);
        avatarEl.style.setProperty("--avatar-fg", fg);
        avatarEl.textContent = first;
      });
    });
}

/* ================= Resources: thumbnails by file type ================= */
function initResourceThumbnails() {
  const cards = document.querySelectorAll(
    ".c-card[data-filetype] .c-card__media.c-thumb"
  );
  if (!cards.length) return;
  const iconMap = {
    pdf: "file-text", // lucide doesn't have dedicated pdf; use file-text
    doc: "file-text",
    docx: "file-text",
    txt: "file-text",
    md: "file-text",
    ppt: "file-input",
    pptx: "file-input",
    xls: "table",
    xlsx: "table",
    csv: "table",
    image: "image",
    jpg: "image",
    jpeg: "image",
    png: "image",
    gif: "image",
    svg: "image",
    video: "film",
    mp4: "film",
    mov: "film",
    avi: "film",
    zip: "file-archive",
    rar: "file-archive",
    code: "code",
  };
  const palette = [
    "hsl(210 100% 97%)", // blue 50
    "hsl(190 95% 95%)", // cyan 50
    "hsl(150 60% 94%)", // green 70
    "hsl(45 100% 95%)", // amber 50
    "hsl(270 80% 96%)", // violet 60
    "hsl(0 85% 96%)", // red 60
    "hsl(320 80% 96%)", // pink 60
  ];
  const fgForBg = (hslStr) => {
    // Extract hue to compute a pleasant darker fg
    const m = hslStr.match(/hsl\((\d+)/);
    const hue = m ? parseInt(m[1], 10) : Math.floor(Math.random() * 360);
    return `hsl(${hue} 60% 30%)`;
  };
  cards.forEach((thumb, idx) => {
    const article = thumb.closest(".c-card");
    const type = (
      article?.getAttribute("data-filetype") || "file"
    ).toLowerCase();
    const icon = iconMap[type] || "file";
    const bg = palette[idx % palette.length];
    const fg = fgForBg(bg);
    thumb.style.background = bg;
    thumb.style.color = fg;
    thumb.innerHTML = `<i data-lucide="${icon}"></i>`;
  });
  if (window.lucide) window.lucide.createIcons();
}

/* ================= Subjects: grid thumbnails with code ================= */
function initSubjectThumbnails() {
  const thumbs = document.querySelectorAll(".c-card .c-subj-thumb");
  if (!thumbs.length) return;
  const hueFromCode = (code) => {
    // Create a deterministic hue from the subject code string
    let h = 0;
    for (let i = 0; i < code.length; i++) {
      h = (h * 31 + code.charCodeAt(i)) % 360;
    }
    return h;
  };
  thumbs.forEach((el) => {
    const card = el.closest(".c-card");
    const code = (card?.getAttribute("data-code") || "").trim() || "SUBJ";
    const hue = hueFromCode(code);
    const bg = `hsl(${hue} 85% 95%)`;
    const fg = `hsl(${hue} 50% 28%)`;
    el.style.background = bg;
    el.style.color = fg;
    el.innerHTML = `<span class="c-subj-thumb__code">${code}</span>`;
  });
}

/* ================= Calendar (sessions) ================= */
function initCalendar() {
  const cal = document.querySelector(".js-calendar");
  if (!cal) return;
  const titleEl = document.querySelector(".js-cal-title");
  const prevBtn = document.querySelector(".js-cal-prev");
  const nextBtn = document.querySelector(".js-cal-next");
  const todayBtn = document.querySelector(".js-cal-today");

  // Example session data; can be replaced with real data later
  const sessions = [
    {
      date: "2025-10-20",
      time: "10:00",
      title: "DS Lecture",
      kind: "lecture",
      location: "Room A",
      subject: "CS204",
    },
    {
      date: "2025-10-22",
      time: "14:00",
      title: "Workshop: Sorting",
      kind: "workshop",
      location: "Lab 2",
      subject: "CS204",
    },
    {
      date: "2025-10-25",
      time: "09:00",
      title: "Exam Prep",
      kind: "examprep",
      location: "Hall 1",
      subject: "MA201",
    },
  ];

  let viewDate = new Date();

  function fmtMonth(date) {
    return date.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }
  function ymd(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function render() {
    // Clear
    cal.innerHTML = "";
    // Day of week header
    const dow = document.createElement("div");
    dow.className = "c-cal-dow";
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((d) => {
      const s = document.createElement("span");
      s.textContent = d;
      dow.appendChild(s);
    });
    cal.appendChild(dow);

    const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    const firstWeekday = start.getDay();
    const daysInMonth = end.getDate();
    if (titleEl) titleEl.textContent = fmtMonth(viewDate);

    // Build cells (include prev month leading blanks to align week)
    const totalCells = firstWeekday + daysInMonth;
    for (let i = 0; i < totalCells; i++) {
      if (i < firstWeekday) {
        const filler = document.createElement("div");
        filler.className = "c-cal-cell";
        filler.setAttribute("aria-hidden", "true");
        cal.appendChild(filler);
        continue;
      }
      const dayNum = i - firstWeekday + 1;
      const cellDate = new Date(
        viewDate.getFullYear(),
        viewDate.getMonth(),
        dayNum
      );
      const cell = document.createElement("div");
      cell.className = "c-cal-cell";
      const head = document.createElement("div");
      head.className = "c-cal-cell__head";
      const dateEl = document.createElement("span");
      dateEl.className = "c-cal-cell__date";
      dateEl.textContent = String(dayNum);
      head.appendChild(dateEl);
      cell.appendChild(head);

      const dateKey = ymd(cellDate);
      sessions
        .filter((s) => s.date === dateKey)
        .forEach((s) => {
          const a = document.createElement("a");
          a.href = "#";
          a.className = "c-cal-event";
          a.dataset.kind = s.kind;
          a.textContent = `${s.time} • ${s.title}`;
          a.addEventListener("click", (e) => {
            e.preventDefault();
            openSessionModal(s);
          });
          cell.appendChild(a);
        });
      cal.appendChild(cell);
    }
    if (window.lucide) window.lucide.createIcons();
  }

  function openSessionModal(s) {
    const modal = document.getElementById("session-modal");
    if (!modal) return;
    modal.hidden = false;
    const title = modal.querySelector("#session-title");
    const content = modal.querySelector(".js-session-content");
    if (title) title.textContent = s.title;
    if (content)
      content.innerHTML = `
      <div class="u-stack-2">
        <p><strong>Date:</strong> ${s.date} ${s.time}</p>
        <p><strong>Subject:</strong> ${s.subject}</p>
        <p><strong>Type:</strong> ${s.kind}</p>
        <p><strong>Location:</strong> ${s.location}</p>
      </div>`;
    modal.addEventListener(
      "click",
      (e) => {
        if (e.target.matches("[data-close]")) modal.hidden = true;
      },
      { once: true }
    );
    document.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape") modal.hidden = true;
      },
      { once: true }
    );
  }

  prevBtn?.addEventListener("click", () => {
    viewDate.setMonth(viewDate.getMonth() - 1);
    render();
  });
  nextBtn?.addEventListener("click", () => {
    viewDate.setMonth(viewDate.getMonth() + 1);
    render();
  });
  todayBtn?.addEventListener("click", () => {
    viewDate = new Date();
    render();
  });

  render();
}

/* ================= Community votes (UI only) ================= */
function initCommunityVotes() {
  document.addEventListener("click", (e) => {
    const up = e.target.closest(".js-upvote");
    const down = e.target.closest(".js-downvote");
    if (!up && !down) return;
    e.preventDefault();
    const post = up?.closest(".c-post") || down?.closest(".c-post");
    const scoreEl = post?.querySelector(".js-score");
    if (!scoreEl) return;
    let score = parseInt(scoreEl.textContent, 10) || 0;
    if (up) score++;
    if (down) score = Math.max(0, score - 1);
    scoreEl.textContent = String(score);
  });
}
