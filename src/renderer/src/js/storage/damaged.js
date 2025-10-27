import * as commonfunction from "../commonfunction.js";

console.log("damaged.js loaded");

let currentPage = 1;
const pageSize = 10; // عدد الصفوف في الصفحة

// ✅ تحميل البيانات
export async function loadDamagedData(page = 1) {
  try {
    commonfunction.showLoading(true);
    currentPage = page;
    const offset = (page - 1) * pageSize;

    const response = await getPerished(pageSize, offset);

    if (response && response.data) {
      const damagedList = response.data.data || [];
      let total = 0;

      if (typeof response.data.total === "number") {
        total = response.data.total;
      } else if (
        typeof response.data.total === "object" &&
        response.data.total !== null
      ) {
        const values = Object.values(response.data.total);
        total = values.length > 0 ? parseInt(values[0]) : 0;
      }

      renderDamagedTable(damagedList);
      renderPagination(total, page, pageSize);
    } else {
      renderDamagedTable([]);
      renderPagination(0, 1, pageSize);
    }
  } catch (error) {
    console.error("❌ Error loading damaged data:", error);
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

  if (!Array.isArray(damagedList) || damagedList.length === 0) {
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
    if (Array.isArray(entry.ingredients)) {
      entry.ingredients.forEach((ingredient) => {
        groupedData[rawDate].push(ingredient);
      });
    }
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

// ✅ دالة ترسم أزرار الصفحات (ذكية)
function renderPagination(total, currentPage, pageSize) {
  const pagination = document.getElementById("damagedPagination");
  if (!pagination) return;

  pagination.innerHTML = "";
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return;

  // helper: زرار
  const createButton = (label, page, active = false, disabled = false) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.className =
      "px-3 py-1 mx-1 border rounded transition " +
      (active ? "bg-blue-500 text-white font-bold" : "bg-white text-black hover:bg-gray-100");

    if (disabled) {
      btn.disabled = true;
      btn.classList.add("opacity-50", "cursor-not-allowed");
    } else {
      btn.addEventListener("click", () => loadDamagedData(page));
    }

    pagination.appendChild(btn);
  };

  // Previous
  createButton("«", currentPage - 1, false, currentPage === 1);

  // أول صفحة
  if (currentPage > 3) {
    createButton("1", 1, currentPage === 1);
    if (currentPage > 4) {
      const span = document.createElement("span");
      span.textContent = "...";
      span.className = "px-2 text-gray-500";
      pagination.appendChild(span);
    }
  }

  // الصفحات القريبة من الحالية
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  for (let i = startPage; i <= endPage; i++) {
    createButton(i, i, i === currentPage);
  }

  // آخر صفحة
  if (currentPage < totalPages - 2) {
    if (currentPage < totalPages - 3) {
      const span = document.createElement("span");
      span.textContent = "...";
      span.className = "px-2 text-gray-500";
      pagination.appendChild(span);
    }
    createButton(totalPages, totalPages, currentPage === totalPages);
  }

  // Next
  createButton("»", currentPage + 1, false, currentPage === totalPages);
}

// ✅ باقي الدوال
export function clearDamagedItemSelection() {
  document.getElementById("damagedItemSelect").value = "";
  document.getElementById("damagedItemUnit").value = "";
  document.getElementById("clearDamagedItemBtn").disabled = true;
}

export function setDefaultDamagedDate() {
  const dateInput = document.getElementById("damagedDate");
  if (!dateInput.value) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
  }
}

export async function addDamaged() {
  const btn = document.getElementById("addDamagedBtn");
  if (btn.disabled) return;
  btn.disabled = true;

  const dateInput = document.getElementById("damagedDate");
  const date = dateInput.value;
  const itemId = document.getElementById("damagedItemSelect").value;
  const quantity = Number.parseFloat(
    document.getElementById("damagedItemQuantity").value
  );

  if (!date || !itemId || !quantity || quantity <= 0) {
    commonfunction.showMessage("warning", "يرجى ملء جميع الحقول المطلوبة");
    btn.disabled = false;
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
    console.error("❌ Error adding damaged item:", error);
    commonfunction.showMessage("error", "حدث خطأ أثناء إضافة الهالك");
  } finally {
    commonfunction.showLoading(false);
    btn.disabled = false;
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
