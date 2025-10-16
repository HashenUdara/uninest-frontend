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
    initOrgTables();
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

/* ================= Organizations Tables (sorting + approve/reject) ================= */
function initOrgTables() {
  const tables = document.querySelectorAll("table.c-table[data-org-table]");
  if (!tables.length) return;

  tables.forEach((table) => {
    const tbody = table.querySelector("tbody");
    const countEl = table.closest("section")?.querySelector(".js-org-count");
    const sortButtons = table.querySelectorAll(".js-sort");
    const modal = document.getElementById("confirm-modal");
    const editModal = document.getElementById("org-edit-modal");
    const toasts = document.querySelector(".c-toasts");
    let pendingAction = null; // { row, type }
    let editingRow = null; // tr | null

    updateCount();

    sortButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const th = btn.closest("th");
        const key = btn.getAttribute("data-key");
        if (!th || !key) return;
        const current = th.getAttribute("aria-sort") || "none";
        const next = current === "ascending" ? "descending" : "ascending";
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
          case "title": {
            const el = row.querySelector(".c-org-cell__title");
            return el ? el.textContent.trim().toLowerCase() : "";
          }
          case "createdBy": {
            const el = row.querySelector("td:nth-child(4)");
            return el ? el.textContent.trim().toLowerCase() : "";
          }
          case "members": {
            const el = row.querySelector("td:nth-child(5)");
            const m = el ? el.textContent.match(/(\d+)/) : null;
            return m ? parseInt(m[1], 10) : 0;
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
      rows.forEach((r) => tbody.appendChild(r));
    }

    // Approve/Reject/Edit/Delete actions
    tbody.addEventListener("click", (e) => {
      const approve = e.target.closest(".js-org-approve");
      const reject = e.target.closest(".js-org-reject");
      const del = e.target.closest(".js-org-delete");
      const edit = e.target.closest(".js-org-edit");
      if (approve || reject) {
        const row = e.target.closest("tr");
        const type = approve ? "approve" : "reject";
        pendingAction = { row, type };
        openModal(
          type === "approve" ? "Approve organization" : "Reject organization"
        );
        return;
      }
      if (del) {
        const row = e.target.closest("tr");
        pendingAction = { row, type: "delete" };
        openModal("Delete organization");
        return;
      }
      if (edit) {
        editingRow = e.target.closest("tr");
        openEditModal("Edit organization", rowToData(editingRow));
        return;
      }
    });

    function updateCount() {
      if (!countEl) return;
      const count = tbody.querySelectorAll("tr").length;
      countEl.textContent = String(count);
    }

    function openModal(titleText) {
      if (!modal) return;
      const title = modal.querySelector("#confirm-title");
      if (title && titleText) title.textContent = titleText;
      modal.hidden = false;
      modal.querySelector(".js-confirm-delete")?.focus();
    }
    function closeModal() {
      if (!modal) return;
      modal.hidden = true;
    }
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target.matches("[data-close]")) closeModal();
      });
      const confirmBtn = modal.querySelector(".js-confirm-delete");
      confirmBtn?.addEventListener("click", () => {
        if (pendingAction?.row) {
          if (pendingAction.type === "delete") {
            pendingAction.row.remove();
            updateCount();
            showToast("Organization deleted");
          } else {
            pendingAction.row.remove();
            updateCount();
            showToast(
              pendingAction.type === "approve"
                ? "Organization approved"
                : "Organization rejected"
            );
          }
          pendingAction = null;
        }
        closeModal();
      });
      document.addEventListener("keydown", (e) => {
        if (!modal.hidden && e.key === "Escape") closeModal();
      });
    }

    // Create button
    const createBtn = table.closest(".c-page")?.querySelector(".js-org-create");
    if (createBtn) {
      createBtn.addEventListener("click", () => {
        editingRow = null;
        openEditModal("Create organization", {
          title: "",
          id: "",
          desc: "",
          createdBy: "",
          members: 0,
        });
      });
    }

    function openEditModal(titleText, data) {
      if (!editModal) return;
      const title = editModal.querySelector("#org-edit-title");
      if (title) title.textContent = titleText;
      const form = editModal.querySelector(".js-org-form");
      form.querySelector("#org-title").value = data.title || "";
      form.querySelector("#org-id").value = data.id || "";
      form.querySelector("#org-desc").value = data.desc || "";
      form.querySelector("#org-created-by").value = data.createdBy || "";
      form.querySelector("#org-members").value = String(data.members || 0);
      editModal.hidden = false;
      form.querySelector("#org-title").focus();
      const saveBtn = editModal.querySelector(".js-org-save");
      const onSave = () => {
        const newData = {
          title: form.querySelector("#org-title").value.trim(),
          id: form.querySelector("#org-id").value.trim(),
          desc: form.querySelector("#org-desc").value.trim(),
          createdBy: form.querySelector("#org-created-by").value.trim(),
          members: parseInt(form.querySelector("#org-members").value, 10) || 0,
        };
        if (editingRow) {
          updateRow(editingRow, newData);
          showToast("Organization updated");
        } else {
          addRow(newData);
          showToast("Organization created");
        }
        closeEditModal();
      };
      saveBtn.addEventListener("click", onSave, { once: true });
      const onClose = (e) => {
        if (e.target.matches("[data-close]")) closeEditModal();
      };
      editModal.addEventListener("click", onClose, { once: true });
      const onKey = (e) => {
        if (!editModal.hidden && e.key === "Escape") closeEditModal();
      };
      document.addEventListener("keydown", onKey, { once: true });
    }
    function closeEditModal() {
      if (editModal) editModal.hidden = true;
    }

    function rowToData(row) {
      return {
        title:
          row.querySelector(".c-org-cell__title")?.textContent.trim() || "",
        id: (row
          .querySelector(".c-org-cell__sub")
          ?.textContent.match(/ID:\s*(.*)/) || [null, ""])[1],
        desc: row.querySelector("td:nth-child(2)")?.textContent.trim() || "",
        createdBy:
          row.querySelector("td:nth-child(3)")?.textContent.trim() || "",
        members:
          parseInt(
            row.querySelector("td:nth-child(4)")?.textContent.trim() || "0",
            10
          ) || 0,
      };
    }
    function updateRow(row, data) {
      row.querySelector(".c-org-cell__title").textContent = data.title;
      const sub = row.querySelector(".c-org-cell__sub");
      if (sub) sub.textContent = `ID: ${data.id}`;
      const descEl =
        row.querySelector("td:nth-child(2) .u-clamp-2") ||
        row.querySelector("td:nth-child(2)");
      if (descEl) descEl.textContent = data.desc;
      row.querySelector("td:nth-child(3)").textContent = data.createdBy;
      row.querySelector("td:nth-child(4)").textContent = String(data.members);
      const avatar = row.querySelector(".c-org-cell__avatar");
      if (avatar) {
        const first = firstAlpha(data.title);
        const { bg, fg } = avatarColorFromChar(first);
        avatar.style.setProperty("--avatar-bg", bg);
        avatar.style.setProperty("--avatar-fg", fg);
        avatar.textContent = first;
      }
    }
    function addRow(data) {
      const hasApprove = !!table.querySelector(".js-org-approve");
      const hasReject = !!table.querySelector(".js-org-reject");
      const actions = `
        ${
          hasApprove
            ? '<button class="c-btn c-btn--sm js-org-approve" aria-label="Approve">Approve</button>'
            : ""
        }
        ${
          hasReject
            ? '<button class="c-btn c-btn--sm c-btn--ghost js-org-reject" aria-label="Reject">Reject</button>'
            : ""
        }
        <button class="c-icon-btn js-org-edit" aria-label="Edit"><i data-lucide="pencil"></i></button>
        <button class="c-icon-btn js-org-delete" aria-label="Delete"><i data-lucide="trash"></i></button>`;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <div class="c-org-cell">
            <span class="c-org-cell__avatar" aria-hidden="true"></span>
            <div class="c-org-cell__meta">
              <span class="c-org-cell__title"></span>
              <span class="c-org-cell__sub u-text-muted"></span>
            </div>
          </div>
        </td>
        <td><div class="u-clamp-2"></div></td>
        <td></td>
        <td></td>
        <td class="u-text-right"><div class="c-table-actions">${actions}</div></td>`;
      tbody.appendChild(tr);
      updateRow(tr, data);
      updateCount();
      if (window.lucide) window.lucide.createIcons();
    }

    function showToast(msg) {
      if (!toasts) return;
      const item = document.createElement("div");
      item.className = "c-toast";
      item.textContent = msg;
      toasts.appendChild(item);
      setTimeout(() => item.remove(), 2500);
    }

    // Initialize org avatars from title initial
    table.querySelectorAll(".c-org-cell").forEach((row) => {
      const titleEl = row.querySelector(".c-org-cell__title");
      const avatarEl = row.querySelector(".c-org-cell__avatar");
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
