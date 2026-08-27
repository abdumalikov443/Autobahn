/* ==========================================================================
   Autobahn Admin — Vehicles page
   Filtering and paging happen SERVER-side: /admin/vehicle/all serves the EJS
   page to the browser and the paginated rows to this fetch (Accept: json).
   ========================================================================== */
(function () {
  "use strict";

  const {
    api, actions, badge, escapeHtml, formatMoney, formatStatus, thumb,
    state, toast, debounce, PAGE_LIMIT, renderPager, queryString,
  } = window.AB;

  /**
   * Which states a vehicle can be moved to from its current one — a row never
   * offers the state it is already in. An out-of-stock car cannot be activated
   * until it is restocked, so that button only appears when quantity > 0.
   */
  function nextActions(vehicle) {
    const inStock = Number(vehicle.vehicleQuantity) > 0;

    switch (vehicle.vehicleStatus) {
      case "ACTIVE":
        return ["PAUSE", "DELETED"];
      case "PAUSE":
        return inStock ? ["ACTIVE", "DELETED"] : ["DELETED"];
      case "OUT_OF_STOCK":
        return inStock ? ["ACTIVE", "DELETED"] : ["DELETED"];
      case "DELETED":
        return inStock ? ["ACTIVE"] : [];
      default:
        return ["DELETED"];
    }
  }

  const COLSPAN = 6;
  const tbody = document.getElementById("vehicleTableBody");
  const statusFilter = document.getElementById("statusFilter");
  const searchInput = document.getElementById("searchInput");
  const chips = document.querySelectorAll(".chip");
  const addForm = document.getElementById("addVehicleForm");

  const els = {
    count: document.getElementById("resultCount"),
    label: document.getElementById("pageLabel"),
    prev: document.getElementById("prevPage"),
    next: document.getElementById("nextPage"),
  };

  const query = {
    page: 1,
    limit: PAGE_LIMIT,
    vehicleType: "all",
    vehicleStatus: "all",
    search: "",
  };

  /* ---------- rendering ---------- */

  function rowHtml(vehicle) {
    const stock = Number(vehicle.vehicleQuantity) || 0;
    const stockCell = stock
      ? String(stock)
      : '<span class="ab-out-of-stock">Out of stock</span>';

    return (
      '<tr data-id="' + escapeHtml(vehicle._id) + '">' +
        "<td>" +
          '<div class="veh-cell">' +
            thumb(vehicle.vehicleImages) +
            "<span>" +
              '<span class="veh-brand d-block">' + escapeHtml(vehicle.vehicleBrand) + "</span>" +
              '<span class="veh-name">' + escapeHtml(vehicle.vehicleModel) + " " +
              '<span class="text-muted-2">· ' + escapeHtml(vehicle.vehicleYear) + "</span></span>" +
            "</span>" +
          "</div>" +
        "</td>" +
        "<td>" + escapeHtml(formatStatus(vehicle.vehicleType)) + "</td>" +
        '<td class="price-cell">' + formatMoney(vehicle.vehiclePrice) + "</td>" +
        "<td>" + stockCell + "</td>" +
        "<td>" + badge(vehicle.vehicleStatus) + "</td>" +
        '<td class="text-end">' + actions(nextActions(vehicle), "Restock first") + "</td>" +
      "</tr>"
    );
  }

  /* ---------- data ---------- */

  async function load() {
    tbody.innerHTML = state.loading(COLSPAN);

    try {
      const body = await api.get("/admin/vehicle/all?" + queryString(query));
      const vehicles = (body.data && body.data.data) || [];
      const total = (body.data && body.data.total) || 0;

      tbody.innerHTML = vehicles.length
        ? vehicles.map(rowHtml).join("")
        : state.empty(COLSPAN, "No vehicles match these filters.");

      renderPager({
        page: query.page, limit: query.limit, total,
        shown: vehicles.length, noun: "vehicles", els,
      });
    } catch (err) {
      tbody.innerHTML = state.error(COLSPAN, err.message);
      els.count.textContent = "";
      els.label.textContent = "";
    }
  }

  async function changeStatus(id, status) {
    try {
      const body = await api.post("/admin/vehicle/update/" + id, { vehicleStatus: status });
      const updated = body.data;
      toast(updated.vehicleBrand + " " + updated.vehicleModel + " → " + formatStatus(status));
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
      query.vehicleType = chip.dataset.category;
      query.page = 1;
      load();
    });
  });

  statusFilter.addEventListener("change", function () {
    query.vehicleStatus = statusFilter.value;
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
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    e.preventDefault();

    const row = btn.closest("tr");
    const id = row && row.dataset.id;
    if (!id) return;

    const status = btn.dataset.action;
    if (status === "DELETED") {
      const name = row.querySelector(".veh-name").textContent.trim();
      if (!confirm("Mark " + name + " as deleted?")) return;
    }
    changeStatus(id, status);
  });

  /* ---------- create ---------- */

  if (addForm) {
    addForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      if (!addForm.checkValidity()) {
        addForm.reportValidity();
        return;
      }

      const files = document.getElementById("vehicleImages").files;
      if (!files.length) return toast("Please add at least one image", "error");
      if (files.length > 5) return toast("At most 5 images", "error");

      if (Number(addForm.elements.vehicleQuantity.value) < 1) {
        return toast("Quantity must be at least 1", "error");
      }

      // vehicleStatus is deliberately not sent — the server always saves a new
      // listing as PAUSED, to be activated by hand from the table.
      const fd = new FormData();
      ["vehicleBrand", "vehicleModel", "vehicleType", "vehicleYear",
       "vehiclePrice", "vehicleQuantity", "vehicleDesc"].forEach(function (name) {
        fd.append(name, addForm.elements[name].value);
      });

      // multipart carries no nested objects — the server JSON.parses this field back.
      fd.append("vehicleSpecs", JSON.stringify({
        power: Number(addForm.elements.power.value),
        acceleration: Number(addForm.elements.acceleration.value),
        topSpeed: Number(addForm.elements.topSpeed.value),
        fuel: addForm.elements.fuel.value,
        driveTrain: addForm.elements.driveTrain.value,
        seats: Number(addForm.elements.seats.value),
      }));

      for (let i = 0; i < files.length; i++) fd.append("vehicleImages", files[i]);

      const btn = document.getElementById("saveVehicleBtn");
      btn.disabled = true;

      try {
        await api.postForm("/admin/vehicle/create", fd);
        bootstrap.Modal.getInstance(document.getElementById("addVehicleModal")).hide();
        addForm.reset();
        toast("Vehicle created");
        query.page = 1;
        load();
      } catch (err) {
        toast(err.message, "error");
      } finally {
        btn.disabled = false;
      }
    });
  }

  load();
})();
