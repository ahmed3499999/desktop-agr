// meals_report.js
console.log("meals_report.js loaded");

import { renderEmptyMessage, clearReportResults } from "./admin_reports.js";
import { showMessage, showLoading } from "../adminstorage/commonfunction.js";

let hospitalsList = [];
let hospitalsLoaded = false;

/** تحويل التاريخ المحلي إلى صيغة YYYY-MM-DD */
function formatDateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** تحميل المستشفيات من API */
export async function loadHospitals() {
  if (hospitalsLoaded) return;

  const hospitalSelect = document.getElementById("hospitalSelectReports");
  if (!hospitalSelect) {
    console.error("❌ عنصر select الخاص بالمستشفيات غير موجود في DOM");
    return;
  }

  try {
    const response = await get_hospitals();
    console.log("📡 Hospitals API Response:", response);

    if (response && Array.isArray(response.data)) {
      hospitalsList = response.data;

      // إنشاء خيارات القائمة
      hospitalSelect.innerHTML = '<option value="" disabled selected>اختر مستشفى</option>';
      response.data.forEach(h => {
        const option = document.createElement("option");
        option.value = h.hos_id;
        option.textContent = h.hos_name;
        hospitalSelect.appendChild(option);
      });

      hospitalsLoaded = true;
    } else {
      console.warn("⚠️ استجابة API غير صحيحة:", response);
      showMessage("error", "لم يتم جلب المستشفيات بشكل صحيح.");
    }
  } catch (error) {
    console.error("❌ خطأ أثناء جلب المستشفيات:", error);
    showMessage("error", "حدث خطأ أثناء تحميل المستشفيات.");
  }
}

/** توليد تقرير الوجبات */
export async function generateMealsReport(report_type) {
  const hospitalSelect = document.getElementById("hospitalSelectReports");
  const hospitalId = hospitalSelect?.value;

  if (!hospitalId) {
    showMessage("error", "اختر المستشفى أولاً");
    return;
  }

  let start_date = "", end_date = "";

  // اختيار الفترة حسب نوع التقرير
  if (report_type === "daily") {
    const dailyMonthValue = document.getElementById("dailyMonth")?.value;
    const customFrom = document.getElementById("dailyCustomFrom")?.value;
    const customTo = document.getElementById("dailyCustomTo")?.value;
    if (customFrom && customTo) {
      start_date = customFrom;
      end_date = customTo;
    } else if (dailyMonthValue) {
      const [year, month] = dailyMonthValue.split("-").map(Number);
      start_date = formatDateLocal(new Date(year, month - 1, 1));
      end_date = formatDateLocal(new Date(year, month, 0));
    } else {
      showMessage("error", "اختر الشهر أو أدخل تواريخ مخصصة لتوليد التقرير.");
      return;
    }
  } else if (report_type === "monthly") {
    const monthlyYear = document.getElementById("monthlyYear")?.value;
    if (monthlyYear) {
      start_date = formatDateLocal(new Date(monthlyYear, 0, 1));
      end_date = formatDateLocal(new Date(monthlyYear, 11, 31));
    }
  } else if (report_type === "yearly") {
    const yearlyFrom = document.getElementById("yearlyFrom")?.value;
    const yearlyTo = document.getElementById("yearlyTo")?.value;
    if (yearlyFrom && yearlyTo) {
      start_date = formatDateLocal(new Date(yearlyFrom, 0, 1));
      end_date = formatDateLocal(new Date(yearlyTo, 11, 31));
    }
  }

  if (!start_date || !end_date) {
    showMessage("error", "اختر فترة التقرير الصحيحة");
    return;
  }

  clearReportResults();
  showLoading(true);

  try {
    const response = await get_meals_report(hospitalId, start_date, end_date, report_type);
    showLoading(false);

    const apiData = response?.data || {};
    const rowsData = apiData.rows || {};
    const totalCost = apiData.total || 0;

    if (!rowsData || Object.keys(rowsData).length === 0) {
      renderEmptyMessage("لا توجد بيانات للوجبات في الفترة المحددة.");
      return;
    }

    const container = document.getElementById("reportResults");
    if (!container) {
      renderEmptyMessage("مشكلة في واجهة النتائج.");
      return;
    }

    let html = `<table class="data-table" style="width:100%; border-collapse:collapse;">`;
    html += `
      <thead>
        <tr>
          <th>التاريخ</th>
          <th>نوع المريض</th>
          <th>اسم الجدول</th>
          <th>عدد الوجبات</th>
          <th>سعر الوجبة</th>
          <th>الصنف</th>
          <th>الكمية</th>
          <th>إجمالي اليوم</th>
        </tr>
      </thead>
      <tbody>
    `;

    Object.entries(rowsData).forEach(([date, group], index, array) => {
      const ingredients = group.ingredients || {};
      const meals = group.meals || [];
      const dayTotal = parseFloat(group.total || 0).toFixed(2);

      const ingredientEntries = Object.entries(ingredients);
      const totalRows = Math.max(ingredientEntries.length, meals.length);

      for (let i = 0; i < totalRows; i++) {
        const meal = meals[i] || {};
        const ing = ingredientEntries[i] || [null, { quantity: "", unit: "" }];

        const mealPatientType = meal.patient_type || "-";
        const mealScheduleName = meal.schedule_name || "-";
        const mealQuantity = meal.quantity || "-";
        const mealCost = meal.cost ? parseFloat(meal.cost).toFixed(2) : "-";

        const ingName = ing[0] || "-";
        const ingUnit = ing[1]?.unit || "";
        const ingQuantity = ing[1]?.quantity || "";

        // صياغة الكمية بالشكل "100جم"
        const formattedQuantity = ingQuantity && ingUnit ? `${ingQuantity}${ingUnit}` : "-";

        if (i === 0) {
          html += `
            <tr>
              <td rowspan="${totalRows}" style="font-weight:bold;">${date}</td>
              <td>${mealPatientType}</td>
              <td>${mealScheduleName}</td>
              <td>${mealQuantity}</td>
              <td>${mealCost}</td>
              <td>${ingName}</td>
              <td>${formattedQuantity}</td>
              <td rowspan="${totalRows}" style="font-weight:bold; color:#000;">${dayTotal}</td>
            </tr>
          `;
        } else {
          html += `
            <tr>
              <td>${mealPatientType}</td>
              <td>${mealScheduleName}</td>
              <td>${mealQuantity}</td>
              <td>${mealCost}</td>
              <td>${ingName}</td>
              <td>${formattedQuantity}</td>
            </tr>
          `;
        }
      }

      // خط فاصل بين الأيام
      if (index < array.length - 1) {
        html += `
          <tr style="padding:0; margin:0;">
            <td colspan="8" style="border-bottom:3px solid black; padding:0; margin:0;"></td>
          </tr>
        `;
      }
    });

    html += `
      </tbody>
      <tfoot>
        <tr>
          <td colspan="8" 
              style="
                padding:18px;
                border:1px solid #d1d5db;
                border-radius:12px;
                box-shadow:0 3px 6px rgba(0,0,0,0.06);
                font-size:16px;
                font-weight:600;
                color:#334155;
                background: linear-gradient(135deg, #f9fafb, #eef2f6);
              ">
            <div style="display:flex; justify-content:center; align-items:center; gap:30px; width:100%;">
              <span style="display:flex; align-items:center; gap:5px;">
                <i class="fas fa-receipt" style="color:#334155;"></i>
                إجمالي تكلفة الوجبات: <strong>${parseFloat(totalCost).toFixed(2)}</strong>
              </span>
            </div>
          </td>
        </tr>
      </tfoot>
    `;

    html += `</table>`;
    container.innerHTML = html;

  } catch (error) {
    showLoading(false);
    console.error("❌ خطأ أثناء جلب تقرير الوجبات:", error);
    renderEmptyMessage("حدث خطأ أثناء جلب تقرير الوجبات.");
    showMessage("error", "حدث خطأ أثناء جلب تقرير الوجبات");
  }
}


/** ربط الواجهة */
export function setupMealsReport() {
  const hospitalDiv = document.getElementById("hospitalDiv");
  const ingredientsDiv = document.getElementById("ingredientsDiv");
  const reportTypeSelect = document.getElementById("reportType");
  const reportModeDiv = document.getElementById("reportModeDiv");
  const reportModeSelect = document.getElementById("reportMode");
  const generateBtn = document.getElementById("generateReportBtn");

  if (!hospitalDiv || !reportTypeSelect || !reportModeDiv || !reportModeSelect || !generateBtn) return;

  reportModeDiv.style.display = "flex";

  const toggleMealsDivs = async () => {
    const isMeals = reportTypeSelect.value === "meals";
    hospitalDiv.style.display = isMeals ? "block" : "none";
    ingredientsDiv.style.display = "none"; // لا نحتاج اختيار أصناف هنا
    if (isMeals) await loadHospitals();
  };

  toggleMealsDivs();

  reportTypeSelect.addEventListener("change", async () => {
    clearReportResults();
    await toggleMealsDivs();
  });

  generateBtn.addEventListener("click", async () => {
    const mode = reportModeSelect.value;
    if (!mode) {
      showMessage("error", "اختر طريقة التقرير أولاً");
      return;
    }
    await generateMealsReport(mode);
  });
}
