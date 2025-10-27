import * as commonfunction from "./commonfunction.js";

console.log("admin_damaged.js loaded");

let currentPage = 1;
const pageSize = 10; // عدد العناصر في الصفحة
let totalItems = 0;

async function loadIngredients() {
  try {
    const select = document.getElementById("damagedItemSelect");
    if (!select) return;
    const response = await getIngredients();
    const ingredients = response.data || [];
    select.innerHTML = `<option value="">اختر صنف</option>`;
    ingredients.forEach((ingredient) => {
      const option = document.createElement("option");
      option.value = ingredient.id;
      option.textContent = ingredient.name;
      option.dataset.unit = ingredient.unit;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("خطأ أثناء تحميل الأصناف:", error);
    commonfunction.showMessage("error", "فشل في تحميل الأصناف");
  }
}

export async function setupDamagedSection() {
  setDefaultDamagedDate();
  await loadIngredients();
  clearDamagedItemSelection();
  await loadDamagedData(1);
  const addBtn = document.getElementById("addDamagedBtn");
  if (addBtn) {
    addBtn.onclick = addDamaged;
  }
  const select = document.getElementById("damagedItemSelect");
  if (select) {
    select.onchange = handleDamagedItemSelect;
  }
  const clearBtn = document.getElementById("clearDamagedItemBtn");
  if (clearBtn) {
    clearBtn.onclick = clearDamagedItemSelection;
  }
}

// ✅ تحميل بيانات الهالك مع pagination
export async function loadDamagedData(page = 1) {
  try {
    commonfunction.showLoading(true);
    currentPage = page;
    const offset = (page - 1) * pageSize;

    const response = await getPerished(pageSize, offset);

    if (response && response.data) {
      const damagedList = response.data.data || [];

      // استخراج total بشكل ذكي
      if (typeof response.data.total === "number") {
        totalItems = response.data.total;
      } else if (typeof response.data.total === "object" && response.data.total !== null) {
        const values = Object.values(response.data.total);
        totalItems = values.length > 0 ? parseInt(values[0]) : 0;
      } else {
        totalItems = damagedList.length;
      }

      renderDamagedTable(damagedList);
      renderPagination(page);
    } else {
      renderDamagedTable([]);
      renderPagination(1);
    }
  } catch (error) {
    console.error("Error loading damaged data:", error);
    commonfunction.showMessage("error", "حدث خطأ في تحميل بيانات الهالك");
  } finally {
    commonfunction.showLoading(false);
  }
}

// ✅ عرض الجدول
export function renderDamagedTable(damagedList) {
  const tableBody = document.getElementById("damagedTableBody");
  const emptyMessage = document.getElementById("damagedEmptyMessage");
  const table = document.getElementById("damagedTable");
  tableBody.innerHTML = "";
  if (!damagedList || damagedList.length === 0) {
    emptyMessage.style.display = "block";
    table.style.display = "table";
    return;
  }
  emptyMessage.style.display = "none";
  table.style.display = "table";
  const groupedData = {};
  damagedList.forEach((entry) => {
    const rawDate = entry.date;
    if (!groupedData[rawDate]) groupedData[rawDate] = [];
    entry.ingredients.forEach((ingredient) => {
      groupedData[rawDate].push(ingredient);
    });
  });
  const sortedDates = Object.keys(groupedData).sort(
    (a, b) => new Date(b) - new Date(a)
  );
  sortedDates.forEach((rawDate) => {
    const arabicDate = commonfunction.formatArabicDate(rawDate);
    const items = groupedData[rawDate];
    items.forEach((ingredient, index) => {
      const row = document.createElement("tr");
      const details = ingredient.ingredient;
      if (index === 0) {
        const dateCell = document.createElement("td");
        dateCell.textContent = arabicDate;
        dateCell.className = "date-cell-group";
        dateCell.setAttribute("rowspan", items.length);
        row.appendChild(dateCell);
        row.classList.add("date-group-start");
      }
      row.innerHTML += `
        <td>${details?.name || ""}</td>
        <td>${details?.unit || ""}</td>
        <td>${ingredient.quantity}</td>
      `;
      tableBody.appendChild(row);
    });
  });
}

// ✅ Pagination
function renderPagination(activePage) {
  const paginationDiv = document.getElementById("damagedPagination");
  if (!paginationDiv) return;

  paginationDiv.innerHTML = "";
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return;

  const createButton = (label, page, active = false, disabled = false) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.className =
      "px-3 py-1 mx-1 border rounded transition " +
      (active
        ? "bg-blue-500 text-white font-bold"
        : "bg-white text-black hover:bg-gray-100");

    if (disabled) {
      btn.disabled = true;
      btn.classList.add("opacity-50", "cursor-not-allowed");
    } else {
      btn.addEventListener("click", () => loadDamagedData(page));
    }

    paginationDiv.appendChild(btn);
  };

  // Previous
  createButton("«", activePage - 1, false, activePage === 1);

  if (activePage > 3) {
    createButton("1", 1, activePage === 1);
    if (activePage > 4) {
      const span = document.createElement("span");
      span.textContent = "...";
      span.className = "px-2 text-gray-500";
      paginationDiv.appendChild(span);
    }
  }

  const startPage = Math.max(1, activePage - 2);
  const endPage = Math.min(totalPages, activePage + 2);

  for (let i = startPage; i <= endPage; i++) {
    createButton(i, i, i === activePage);
  }

  if (activePage < totalPages - 2) {
    if (activePage < totalPages - 3) {
      const span = document.createElement("span");
      span.textContent = "...";
      span.className = "px-2 text-gray-500";
      paginationDiv.appendChild(span);
    }
    createButton(totalPages, totalPages, activePage === totalPages);
  }

  createButton("»", activePage + 1, false, activePage === totalPages);
}

// ✅ باقي الدوال زي ما هي
export function clearDamagedItemSelection() {
  const clearBtn = document.getElementById("clearDamagedItemBtn");
  const itemSelect = document.getElementById("damagedItemSelect");
  const itemUnit = document.getElementById("damagedItemUnit");

  if (itemSelect) itemSelect.value = "";
  if (itemUnit) itemUnit.value = "";
  if (clearBtn) clearBtn.disabled = true;
}

export function setDefaultDamagedDate() {
  const dateInput = document.getElementById("damagedDate");
  if (!dateInput.value) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
  }
}

export async function addDamaged() {
  const dateInput = document.getElementById("damagedDate");
  const date = dateInput.value;
  const itemId = document.getElementById("damagedItemSelect").value;
  const quantity = Number.parseFloat(
    document.getElementById("damagedItemQuantity").value
  );
  if (!date || !itemId || !quantity || quantity <= 0) {
    commonfunction.showMessage("warning", "يرجى ملء جميع الحقول المطلوبة");
    return;
  }
  try {
    commonfunction.showLoading(true);
    const ingredients = [{ ingredient_id: parseInt(itemId), quantity }];
    await addPerished(date, ingredients);
    commonfunction.showMessage("success", "تم إضافة الهالك بنجاح");
    const currentDate = dateInput.value;
    document.getElementById("damagedItemSelect").value = "";
    document.getElementById("damagedItemUnit").value = "";
    document.getElementById("damagedItemQuantity").value = "";
    dateInput.value = currentDate;
    await loadDamagedData(1);
  } catch (error) {
    console.error("Error adding damaged item:", error);
    commonfunction.showMessage("error", "حدث خطأ أثناء إضافة الهالك");
  } finally {
    commonfunction.showLoading(false);
  }
}

export function handleDamagedItemSelect() {
  const select = document.getElementById("damagedItemSelect");
  const selectedOption = select.options[select.selectedIndex];
  if (selectedOption && selectedOption.value) {
    document.getElementById("damagedItemUnit").value =
      selectedOption.dataset.unit;
    const clearBtn = document.getElementById("clearDamagedItemBtn");
    if (clearBtn) {
      clearBtn.disabled = false;
    }
  }
}
