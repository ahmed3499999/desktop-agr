import { showMessage, showLoading } from "../adminstorage/commonfunction.js";

console.log("admin_reports.js loaded");

// ⚡ دالة أساسية لإعداد قسم التقارير
export function setupReportsSection() {
  const reportTypeSelect = document.getElementById("reportType");
  const reportModeSelect = document.getElementById("reportMode");
  const generateBtn = document.getElementById("generateReportBtn");

  if (reportTypeSelect) {
    const newSelect = reportTypeSelect.cloneNode(true);
    reportTypeSelect.replaceWith(newSelect);

    newSelect.addEventListener("change", async () => {
      const selectedType = newSelect.value;

      resetReportsUI();
      toggleFilters(selectedType);
      const reportModeDiv = document.getElementById("reportModeDiv");
      if (reportModeDiv) reportModeDiv.style.display = "block";
      clearReportResults();

      // ✅ تقرير الموردين
      if (selectedType === "suppliers") {
        try {
          const module = await import("./supplier_report.js");
          module.setupSupplierReport();
        } catch (err) {
          console.error(err);
          showMessage("error", "حدث خطأ أثناء تحميل تقرير الموردين.");
        }
      }

      // ✅ تقرير الواردات
      if (selectedType === "imports") {
        try {
          const module = await import("./import_report.js");
          module.setupImportReport();
        } catch (err) {
          console.error(err);
          showMessage("error", "حدث خطأ أثناء تحميل تقرير الواردات.");
        }
      }

      // ✅ تقرير المرتجعات
      if (selectedType === "returns") {
        try {
          const module = await import("./return_report.js");
          module.setupReturnReport();
        } catch (err) {
          console.error(err);
          showMessage("error", "حدث خطأ أثناء تحميل تقرير المرتجعات.");
        }
      }

      // ✅ تقرير الوجبات
      if (selectedType === "meals") {
        try {
          const module = await import("./meals_report.js");
          module.setupMealsReport();
        } catch (err) {
          console.error(err);
          showMessage("error", "حدث خطأ أثناء تحميل تقرير الوجبات.");
        }
      }

      // ✅ تقرير المصروفات
      if (selectedType === "financial") {
        try {
          const module = await import("./expenses_report.js");
          module.setupExpensesReport();
        } catch (err) {
          console.error(err);
          showMessage("error", "حدث خطأ أثناء تحميل تقرير المصروفات.");
        }
      }

      // ✅ تقرير التالف
      if (selectedType === "damaged") {
        try {
          const module = await import("./damaged_report.js");
          module.setupDamagedReport();
        } catch (err) {
          console.error(err);
          showMessage("error", "حدث خطأ أثناء تحميل تقرير التالف.");
        }
      }

      // ✅ تقرير الصادر (الجديد)
      if (selectedType === "exports") {
        try {
          const module = await import("./exports_report.js");
          module.setupExportsReport?.(); // دالة تهيئة التقرير لو موجودة
        } catch (err) {
          console.error(err);
          showMessage("error", "حدث خطأ أثناء تحميل تقرير الصادر.");
        }
      }
    });
  }

  if (reportModeSelect) {
    const newMode = reportModeSelect.cloneNode(true);
    reportModeSelect.replaceWith(newMode);

    newMode.addEventListener("change", () => {
      const mode = newMode.value;
      toggleDateInputs(mode);
    });
  }

  if (generateBtn) {
    const newBtn = generateBtn.cloneNode(true);
    generateBtn.replaceWith(newBtn);

    newBtn.addEventListener("click", async () => {
      const type = document.getElementById("reportType")?.value;
      const mode = document.getElementById("reportMode")?.value;

      if (!type || !mode) {
        showMessage("error", "اختر نوع التقرير وطريقة العرض أولاً");
        return;
      }

      showLoading(true);
      try {
        await generateReport(type, mode);
      } catch (err) {
        console.error(err);
        showMessage("error", "حدث خطأ أثناء توليد التقرير.");
      } finally {
        showLoading(false);
      }

      // تصفير ذكي للقيم الحالية لطريقة التقرير
      resetDateInputs(mode);
    });
  }

  // ⚡ تهيئة أزرار "تخصيص فترة" و"إلغاء" لليومي والشهري
  setupCustomPeriodButtons();
}

// 🔹 تصفير الواجهة عند تغيير نوع التقرير
function resetReportsUI() {
  const modeSelect = document.getElementById("reportMode");
  if (modeSelect) modeSelect.value = "";

  const dateFilters = document.getElementById("dateFilters");
  if (dateFilters) dateFilters.style.display = "none";

  [
    "dailyMonth", "dailyCustomFrom", "dailyCustomTo",
    "monthlyYear", "monthlyCustomFrom", "monthlyCustomTo",
    "yearlyFrom", "yearlyTo"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  // إعادة الوضع الافتراضي لليومي والشهري
  ["dailyDefault", "dailyCustom", "monthlyDefault", "monthlyCustom"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (id.endsWith("Default") ? "flex" : "none");
  });

  clearReportResults();

  const reportModeDiv = document.getElementById("reportModeDiv");
  if (reportModeDiv) reportModeDiv.style.display = "none";
}

// 🔹 إظهار فلاتر خاصة حسب نوع التقرير
function toggleFilters(type) {
  document.querySelectorAll(".report-filters").forEach(div => div.style.display = "none");
  const activeFilterDiv = document.getElementById(`${type}Filters`);
  if (activeFilterDiv) activeFilterDiv.style.display = "block";
}

// 🔹 إظهار أو إخفاء فلاتر التاريخ حسب نوع التقرير
function toggleDateInputs(mode) {
  const dailyInputs = document.getElementById("dailyFilters");
  const monthlyInputs = document.getElementById("monthlyFilters");
  const yearlyInputs = document.getElementById("yearlyFilters");

  if (dailyInputs) dailyInputs.style.display = "none";
  if (monthlyInputs) monthlyInputs.style.display = "none";
  if (yearlyInputs) yearlyInputs.style.display = "none";

  if (mode === "daily" && dailyInputs) dailyInputs.style.display = "block";
  else if (mode === "monthly" && monthlyInputs) monthlyInputs.style.display = "block";
  else if (mode === "yearly" && yearlyInputs) yearlyInputs.style.display = "block";

  const dateFilters = document.getElementById("dateFilters");
  if (dateFilters) dateFilters.style.display = "block";

  // عند التبديل، إعادة الوضع الافتراضي لليومي والشهري
  ["dailyDefault", "dailyCustom", "monthlyDefault", "monthlyCustom"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (id.endsWith("Default") ? "flex" : "none");
  });
}

// 🔹 إعداد أزرار "تخصيص فترة" و"إلغاء"
function setupCustomPeriodButtons() {
  const toggleDaily = document.getElementById("dailyToggleBtn");
  const cancelDaily = document.getElementById("dailyCancelBtn");
  const toggleMonthly = document.getElementById("monthlyToggleBtn");
  const cancelMonthly = document.getElementById("monthlyCancelBtn");

  if (toggleDaily && cancelDaily) {
    toggleDaily.addEventListener("click", () => {
      document.getElementById("dailyDefault").style.display = "none";
      document.getElementById("dailyCustom").style.display = "flex";
    });
    cancelDaily.addEventListener("click", () => {
      document.getElementById("dailyCustom").style.display = "none";
      document.getElementById("dailyDefault").style.display = "flex";
    });
  }

  if (toggleMonthly && cancelMonthly) {
    toggleMonthly.addEventListener("click", () => {
      document.getElementById("monthlyDefault").style.display = "none";
      document.getElementById("monthlyCustom").style.display = "flex";
    });
    cancelMonthly.addEventListener("click", () => {
      document.getElementById("monthlyCustom").style.display = "none";
      document.getElementById("monthlyDefault").style.display = "flex";
    });
  }
}

// 🔹 تصفير الحقول حسب طريقة التقرير
function resetDateInputs(mode) {
  if (mode === "daily") {
    ["dailyMonth", "dailyCustomFrom", "dailyCustomTo"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
  } else if (mode === "monthly") {
    ["monthlyYear", "monthlyCustomFrom", "monthlyCustomTo"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
  } else if (mode === "yearly") {
    ["yearlyFrom", "yearlyTo"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
  }
}

// 🔹 استدعاء الملف المناسب لتوليد التقرير
async function generateReport(type, mode) {
  if (type === "suppliers") {
    try {
      const module = await import("./supplier_report.js");
      await module.generateSupplierReport(mode);
    } catch (err) {
      console.error(err);
      showMessage("error", "حدث خطأ أثناء توليد تقرير الموردين.");
    }
    return;
  }

  if (type === "imports") {
    try {
      const module = await import("./import_report.js");
      await module.generateImportReport(mode);
    } catch (err) {
      console.error(err);
      showMessage("error", "حدث خطأ أثناء توليد تقرير الواردات.");
    }
    return;
  }

  if (type === "returns") {
    try {
      const module = await import("./return_report.js");
      await module.generateReturnReport(mode);
    } catch (err) {
      console.error(err);
      showMessage("error", "حدث خطأ أثناء توليد تقرير المرتجعات.");
    }
    return;
  }

  if (type === "meals") {
    try {
      const module = await import("./meals_report.js");
      await module.generateMealsReport(mode);
    } catch (err) {
      console.error(err);
      showMessage("error", "حدث خطأ أثناء توليد تقرير الوجبات.");
    }
    return;
  }

  if (type === "financial") {
    try {
      const module = await import("./expenses_report.js");
      await module.generateExpensesReport(mode);
    } catch (err) {
      console.error(err);
      showMessage("error", "حدث خطأ أثناء توليد تقرير المصروفات.");
    }
    return;
  }

  if (type === "damaged") {
    try {
      const module = await import("./damaged_report.js");
      await module.generateDamagedReport(mode);
    } catch (err) {
      console.error(err);
      showMessage("error", "حدث خطأ أثناء توليد تقرير التالف.");
    }
    return;
  }

  // ✅ تقرير الصادر (Export Report)
  if (type === "exports") {
    try {
      const module = await import("./exports_report.js");
      await module.generateExportsReport(mode);
    } catch (err) {
      console.error(err);
      showMessage("error", "حدث خطأ أثناء توليد تقرير الصادر.");
    }
    return;
  }

  console.log(`⚡ generateReport: تقرير ${type} بطريقة ${mode} لسه مش متوصل`);
  renderEmptyMessage("لا يوجد كود مضاف لعرض هذا النوع من التقارير بعد.");
}

// 🧹 تنظيف نتائج التقرير
export function clearReportResults() {
  const container = document.getElementById("reportResults");
  if (container) container.innerHTML = "";
}

// 📝 رسالة فارغة عند عدم وجود بيانات
export function renderEmptyMessage(msg) {
  const container = document.getElementById("reportResults");
  if (container) container.innerHTML = `<p style="color: red;">${msg}</p>`;
}

// 📊 عرض جدول التقرير مع رسم بياني
export function renderTable(headers = [], rows = [], footerHTML = "", chartId = null, chartOptions = null) {
  const container = document.getElementById("reportResults");
  if (!container) return;

  if (!rows || rows.length === 0) {
    renderEmptyMessage("لا توجد بيانات مطابقة.");
    return;
  }

  let html = "";
  if (chartId) html += `<div id="${chartId}" style="width:100%; height:400px; margin-bottom:20px;"></div>`;

  html += `
    <table class="data-table" id="analysisTable">
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>
  `;

  rows.forEach(row => {
    html += `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`;
  });

  html += `</tbody>`;
  if (footerHTML) html += `<tfoot>${footerHTML}</tfoot>`;
  html += `</table>`;

  container.innerHTML = html;

  if (chartId && chartOptions) renderChart(chartId, chartOptions);
}

// 📈 إنشاء الرسم البياني
export function renderChart(chartId, chartOptions) {
  if (!window.echarts) {
    console.warn("⚠ مكتبة ECharts غير موجودة.");
    return;
  }
  const chartDom = document.getElementById(chartId);
  if (!chartDom) return;
  const chart = echarts.init(chartDom);
  chart.setOption(chartOptions);
}
