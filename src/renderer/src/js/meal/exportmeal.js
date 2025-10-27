import * as commonfunction from "../../commonfunction.js";

console.log("Meal Export Module Loaded");

export let currentMealExportItems = [];
let currentIngredientsData = [];

let savedMealExports = [];
let currentPage = 1;
const pageSize = 5; // عدد فواتير التصدير في كل صفحة

export function getCurrentMealExportItems() {
  return currentMealExportItems;
}

export function setCurrentMealExportItems(items) {
  currentMealExportItems = items;
}

function getArabicDayName(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString + 'T12:00:00');
  const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  return days[date.getDay()];
}

function getWeekdayNumber(arabicDayName) {
  const dayMapping = {
    "السبت": 0,
    "الأحد": 1,
    "الاثنين": 2,
    "الثلاثاء": 3,
    "الأربعاء": 4,
    "الخميس": 5,
    "الجمعة": 6
  };
  return dayMapping[arabicDayName];
}

export function updateDayName() {
  const dateInput = document.getElementById("mealExportDate");
  const dayNameInput = document.getElementById("dayNameInput");
  if (dateInput && dayNameInput && dateInput.value) {
    const dayName = getArabicDayName(dateInput.value);
    dayNameInput.value = dayName || "";
  }
}

function populateMealExportSelect() {
  const select = document.getElementById("mealExportSelect");
  select.innerHTML = '<option value="" disabled selected>اختر الوجبة</option>';
  getSchedules()
    .then((response) => {
      const schedules = response.data;
      schedules.forEach((schedule) => {
        const option = document.createElement("option");
        option.value = schedule.schedule_id;
        option.textContent = `${schedule.patient_type} - ${schedule.schedule_name}`;
        option.dataset.patientType = schedule.patient_type;
        option.dataset.scheduleName = schedule.schedule_name;
        option.dataset.cost = schedule.cost || 0;
        select.appendChild(option);
      });
    })
    .catch((error) => {
      console.error("Error loading meal schedules:", error);
    });
}

export function createNewMealExport() {
  console.log("إنشاء فاتورة تصدير وجبات جديدة");
  const mealExportForm = document.getElementById("mealExportForm");
  const createBtn = document.getElementById("createNewMealExportBtn");

  // ✅ تحميل الفواتير عند فتح التبويب لأول مرة
  loadSavedMealExports(1);

  mealExportForm.style.display = "block";
  createBtn.style.display = "none";

  const today = new Date().toISOString().split("T")[0];
  document.getElementById("mealExportDate").value = today;
  updateDayName();

  currentMealExportItems = [];
  currentIngredientsData = [];
  renderMealExportItems();
  updateMealExportTotal();

  commonfunction.showMessage("info", "تم إنشاء فاتورة تصدير وجبات جديدة");
  populateMealExportSelect();
}

export function renderMealExportItems() {
  const mealExportItemsBody = document.getElementById("mealExportItemsBody");
  const noMealExportItemsMsg = document.getElementById("noMealExportItemsMsg");

  if (!mealExportItemsBody || !noMealExportItemsMsg) {
    console.log("عناصر جدول فاتورة التصدير غير موجودة");
    return;
  }

  mealExportItemsBody.innerHTML = "";

  if (currentMealExportItems.length === 0) {
    noMealExportItemsMsg.style.display = "block";
    return;
  }

  noMealExportItemsMsg.style.display = "none";

  currentMealExportItems.forEach((item, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.patientType} (${item.scheduleName})</td>
      <td>${item.quantity}</td>
      <td>${item.cost.toFixed(2)}</td>
      <td>${item.total.toFixed(2)}</td>
      <td>
        <button class="view-btn small-btn" onclick="mealExport.viewMealExportItems('${item.mealId}')">
          <i class="fas fa-eye"></i> تفاصيل وجبة 
        </button> 
        <button class="delete-btn red-btn" onclick="mealExport.removeMealFromExport(${index})">
          <i class="fas fa-trash"></i> حذف
        </button>
      </td>
    `;
    mealExportItemsBody.appendChild(row);
  });
}

export async function viewMealExportItems(scheduleId, selectedDate = null) {
    try {
        commonfunction.showLoading(true);

        const date = selectedDate || document.getElementById("mealExportDate").value;
        if (!date) {
            commonfunction.showMessage("warning", "لم يتم تحديد التاريخ");
            return;
        }

        const dayName = getArabicDayName(date);
        const weekdayNumber = getWeekdayNumber(dayName);

        const res = await getSchedules();
        const schedule = res.data.find(e => e.schedule_id == scheduleId);
        if (!schedule) {
            commonfunction.showMessage("error", "لم يتم العثور على الجدول المطلوب");
            return;
        }

        const day = (schedule.meals || []).find(m =>
            parseInt(m.weekday) === weekdayNumber || m.weekday === weekdayNumber.toString()
        );

        if (!day || !day.ingredients || !day.ingredients.length) {
            commonfunction.showMessage("info", "لا توجد أصناف في هذا اليوم");
            return;
        }

        const ingredients = day.ingredients.map(i => ({
            name: i.ingredient?.name || i.name || "-",
            quantity: i.quantity || "-",
            unit: i.ingredient?.unit || "-"
        }));

        openMealExportItemsModal(ingredients);
    } catch (err) {
        console.error(err);
        commonfunction.showMessage("error", "حدث خطأ أثناء تحميل الأصناف");
    } finally {
        commonfunction.showLoading(false);
    }
}

export function updateMealExportTotal() {
  const total = currentMealExportItems.reduce((sum, item) => sum + item.total, 0);
  document.getElementById("mealExportTotal").textContent = total.toFixed(2);
}

// ✅ دالة جديدة لتحميل فواتير التصدير مع Pagination
export async function loadSavedMealExports(page = 1) {
  try {
    commonfunction.showLoading(true);
    currentPage = page;
    const offset = (page - 1) * pageSize;

    const response = await getExports(pageSize, offset);

    if (response && response.data) {
      const allExports = response.data.data || [];
      const total = response.data.total || 0;

      savedMealExports = allExports.filter(exportItem =>
        exportItem.meals && exportItem.meals.length > 0
      );

      // حساب الرقم التسلسلي الأول بناءً على الصفحة الحالية والإجمالي
      const startingSerialNumber = total - (page - 1) * pageSize;
      
      renderSavedMealExports(savedMealExports, startingSerialNumber);
      renderMealExportsPagination(total, page, pageSize);
    } else {
      renderSavedMealExports([], 0);
      renderMealExportsPagination(0, 1, pageSize);
    }
  } catch (error) {
    console.error("❌ Error loading meal exports:", error);
    commonfunction.showMessage("error", "حدث خطأ في تحميل فواتير التصدير");
  } finally {
    commonfunction.showLoading(false);
  }
}

// ✅ دالة لعرض أزرار Pagination لفواتير التصدير
function renderMealExportsPagination(total, currentPage, pageSize) {
  const pagination = document.getElementById("mealExportsPagination");
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
      btn.addEventListener("click", () => loadSavedMealExports(page));
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

// ✅ تعديل دالة renderSavedMealExports لتعمل مع البيانات الجديدة
export function renderSavedMealExports(exports, startingSerialNumber) {
  console.log("عرض فواتير التصدير المحفوظة");
  // ✅ إزالة الشرط الذي يمنع العرض إذا كان التبويب مخفي
  const savedMealExportsList = document.getElementById("savedMealExportsList");
  const noMealExportsMsg = document.getElementById("noMealExportsMsg");

  if (!savedMealExportsList || !noMealExportsMsg) {
    console.log("عناصر فواتير التصدير غير موجودة في DOM");
    return;
  }

  savedMealExportsList.innerHTML = "";

  if (!Array.isArray(exports) || exports.length === 0) {
    console.log("لا توجد فواتير تصدير لعرضها");
    noMealExportsMsg.style.display = "block";
    return;
  }

  noMealExportsMsg.style.display = "none";

  // استخدام الرقم التسلسلي الأول الممرر من الدالة الأم
  let serialNumber = startingSerialNumber;

  exports.forEach((exportInvoice, index) => {
    let totalQuantity = 0;
    let totalAmount = 0;

    (exportInvoice.meals || []).forEach(meal => {
      const quantity = parseFloat(meal[3]) || 0;
      const cost = parseFloat(meal[4]) || 0;
      totalQuantity += quantity;
      totalAmount += quantity * cost;
    });

    const exportCard = document.createElement("div");
    exportCard.className = "invoice-card";
    exportCard.innerHTML = `
      <div class="invoice-card-header">
        <div class="invoice-number">فاتورة تصدير ${serialNumber--}</div>
        <div class="invoice-date">${commonfunction.formatArabicDate(exportInvoice.date)} (${getArabicDayName(exportInvoice.date)})</div>
      </div>
      <div class="invoice-card-body">
        <div class="invoice-info-item">
          <div class="invoice-info-label">عدد الوجبات</div>
          <div class="invoice-info-value">${(exportInvoice.meals || []).length}</div>
        </div>
        <div class="invoice-info-item">
          <div class="invoice-info-label">إجمالي الكمية</div>
          <div class="invoice-info-value">${totalQuantity}</div>
        </div>
        <div class="invoice-info-item">
          <div class="invoice-info-label">المجموع الكلي</div>
          <div class="invoice-info-value">${totalAmount.toFixed(2)} جنيه</div>
        </div>
      </div>
      <div class="invoice-card-actions">
        <button class="view-btn" onclick="mealExport.viewMealExportDetails(${exportInvoice.id || index})">
          <i class="fas fa-eye"></i> عرض الفاتورة</button>
        <button class="view-btn" onclick="mealExport.viewSavedMealExportIngredients(${exportInvoice.id || index})">
          <i class="fas fa-list"></i> عرض الأصناف</button>
      </div>
    `;
    savedMealExportsList.appendChild(exportCard);
  });
}

export async function viewMealExportDetails(exportId) {
  try {
    commonfunction.showLoading(true);
    // جلب جميع فواتير التصدير للعثور على الفاتورة المحددة
    const response = await getExports(1000, 0);
    if (response && response.data && response.data.data) {
      const exportInvoice = response.data.data.find(exp => exp.id === exportId);
      if (!exportInvoice) {
        commonfunction.showMessage("error", "لم يتم العثور على الفاتورة");
        return;
      }
      showMealExportModal(exportInvoice, exportId);
    }
  } catch (error) {
    console.error("Error loading export details:", error);
    commonfunction.showMessage("error", "حدث خطأ أثناء تحميل تفاصيل الفاتورة");
  } finally {
    commonfunction.showLoading(false);
  }
}

export async function showMealExportModal(exportInvoice, exportId) {
    const modal = document.getElementById("mealExportDetailsModal");
    const modalTitle = document.getElementById("mealExportModalTitle");
    const modalContent = document.getElementById("mealExportDetailsContent");

    try {
        commonfunction.showLoading(true);
        if (!exportInvoice || !exportInvoice.meals) {
            throw new Error("بيانات الفاتورة غير مكتملة");
        }

        // تحديث عنوان الفاتورة في الهيدر فقط

        const totalQuantity = exportInvoice.meals.reduce((sum, meal) => {
            return sum + (parseFloat(meal[3]) || 0);
        }, 0);

        const totalAmount = exportInvoice.meals.reduce((sum, meal) => {
            return sum + ((parseFloat(meal[3]) || 0) * (parseFloat(meal[4]) || 0));
        }, 0);

        const mealsTable = exportInvoice.meals.map((meal) => {
            const mealQuantity = parseFloat(meal[3]) || 0;
            const mealCost = parseFloat(meal[4]) || 0;
            const mealTotal = mealQuantity * mealCost;
            return `
                <tr>
                    <td>${meal[1] || "غير محدد"}</td>
                    <td>${mealQuantity}</td>
                    <td>${mealCost.toFixed(2)}</td>
                    <td>${mealTotal.toFixed(2)}</td>
                </tr>
            `;
        }).join("");

        modalContent.innerHTML = `
            <div class="invoice-details-section">
                <div class="invoice-details-grid">
                    <div class="detail-item">
                        <div class="detail-label">التاريخ</div>
                        <div class="detail-value">${commonfunction.formatArabicDate(exportInvoice.date)} (${getArabicDayName(exportInvoice.date)})</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">عدد الوجبات</div>
                        <div class="detail-value">${exportInvoice.meals.length}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">إجمالي الكمية</div>
                        <div class="detail-value">${totalQuantity}</div>
                    </div>
                </div>
            </div>

            <div class="invoice-items-section">
                <h4><i class="fas fa-utensils"></i> وجبات الفاتورة</h4>
                <table class="modal-table">
                    <thead>
                        <tr>
                            <th>الوجبة</th>
                            <th>الكمية</th>
                            <th>تكلفة الوحدة</th>
                            <th>المجموع</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${mealsTable}
                    </tbody>
                </table>
            </div>

            <div class="invoice-summary">
                <div class="summary-row">
                    <span>المجموع الكلي:</span>
                    <span>${totalAmount.toFixed(2)} جنيه</span>
                </div>
            </div>
        `;
        modal.style.display = "flex";
    } catch (error) {
        console.error("خطأ في showMealExportModal:", error);
        commonfunction.showMessage("error", "حدث خطأ أثناء عرض تفاصيل فاتورة التصدير");
    } finally {
        commonfunction.showLoading(false);
    }
}

export function closeMealExportModal() {
  const modal = document.getElementById("mealExportDetailsModal");
  modal.style.display = "none";
}

export function addMealToExport() {
  console.log("إضافة وجبة للفاتورة");
  const mealId = document.getElementById("mealExportSelect").value;
  const select = document.getElementById("mealExportSelect");
  const selectedOption = select.options[select.selectedIndex];

  const quantity = Number.parseFloat(document.getElementById("mealExportQuantity").value.trim());
  const cost = Number.parseFloat(selectedOption.dataset.cost || 0);

  if (!mealId || isNaN(quantity) || quantity <= 0) {
    commonfunction.showMessage("warning", "يرجى اختيار الوجبة وإدخال الكمية بشكل صحيح");
    return;
  }

  const existingMealIndex = currentMealExportItems.findIndex(
    (exportItem) => exportItem.mealId == mealId
  );

  if (existingMealIndex !== -1) {
    currentMealExportItems[existingMealIndex].quantity += quantity;
    currentMealExportItems[existingMealIndex].total =
      currentMealExportItems[existingMealIndex].quantity * currentMealExportItems[existingMealIndex].cost;
  } else {
    const exportItem = {
      mealId: mealId,
      scheduleName: selectedOption.dataset.scheduleName,
      patientType: selectedOption.dataset.patientType,
      quantity: quantity,
      cost: cost,
      total: quantity * cost,
    };
    currentMealExportItems.push(exportItem);
  }

  renderMealExportItems();
  updateMealExportTotal();

  document.getElementById("mealExportSelect").value = "";
  document.getElementById("mealExportQuantity").value = "";
  document.getElementById("mealExportCost").value = "";
  document.getElementById("clearMealExportBtn").disabled = true;

  commonfunction.showMessage("success", "تم إضافة الوجبة للفاتورة");
}

export function removeMealFromExport(index) {
  commonfunction.showConfirm("هل أنت متأكد من حذف هذه الوجبة من الفاتورة؟").then(
    (confirmed) => {
      if (confirmed) {
        currentMealExportItems.splice(index, 1);
        renderMealExportItems();
        updateMealExportTotal();
        commonfunction.showMessage("success", "تم حذف الوجبة من الفاتورة");
      }
    }
  );
}

export function cancelMealExport() {
  console.log("إلغاء فاتورة التصدير");
  const mealExportForm = document.getElementById("mealExportForm");
  const createBtn = document.getElementById("createNewMealExportBtn");

  commonfunction.showConfirm("هل أنت متأكد من إلغاء فاتورة التصدير؟").then((confirmed) => {
    if (confirmed) {
      mealExportForm.style.display = "none";
      createBtn.style.display = "block";

      document.getElementById("mealExportSelect").value = "";
      document.getElementById("mealExportQuantity").value = "";
      document.getElementById("mealExportCost").value = "";
      document.getElementById("dayNameInput").value = "";

      currentMealExportItems = [];
      currentIngredientsData = [];
      renderMealExportItems();
      commonfunction.showMessage("info", "تم إلغاء فاتورة التصدير");
    }
  });
}

async function getMealScheduleDetails(scheduleId) {
  try {
    const response = await getSchedules();
    const schedules = response.data || [];

    const schedule = schedules.find(s => s.schedule_id == scheduleId);
    if (!schedule) {
      console.error(`Schedule ${scheduleId} not found`);
      return null;
    }

    return {
      data: schedule
    };
  } catch (error) {
    console.error(`Error loading schedule ${scheduleId}:`, error);
    return null;
  }
}

export async function showMealIngredientsModal() {
    const modal = document.getElementById('mealIngredientsModal');
    const dateInput = document.getElementById('mealExportDate');
    const date = dateInput ? dateInput.value : null;

    if (!date || currentMealExportItems.length === 0) {
        commonfunction.showMessage('warning', 'يرجى ملء التاريخ وإضافة وجبات للفاتورة');
        return;
    }

    try {
        commonfunction.showLoading(true);

        const dayName = getArabicDayName(date);
        const weekdayNumber = getWeekdayNumber(dayName);

        document.getElementById('modalExportDate').textContent = commonfunction.formatArabicDate(date);
        document.getElementById('modalExportDay').textContent = `(${dayName})`;

        const selectedMealsDisplay = document.getElementById('selectedMealsDisplay');
        selectedMealsDisplay.innerHTML = currentMealExportItems.map(meal =>
            `<div class="meal-badge">
                <i class="fas fa-utensils"></i>
                ${meal.scheduleName} × ${meal.quantity}
            </div>`
        ).join('');

        modal.style.display = 'flex';

        const schedulesResponse = await getSchedules();
        const schedules = schedulesResponse.data || [];

        const ingredientsResponse = await getIngredients();
        const ingredients = ingredientsResponse.data || [];

        await populateIngredientSelect("ingredientSelect", ingredients);

        const scheduleMap = {};
        schedules.forEach(schedule => {
            scheduleMap[schedule.schedule_id] = schedule;
        });

        const ingredientTotals = {};

        for (const meal of currentMealExportItems) {
            const schedule = scheduleMap[meal.mealId];
            if (!schedule || !schedule.meals) continue;

            const mealsForSelectedDay = schedule.meals.filter(m => parseInt(m.weekday) === weekdayNumber);

            mealsForSelectedDay.forEach(dayMeal => {
                if (!Array.isArray(dayMeal.ingredients)) return;

                dayMeal.ingredients.forEach(ingredient => {
                    const ingredientData = ingredient.ingredient;
                    const id = ingredientData?.id || null;
                    const name = ingredientData?.name || 'غير محدد';
                    const unit = ingredientData?.unit || '';
                    const quantityPerMeal = parseFloat(ingredient.quantity) || 0;
                    const totalQuantityNeeded = quantityPerMeal * meal.quantity;

                    const key = `${id}__${name}__${unit}`;
                    if (!ingredientTotals[key]) {
                        const stock = ingredients.find(s => s.id === id);
                        ingredientTotals[key] = {
                            ingredient_id: id,
                            name,
                            unit,
                            stockQuantity: stock ? stock.quantity : 0,
                            totalQuantity: 0,
                            editedQuantity: 0
                        };
                    }

                    ingredientTotals[key].totalQuantity += totalQuantityNeeded;
                    ingredientTotals[key].editedQuantity += totalQuantityNeeded;
                });
            });
        }

        currentIngredientsData = Object.values(ingredientTotals);

        renderIngredientsTable(currentIngredientsData);

    } catch (error) {
        console.error('Error showing ingredients modal:', error);
        commonfunction.showMessage('error', 'حدث خطأ أثناء تحميل تفاصيل الوجبات');
    } finally {
        commonfunction.showLoading(false);
    }
}

function populateIngredientSelect(selectId, ingredients) {
  const select = document.getElementById(selectId);
  const unitInput = document.getElementById("ingredientUnit");

  select.innerHTML = `<option disabled selected>اختر الصنف</option>`;
  ingredients.forEach((ingredient) => {
    const option = document.createElement("option");
    option.value = ingredient.id;
    option.textContent = ingredient.name;
    option.dataset.unit = ingredient.unit;
    select.appendChild(option);
  });

  select.addEventListener("change", function () {
    const selectedOption = this.options[this.selectedIndex];
    const unit = selectedOption.dataset.unit || "";
    unitInput.value = unit;
  });
}

function addIngredientToExport() {
  const select = document.getElementById("addIngredientSelect");
  const unitInput = document.getElementById("addIngredientUnit");
  const qtyInput = document.getElementById("addIngredientQtyInput");

  const selectedOption = select.options[select.selectedIndex];
  const ingredientId = parseInt(selectedOption.value);
  const name = selectedOption.textContent;
  const unit = unitInput.value;
  const qty = parseFloat(qtyInput.value);

  if (!ingredientId || !qty || qty <= 0) {
    commonfunction.showMessage("warning", "يرجى اختيار صنف وإدخال كمية صحيحة");
    return;
  }

  const newItem = {
    ingredient_id: ingredientId,
    name,
    unit,
    quantity: qty
  };

  currentMealExportItems.push(newItem);
  renderMealExportItemsTable();
}

export function addManualIngredient() {
    const select = document.getElementById('ingredientSelect');
    const selectedOption = select.options[select.selectedIndex];
    if (!selectedOption || !selectedOption.value) return;

    const id = parseInt(selectedOption.value);
    const name = selectedOption.dataset.name;
    const unit = selectedOption.dataset.unit;
    const qtyInput = document.getElementById('ingredientQtyInput');
    const quantity = parseFloat(qtyInput.value || '0');

    if (!id || !name || !unit || quantity <= 0) {
        commonfunction.showMessage('warning', 'يجب اختيار الصنف وتحديد الكمية');
        return;
    }

    const existing = currentIngredientsData.find(item => item.name === name && item.unit === unit);
    if (existing) {
        existing.editedQuantity += quantity;
        existing.totalQuantity += quantity;
    } else {
        currentIngredientsData.push({
            ingredient_id: id,
            name,
            unit,
            stockQuantity: 0,
            totalQuantity: quantity,
            editedQuantity: quantity
        });
    }

    qtyInput.value = '';
    renderIngredientsTable(currentIngredientsData);
}

function renderIngredientsTable(ingredients) {
    const tableBody = document.getElementById('ingredientsTableBody');
    const noIngredientsMsg = document.getElementById('noIngredientsMsg');

    tableBody.innerHTML = '';

    if (!ingredients.length) {
        noIngredientsMsg.style.display = 'block';
        return;
    }

    noIngredientsMsg.style.display = 'none';

    ingredients.forEach((ing, index) => {
        const row = document.createElement('tr');

        const tdName = document.createElement('td');
        tdName.textContent = ing.name;
        row.appendChild(tdName);

        const tdStock = document.createElement('td');
        tdStock.textContent = `${ing.stockQuantity} ${ing.unit}`;
        row.appendChild(tdStock);

        const tdEdit = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'number';
        input.step = '0.01';
        input.value = ing.editedQuantity.toFixed(2);
        input.className = 'edit-qty-input';
        input.id = `qty-input-${index}`;

        input.addEventListener('input', function () {
            const newValue = parseFloat(this.value) || 0;
            ing.editedQuantity = newValue;
            renderIngredientsTable(ingredients); // تحديث الجدول
        });

        tdEdit.appendChild(input);
        row.appendChild(tdEdit);

        // عمود الإجراءات
        const tdActions = document.createElement('td');

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> حذف';
        deleteBtn.className = 'btn delete-btn';
        deleteBtn.style.marginInlineEnd = '8px';
        deleteBtn.addEventListener('click', () => {
            ingredients.splice(index, 1);
            renderIngredientsTable(ingredients);
        });
        tdActions.appendChild(deleteBtn);

        const replaceBtn = document.createElement('button');
        replaceBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> استبدال';
        replaceBtn.className = 'btn replace-btn';
        replaceBtn.addEventListener('click', () => {
            mealExport.openReplaceIngredientModal(index);
        });
        tdActions.appendChild(replaceBtn);

        row.appendChild(tdActions);

        // ✅ تلوين الصف بناءً على الكمية
        row.classList.remove('ingredient-danger', 'ingredient-safe');
        if (ing.editedQuantity > ing.stockQuantity) {
            row.classList.add('ingredient-danger');
        } else {
            row.classList.add('ingredient-safe');
        }

        tableBody.appendChild(row);
    });
}

let ingredientIndexToReplace = null;

export async function openReplaceIngredientModal(index) {
    if (index === null || index >= currentIngredientsData.length) {
        console.error("لا يمكن فتح نافذة الاستبدال: index غير صالح.");
        return;
    }

    ingredientIndexToReplace = index;

    const select = document.getElementById("replaceIngredientSelect");
    const unitInput = document.getElementById("replaceIngredientUnit");
    const qtyInput = document.getElementById("replaceIngredientQtyInput");

    select.innerHTML = '<option value="" disabled selected>اختر الصنف</option>';

    try {
        const response = await getIngredients();
        const ingredientsList = response.data || [];

        ingredientsList.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.name;
            option.dataset.unit = item.unit;
            option.dataset.name = item.name;
            option.dataset.stock = item.quantity ?? 0; // ✅ نضيف الكمية من السيرفر هنا
            select.appendChild(option);
        });

        select.onchange = function () {
            const unit = this.options[this.selectedIndex].dataset.unit || '';
            unitInput.value = unit;
        };

    } catch (error) {
        console.error("فشل تحميل بيانات المخزن:", error);
    }

    unitInput.value = '';
    qtyInput.value = '';

    document.getElementById("replaceIngredientModal").style.display = "flex";
}

export function replaceIngredientInExport() {
    const select = document.getElementById("replaceIngredientSelect");
    const unitInput = document.getElementById("replaceIngredientUnit");
    const qtyInput = document.getElementById("replaceIngredientQtyInput");

    const selectedId = parseInt(select.value);
    const selectedName = select.options[select.selectedIndex]?.dataset?.name;
    const selectedUnit = unitInput.value;
    const selectedQty = parseFloat(qtyInput.value);
    const selectedStock = parseFloat(select.options[select.selectedIndex]?.dataset?.stock || 0); // ✅

    if (!selectedId || !selectedName || !selectedUnit || isNaN(selectedQty) || selectedQty <= 0) {
        alert("يرجى اختيار الصنف وإدخال الكمية بشكل صحيح");
        return;
    }

    if (ingredientIndexToReplace === null || ingredientIndexToReplace >= currentIngredientsData.length) {
        alert('لا يمكن استبدال الصنف: لم يتم تحديد عن� صحيح.');
        console.error('فشل في العثور على العنصر للاستبدال.');
        return;
    }

    currentIngredientsData[ingredientIndexToReplace] = {
        ingredient_id: selectedId,
        name: selectedName,
        unit: selectedUnit,
        stockQuantity: selectedStock, // ✅ نعرض الكمية الحقيقية هنا
        totalQuantity: selectedQty,
        editedQuantity: selectedQty
    };

    renderIngredientsTable(currentIngredientsData);

    document.getElementById("replaceIngredientModal").style.display = "none";
    ingredientIndexToReplace = null;
}

export function closeMealIngredientsModal() {
  const modal = document.getElementById('mealIngredientsModal');
  modal.style.display = 'none';
}

export async function confirmSaveMealExport() {
  try {
    commonfunction.showLoading(true);
    closeMealIngredientsModal();
    await performActualSave();
  } catch (error) {
    console.error('Error confirming save:', error);
    commonfunction.showMessage('error', 'حدث خطأ أثناء حفظ فاتورة التصدير');
  } finally {
    commonfunction.showLoading(false);
  }
}

async function performActualSave() {
  const date = document.getElementById('mealExportDate').value;

  try {
    const meals = currentMealExportItems.map(item => ({
      schedule_name: item.scheduleName,
      patient_type: item.patientType,
      quantity: item.quantity,
      cost: item.cost
    }));

    const ingredients = currentIngredientsData.map(ing => ({
      ingredient_id: ing.ingredient_id || null,
      name: ing.name,
      quantity: ing.editedQuantity,
      unit: ing.unit
    }));

    const exportResponse = await addExport(date, meals, ingredients);

    if (exportResponse.data && exportResponse.data.id) {
      commonfunction.showMessage('success', 'تم حفظ فاتورة التصدير بنجاح');

      document.getElementById('mealExportForm').style.display = 'none';
      document.getElementById('createNewMealExportBtn').style.display = 'block';

      document.getElementById("mealExportSelect").value = "";
      document.getElementById("mealExportQuantity").value = "";
      document.getElementById("mealExportCost").value = "";
      document.getElementById("dayNameInput").value = "";

      currentMealExportItems = [];
      currentIngredientsData = [];

      await loadSavedMealExports(1); // ✅ تحميل الصفحة الأولى بعد الحفظ
    }
  } catch (error) {
    console.error('Error in actual save:', error);
    throw error;
  }
}

export async function saveMealExport() {
  console.log('حفظ فاتورة التصدير - عرض الوجبات والأصناف');
  await showMealIngredientsModal();
}

export function handleMealExportSelect() {
  const select = document.getElementById("mealExportSelect");
  const selectedOption = select.options[select.selectedIndex];

  if (selectedOption && selectedOption.value) {
    document.getElementById("mealExportCost").value = selectedOption.dataset.cost || 0;
    document.getElementById("clearMealExportBtn").disabled = false;
  }
}

export function clearMealExportSelection() {
  document.getElementById("mealExportSelect").value = "";
  document.getElementById("mealExportCost").value = "";
  document.getElementById("clearMealExportBtn").disabled = true;
}

export async function updateMealExportItemsList() {
  const mealExportSelect = document.getElementById("mealExportSelect");
  if (!mealExportSelect) {
    console.log("قائمة الوجبات غير موجودة");
    return;
  }

  try {
    commonfunction.showLoading(true);
    const response = await getSchedules();
    if (response.data) {
      mealExportSelect.innerHTML =
        '<option value="" disabled selected>اختر الوجبة</option>';
      response.data.forEach((schedule) => {
        const option = document.createElement("option");
        option.value = schedule.schedule_id;
        option.textContent = `${schedule.patient_type} - ${schedule.schedule_name}`;
        option.dataset.patientType = schedule.patient_type;
        option.dataset.scheduleName = schedule.schedule_name;
        option.dataset.cost = schedule.cost || 0;
        mealExportSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Error updating meal export items list:", error);
    commonfunction.showMessage("error", "حدث خطأ أثناء تحميل قائمة الوجبات");
  } finally {
    commonfunction.showLoading(false);
  }
}

export async function initMealExport() {
  console.log("تهيئة نظام تصدير الوجبات");
  await updateMealExportItemsList();
  await loadSavedMealExports(1); // ✅ استخدام الدالة الجديدة
}

export function populateInvoicePreview() {
  const tbody = document.getElementById("invoicePreviewBody");
  const items = currentIngredientsData;

  tbody.innerHTML = "";

  if (!items || items.length === 0) {
    document.getElementById("noIngredientsMsg").style.display = "block";
    return;
  }

  document.getElementById("noIngredientsMsg").style.display = "none";

  items.forEach((item, index) => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = item.name;

    const quantityCell = document.createElement("td");
    quantityCell.textContent = `${item.editedQuantity.toFixed(2)} ${item.unit}`;

    const actionsCell = document.createElement("td");
    const editBtn = document.createElement("button");
    editBtn.textContent = "تعديل";
    editBtn.onclick = () => {
      const newQuantity = prompt("أدخل الكمية الجديدة:", item.editedQuantity);
      if (newQuantity !== null && !isNaN(newQuantity)) {
        item.editedQuantity = parseFloat(newQuantity);
        populateInvoicePreview();
      }
    };
    actionsCell.appendChild(editBtn);

    row.appendChild(nameCell);
    row.appendChild(quantityCell);
    row.appendChild(actionsCell);

    tbody.appendChild(row);
  });
}

function openMealExportItemsModal(ingredients) {
    const tbody = document.getElementById("mealExportItemsBodyModal");
    tbody.innerHTML = "";
    
    ingredients.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.editedQuantity !== undefined ? item.editedQuantity : (item.quantity !== undefined ? item.quantity : 0)}</td>
            <td>${item.unit}</td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById("mealExportItemsModal").style.display = "flex";
}

export function closeMealExportItemsModal() {
    document.getElementById("mealExportItemsModal").style.display = "none";
}

export async function viewSavedMealExportIngredients(exportId) {
  try {
    commonfunction.showLoading(true);
    // جلب جميع فواتير التصدير للعثور على الفاتورة المحددة
    const response = await getExports(1000, 0);
    if (response && response.data && response.data.data) {
      const exportInvoice = response.data.data.find(exp => exp.id === exportId);
      if (!exportInvoice) {
        commonfunction.showMessage("error", "لم يتم العثور على الفاتورة");
        return;
      }
      
      const ingredients = exportInvoice?.ingredients || [];
      if (ingredients.length === 0) {
        commonfunction.showMessage('info', 'لا توجد أصناف لهذه الفاتورة.');
        return;
      }

      const tbody = document.getElementById('mealExportItemsBodyModal');
      tbody.innerHTML = '';

      ingredients.forEach(item => {
        const name = item.ingredient?.name || "-";
        const unit = item.ingredient?.unit || "-";
        const quantity = item.quantity || 0;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${name}</td>
            <td>${quantity}</td>
            <td>${unit}</td>
        `;
        tbody.appendChild(row);
      });

      document.getElementById('mealExportItemsModal').style.display = 'flex';
    }
  } catch (error) {
    console.error("Error loading export details:", error);
    commonfunction.showMessage("error", "حدث خطأ أثناء تحميل تفاصيل الفاتورة");
  } finally {
    commonfunction.showLoading(false);
  }
}

export function handleIngredientSelect() {
    const select = document.getElementById("ingredientSelect");
    const selectedOption = select.options[select.selectedIndex];
    const unitInput = document.getElementById("ingredientUnit");

    if (selectedOption && unitInput) {
        unitInput.value = selectedOption.dataset.unit || "";
    }
}

export function addManualIngredientNew() {
    const select = document.getElementById('manualIngredientSelect');
    const unitInput = document.getElementById('manualIngredientUnit');
    const qtyInput = document.getElementById('manualIngredientQtyInput');

    const selectedId = parseInt(select.value);
    const selectedName = select.options[select.selectedIndex]?.dataset.name;
    const selectedUnit = unitInput.value;
    const selectedQty = parseFloat(qtyInput.value);
    const selectedStock = parseFloat(select.options[select.selectedIndex]?.dataset?.stock || 0);

    if (!selectedId || !selectedName || !selectedUnit || isNaN(selectedQty) || selectedQty <= 0) {
        alert("يرجى اختيار الصنف وإدخال الكمية بشكل صحيح");
        return;
    }

    // ✅ تحقق من التكرار
    const duplicate = currentIngredientsData.find(item => item.ingredient_id === selectedId);
    if (duplicate) {
        commonfunction.showMessage('warning', 'هذا الصنف مضاف بالفعل');
        return;
    }

    const newItem = {
        ingredient_id: selectedId,
        name: selectedName,
        unit: selectedUnit,
        stockQuantity: selectedStock,
        totalQuantity: selectedQty,
        editedQuantity: selectedQty
    };

    currentIngredientsData.push(newItem);

    renderIngredientsTable(currentIngredientsData);
    document.getElementById('manualIngredientModal').style.display = 'none';
}

export async function openManualIngredientModal() {
    const modal = document.getElementById('manualIngredientModal');
    const select = document.getElementById('manualIngredientSelect');
    const unitInput = document.getElementById('manualIngredientUnit');
    const qtyInput = document.getElementById('manualIngredientQtyInput');

    select.innerHTML = '<option value="" disabled selected>اختر الصنف</option>';
    unitInput.value = '';
    qtyInput.value = '';

    try {
        const response = await getIngredients();
        const ingredientsList = response.data || [];

        ingredientsList.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.name;
            option.dataset.unit = item.unit;
            option.dataset.name = item.name;
            option.dataset.stock = item.quantity ?? 0;
            select.appendChild(option);
        });

        select.onchange = function () {
            const selected = this.options[this.selectedIndex];
            unitInput.value = selected.dataset.unit || '';
        };

    } catch (err) {
        console.error("فشل في تحميل الأصناف:", err);
        commonfunction.showMessage('error', 'حدث خطأ أثناء تحميل الأصناف');
        return;
    }

    modal.style.display = 'flex';
}

// ✅ إضافة event listener لتحميل فواتير التصدير عند فتح التبويب
document.addEventListener('DOMContentLoaded', function() {
  // تحميل فواتير التصدير تلقائياً عند تحميل الصفحة إذا كان تبويب التصدير مفتوح
  const mealExportContent = document.getElementById("mealExportContent");
  if (mealExportContent && mealExportContent.style.display !== "none") {
    loadSavedMealExports(1);
  }
  
  // استمع لتغيرات التبويبات
  const tabButtons = document.querySelectorAll('.tab-button');
  if (tabButtons) {
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        // تحقق إذا كان الزر مرتبط بتبويب التصدير
        const onclickAttr = this.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes('mealExportContent')) {
          // تأخير بسيط لضمان أن التبويب قد فتح قبل تحميل البيانات
          setTimeout(() => {
            loadSavedMealExports(1);
          }, 100);
        }
      });
    });
  }
});

// إضافة الدوال للـ window object عشان تكون متاحة من HTML
window.mealExport = {
    createNewMealExport,
    addMealToExport,
    removeMealFromExport,
    cancelMealExport,
    saveMealExport,
    viewMealExportDetails,
    closeMealExportModal,
    handleMealExportSelect,
    handleIngredientSelect,
    clearMealExportSelection,
    updateDayName,
    closeMealIngredientsModal,
    confirmSaveMealExport,
    showMealIngredientsModal,
    viewMealExportItems,
    closeMealExportItemsModal,
    addManualIngredient,
    populateIngredientSelect,
    viewSavedMealExportIngredients,
    replaceIngredientInExport,
    openReplaceIngredientModal,
    addManualIngredientNew,
    openManualIngredientModal,
    loadSavedMealExports // ✅ إضافة الدالة الجديدة
};