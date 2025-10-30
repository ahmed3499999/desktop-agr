console.log("return_report.js loaded");

import { renderTable, renderChart, clearReportResults, renderEmptyMessage } from "./admin_reports.js";
import { showMessage, showLoading } from "../adminstorage/commonfunction.js";

let ingredientsList = [];
let hospitalsList = [];
let hospitalsLoaded = false;

function formatDateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function loadIngredients() {
  const hospitalSelect = document.getElementById("hospitalSelectReports");
  const hospitalId = hospitalSelect?.value;
  if (ingredientsList.length > 0) {
    populateIngredientsSelect();
    return;
  }
  if (hospitalId) {
    try {
      const response = await get_hospital_ingredients(hospitalId);
      console.log("📡 Ingredients API Response for hospital", hospitalId, ":", response);
      if (response) {
        const list = Array.isArray(response.data) ? response.data : response.rows;
        if (Array.isArray(list)) {
          ingredientsList = list;
        } else {
          console.warn("⚠️ لم يتم جلب الأصناف بشكل صحيح:", response);
          showMessage("error", "لم يتم جلب الأصناف بشكل صحيح.");
        }
      }
    } catch (error) {
      console.error("❌ حدث خطأ أثناء جلب الأصناف:", error);
      showMessage("error", "حدث خطأ أثناء جلب الأصناف.");
    }
  }
  populateIngredientsSelect();
}

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

function populateIngredientsSelect() {
  const container = document.getElementById("ingredientsContainer");
  if (!container) return;
  container.innerHTML = "";
  container.style.overflow = "visible";
  container.style.maxHeight = "none";
  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = "اختر الأصناف";
  Object.assign(toggleBtn.style, {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: "100%", marginBottom: "10px", padding: "12px 0",
    background: "linear-gradient(90deg, #4f46e5, #3b82f6)", color: "#fff",
    border: "none", borderRadius: "12px", cursor: "pointer",
    fontWeight: "600", fontSize: "14px", transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)", letterSpacing: "0.5px",
    position: "relative", overflow: "hidden",
  });
  toggleBtn.onmouseover = () => toggleBtn.style.transform = "translateY(-2px)";
  toggleBtn.onmouseleave = () => toggleBtn.style.transform = "translateY(0)";
  const listWrapper = document.createElement("div");
  Object.assign(listWrapper.style, {
    display: "none", border: "1px solid #ddd", borderRadius: "12px",
    padding: "10px", background: "#f9fafb", maxHeight: "220px", overflowY: "auto",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  });
  const searchWrapper = document.createElement("div");
  Object.assign(searchWrapper.style, { position: "relative", marginBottom: "8px" });
  const searchInput = document.createElement("input");
  Object.assign(searchInput.style, {
    width: "100%", padding: "6px 30px 6px 10px",
    borderRadius: "6px", border: "1px solid #ccc",
    fontSize: "13px", outline: "none",
  });
  const searchIcon = document.createElement("span");
  searchIcon.innerHTML = "🔍";
  Object.assign(searchIcon.style, {
    position: "absolute", right: "8px", top: "50%",
    transform: "translateY(-50%)", pointerEvents: "none", fontSize: "14px", color: "#999",
  });
  searchWrapper.appendChild(searchInput);
  searchWrapper.appendChild(searchIcon);
  listWrapper.appendChild(searchWrapper);
  searchInput.addEventListener("input", () => {
    const filter = searchInput.value.toLowerCase();
    listWrapper.querySelectorAll(".ingredient-item").forEach(div => {
      div.style.display = div.dataset.name.toLowerCase().includes(filter) ? "flex" : "none";
    });
  });
  const controlsDiv = document.createElement("div");
  Object.assign(controlsDiv.style, { display: "flex", justifyContent: "space-between", marginBottom: "10px" });
  const selectAllBtn = document.createElement("button"); selectAllBtn.textContent = "اختيار الكل";
  const deselectAllBtn = document.createElement("button"); deselectAllBtn.textContent = "إلغاء الكل";
  [selectAllBtn, deselectAllBtn].forEach(btn => {
    Object.assign(btn.style, {
      background: btn === selectAllBtn ? "#10b981" : "#ef4444",
      color: "#fff", border: "none", padding: "6px 12px", borderRadius: "8px",
      cursor: "pointer", fontSize: "13px", fontWeight: "500",
      transition: "0.2s", boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    });
    btn.onmouseover = () => btn.style.opacity = "0.85";
    btn.onmouseleave = () => btn.style.opacity = "1";
  });
  controlsDiv.appendChild(selectAllBtn); controlsDiv.appendChild(deselectAllBtn);
  listWrapper.appendChild(controlsDiv);
  ingredientsList.forEach(ing => {
    const div = document.createElement("div");
    div.className = "ingredient-item"; div.dataset.name = ing.name;
    Object.assign(div.style, { display: "flex", alignItems: "center", marginBottom: "6px",
      padding: "6px 8px", borderRadius: "6px", transition: "0.2s", cursor: "pointer" });
    div.onmouseover = () => div.style.background = "#e0f2fe";
    div.onmouseleave = () => div.style.background = "transparent";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox"; checkbox.value = ing.id; checkbox.id = `ingredient_${ing.id}`;
    checkbox.style.marginRight = "8px";
    const label = document.createElement("label");
    label.htmlFor = `ingredient_${ing.id}`; label.textContent = ing.name; label.style.flex = "1";
    div.appendChild(checkbox); div.appendChild(label); listWrapper.appendChild(div);
  });
  selectAllBtn.onclick = () => listWrapper.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = true);
  deselectAllBtn.onclick = () => listWrapper.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = false);
  toggleBtn.onclick = () => {
    if (!document.getElementById("hospitalSelectReports")?.value) {
      showMessage("error", "حدد المستشفى أولاً");
      return;
    }
    listWrapper.style.display = listWrapper.style.display === "none" ? "block" : "none";
  };
  container.appendChild(toggleBtn); container.appendChild(listWrapper);
}

export async function generateReturnReport(report_type) {
  const hospitalSelect = document.getElementById("hospitalSelectReports");
  const selectedIngredients = Array.from(
    document.querySelectorAll("#ingredientsContainer input[type=checkbox]:checked")
  ).map(cb => Number(cb.value));
  const hospitalId = hospitalSelect?.value;
  if (!hospitalId) { showMessage("error", "اختر المستشفى أولاً"); return; }
  let start_date = "", end_date = "";
  if (report_type === "daily") {
    const dailyMonthValue = document.getElementById("dailyMonth")?.value;
    const customFrom = document.getElementById("dailyCustomFrom")?.value;
    const customTo = document.getElementById("dailyCustomTo")?.value;
    if (customFrom && customTo) { start_date = customFrom; end_date = customTo; }
    else if (dailyMonthValue) {
      const [year, month] = dailyMonthValue.split("-").map(Number);
      start_date = formatDateLocal(new Date(year, month - 1, 1));
      end_date = formatDateLocal(new Date(year, month, 0));
    } else { showMessage("error", "اختر الشهر أو أدخل تواريخ مخصصة لتوليد التقرير."); return; }
  } else if (report_type === "monthly") {
    const monthlyYear = document.getElementById("monthlyYear")?.value;
    if (monthlyYear) { start_date = formatDateLocal(new Date(monthlyYear, 0, 1));
                        end_date = formatDateLocal(new Date(monthlyYear, 11, 31)); }
  } else if (report_type === "yearly") {
    const yearlyFrom = document.getElementById("yearlyFrom")?.value;
    const yearlyTo = document.getElementById("yearlyTo")?.value;
    if (yearlyFrom && yearlyTo) { start_date = formatDateLocal(new Date(yearlyFrom, 0, 1));
                                  end_date = formatDateLocal(new Date(yearlyTo, 11, 31)); }
  }
  if (!start_date || !end_date) { showMessage("error", "اختر فترة التقرير الصحيحة"); return; }
  clearReportResults(); showLoading(true);
  try {
    const response = await get_returns_report(hospitalId, selectedIngredients, start_date, end_date, report_type);
    showLoading(false);
    const apiData = response?.data || {};
    const rowsData = apiData.rows || {};
    const totalCost = apiData.total_cost || 0;
    const totalIngredients = apiData.total_ingredients || {};
    if (!rowsData || Object.keys(rowsData).length === 0) {
      renderEmptyMessage("لا توجد بيانات للمرتجعات في الفترة المحددة."); return;
    }
    const headers = ["التاريخ", "الصنف", "الوحدة", "الكمية", "السعر", "الإجمالي"];
    const container = document.getElementById("reportResults");
    if (!container) { renderEmptyMessage("مشكلة في واجهة النتائج."); return; }
    let html = `<table class="data-table" style="width:100%;">`;
    html += `<thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>`;
    Object.entries(rowsData).forEach(([date, group], idx) => {
      const ingredients = group.ingredients || [];
      const dayTotal = parseFloat(group.total || 0).toFixed(2);
      ingredients.forEach((ing, index) => {
        const borderStyle = (index === ingredients.length - 1 && idx < Object.keys(rowsData).length - 1)
          ? "border-bottom:3px solid black;" : "";
        if (index === 0) {
          html += `<tr style="${borderStyle}">
                     <td rowspan="${ingredients.length}">${date}</td>
                     <td>${ing.name}</td>
                     <td>${ing.unit}</td>
                     <td>${ing.quantity}</td>
                     <td>${parseFloat(ing.cost).toFixed(2)}</td>
                     <td rowspan="${ingredients.length}">${dayTotal}</td>
                   </tr>`;
        } else {
          html += `<tr style="${borderStyle}">
                     <td>${ing.name}</td>
                     <td>${ing.unit}</td>
                     <td>${ing.quantity}</td>
                     <td>${parseFloat(ing.cost).toFixed(2)}</td>
                   </tr>`;
        }
      });
    });
html += `<tfoot>
  <tr>
    <td colspan="6" 
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
        <div style="flex-shrink:0; text-align:right; width:auto;">
          <button id="toggleSelectedIngredients" 
                  style="
                    padding:8px 16px;
                    background: linear-gradient(90deg, #3b82f6, #2563eb); 
                    color:#fff;
                    border:none;
                    border-radius:10px;
                    cursor:pointer;
                    font-weight:600;
                    transition: all 0.3s ease;
                  "
                  onmouseover="this.style.opacity='0.85'"
                  onmouseleave="this.style.opacity='1'"
          >
            اجمالي الأصناف المختارة
          </button>
          <ul id="selectedIngredientsList" 
              style="
                display:none;
                list-style:none; 
                padding:0; 
                margin:5px 0 0 0;
                max-height:150px;
                overflow-y:auto;
                border:1px solid #ddd;
                border-radius:10px;
                background:#f9fafb;
                min-width:200px;
              ">
            ${Object.entries(totalIngredients).map(([name, total]) =>
              `<li style="
                  padding:6px 10px; 
                  cursor:pointer; 
                  display:flex; 
                  justify-content:space-between; 
                  border-bottom:1px solid #e5e7eb;
                ">
                <span>${name}</span>
                <span>${total}</span>
              </li>`).join("")}
          </ul>
        </div>
        <span style="display:flex; align-items:center; gap:5px;">
          <i class="fas fa-receipt" style="color:#334155;"></i>
          إجمالي المرتجعات: <strong>${parseFloat(totalCost).toFixed(2)}</strong>
        </span>

      </div>
    </td>
  </tr>
</tfoot>`;
html += `</table>`;
container.innerHTML = html;
setTimeout(() => {
  const toggleBtn = document.getElementById("toggleSelectedIngredients");
  const list = document.getElementById("selectedIngredientsList");
  if(toggleBtn && list) {
    toggleBtn.addEventListener("click", () => {
      list.style.display = list.style.display === "none" ? "block" : "none";
    });
  }
}, 0);
  } catch (error) {
    showLoading(false);
    console.error("❌ خطأ أثناء جلب تقرير المرتجعات:", error);
    renderEmptyMessage("حدث خطأ أثناء جلب تقرير المرتجع.");
    showMessage("error", "حدث خطأ أثناء جلب تقرير المرتجع");
  }
}

export function setupReturnReport() {
  const hospitalDiv = document.getElementById("hospitalDiv");
  const ingredientsDiv = document.getElementById("ingredientsDiv");
  const reportTypeSelect = document.getElementById("reportType");
  const reportModeDiv = document.getElementById("reportModeDiv");
  const reportModeSelect = document.getElementById("reportMode");
  const generateBtn = document.getElementById("generateReportBtn");
  if (!hospitalDiv || !ingredientsDiv || !reportTypeSelect || !reportModeDiv || !reportModeSelect || !generateBtn) return;
  reportModeDiv.style.display = "flex";
  const toggleReturnDivs = async () => {
    const isReturn = reportTypeSelect.value === "returns";
    hospitalDiv.style.display = isReturn ? "block" : "none";
    ingredientsDiv.style.display = isReturn ? "block" : "none";
    if (isReturn) { await Promise.all([loadHospitals(), loadIngredients()]); }
    document.querySelectorAll("#ingredientsContainer input[type=checkbox]").forEach(cb => cb.checked = false);
  };
  toggleReturnDivs();
  reportTypeSelect.addEventListener("change", async () => {
    clearReportResults(); await toggleReturnDivs();
  });
  generateBtn.addEventListener("click", async () => {
    const mode = reportModeSelect.value;
    if (!mode) { showMessage("error", "اختر طريقة التقرير أولاً"); return; }
    await generateReturnReport(mode);
    document.querySelectorAll("#ingredientsContainer input[type=checkbox]").forEach(cb => cb.checked = false);
  });
  const hospitalSelect = document.getElementById("hospitalSelectReports");
  hospitalSelect?.addEventListener("change", async () => {
    ingredientsList = [];
    await loadIngredients();
  });
}