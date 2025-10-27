import * as commonfunction from "../commonfunction.js";

console.log("returns.js loaded ✅");

let currentPage = 1;
const pageSize = 10; // عدد الصفوف في الصفحة

// تحميل المرتجعات بالصفحات
export async function loadReturnsData(page = 1) {
  try {
    commonfunction.showLoading(true);
    currentPage = page;
    const offset = (page - 1) * pageSize;

    console.log(`🔄 Loading returns | page=${page}, limit=${pageSize}, offset=${offset}`);

    const response = await getReturns(pageSize, offset);

    // 🟢 Debug response
    console.log("📥 API raw response:", response);
    console.log("📦 response.data:", response?.data);

    if (response && response.data) {
      const returnsList = response.data.data || [];
      let total = 0;

      if (typeof response.data.total === "number") {
        total = response.data.total;
      } else if (
        typeof response.data.total === "object" &&
        response.data.total !== null
      ) {
        const values = Object.values(response.data.total);
        total = values.length > 0 ? parseInt(values[0]) : 0;
      } else {
        // fallback لو السيرفر مش بيرجع total
        total = returnsList.length;
      }

      console.log("📊 Parsed returnsList:", returnsList);
      console.log(`📊 Total=${total} | CurrentPage=${page} | PageSize=${pageSize}`);

      renderReturnsTable(returnsList);
      renderPagination(total, page, pageSize);
    } else {
      console.warn("⚠️ Empty or invalid response format from API");
      renderReturnsTable([]);
      renderPagination(0, 1, pageSize);
    }
  } catch (error) {
    console.error("❌ Error loading returns:", error);
    commonfunction.showMessage("error", "حدث خطأ في تحميل بيانات المرتجعات");
  } finally {
    commonfunction.showLoading(false);
  }
}

// عرض الجدول
export function renderReturnsTable(returnsList) {
  const tableBody = document.getElementById("returnsTableBody");
  const emptyMessage = document.getElementById("returnsEmptyMessage");
  const table = document.getElementById("returnsTable");

  tableBody.innerHTML = "";

  if (!Array.isArray(returnsList) || returnsList.length === 0) {
    console.warn("⚠️ No returns to render (empty list)");
    emptyMessage.style.display = "block";
    table.style.display = "table";
    return;
  }

  console.log(`📝 Rendering ${returnsList.length} return entries`);

  emptyMessage.style.display = "none";
  table.style.display = "table";

  const groupedData = {};
  returnsList.forEach((entry) => {
    const rawDate = entry.date;
    if (!groupedData[rawDate]) groupedData[rawDate] = [];
    if (Array.isArray(entry.ingredients)) {
      entry.ingredients.forEach((ingredient) => {
        groupedData[rawDate].push(ingredient);
      });
    }
  });

  console.log("📌 Grouped returns data by date:", groupedData);

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
        <td>${details?.return_cost?.toFixed(2) || "0.00"}</td>
        <td>${(ingredient.quantity * (details?.return_cost || 0)).toFixed(2)}</td>
      `;
      tableBody.appendChild(row);
    });
  });
}

// ✅ رسم الباجينيشن
function renderPagination(total, currentPage, pageSize) {
  const pagination = document.getElementById("returnsPagination");
  if (!pagination) return;

  pagination.innerHTML = "";
  const totalPages = Math.ceil(total / pageSize);
  console.log(`📑 Rendering pagination | totalPages=${totalPages}, currentPage=${currentPage}`);

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
      btn.addEventListener("click", () => loadReturnsData(page));
    }

    pagination.appendChild(btn);
  };

  // Previous
  createButton("«", currentPage - 1, false, currentPage === 1);

  if (currentPage > 3) {
    createButton("1", 1, currentPage === 1);
    if (currentPage > 4) {
      const span = document.createElement("span");
      span.textContent = "...";
      span.className = "px-2 text-gray-500";
      pagination.appendChild(span);
    }
  }

  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  for (let i = startPage; i <= endPage; i++) {
    createButton(i, i, i === currentPage);
  }

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

// ✅ باقي الدوال: اختيار، تاريخ افتراضي، إضافة
export function handleReturnItemSelect() {
  const select = document.getElementById("returnItemSelect");
  const selectedOption = select.options[select.selectedIndex];
  if (selectedOption && selectedOption.value) {
    document.getElementById("returnItemUnit").value =
      selectedOption.dataset.unit;
    document.getElementById("returnItemPrice").value =
      selectedOption.dataset.cost;
  }
}

export function setDefaultReturnDate() {
  const dateInput = document.getElementById("returnDate");
  if (!dateInput.value) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
  }
}

export async function addReturn() {
  const btn = document.getElementById("addReturnBtn");
  if (btn.disabled) return;
  btn.disabled = true;

  const dateInput = document.getElementById("returnDate");
  const date = dateInput.value;
  const itemId = document.getElementById("returnItemSelect").value;
  const quantity = Number.parseFloat(
    document.getElementById("returnItemQuantity").value
  );
  const unitPrice = Number.parseFloat(
    document.getElementById("returnItemPrice").value
  );

  if (!date || !itemId || !quantity || quantity <= 0) {
    commonfunction.showMessage("warning", "يرجى ملء جميع الحقول المطلوبة");
    btn.disabled = false;
    return;
  }

  try {
    commonfunction.showLoading(true);
    const ingredients = [{ ingredient_id: parseInt(itemId), quantity }];
    console.log("➕ Adding return:", { date, ingredients });
    await apiAddReturn(date, ingredients);

    commonfunction.showMessage("success", "تم إضافة المرتجع بنجاح");

    const currentDate = date;
    document.getElementById("returnItemSelect").value = "";
    document.getElementById("returnItemUnit").value = "";
    document.getElementById("returnItemQuantity").value = "";
    document.getElementById("returnItemPrice").value = "";
    dateInput.value = currentDate;

    await loadReturnsData(1);
  } catch (error) {
    console.error("❌ Error adding return:", error);
    commonfunction.showMessage("error", "حدث خطأ أثناء إضافة المرتجع");
  } finally {
    commonfunction.showLoading(false);
    btn.disabled = false;
  }
}
