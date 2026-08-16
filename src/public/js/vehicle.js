// --- Filter state ---
let activeCategory = "all";

const chips = document.querySelectorAll(".chip");
const statusFilter = document.getElementById("statusFilter");
const searchInput = document.getElementById("searchInput");
const rows = document.querySelectorAll(".veh-row");

// Category chips
chips.forEach(chip => {
    chip.addEventListener("click", () => {
        chips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        activeCategory = chip.dataset.category;
        applyFilters();
    });
});

// Status dropdown + search
statusFilter.addEventListener("change", applyFilters);
searchInput.addEventListener("input", applyFilters);

function applyFilters() {
    const status = statusFilter.value;
    const term = searchInput.value.trim().toLowerCase();

    rows.forEach(row => {
        const matchCat = activeCategory === "all" || row.dataset.category === activeCategory;
        const matchStatus = status === "all" || row.dataset.status === status;
        const matchSearch = row.dataset.name.includes(term);
        row.style.display = (matchCat && matchStatus && matchSearch) ? "" : "none";
    });
}

// --- Status actions: only change the badge, never remove the row ---
// A car has ONE target state: Active, Paused or Deleted.
const badgeClass = { Active: "badge-active", Paused: "badge-paused", Deleted: "badge-deleted" };

function setStatus(row, status) {
    row.dataset.status = status;
    const badge = row.querySelector(".ab-badge");
    badge.textContent = status;
    badge.className = "ab-badge " + badgeClass[status];
    applyFilters(); // re-hide if it no longer matches the active status filter
}

document.querySelectorAll(".veh-row").forEach(row => {
    row.querySelector(".act-activate").addEventListener("click", e => { e.preventDefault(); setStatus(row, "Active"); });
    row.querySelector(".act-pause").addEventListener("click", e => { e.preventDefault(); setStatus(row, "Paused"); });
    row.querySelector(".act-delete").addEventListener("click", e => {
        e.preventDefault();
        const name = row.querySelector(".veh-name").textContent;
        if (confirm("Mark " + name + " as deleted?")) setStatus(row, "Deleted");
    });
});
