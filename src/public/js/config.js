/* ==========================================================================
   Autobahn Admin — shared browser helpers
   Loaded first on every admin page; exposes a single global: window.AB
   (Plain browser script — no module.exports here, it would throw in the browser.)
   ========================================================================== */
(function (window, document) {
  "use strict";

  /* ---------- formatting ---------- */

  function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatMoney(value) {
    const n = Number(value);
    if (!isFinite(n)) return "—";
    return "\u20A9" + n.toLocaleString("en-US");
  }

  /** Enum values whose plain title-case reads wrong next to the filter labels. */
  const STATUS_LABEL = {
    PAUSE: "Paused",
    BLOCK: "Blocked",
    DELETE: "Deleted",
  };

  /** ACTIVE -> Active, OUT_OF_STOCK -> Out of stock, PAUSE -> Paused */
  function formatStatus(status) {
    if (!status) return "—";
    if (STATUS_LABEL[status]) return STATUS_LABEL[status];

    const s = String(status).replace(/_/g, " ").toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function initials(name) {
    if (!name) return "??";
    return String(name).trim().slice(0, 2).toUpperCase();
  }

  /** Vehicle/member image paths are stored relative, e.g. "uploads/vehicles/x.jpg" */
  function imageUrl(path) {
    if (!path) return null;
    return "/" + String(path).replace(/^\/+/, "");
  }

  /**
   * Every value coming from the database is injected via innerHTML, so it MUST be
   * escaped — review content and nicknames are user-supplied.
   */
  function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Vehicle thumbnail. Rendered as an <img> rather than a background so a missing
   * file (the record can outlive the upload) removes itself and lets the car icon
   * baked into .veh-thumb show through.
   */
  function thumb(images) {
    const src = imageUrl(images && images[0]);
    if (!src) return '<span class="veh-thumb"></span>';
    return (
      '<span class="veh-thumb"><img src="' + escapeHtml(src) +
      '" alt="" onerror="this.remove()" /></span>'
    );
  }

  /* ---------- badges ---------- */

  const BADGE_CLASS = {
    // vehicle
    ACTIVE: "badge-active",
    PAUSE: "badge-paused",
    DELETED: "badge-deleted",
    OUT_OF_STOCK: "badge-blocked",
    // member
    BLOCK: "badge-blocked",
    DELETE: "badge-deleted",
    // order
    CREATED: "badge-paused",
    PROCESSING: "badge-processing",
    FINISHED: "badge-active",
    CANCELLED: "badge-deleted",
    // review
    PENDING: "badge-paused",
    APPROVED: "badge-active",
    REJECTED: "badge-deleted",
  };

  function badge(status) {
    const cls = BADGE_CLASS[status] || "badge-paused";
    return (
      '<span class="ab-badge ' + cls + '">' + escapeHtml(formatStatus(status)) + "</span>"
    );
  }

  /* ---------- row actions ---------- */

  /** Icon + colour for every status a row can be moved TO. */
  const ACTION_STYLE = {
    // vehicle
    ACTIVE: { cls: "act-activate", icon: "bi-check-circle", title: "Set active" },
    PAUSE: { cls: "act-pause", icon: "bi-pause-fill", title: "Pause listing" },
    DELETED: { cls: "act-delete", icon: "bi-trash", title: "Mark as deleted" },
    // member
    BLOCK: { cls: "act-block", icon: "bi-slash-circle", title: "Block" },
    DELETE: { cls: "act-delete", icon: "bi-trash", title: "Delete" },
    // review
    APPROVED: { cls: "act-activate", icon: "bi-check-lg", title: "Approve" },
    PENDING: { cls: "act-pause", icon: "bi-hourglass-split", title: "Move back to pending" },
    REJECTED: { cls: "act-delete", icon: "bi-x-lg", title: "Reject" },
    // order
    PROCESSING: { cls: "act-process", icon: "bi-play-fill", title: "Start processing" },
    FINISHED: { cls: "act-activate", icon: "bi-check-lg", title: "Mark finished" },
    CANCELLED: { cls: "act-delete", icon: "bi-x-lg", title: "Cancel order" },
  };

  /**
   * Renders one button per status the row can actually move to — a row never
   * offers the state it is already in.
   */
  function actions(list, emptyLabel) {
    if (!list || !list.length) {
      return '<span class="text-muted-2" style="font-size:13px;">' +
        escapeHtml(emptyLabel || "No actions") + "</span>";
    }

    return list
      .map(function (status) {
        const style = ACTION_STYLE[status];
        if (!style) return "";
        return (
          '<a class="act-btn ' + style.cls + '" title="' + escapeHtml(style.title) +
          '" href="#" data-action="' + escapeHtml(status) + '">' +
          '<i class="bi ' + style.icon + '"></i></a>'
        );
      })
      .join("");
  }

  function stars(rating) {
    const n = Math.max(0, Math.min(5, Number(rating) || 0));
    let out = '<span class="ab-stars" title="' + n + ' / 5">';
    for (let i = 1; i <= 5; i++) {
      out += '<i class="bi ' + (i <= n ? "bi-star-fill" : "bi-star") + '"></i>';
    }
    return out + "</span>";
  }

  /* ---------- fetch wrappers ---------- */

  /**
   * Admin endpoints authenticate with the session cookie, so credentials must be sent.
   * A 401 means the session expired — bounce back to the login screen.
   *
   * Every admin URL serves both the EJS page and its data; the Accept header is what
   * asks for the JSON side, so it must be present on all of these calls.
   */
  async function request(url, options) {
    const opts = Object.assign({ credentials: "same-origin" }, options);
    opts.headers = Object.assign({ Accept: "application/json" }, opts.headers);

    const res = await fetch(url, opts);

    if (res.status === 401) {
      window.location.replace("/admin/login");
      throw new Error("Not authenticated");
    }

    const text = await res.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch (err) {
      // Legacy routes answer with an HTML <script>alert()</script> body.
      throw new Error("Unexpected server response");
    }

    if (!res.ok) throw new Error((body && body.message) || "Something went wrong!");
    return body;
  }

  const api = {
    get: (url) => request(url, { method: "GET" }),
    post: (url, payload) =>
      request(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload || {}),
      }),
    postForm: (url, formData) => request(url, { method: "POST", body: formData }),
  };

  /* ---------- table states ---------- */

  function stateRow(colspan, icon, message) {
    return (
      '<tr class="ab-state-row"><td colspan="' + colspan + '">' +
      '<div class="ab-state"><i class="bi ' + icon + '"></i><span>' +
      escapeHtml(message) +
      "</span></div></td></tr>"
    );
  }

  const state = {
    loading: (colspan) => stateRow(colspan, "bi-hourglass-split", "Loading…"),
    empty: (colspan, msg) => stateRow(colspan, "bi-inbox", msg || "Nothing to show yet."),
    error: (colspan, msg) => stateRow(colspan, "bi-exclamation-triangle", msg || "Failed to load."),
  };

  /* ---------- pagination ---------- */

  /** Default page size shared by all four admin tables. */
  const PAGE_LIMIT = 6;

  /**
   * Paints the shared pager below a table. `shown` is how many rows this page
   * actually rendered, which is what makes the "1–10 of 42" range correct on the
   * final, partially-filled page.
   */
  function renderPager(opts) {
    const { page, limit, total, shown, noun, els } = opts;
    const pages = Math.max(1, Math.ceil(total / limit));
    const from = total ? (page - 1) * limit + 1 : 0;
    const to = from ? from + shown - 1 : 0;

    if (els.count) {
      els.count.textContent = total
        ? "Showing " + from + "–" + to + " of " + total + " " + noun
        : "";
    }
    if (els.label) els.label.textContent = "Page " + page + " / " + pages;
    if (els.prev) els.prev.disabled = page <= 1;
    if (els.next) els.next.disabled = page >= pages;
    return pages;
  }

  /** Serialises an inquiry into a query string, dropping "all" and empty values. */
  function queryString(params) {
    const qs = new URLSearchParams();
    Object.keys(params).forEach(function (key) {
      const value = params[key];
      if (value === "" || value === null || value === undefined || value === "all") return;
      qs.set(key, value);
    });
    return qs.toString();
  }

  /* ---------- toast ---------- */

  let toastTimer = null;
  function toast(message, kind) {
    let el = document.querySelector(".ab-toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "ab-toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.remove("is-error", "is-ok");
    el.classList.add(kind === "error" ? "is-error" : "is-ok", "show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
  }

  /* ---------- misc ---------- */

  function debounce(fn, wait) {
    let t = null;
    return function () {
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, args), wait || 250);
    };
  }

  /* ---------- post-redirect notices ---------- */

  const NOTICES = {
    login: "Successfully logged in",
    signup: "Successfully signed up",
    logout: "Successfully logged out",
  };

  /**
   * Auth redirects carry ?notice=… because logout destroys the session, so a
   * server-side flash has nowhere to live. Shown once, then stripped from the URL
   * so a refresh or a back-navigation does not repeat it.
   */
  function showNotice() {
    const params = new URLSearchParams(window.location.search);
    const key = params.get("notice");
    if (!key || !NOTICES[key]) return;

    toast(NOTICES[key]);

    params.delete("notice");
    const qs = params.toString();
    window.history.replaceState(
      {},
      "",
      window.location.pathname + (qs ? "?" + qs : "") + window.location.hash
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showNotice);
  } else {
    showNotice();
  }

  window.AB = {
    formatDate,
    formatMoney,
    formatStatus,
    initials,
    imageUrl,
    escapeHtml,
    thumb,
    badge,
    actions,
    stars,
    api,
    state,
    toast,
    debounce,
    PAGE_LIMIT,
    renderPager,
    queryString,
  };
})(window, document);
