/* ==========================================================================
   Autobahn Admin — Users page
   Filtering and paging happen SERVER-side: /admin/user/all serves the EJS page
   to the browser and the paginated rows to this fetch (Accept: json).
   ========================================================================== */
(function () {
  "use strict";

  const {
    api, actions, badge, escapeHtml, formatDate, formatStatus, imageUrl, initials,
    state, toast, debounce, PAGE_LIMIT, renderPager, queryString,
  } = window.AB;

  /** A row never offers the state it is already in. */
  const NEXT_ACTIONS = {
    ACTIVE: ["BLOCK", "DELETE"],
    BLOCK: ["ACTIVE", "DELETE"],
    DELETE: ["ACTIVE"],
  };

  const COLSPAN = 6;
  const tbody = document.getElementById("userTableBody");
  const leaseFilter = document.getElementById("leaseFilter");
  const searchInput = document.getElementById("searchInput");
  const chips = document.querySelectorAll(".chip");

  const els = {
    count: document.getElementById("resultCount"),
    label: document.getElementById("pageLabel"),
    prev: document.getElementById("prevPage"),
    next: document.getElementById("nextPage"),
  };

  const query = { page: 1, limit: PAGE_LIMIT, memberStatus: "all", lease: "all", search: "" };

  /* ---------- rendering ---------- */

  function avatar(user) {
    const src = imageUrl(user.memberImage);
    return src
      ? '<img class="ab-avatar" src="' + escapeHtml(src) + '" alt="" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'ab-avatar\',textContent:this.dataset.fallback}))" data-fallback="' + escapeHtml(initials(user.memberNick)) + '" />'
      : '<span class="ab-avatar">' + escapeHtml(initials(user.memberNick)) + "</span>";
  }

  function rowHtml(user) {
    const leases = Number(user.activeLeases) || 0;

    return (
      '<tr data-id="' + escapeHtml(user._id) + '">' +
        "<td>" +
          '<div class="veh-cell">' +
            avatar(user) +
            "<span>" +
              '<span class="veh-name d-block">' + escapeHtml(user.memberNick) + "</span>" +
              '<span class="text-muted-2" style="font-size:13px;">' + escapeHtml(user.memberPhone) + "</span>" +
            "</span>" +
          "</div>" +
        "</td>" +
        '<td class="text-muted-2">' + escapeHtml(user.memberAddress || "—") + "</td>" +
        "<td>" +
          (leases
            ? '<span class="ab-count">' + leases + "</span>"
            : '<span class="text-muted-2">0</span>') +
        "</td>" +
        "<td>" + escapeHtml(formatDate(user.createdAt)) + "</td>" +
        "<td>" + badge(user.memberStatus) + "</td>" +
        '<td class="text-end">' + actions(NEXT_ACTIONS[user.memberStatus]) + "</td>" +
      "</tr>"
    );
  }

  /* ---------- data ---------- */

  async function load() {
    tbody.innerHTML = state.loading(COLSPAN);

    try {
      const body = await api.get("/admin/user/all?" + queryString(query));
      const total = (body.data && body.data.total) || 0;
      const users = (body.data && body.data.data) || [];

      tbody.innerHTML = users.length
        ? users.map(rowHtml).join("")
        : state.empty(COLSPAN, "No users match these filters.");

      renderPager({
        page: query.page, limit: query.limit, total,
        shown: users.length, noun: "users", els,
      });
    } catch (err) {
      tbody.innerHTML = state.error(COLSPAN, err.message);
      els.count.textContent = "";
      els.label.textContent = "";
    }
  }

  async function changeStatus(id, status) {
    try {
      // This route takes the id in the body, not the path.
      const body = await api.post("/admin/user/edit", { _id: id, memberStatus: status });
      toast(body.data.memberNick + " → " + formatStatus(status));
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
      query.memberStatus = chip.dataset.status;
      query.page = 1;
      load();
    });
  });

  leaseFilter.addEventListener("change", function () {
    query.lease = leaseFilter.value;
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

  tbody.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    e.preventDefault();

    const row = btn.closest("tr");
    const id = row && row.dataset.id;
    if (!id) return;

    const status = btn.dataset.action;
    const nick = row.querySelector(".veh-name").textContent.trim();

    if (status === "DELETE" && !confirm("Delete member " + nick + "?")) return;
    if (status === "BLOCK" && !confirm("Block member " + nick + "?")) return;

    changeStatus(id, status);
  });

  load();
})();
