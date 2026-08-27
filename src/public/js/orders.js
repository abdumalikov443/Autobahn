/* ==========================================================================
   Autobahn Admin — Orders page
   Filtering and paging happen SERVER-side: /admin/order/all serves the EJS
   page to the browser and the paginated rows to this fetch (Accept: json).
   ========================================================================== */
(function () {
  "use strict";

  const {
    api, actions, badge, escapeHtml, formatDate, formatMoney, formatStatus, initials, thumb,
    state, toast, debounce, PAGE_LIMIT, renderPager, queryString,
  } = window.AB;

  const COLSPAN = 7;
  const tbody = document.getElementById("orderTableBody");
  const limitFilter = document.getElementById("limitFilter");
  const searchInput = document.getElementById("searchInput");
  const chips = document.querySelectorAll(".chip");

  const els = {
    count: document.getElementById("resultCount"),
    label: document.getElementById("pageLabel"),
    prev: document.getElementById("prevPage"),
    next: document.getElementById("nextPage"),
  };

  const query = { page: 1, limit: PAGE_LIMIT, orderStatus: "all", search: "" };

  /** A row never offers the state it is already in; closed orders offer nothing. */
  const NEXT_ACTIONS = {
    CREATED: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["FINISHED", "CANCELLED"],
    FINISHED: [],
    CANCELLED: [],
  };

  /* ---------- rendering ---------- */

  function vehicleCell(order) {
    const v = order.vehicleData;
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

  function memberCell(order) {
    const m = order.memberData;
    if (!m) return '<span class="text-muted-2">Deleted member</span>';

    return (
      '<div class="veh-cell">' +
        '<span class="ab-avatar ab-avatar-sm">' + escapeHtml(initials(m.memberNick)) + "</span>" +
        "<span>" +
          '<span class="veh-name d-block">' + escapeHtml(m.memberNick) + "</span>" +
          '<span class="text-muted-2" style="font-size:13px;">' + escapeHtml(m.memberPhone || "") + "</span>" +
        "</span>" +
      "</div>"
    );
  }

  function rowHtml(order) {
    return (
      '<tr data-id="' + escapeHtml(order._id) + '">' +
        "<td>" + vehicleCell(order) + "</td>" +
        "<td>" + memberCell(order) + "</td>" +
        "<td>" +
          "<span>" + escapeHtml(order.orderLeaseTerm) + " mo</span>" +
          '<span class="text-muted-2 d-block" style="font-size:12px;">' +
            escapeHtml(order.orderDeliveryLocation || "") + "</span>" +
        "</td>" +
        "<td>" + escapeHtml(formatDate(order.orderStartDate)) + "</td>" +
        '<td class="price-cell">' + formatMoney(order.orderTotal) + "</td>" +
        "<td>" + badge(order.orderStatus) + "</td>" +
        '<td class="text-end">' + actions(NEXT_ACTIONS[order.orderStatus], "Closed") + "</td>" +
      "</tr>"
    );
  }

  /* ---------- data ---------- */

  async function load() {
    tbody.innerHTML = state.loading(COLSPAN);

    try {
      const body = await api.get("/admin/order/all?" + queryString(query));
      const orders = (body.data && body.data.data) || [];
      const total = (body.data && body.data.total) || 0;

      tbody.innerHTML = orders.length
        ? orders.map(rowHtml).join("")
        : state.empty(COLSPAN, "No orders match these filters.");

      renderPager({
        page: query.page, limit: query.limit, total,
        shown: orders.length, noun: "orders", els,
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
      await api.post("/admin/order/update/", { orderId: id, orderStatus: status });
      toast("Order → " + formatStatus(status));
      // A status change can move the row out of the current filter, and it also
      // adjusts vehicle stock server-side — reload rather than patching locally.
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
      query.orderStatus = chip.dataset.status;
      query.page = 1;
      load();
    });
  });

  limitFilter.addEventListener("change", function () {
    query.limit = Number(limitFilter.value);
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
    if (status === "CANCELLED" && !confirm("Cancel this order? The car returns to stock.")) return;

    changeStatus(id, status);
  });

  load();
})();
