// 📌 قراءة اسم المستشفى قبل أي تحقق أو عمليات أخرى
let hospitalName = sessionStorage.getItem("hospitalNameFromAdmin");

// ✅ إذا كانت فارغة أو null أو undefined نرجع نستخدم hospitalName
if (!hospitalName || hospitalName === "null" || hospitalName === "undefined") {
    hospitalName = sessionStorage.getItem("hospitalName");
}

// 🔍 طباعة كل بيانات sessionStorage لمراجعتها
console.log("💾 All sessionStorage data at start:", { ...sessionStorage });
console.log("📌 Hospital Name on USER page (early check):", hospitalName);

import * as commonfunction from "./commonfunction.js";
import * as item from "./storage/item.js";

// ✅ التحقق بعد ما نقرأ البيانات

document.addEventListener('DOMContentLoaded', () => {
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const mobileSidebar = document.getElementById('mobileSidebar');
    const closeSidebar = document.getElementById('closeSidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');

    // دالة عرض اسم المستشفى
    function displayHospitalName() {
        const hospitalNameElem = document.getElementById("hospitalNameDisplay");

        if (hospitalName && hospitalNameElem) {
            hospitalNameElem.innerHTML = `👋 أهلاً بك في مستشفى <span class="hospital-name">${hospitalName}</span>`;
        } else if (hospitalNameElem) {
            hospitalNameElem.innerHTML = `👋 أهلاً بك في مستشفى <span class="hospital-name">غير محدد</span>`;
        }
    }

    // عرض الاسم فور تحميل الصفحة
    displayHospitalName();

    // فتح القائمة الجانبية
    hamburgerMenu.addEventListener('click', () => {
        mobileSidebar.classList.add('active');
        mobileOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // غلق القائمة الجانبية
    closeSidebar.addEventListener('click', closeMobileMenu);
    mobileOverlay.addEventListener('click', closeMobileMenu);

    // فتح/غلق القوائم الفرعية
    document.querySelectorAll('.main-menu > li').forEach(menuItem => {
        menuItem.addEventListener('click', (e) => {
            const submenu = menuItem.querySelector('.submenu');
            if (submenu) {
                e.stopPropagation();
                submenu.classList.toggle('show');
            } else {
                closeMobileMenu();
            }
        });
    });

    // أزرار القوائم الفرعية
    document.querySelectorAll('.submenu li a').forEach(link => {
        link.addEventListener('click', (e) => handleTabClick(e, link));
    });

    // زر تسجيل الخروج
    document.querySelectorAll(".logout-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            commonfunction
                .showConfirm("هل أنت متأكد من تسجيل الخروج؟")
                .then((confirmed) => {
                    if (confirmed) {
                        commonfunction.showMessage("info", "تم تسجيل الخروج بنجاح");
                        sessionStorage.removeItem("token");
                        sessionStorage.removeItem("hospitalName");
                        sessionStorage.removeItem("hospitalNameFromAdmin");
                        sessionStorage.removeItem("hos_id");
                        document.location.href = "index.html";
                    }
                });
        });
    });

    // إغلاق القائمة عند تغيير حجم الشاشة
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) closeMobileMenu();
    });

    function closeMobileMenu() {
        mobileSidebar.classList.remove('active');
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = '';
        document.querySelectorAll('.submenu').forEach(sub => sub.classList.remove('show'));
    }

    async function handleTabClick(e, el) {
        e.preventDefault();
        const tab = el.dataset.tab;
        const category = el.dataset.category;
        if (tab && category) {
            if (currentCategory === category && currentTab === tab && isMobile()) {
                closeMobileMenu();
                return;
            }
            await selectCategory(category, el.closest('.has-submenu'));
            await selectTab(tab);
            closeMobileMenu();
        }
    }

    window.handleMobileTabClick = handleTabClick;
});


const tabsWrapper = document.getElementById("tabsWrapper");

const tabContent = {
    المخزن: {
        tabs: ["الأصناف", "الصادر", "الوارد", "المرتجع", "الهالك"],
        defaultTab: "الأصناف"
    },
    الوجبات: {
        tabs: ["قائمة الوجبات", "تصدير وجبات"],
        defaultTab: "قائمة الوجبات"
    },
    المصروفات: {
        tabs: ["إدارة المصروفات"],
        defaultTab: "إدارة المصروفات"
    },
};

let currentCategory = "المخزن";
let currentTab = "الأصناف";

async function init() {
    console.log("تم تحميل النظام");
    setupEventListeners();
    generateTabs(currentCategory);
    await selectTab(currentTab);
    commonfunction.updateReturnAndDamagedItemsList();
}

function setupEventListeners() {
    document.querySelectorAll('.nav-item:not(.logout-btn)').forEach(nav => {
        nav.addEventListener('click', () => {
            const category = nav.getAttribute('data-category');
            selectCategory(category, nav);
        });
    });
}

function generateTabs(category) {
    const tabs = tabContent[category].tabs;
    tabsWrapper.innerHTML = "";
    tabs.forEach((tab) => {
        const tabButton = document.createElement("button");
        tabButton.className = `tab-button ${tab === currentTab ? "active" : ""}`;
        tabButton.textContent = tab;
        tabButton.addEventListener("click", async () => {
            await selectTab(tab);
        });
        tabsWrapper.appendChild(tabButton);
    });
}

async function selectTab(tab) {
    currentTab = tab;

    // تحديث حالة الأزرار
    document.querySelectorAll(".tab-button").forEach((btn) => {
        btn.classList.toggle("active", btn.textContent.trim() === tab);
    });

    // إخفاء جميع الأقسام
    const sections = [
        "mainContent", "importContent", "exportContent",
        "returnsContent", "damagedContent", "mealsListContent",
        "mealExportContent", "expensesContent", "suppliersContent"
    ];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });

    // عرض القسم المطلوب
    const contentMap = {
        "الأصناف": "mainContent",
        "الصادر": "exportContent",
        "الوارد": "importContent",
        "المرتجع": "returnsContent",
        "الهالك": "damagedContent",
        "قائمة الوجبات": "mealsListContent",
        "تصدير وجبات": "mealExportContent",
        "إدارة المصروفات": "expensesContent"
    };
    const contentId = contentMap[tab];
    if (contentId) {
        const contentElement = document.getElementById(contentId);
        if (contentElement) {
            contentElement.style.display = "block";
            await loadTabContent(tab);
        }
    }
}

async function loadTabContent(tab) {
    try {
        switch (tab) {
            case "الوارد": {
                const invoicee = await import("./storage/invoice.js");
                window.invoice = { ...invoicee };

                // ✅ تحديث قائمة الأصناف + تحميل الفواتير المحفوظة من localStorage
                invoicee.updateInvoiceItemsList?.();
                invoicee.loadSavedInvoices?.(1);

                break;
            }
            case "الصادر": {
                const exportt = await import("./storage/export.js");
                await exportt.loadExportData?.();
                break;
            }
            case "المرتجع": {
                const returnn = await import("./storage/return.js");
                Object.assign(window, {
                    handleReturnItemSelect: returnn.handleReturnItemSelect,
                    setDefaultReturnDate: returnn.setDefaultReturnDate,
                    addReturn: returnn.addReturn
                });
                returnn.setDefaultReturnDate?.();
                returnn.loadReturnsData?.();
                commonfunction.updateReturnAndDamagedItemsList?.();
                break;
            }
            case "الهالك": {
                const damagedd = await import("./storage/damaged.js");
                Object.assign(window, {
                    handleDamagedItemSelect: damagedd.handleDamagedItemSelect,
                    clearDamagedItemSelection: damagedd.clearDamagedItemSelection,
                    addDamaged: damagedd.addDamaged
                });
                damagedd.setDefaultDamagedDate?.();
                damagedd.loadDamagedData?.();
                commonfunction.updateReturnAndDamagedItemsList?.();
                break;
            }
            case "قائمة الوجبات": {
                await loadSchedules();
                break;
            }
            case "تصدير وجبات": {
                const mealExport = await import("./meal/exportmeal.js");
                await mealExport.initMealExport();
                break;
            }
            case "إدارة المصروفات": {
                const expense = await import("./expense.js");

                // ضبط التاريخ الافتراضي
                expense.setDefaultExpenseDate?.();

                // تحميل بيانات المصروفات
                await expense.loadExpensesData?.();

                // ربط زر الإضافة
                document.getElementById("addExpenseBtn")?.addEventListener("click", expense.addExpense);

                // ربط زر عرض التحليل
                document.getElementById("showAnalysisBtn")?.addEventListener("click", expense.filterExpensesByDate);

                break;
            }
            case "الأصناف":
            default: {
                // تحميل البيانات
                await item.loadItems?.();

                // ربط زر الإضافة
                document.getElementById("addItemBtn")?.addEventListener("click", item.addItem);

                // ربط نوع الوحدة بالقائمة الفرعية في نافذة الإضافة
                document.getElementById("unitType")?.addEventListener("change", (e) => {
                    const type = e.target.value;
                    const unitSubtype = document.getElementById("unitSubtype");
                    unitSubtype.innerHTML = '<option value="" disabled selected>اختر الوحدة</option>';

                    if (item.unitsByType[type]) {
                        item.unitsByType[type].forEach((u) => {
                            const option = document.createElement("option");
                            option.value = u;
                            option.textContent = u;
                            unitSubtype.appendChild(option);
                        });
                        unitSubtype.style.display = "block";
                        unitSubtype.disabled = false;
                    } else {
                        unitSubtype.style.display = "none";
                        unitSubtype.disabled = true;
                    }
                });

                // ربط نوع الوحدة بالقائمة الفرعية في نافذة التعديل
                document.getElementById("editUnitTypeModal")?.addEventListener("change", (e) => {
                    const selectedType = e.target.value;
                    const unitSubtypeSelect = document.getElementById("editUnitSubtypeModal");

                    unitSubtypeSelect.innerHTML = '<option value="" disabled selected>اختر الوحدة</option>';

                    if (item.unitsByType[selectedType]) {
                        item.unitsByType[selectedType].forEach((unit) => {
                            const option = document.createElement("option");
                            option.value = unit;
                            option.textContent = unit;
                            unitSubtypeSelect.appendChild(option);
                        });

                        unitSubtypeSelect.disabled = false;
                        unitSubtypeSelect.style.display = "block";
                    } else {
                        unitSubtypeSelect.disabled = true;
                        unitSubtypeSelect.style.display = "none";
                    }
                });

                // ربط زر إغلاق المودال
                document.getElementById("closeModalBtn")?.addEventListener("click", () => {
                    document.getElementById("editItemModal").style.display = "none";
                });

                // ربط أزرار الجدول للتعديل
                document.getElementById("itemsTableBody")?.addEventListener("click", (e) => {
                    const editBtn = e.target.closest(".edit-btn");
                    if (editBtn) {
                        const id = editBtn.dataset.id;
                        item.openEditForm(parseInt(id));
                    }
                });

                // ربط زر إلغاء التعديل
                document.getElementById("cancelEditBtnModal")?.addEventListener("click", () => {
                    document.getElementById("editItemModal").style.display = "none";
                });

                break;
            }
        }
    } catch (error) {
        console.error(`فشل تحميل محتوى التبويب "${tab}":`, error);
    }
}

function isMobile() {
    return window.innerWidth <= 768; // أو استخدم 600 حسب تصميمك
}

function selectCategory(category, navItem) {
    if (currentCategory === category) {
        // إذا نفس الفئة وموبايل لا تعيد تحميل التبويب
        if (isMobile()) return;
        // في ديسكتوب أو شاشة كبيرة، يحدث إعادة تحميل للتبويب
        selectTab(currentTab);
        return;
    }

    currentCategory = category;

    // تحديث التبويبات
    document.querySelectorAll(".nav-item").forEach((nav) => nav.classList.remove("active"));
    if (navItem) navItem.classList.add("active");

    // توليد التبويبات
    generateTabs(category);

    // اختيار التبويب الافتراضي فقط لو مش موبايل
    if (!isMobile()) {
        currentTab = tabContent[category].defaultTab;
        selectTab(currentTab);
    }
}





// Modal unit type change handler
document
  .getElementById("editUnitTypeModal")
  .addEventListener("change", function () {
    const selectedType = this.value;
    const subtypeSelect = document.getElementById("editUnitSubtypeModal");
    subtypeSelect.innerHTML = `<option value="" disabled selected>اختر الوحدة</option>`;
    if (item.unitsByType[selectedType]) {
      item.unitsByType[selectedType].forEach((unit) => {
        const option = document.createElement("option");
        option.value = unit;
        option.textContent = unit;
        subtypeSelect.appendChild(option);
      });
      subtypeSelect.disabled = false;
    } else {
      subtypeSelect.disabled = true;
    }
  });

// Modal confirm edit handler
document
  .getElementById("confirmEditBtnModal")
  .addEventListener("click", async function () {
    const name = document.getElementById("editItemNameModal").value.trim();
    const unit = document.getElementById("editUnitSubtypeModal").value.trim();
    const cost =
      parseFloat(document.getElementById("editItemCostModal").value) || 0;

    if (!name || !unit) {
      commonfunction.showMessage(
        "warning",
        "يرجى إدخال اسم الصنف واختيار الوحدة"
      );
      return;
    }

    try {
      commonfunction.showLoading(true);
      const res = await updateIngredient(
        commonfunction.getEditingItemId(),
        name,
        unit,
        cost,
        document.getElementById("editItemQuantityModal").value
      );
      if (res.status === 200) {
        commonfunction.showMessage("success", "تم تعديل الصنف بنجاح");
        commonfunction.setEditingItemId(null);
        document.getElementById("editItemModal").style.display = "none";
        await item.loadItems();
      }
    } catch (err) {
      commonfunction.showMessage("error", "حدث خطأ أثناء تعديل الصنف");
    } finally {
      commonfunction.showLoading(false);
    }
  });

// Original edit form handlers (keeping both for compatibility)
document.getElementById("editUnitType").addEventListener("change", function () {
  const selectedType = this.value;
  const subtypeSelect = document.getElementById("editUnitSubtype");
  subtypeSelect.innerHTML = `<option value="" disabled selected>اختر الوحدة</option>`;
  if (item.unitsByType[selectedType]) {
    item.unitsByType[selectedType].forEach((unit) => {
      const option = document.createElement("option");
      option.value = unit;
      option.textContent = unit;
      subtypeSelect.appendChild(option);
    });
    subtypeSelect.disabled = false;
  } else {
    subtypeSelect.disabled = true;
  }
});

async function handleConfirmEdit() {
  const name = document.getElementById("editItemName").value.trim();
  const unit = document.getElementById("editUnitSubtype").value.trim();
  const cost = parseFloat(document.getElementById("editItemCost").value) || 0;

  if (!name || !unit) {
    commonfunction.showMessage(
      "warning",
      "يرجى إدخال اسم الصنف واختيار الوحدة"
    );
    return;
  }

  try {
    commonfunction.showLoading(true);
    const res = await updateIngredient(
      commonfunction.getEditingItemId(),
      name,
      unit,
      cost
    );
    if (res.status === 200) {
      commonfunction.showMessage("success", "تم تعديل الصنف بنجاح");
      commonfunction.setEditingItemId(null);
      document.getElementById("editItemForm").style.display = "none";
      await item.loadItems();
    }
  } catch (err) {
    commonfunction.showMessage("error", "حدث خطأ أثناء تعديل الصنف");
  } finally {
    commonfunction.showLoading(false);
  }
}

// Meals Management
let currentAddingDay = null;
let tempIngredients = [];
let currentScheduleId = null;
let ingredientList = [];
let schedules = []; // ✅ جعل المتغير جلوبال عشان باقي الدوال تقدر توصله
let scheduleToClone = null; // ✅ تعريف متغير النسخ ليكون متاح عالميًا

const arabicWeekdayMap = {
  السبت: 0,
  الأحد: 1,
  الاثنين: 2,
  الثلاثاء: 3,
  الأربعاء: 4,
  الخميس: 5,
  الجمعة: 6,
};

const weekdayNumberMap = {
  0: "السبت",
  1: "الأحد",
  2: "الاثنين",
  3: "الثلاثاء",
  4: "الأربعاء",
  5: "الخميس",
  6: "الجمعة",
};

// ======================
// البحث الحي في الجداول
// ======================
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchSchedules");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.trim().toLowerCase();
      const listContainer = document.getElementById("schedulesList");
      listContainer.innerHTML = "";

      const filtered = schedules.filter(
        (s) =>
          s.schedule_name.toLowerCase().includes(query) ||
          s.patient_type.toLowerCase().includes(query)
      );

      if (filtered.length > 0) {
        filtered.forEach(renderScheduleCard);
      } else {
        listContainer.innerHTML = `<div class="empty-message">لا توجد نتائج</div>`;
      }
    });
  }
});

// ======================
// باقي الدوال كما هي
// ======================
function handleScheduleNameChange(eventOrContext = "") {
  let select, customInput;
  if (eventOrContext?.target) {
    select = eventOrContext.target;
    if (select.id === "scheduleNameSelect") {
      customInput = document.getElementById("customScheduleInput");
    } else if (select.id === "editScheduleNameSelect") {
      customInput = document.getElementById("editCustomScheduleInput");
    }
  } else {
    const context = eventOrContext;
    select = document.getElementById(`${context}scheduleNameSelect`);
    customInput = document.getElementById(`${context}customScheduleInput`);
  }

  if (!select || !customInput) return;

  if (select.value === "other") {
    customInput.style.display = "block";
  } else {
    customInput.style.display = "none";
    customInput.value = "";
  }
}
window.handleScheduleNameChange = handleScheduleNameChange;

async function createSchedule() {
  const patientType = document.getElementById("patientTypeInput").value.trim();
  const scheduleSelect = document.getElementById("scheduleNameSelect");
  const selectedValue = scheduleSelect.value;
  const customSchedule = document
    .getElementById("customScheduleInput")
    .value.trim();
  const note = document.getElementById("scheduleNoteInput").value.trim();
  const cost = parseFloat(document.getElementById("scheduleCostInput").value);

  const scheduleName =
    selectedValue === "other" ? customSchedule : selectedValue;

  if (!patientType || !scheduleName) {
    commonfunction.showMessage("warning", "يرجى إدخال نوع المريض واسم الجدول");
    return;
  }

  if (isNaN(cost)) {
    commonfunction.showMessage(
      "warning",
      "يرجى إدخال التكلفة الإجمالية للجدول"
    );
    return;
  }

  try {
    commonfunction.showLoading(true);
    const res = await addSchedule(patientType, scheduleName, note || "", cost);
    if (res && res.status === 200) {
      document.getElementById("patientTypeInput").value = "";
      scheduleSelect.value = "";
      document.getElementById("customScheduleInput").value = "";
      document.getElementById("customScheduleInput").style.display = "none";
      document.getElementById("scheduleNoteInput").value = "";
      document.getElementById("scheduleCostInput").value = "";
      commonfunction.showMessage("success", "تمت إضافة الجدول بنجاح");
      await loadSchedules();
    } else {
      commonfunction.showMessage("error", "حدث خطأ أثناء إضافة الجدول");
    }
  } catch (error) {
    console.error("فشل إضافة الجدول:", error);
    commonfunction.showMessage("error", "حدث خطأ أثناء الاتصال بالخادم");
  } finally {
    commonfunction.showLoading(false);
  }
}
window.createSchedule = createSchedule;

async function loadSchedules() {
  const listContainer = document.getElementById("schedulesList");
  listContainer.innerHTML = "";

  try {
    const res = await getSchedules();
    schedules = res.data;

    if (Array.isArray(schedules) && schedules.length > 0) {
      const uniqueSchedules = schedules.filter(
        (item, index, self) =>
          index === self.findIndex((s) => s.schedule_id === item.schedule_id)
      );

      uniqueSchedules.forEach(renderScheduleCard);
    } else {
      listContainer.innerHTML = `<div class="empty-message">لا توجد جداول مضافة</div>`;
    }
  } catch (err) {
    console.error("فشل تحميل الجداول:", err);
    listContainer.innerHTML = `<div class="empty-message">خطأ في تحميل الجداول</div>`;
  }
}

function renderScheduleCard(schedule) {
  const listContainer = document.getElementById("schedulesList");
  const title = `${schedule.patient_type} (${schedule.schedule_name})`;
  const colorClass = getMealColorClass(schedule.schedule_name);
  const cost = schedule.cost ? `${schedule.cost} جنيه` : "—";

  const card = document.createElement("div");
  card.className = "schedule-card";
  card.innerHTML = `
    <div class="left-strip ${colorClass}"></div>
    <div class="schedule-content">
      <div class="schedule-title"><i class="fas fa-utensils"></i> ${title}</div>
      <div class="schedule-info">
        <div>تكلفة الوجبة: <strong>${cost}</strong></div>
      </div>
      <div class="schedule-actions" style="display: flex; flex-wrap: wrap; gap: 5px;">
        <button class="view-btn" onclick="viewScheduleDays(${schedule.schedule_id})">
          <i class="fas fa-eye"></i> عرض 
        </button>
        <button class="edit-btn" onclick="editSchedule(${schedule.schedule_id})">
          <i class="fas fa-edit"></i> تعديل
        </button>
        <button class="copy-btn" onclick="openCloneScheduleModal(${schedule.schedule_id})">
          <i class="fas fa-copy"></i> نسخ
        </button>
        <button class="delete-btn" onclick="deleteSchedule(${schedule.schedule_id})">
          <i class="fas fa-trash-alt"></i> حذف
        </button>
        <button class="print-btn" onclick="printSingleSchedule(${schedule.schedule_id})">
          <i class="fas fa-print"></i> طباعة
        </button>
      </div>
    </div>
  `;
  listContainer.appendChild(card);
  document.getElementById("noSchedulesMsg").style.display = "none";
}

function printSingleSchedule(scheduleId) {
  const schedule = schedules.find(s => s.schedule_id === scheduleId);
  if (!schedule) {
    commonfunction.showMessage("error", "الجدول غير موجود للطباعة");
    return;
  }

  const maxIngredients = Math.max(...(schedule.meals || []).map(m => m.ingredients?.length || 1));

  let printContent = `
    <html>
    <head>
      <title>طباعة الجدول</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; direction: rtl; background: #f9f9f9; color: #111; }
        h2 { text-align: center; margin-bottom: 20px; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        th, td { border: 1px solid #ccc; padding: 10px; text-align: center; vertical-align: top; }
        th { background-color: #e2e8f0; color: #111; }
        td.note { white-space: pre-wrap; word-wrap: break-word; text-align: right; max-width: 200px; }
        tr:nth-child(even) { background-color: #f5f5f5; }
      </style>
    </head>
    <body>
      <h2>${schedule.patient_type} (${schedule.schedule_name})</h2>
      <table>
        <thead>
          <tr>
            <th>اليوم</th>
            <th colspan="${maxIngredients}">المكونات</th>
            <th>الملاحظات</th>
          </tr>
        </thead>
        <tbody>
  `;

  (schedule.meals || []).forEach((meal, index) => {
    printContent += `<tr>`;
    printContent += `<td>${weekdayNumberMap[meal.weekday]}</td>`;

    // أعمدة المكونات مع الكمية والوحدة من pivot أو quantity مباشرة
    for (let i = 0; i < maxIngredients; i++) {
      const ing = meal.ingredients[i];
      const qty = ing?.quantity ?? ing?.pivot?.quantity ?? 0;
      const unit = ing?.unit ?? ing?.ingredient?.unit ?? "";
      const name = ing?.ingredient?.name ?? ing?.name ?? "";
      const text = ing ? `${name}: ${qty} ${unit}`.trim() : "";
      printContent += `<td>${text}</td>`;
    }

    // عمود الملاحظات مرة واحدة فقط على أول صف
    if (index === 0) {
      printContent += `<td class="note" rowspan="${schedule.meals.length}">${schedule.note || ""}</td>`;
    }

    printContent += `</tr>`;
  });

  printContent += `
        </tbody>
      </table>
    </body>
    </html>
  `;

  const printWindow = window.open('', '', 'width=900,height=600');
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
window.printSingleSchedule = printSingleSchedule;

function getMealColorClass(mealName) {
  const name = mealName.trim();
  if (name.includes("فطار")) return "color-yellow";
  if (name.includes("غذاء")) return "color-green";
  if (name.includes("عشاء")) return "color-blue";
  return "color-gray";
}

async function addScheduleWithMeals(newScheduleId, meals) {
  for (let meal of meals) {
    const weekday = meal.weekday;
    const validIngredients = (meal.ingredients || [])
      .map((ing) => {
        return {
          ingredient_id: ing.ingredient?.id || ing.ingredient_id || ing.id,
          quantity: ing.quantity,
          unit: ing.ingredient?.unit || ing.unit,
        };
      })
      .filter(
        (i) =>
          i.ingredient_id !== undefined &&
          i.quantity !== undefined &&
          i.unit !== undefined
      );

    if (validIngredients.length > 0) {
      await addScheduleMeal(newScheduleId, weekday, validIngredients);
    }
  }
}

async function openCloneScheduleModal(scheduleId) {
  try {
    commonfunction.showLoading(true);
    const res = await getSchedules();
    const schedule = res.data.find((s) => s.schedule_id === scheduleId);
    if (!schedule)
      return commonfunction.showMessage("error", "الجدول غير موجود");

    scheduleToClone = {
      ...schedule,
      meals: schedule.meals || [],
    };

    document.getElementById(
      "cloneScheduleName"
    ).value = `${schedule.schedule_name}`;
    document.getElementById("clonePatientType").value = schedule.patient_type;
    document.getElementById("cloneNote").value = schedule.note || "";
    document.getElementById("cloneScheduleModal").style.display = "flex";
  } catch (err) {
    console.error(err);
    commonfunction.showMessage("error", "فشل في تحميل بيانات الجدول");
  } finally {
    commonfunction.showLoading(false);
  }
}
window.openCloneScheduleModal = openCloneScheduleModal;

function closeCloneScheduleModal() {
  document.getElementById("cloneScheduleModal").style.display = "none";
}
window.closeCloneScheduleModal = closeCloneScheduleModal;

async function confirmCloneSchedule() {
  const name = document.getElementById("cloneScheduleName").value.trim();
  const type = document.getElementById("clonePatientType").value.trim();
  const note = document.getElementById("cloneNote").value.trim();

  if (!name || !type) {
    commonfunction.showMessage("warning", "يرجى تعبئة اسم الجدول ونوع المريض");
    return;
  }

  try {
    commonfunction.showLoading(true);
    const res = await addSchedule(type, name, note, scheduleToClone.cost || 0);
    if (res?.status === 201 && res.data?.id) {
      const newScheduleId = res.data.id;
      await addScheduleWithMeals(newScheduleId, scheduleToClone.meals);
      commonfunction.showMessage("success", "تم نسخ الجدول بنجاح");
      document.getElementById("cloneScheduleModal").style.display = "none";
      await loadSchedules();
    } else {
      throw new Error("فشل في إنشاء الجدول");
    }
  } catch (err) {
    console.error("خطأ أثناء نسخ الجدول:", err);
    commonfunction.showMessage("error", "حدث خطأ أثناء نسخ الجدول");
  } finally {
    commonfunction.showLoading(false);
  }
}
window.confirmCloneSchedule = confirmCloneSchedule;

function editSchedule(scheduleId) {
  currentScheduleId = scheduleId;
  const schedule = schedules.find((s) => s.schedule_id === scheduleId);
  if (!schedule) return alert("الجدول غير موجود");

  document.getElementById("editPatientTypeInput").value =
    schedule.patient_type || "";
  document.getElementById("editScheduleCostInput").value = schedule.cost || "";
  document.getElementById("editScheduleNoteInput").value = schedule.note || "";

  const editSelect = document.getElementById("editScheduleNameSelect");
  const editCustomInput = document.getElementById("editCustomScheduleInput");
  const knownNames = ["وجبة الفطار", "وجبة الغذاء", "وجبة العشاء"];

  if (knownNames.includes(schedule.schedule_name)) {
    editSelect.value = schedule.schedule_name;
    editCustomInput.style.display = "none";
    editCustomInput.value = "";
  } else {
    editSelect.value = "other";
    editCustomInput.style.display = "block";
    editCustomInput.value = schedule.schedule_name || "";
  }

  document.getElementById("editScheduleModal").style.display = "flex";
}
window.editSchedule = editSchedule;

function closeEditScheduleModal() {
  document.getElementById("editScheduleModal").style.display = "none";
}
window.closeEditScheduleModal = closeEditScheduleModal;

function confirmEditSchedule() {
  const patient_type = document
    .getElementById("editPatientTypeInput")
    .value.trim();
  const schedule_name_select = document.getElementById(
    "editScheduleNameSelect"
  ).value;
  const custom_name = document
    .getElementById("editCustomScheduleInput")
    .value.trim();
  const cost = parseFloat(
    document.getElementById("editScheduleCostInput").value || 0
  );
  const note = document.getElementById("editScheduleNoteInput").value.trim();

  const final_name =
    schedule_name_select === "other" ? custom_name : schedule_name_select;

  if (!patient_type || !final_name) {
    commonfunction.showMessage("error", "يرجى تعبئة نوع المريض واسم الوجبة");
    return;
  }

  updateSchedule(currentScheduleId, patient_type, final_name, note, cost)
    .then(() => {
      commonfunction.showMessage("success", "تم تعديل الجدول بنجاح");
      closeEditScheduleModal();
      loadSchedules();
    })
    .catch((err) => {
      console.error(err);
      commonfunction.showMessage("error", "حدث خطأ أثناء تعديل الجدول");
    });
}
window.confirmEditSchedule = confirmEditSchedule;

function deleteSchedule(schedule_id) {
  const card = document
    .querySelector(
      `.schedule-card button.delete-btn[onclick="deleteSchedule(${schedule_id})"]`
    )
    ?.closest(".schedule-card");

  if (!card) {
    commonfunction.showMessage(
      "error",
      "لم يتم العثور على عنصر الجدول في الواجهة"
    );
    return;
  }

  commonfunction
    .showConfirm("هل أنت متأكد من حذف الجدول؟")
    .then((confirmed) => {
      if (!confirmed) return;

      commonfunction.showLoading(true);
      DELETE(schedules_endpoint(schedule_id))
        .then(() => {
          card.style.transition = "opacity 0.4s ease, transform 0.4s ease";
          card.style.opacity = "0";
          card.style.transform = "translateX(50px)";
          setTimeout(() => {
            card.remove();
            commonfunction.showMessage("success", "تم حذف الجدول بنجاح");
            if (document.querySelectorAll(".schedule-card").length === 0) {
              loadSchedules();
            }
          }, 400);
        })
        .catch((err) => {
          console.error("فشل الحذف:", err);
          commonfunction.showMessage("error", "حدث خطأ أثناء الحذف");
        })
        .finally(() => {
          commonfunction.showLoading(false);
        });
    });
}
window.deleteSchedule = deleteSchedule;

// عرض
function viewScheduleDetails(
  scheduleId,
  scheduleName,
  patientType,
  days,
  scheduleNote = ""
) {
  currentScheduleId = scheduleId;
  const modal = document.getElementById("scheduleModal");
  const modalTitle = document.getElementById("modalScheduleTitle");
  const tableBody = document.getElementById("scheduleMealsBody");

  modalTitle.textContent = `${patientType} (${scheduleName})`;
  tableBody.innerHTML = "";

  let noteAppended = false;

  for (let i = 0; i < 7; i++) {
    const dayData = days.find((d) => d.weekday === i);
    const day = weekdayNumberMap[i];
    const ingredients = (dayData?.ingredients || []).map((ing) => ({
      name: ing.ingredient?.name || ing.ingredient_name || ing.name || "-",
      quantity: ing.quantity || "-",
      unit: ing.ingredient?.unit || "-",
    }));

    const numRows = ingredients.length || 1;

    for (let idx = 0; idx < numRows; idx++) {
      const row = document.createElement("tr");
      row.classList.add("day-row");

      if (idx === 0) {
        const tdDay = document.createElement("td");
        tdDay.textContent = day;
        tdDay.style.textAlign = "center";
        tdDay.rowSpan = numRows;
        tdDay.style.borderBottom = "2px solid #000";
        row.appendChild(tdDay);
      }

      const tdName = document.createElement("td");
      tdName.textContent = ingredients[idx]?.name || "-";
      tdName.style.borderBottom =
        idx === numRows - 1 ? "2px solid #000" : "1px solid #c";
      row.appendChild(tdName);

      const tdQty = document.createElement("td");
      const qty = ingredients[idx]?.quantity || "-";
      const unit = ingredients[idx]?.unit || "";
      tdQty.textContent = `${qty} ${unit}`.trim();
      tdQty.style.borderBottom =
        idx === numRows - 1 ? "2px solid #000" : "1px solid #ccc";
      row.appendChild(tdQty);

      if (idx === 0) {
        const tdAdd = document.createElement("td");
        tdAdd.rowSpan = numRows;
        const addBtn = document.createElement("button");
        addBtn.className = "add-btn small-btn";
        addBtn.innerHTML = '<i class="fas fa-plus"></i>';
        addBtn.onclick = () => openAddMealToDay(scheduleId, day);
        tdAdd.appendChild(addBtn);
        tdAdd.style.borderBottom = "2px solid #000";
        row.appendChild(tdAdd);
      }

      if (!noteAppended) {
        const tdNotes = document.createElement("td");
        tdNotes.textContent = scheduleNote || "-";
        tdNotes.rowSpan = 7;
        tdNotes.style.verticalAlign = "top";
        tdNotes.style.textAlign = "right";
        tdNotes.style.whiteSpace = "pre-wrap";
        tdNotes.style.wordBreak = "break-word";
        tdNotes.style.maxWidth = "200px";
        tdNotes.style.border = "none";
        row.appendChild(tdNotes);
        noteAppended = true;
      }

      tableBody.appendChild(row);
    }
  }

  modal.style.display = "flex";
}
window.viewScheduleDetails = viewScheduleDetails;

function viewScheduleDays(scheduleId) {
  commonfunction.showLoading(true);
  getSchedules()
    .then((res) => {
      const schedule = res.data.find((s) => s.schedule_id === scheduleId);
      if (!schedule) {
        commonfunction.showMessage("error", "لم يتم العثور على هذا الجدول");
        return;
      }
      const { schedule_name, patient_type, meals, note } = schedule;
      viewScheduleDetails(
        scheduleId,
        schedule_name,
        patient_type,
        meals || [],
        note
      );
    })
    .catch((err) => {
      console.error("فشل عرض التفاصيل:", err);
      commonfunction.showMessage("error", "حدث خطأ أثناء تحميل تفاصيل الجدول");
    })
    .finally(() => {
      commonfunction.showLoading(false);
    });
}
window.viewScheduleDays = viewScheduleDays;

function loadIngredientsList(targetSelectId = "ingredientSelect") {
  getIngredients().then((res) => {
    ingredientList = res.data;
    const select = document.getElementById(targetSelectId);
    if (!select) return;
    select.innerHTML = "<option disabled selected>اختر الصنف</option>";
    res.data.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.name;
      select.appendChild(option);
    });
  });
}
window.loadIngredientsList = loadIngredientsList;

function confirmAddIngredientToDay() {
  const ingredientId = document.getElementById("ingredientSelect").value;
  const quantityStr = document.getElementById("ingredientQuantity").value;
  const selected = ingredientList.find((i) => i.id == ingredientId);

  if (!selected) {
    commonfunction.showMessage("error", "اختر الصنف أولاً");
    return;
  }

  if (isNaN(parseFloat(quantityStr))) {
    commonfunction.showMessage("error", "يرجى تعبئة الكمية بشكل صحيح");
    return;
  }

  const ingredient = {
    ingredient_id: selected.id,
    quantity: parseFloat(quantityStr),
    unit: selected.unit || "-",
    name: selected.name,
    unitLabel: selected.unit || "-",
  };

  tempIngredients.push(ingredient);
  redrawIngredientsTable(); // <=== مهم تعيد رسم الجدول بعد الإضافة

  // تنظيف حقول الإدخال
  document.getElementById("ingredientSelect").value = "";
  document.getElementById("ingredientQuantity").value = "";
  document.getElementById("ingredientUnit").value = "";
}
window.confirmAddIngredientToDay = confirmAddIngredientToDay;

function redrawIngredientsTable() {
  const tableBody = document.getElementById("addMealPreviewRows");
  tableBody.innerHTML = "";
  tempIngredients.forEach((ing, idx) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${ing.name}</td>
      <td>${ing.quantity}</td>
      <td>${ing.unitLabel}</td>
      <td>
        <button onclick="removeIngredientFromDay(${idx})">❌</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}
window.redrawIngredientsTable = redrawIngredientsTable;

function moveIngredientUp(index) {
  if (index <= 0) return;
  [tempIngredients[index - 1], tempIngredients[index]] = [
    tempIngredients[index],
    tempIngredients[index - 1],
  ];
  redrawIngredientsTable();
}
window.moveIngredientUp = moveIngredientUp;

function moveIngredientDown(index) {
  if (index >= tempIngredients.length - 1) return;
  [tempIngredients[index + 1], tempIngredients[index]] = [
    tempIngredients[index],
    tempIngredients[index + 1],
  ];
  redrawIngredientsTable();
}
window.moveIngredientDown = moveIngredientDown;

function removeIngredientFromDay(index) {
  tempIngredients.splice(index, 1);
  redrawIngredientsTable();
}
window.removeIngredientFromDay = removeIngredientFromDay;

function confirmAddScheduleMeal() {
  const weekdayIndex = arabicWeekdayMap[currentAddingDay];

  if (tempIngredients.length === 0) {
    commonfunction.showMessage("error", "يجب إضافة مكون واحد على الأقل");
    return;
  }

  const ingredientsPayload = tempIngredients.map((ing) => ({
    ingredient_id: ing.ingredient_id,
    quantity: ing.quantity,
    unit: ing.unit,
  }));

  getSchedules().then((res) => {
    const schedule = res.data.find((s) => s.schedule_id === currentScheduleId);
    if (!schedule) {
      commonfunction.showMessage("error", "لم يتم العثور على الجدول");
      return;
    }

    const existingMeal = (schedule.meals || []).find(
      (m) => m.weekday === weekdayIndex
    );

    const promise = existingMeal
      ? updateScheduleMeal(existingMeal.id, ingredientsPayload)
      : addScheduleMeal(currentScheduleId, weekdayIndex, ingredientsPayload);

    promise
      .then(() => {
        commonfunction.showMessage(
          "success",
          existingMeal ? "تم تعديل الوجبة" : "تمت إضافة مكونات الوجبة"
        );
        closeAddMealModal();
        viewScheduleDays(currentScheduleId);
      })
      .catch((err) => {
        console.error("خطأ أثناء الحفظ:", err);
        commonfunction.showMessage("error", "حدث خطأ أثناء الحفظ");
      });
  });
}
window.confirmAddScheduleMeal = confirmAddScheduleMeal;

function cancelAddScheduleMeal() {
  closeAddMealModal();
}
window.cancelAddScheduleMeal = cancelAddScheduleMeal;

function closeScheduleModal() {
  document.getElementById("scheduleModal").style.display = "none";
  closeAddMealModal();
}
window.closeScheduleModal = closeScheduleModal;

function openAddMealToDay(scheduleId, weekday) {
  if (!scheduleId) {
    console.error("scheduleId مفقود");
    commonfunction.showMessage("error", "لا يمكن تحديد الجدول.");
    return;
  }

  currentScheduleId = scheduleId;
  currentAddingDay = weekday;
  openAddMealModal(weekday);

  getSchedules().then((res) => {
    const schedule = res.data.find((s) => s.schedule_id === scheduleId);
    if (!schedule) return;

    const dayData = (schedule.meals || []).find(
      (d) => d.weekday === arabicWeekdayMap[weekday]
    );

    const ingredients = (dayData?.ingredients || []).map((ing) => {
      const name = ing.ingredient?.name || ing.ingredient_name || ing.name;
      const quantity = ing.quantity;
      const unit = ing.ingredient?.unit || "-";
      return {
        ingredient_id: ing.ingredient?.id || ing.ingredient_id,
        name,
        quantity,
        unit,
        unitLabel: unit,
      };
    });

    tempIngredients = ingredients;
    redrawIngredientsTable();
  });
}
window.openAddMealToDay = openAddMealToDay;

function openAddMealModal(day) {
  document.getElementById("selectedWeekdayNameModal").textContent = day;
  document.getElementById("addMealModal").style.display = "flex";
  setTimeout(() => {
    loadIngredientsList();
  }, 50);
}
window.openAddMealModal = openAddMealModal;

function closeAddMealModal() {
  document.getElementById("addMealModal").style.display = "none";
  document.getElementById("addMealPreviewRows").innerHTML = "";
  tempIngredients = [];
}
window.closeAddMealModal = closeAddMealModal;

function updateIngredientUnit() {
  const select = document.getElementById("ingredientSelect");
  const selected = ingredientList.find((i) => i.id == select.value);
  if (!selected) return;
  document.getElementById("ingredientUnit").value = selected.unit || "-";
}
window.updateIngredientUnit = updateIngredientUnit;




// ادارة المصروفات
window.addExpense = async () => {
  const expense = await import("./expense.js");
  expense.addExpense();
};

window.openAnalysisModal = commonfunction.openAnalysisModal;
window.closeAnalysisModal = commonfunction.closeAnalysisModal;
window.filterExpensesByDate = async () => {
  const expense = await import("./expense.js");
  expense.filterExpensesByDate();
};

// Initialize the app
document.addEventListener("DOMContentLoaded", init);