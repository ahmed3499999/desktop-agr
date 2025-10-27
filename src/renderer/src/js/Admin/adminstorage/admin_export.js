import * as commonfunction from "../../commonfunction.js";

console.log("admin_export.js loaded");

let exportItems = [];
let hospitals = [];
let ingredients = [];

let currentPage = 1;
let pageSize = 6;
let totalItems = 0;

export async function setupExportSection() {
  try {
    const [hospitalsResponse, ingredientsResponse] = await Promise.all([
      get_hospitals(),
      getIngredients()
    ]);

    hospitals = hospitalsResponse.data || [];
    ingredients = ingredientsResponse.data || [];

    console.log("🏥 Hospitals loaded:", hospitals);
    console.log("🥫 Ingredients loaded:", ingredients);

    renderHospitals();
    renderIngredients();

    await loadExportData();
  } catch (err) {
    console.error("فشل تحميل بيانات التهيئة:", err);
    alert("حدث خطأ أثناء تحميل بيانات الصفحة");
  }

  document.getElementById("createNewExportBtn").addEventListener("click", createNewExport);
  document.getElementById("cancelExportBtn").addEventListener("click", cancelExport);
  document.getElementById("saveExportBtn").addEventListener("click", saveExport);
  document.getElementById("addItemToExportBtn").addEventListener("click", addItemToExport);
  document.getElementById("clearExportItemBtn").addEventListener("click", clearExportItemSelection);
  document.getElementById("exportItemSelect").addEventListener("change", handleExportItemSelect);
}

function renderHospitals() {
  const select = document.getElementById("hospitalSelect");
  if (!select) return;

  select.innerHTML = `<option value="" disabled selected>اختر المستشفى</option>`;

  // 🔹 فلترة المستشفيات بحيث نستبعد الـ id = 1
  hospitals
    .filter(hos => String(hos.hos_id) !== "1")
    .forEach((hos) => {
      const option = document.createElement("option");
      option.value = hos.hos_id;
      option.textContent = hos.hos_name?.trim() || "[اسم غير معروف]";
      select.appendChild(option);
    });
}


function renderIngredients() {
  const select = document.getElementById("exportItemSelect");
  if (!select) return;

  select.innerHTML = `<option value="" disabled selected>اختر الصنف</option>`;
  ingredients.forEach((ing) => {
    const option = document.createElement("option");
    option.value = ing.id;
    option.textContent = ing.name;
    select.appendChild(option);
  });
}

export function createNewExport() {
  document.getElementById("exportForm").style.display = "block";
  document.getElementById("createNewExportBtn").style.display = "none";

  // 🔹 ضبط التاريخ على تاريخ اليوم
  const today = new Date().toISOString().split("T")[0];
  const exportDateInput = document.getElementById("exportDate");
  if (exportDateInput) exportDateInput.value = today;

  exportItems = [];
  renderExportItems();
}


export function cancelExport() {
  document.getElementById("exportForm").style.display = "none";
  document.getElementById("createNewExportBtn").style.display = "inline-block";
  clearExportForm();
}

export function handleExportItemSelect() {
  const select = document.getElementById("exportItemSelect");
  const unitInput = document.getElementById("exportItemUnit");
  const clearBtn = document.getElementById("clearExportItemBtn");

  const selectedId = select.value;
  const ingredient = ingredients.find((ing) => ing.id == selectedId);

  if (ingredient) {
    unitInput.value = ingredient.unit;
    clearBtn.disabled = false;
  } else {
    unitInput.value = "";
    clearBtn.disabled = true;
  }
}

export function clearExportItemSelection() {
  document.getElementById("exportItemSelect").value = "";
  document.getElementById("exportItemUnit").value = "";
  document.getElementById("clearExportItemBtn").disabled = true;
}

export function addItemToExport() {
  const itemId = document.getElementById("exportItemSelect").value;
  const quantity = parseFloat(document.getElementById("exportItemQuantity").value);

  if (!itemId || isNaN(quantity) || quantity <= 0) {
    alert("يرجى اختيار صنف وكمية صحيحة");
    return;
  }

  const item = ingredients.find((ing) => ing.id == itemId);
  if (!item) return;

  const existing = exportItems.find(e => e.ingredient_id == item.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    exportItems.push({
      ingredient_id: item.id,
      name: item.name,
      unit: item.unit,
      quantity: quantity
    });
  }

  renderExportItems();
  clearExportItemSelection();
  document.getElementById("exportItemQuantity").value = "";
}

function renderExportItems() {
  const tbody = document.getElementById("exportItemsBody");
  const emptyMsg = document.getElementById("noExportItemsMsg");

  tbody.innerHTML = "";

  if (exportItems.length === 0) {
    emptyMsg.style.display = "block";
    return;
  }

  emptyMsg.style.display = "none";

  exportItems.forEach((item, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.unit}</td>
      <td>${item.quantity}</td>
      <td><button class="cancel-btn" data-index="${index}">حذف</button></td>
    `;

    row.querySelector("button").addEventListener("click", () => {
      exportItems.splice(index, 1);
      renderExportItems();
    });

    tbody.appendChild(row);
  });
}

function clearExportForm() {
  document.getElementById("exportDate").value = "";
  document.getElementById("hospitalSelect").value = "";
  document.getElementById("exportNotes").value = "";
  document.getElementById("exportItemSelect").value = "";
  document.getElementById("exportItemUnit").value = "";
  document.getElementById("exportItemQuantity").value = "";
  exportItems = [];
  renderExportItems();
}

export async function saveExport() {
  const date = document.getElementById("exportDate").value;
  const dest_hos_id = document.getElementById("hospitalSelect").value;
  const note = document.getElementById("exportNotes").value;

  if (!date || !dest_hos_id || dest_hos_id === "") {
    alert("يرجى إدخال التاريخ واختيار المستشفى");
    return;
  }

  try {
    await addExport(date, [], exportItems, note, parseInt(dest_hos_id));
    cancelExport();
    await loadExportData();
  } catch (err) {
    console.error("فشل حفظ الفاتورة:", err);
    alert("حدث خطأ أثناء حفظ الفاتورة");
  }
}

async function loadExportData(page = 1) {
  try {
    commonfunction.showLoading(true);

    currentPage = page;
    const offset = (page - 1) * pageSize;

    const response = await getExports(pageSize, offset);

    const list = document.getElementById("savedExportsList");
    const emptyMsg = document.getElementById("noExportsMsg");

    list.innerHTML = "";

    const exportsList = response.data?.data || [];
    const total = response.data?.total || 0;
    totalItems = typeof total === "number" ? total : exportsList.length;

    console.log("📦 Exports from server:", exportsList);

    if (exportsList.length === 0) {
      emptyMsg.style.display = "block";
      document.getElementById("exportPagination").style.display = "none"; // ✅ إخفاء الباجينج
      return;
    }

    emptyMsg.style.display = "none";

    exportsList.forEach((exp) => {
      const card = document.createElement("div");
      card.className = "export-card";

      const ingredientsHtml = exp.ingredients?.length
        ? exp.ingredients.map(i => {
            const ing = i.ingredient || {};
            const name = ing.name || "غير معروف";
            const unit = ing.unit || "";
            return `<li><strong>${name}</strong> - ${i.quantity} ${unit}</li>`;
          }).join("")
        : "<li>لا توجد أصناف</li>";

      const hospitalName = getHospitalNameById(exp.destination_hos_id);

      card.innerHTML = `
        <div class="export-card-header">
          <div class="export-card-title">فاتورة صادر</div>
          <div style="display: flex; gap: 10px;">
            <button class="show-details-btn" style="
              background-color: #0056b3;
              color: white;
              padding: 5px 10px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            ">عرض التفاصيل</button>
            <button class="cancel-btn">حذف</button>
          </div>
        </div>
        <div class="export-card-body">
          <p><strong>📅 التاريخ:</strong> ${exp.date}</p>
          <p><strong>🏥 المستشفى:</strong> ${hospitalName || "غير معروف"}</p>
          <p><strong>📝 ملاحظات:</strong> ${exp.note || "لا يوجد"}</p>
        </div>
      `;

      card.querySelector(".show-details-btn").addEventListener("click", () => {
        showExportDetails(exp);
      });

      card.querySelector(".cancel-btn").addEventListener("click", () => {
        showConfirmDeleteModal(async () => {
          try {
            await deleteExport(exp.id);
            await loadExportData(currentPage);
          } catch (err) {
            console.error("فشل حذف الفاتورة:", err);
            alert("حدث خطأ أثناء الحذف");
          }
        });
      });

      list.appendChild(card);
    });

    // ✅ عرض الباجينج
    renderPagination(page);

  } catch (err) {
    console.error("فشل تحميل فواتير الصادر:", err);
  } finally {
    commonfunction.showLoading(false);
  }
}

function renderPagination(activePage) {
  const paginationDiv = document.getElementById("exportPagination");
  if (!paginationDiv) return;

  paginationDiv.innerHTML = "";

  const totalPages = Math.ceil(totalItems / pageSize);

  // ✅ اخفاء لو صفحة واحدة أو أقل
  if (totalPages <= 1) {
    paginationDiv.style.display = "none";
    return;
  } else {
    paginationDiv.style.display = "flex";
  }

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
      btn.addEventListener("click", () => loadExportData(page));
    }

    paginationDiv.appendChild(btn);
  };

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


function getHospitalNameById(id) {
  const hos = hospitals.find(h => String(h.hos_id) === String(id));
  return hos?.hos_name || null;
}

export function showExportDetails(exportData) {
  const modal = document.getElementById("exportDetailsModal");
  const container = document.getElementById("exportDetailsContainer");

  // إنشاء محتوى تفاصيل الأصناف
  const itemsHtml = exportData.ingredients?.length
    ? exportData.ingredients.map(i => {
        const ing = i.ingredient || {};
        const name = ing.name || "غير معروف";
        const unit = ing.unit || "";
        return `<tr>
                  <td>${name}</td>
                  <td>${unit}</td>
                  <td>${i.quantity}</td>
                </tr>`;
      }).join("")
    : `<tr><td colspan="3">لا توجد أصناف</td></tr>`;

  const hospitalName = getHospitalNameById(exportData.destination_hos_id) || "غير معروف";

container.innerHTML = `
  <table class="data-table1" >
    <thead>
      <tr>
        <th>الصنف</th>
        <th>الوحدة</th>
        <th>الكمية</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>
`;


  modal.style.display = "flex";
}

// إغلاق المودال
document.getElementById("closeExportModalBtn").addEventListener("click", () => {
  document.getElementById("exportDetailsModal").style.display = "none";
});

const confirmModal = document.getElementById("confirmDeleteModal");
const confirmBtn = document.getElementById("confirmDeleteBtn");
const cancelBtn = document.getElementById("cancelDeleteBtn");

function showConfirmDeleteModal(onConfirm) {
  confirmModal.style.display = "flex";

  function cleanUp() {
    confirmBtn.removeEventListener("click", onConfirmHandler);
    cancelBtn.removeEventListener("click", onCancelHandler);
    confirmModal.style.display = "none";
  }

  function onConfirmHandler() {
    cleanUp();
    onConfirm();
  }

  function onCancelHandler() {
    cleanUp();
  }

  confirmBtn.addEventListener("click", onConfirmHandler);
  cancelBtn.addEventListener("click", onCancelHandler);
}
