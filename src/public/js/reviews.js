/* ==========================================================================
   Autobahn Admin — Reviews page
   Filtering and paging happen SERVER-side: /admin/review/all serves the EJS
   page to the browser and the paginated rows to this fetch (Accept: json).

   Moderation matters beyond this table: only APPROVED reviews feed a vehicle's
   average rating on /vehicle/top-vehicles.
   ========================================================================== */
(function () {
  "use strict";

  const {
    api, actions, badge, escapeHtml, formatDate, formatStatus, imageUrl, initials, stars, thumb,
    state, toast, debounce, PAGE_LIMIT, renderPager, queryString,
  } = window.AB;

  /** A row never offers the state it is already in. */
  const NEXT_ACTIONS = {
    PENDING: ["APPROVED", "REJECTED"],
    APPROVED: ["PENDING", "REJECTED"],
    REJECTED: ["APPROVED", "PENDING"],
  };

  const COLSPAN = 6;
  const tbody = document.getElementById("reviewTableBody");
  const ratingFilter = document.getElementById("ratingFilter");
  const searchInput = document.getElementById("searchInput");
  const chips = document.querySelectorAll(".chip");

  const els = {
    count: document.getElementById("resultCount"),
    label: document.getElementById("pageLabel"),
    prev: document.getElementById("prevPage"),
    next: document.getElementById("nextPage"),
  };

  const query = { page: 1, limit: PAGE_LIMIT, reviewStatus: "all", rating: "all", search: "" };

  /* ---------- rendering ---------- */

  function vehicleCell(review) {
    const v = review.vehicleData;
    if (!v) return '<span class="text-muted-2">Vehicle removed</span>';

    return (
      '<div class="veh-cell">' + thumb(v.vehicleImages) +
        "<span>" +
          '<span class="veh-brand d-block">' + escapeHtml(v.vehicleBrand) + "</span>" +
          '<span class="veh-name">' + escapeHtml(v.vehicleModel) + "</span>" +
        "</span>" +
      "</div>"
    );
  }

  function memberCell(review) {
    const m = review.memberData;
    if (!m) return '<span class="text-muted-2">Deleted member</span>';

    const src = imageUrl(m.memberImage);
    const av = src
      ? '<img class="ab-avatar ab-avatar-sm" src="' + escapeHtml(src) + '" alt="" />'
      : '<span class="ab-avatar ab-avatar-sm">' + escapeHtml(initials(m.memberNick)) + "</span>";

    return '<div class="veh-cell">' + av + "<span>" + escapeHtml(m.memberNick) + "</span></div>";
  }

  function rowHtml(review) {
    return (
      '<tr data-id="' + escapeHtml(review._id) + '">' +
        "<td>" + vehicleCell(review) + "</td>" +
        "<td>" + memberCell(review) + "</td>" +
        '<td class="ab-review-content">' +
          '<p class="ab-review-text">' + escapeHtml(review.content) + "</p>" +
          '<button type="button" class="ab-review-toggle">Show more</button>' +
          '<span class="text-muted-2 d-block" style="font-size:12px;">' + escapeHtml(formatDate(review.createdAt)) + "</span>" +
        "</td>" +
        "<td>" + stars(review.rating) + "</td>" +
        "<td>" + badge(review.reviewStatus) + "</td>" +
        '<td class="text-end">' + actions(NEXT_ACTIONS[review.reviewStatus]) + "</td>" +
      "</tr>"
    );
  }

  /**
   * The clamp is pure CSS, but whether a given review is actually cut off can only
   * be known after layout — so the "Show more" button is revealed per row here.
   */
  function markClampable() {
    tbody.querySelectorAll(".ab-review-text").forEach(function (el) {
      if (el.scrollHeight > el.clientHeight + 1) el.classList.add("is-clampable");
    });
  }

  /* ---------- data ---------- */

  async function load() {
    tbody.innerHTML = state.loading(COLSPAN);

    try {
      const body = await api.get("/admin/review/all?" + queryString(query));
      const reviews = (body.data && body.data.data) || [];
      const total = (body.data && body.data.total) || 0;

      tbody.innerHTML = reviews.length
        ? reviews.map(rowHtml).join("")
        : state.empty(COLSPAN, "No reviews match these filters.");
      markClampable();

      renderPager({
        page: query.page, limit: query.limit, total,
        shown: reviews.length, noun: "reviews", els,
      });
    } catch (err) {
      tbody.innerHTML = state.error(COLSPAN, err.message);
      els.count.textContent = "";
      els.label.textContent = "";
    }
  }

  async function changeStatus(id, status) {
    try {
      await api.post("/admin/review/update/" + id, { reviewStatus: status });
      toast("Review " + formatStatus(status).toLowerCase());
      // The row may no longer belong on this page under the active status filter.
      load();
    } catch (err) {
      toast(err.message, "error");
    }
  }

  /* ---------- handlers ---------- */

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      query.reviewStatus = chip.dataset.status;
      query.page = 1;
      load();
    });
  });

  ratingFilter.addEventListener("change", function () {
    query.rating = ratingFilter.value;
    query.page = 1;
    load();
  });

  searchInput.addEventListener("input", debounce(function () {
    query.search = searchInput.value.trim();
    query.page = 1;
    load();
  }, 350));

  els.prev.addEventListener("click", function () {
    if (query.page > 1) { query.page--; load(); }
  });

  els.next.addEventListener("click", function () {
    query.page++;
    load();
  });

  // Delegated: rows are re-rendered on every load, so per-row listeners would go stale.
  tbody.addEventListener("click", function (e) {
    const toggle = e.target.closest(".ab-review-toggle");
    if (toggle) {
      const text = toggle.previousElementSibling;
      const expanded = text.classList.toggle("is-expanded");
      toggle.textContent = expanded ? "Show less" : "Show more";
      return;
    }

    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    e.preventDefault();

    const row = btn.closest("tr");
    const id = row && row.dataset.id;
    if (!id) return;

    const status = btn.dataset.action;
    if (status === "REJECTED" && !confirm("Reject this review?")) return;

    changeStatus(id, status);
  });

  load();
})();
