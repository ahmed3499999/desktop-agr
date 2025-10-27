console.log("damaged_report.js loaded");

import { showMessage, showLoading } from "../adminstorage/commonfunction.js";
import { renderTable, renderChart, clearReportResults, renderEmptyMessage } from "./admin_reports.js";

let hospitalsList = [];
let ingredientsList = [];

function formatDateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function loadHospitals() {
  try {
    const res = await get_hospitals();
    hospitalsList = res?.data || [];
    populateHospitals();
    console.log("🏥 hospitalsList loaded:", hospitalsList);
  } catch (error) {
    console.error("Error loading hospitals:", error);
    hospitalsList = [];
  }
}

function populateHospitals() {
  const select = document.getElementById("hospitalSelectReports");
  if (!select) return;
  select.innerHTML = `<option value="" disabled selected>اختر مستشفى</option>`;
  hospitalsList.forEach(h => {
    const opt = document.createElement("option");
    opt.value = h.hos_id;
    opt.textContent = h.hos_name;
    select.appendChild(opt);
  });
  select.onchange = () => {
    const hosId = select.value;
    if (hosId) {
      loadIngredients(hosId);
    }
  };
}

async function loadIngredients(hospitalId) {
  try {
    const res = await get_hospital_ingredients(hospitalId);
    ingredientsList = res?.data || [];
    populateIngredients();
  } catch (err) {
    console.error("خطأ أثناء جلب الأصناف:", err);
    ingredientsList = [];
    showMessage("error", "تعذر جلب الأصناف");
  }
}

function populateIngredients() {
  const container = document.getElementById("ingredientsContainer");
  if (!container) return;
  container.innerHTML = "";

  // Ensure the ingredients container doesn't force an extra page-level scrollbar
  container.style.overflow = "visible";
  container.style.maxHeight = "none";

  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = "اختر الأصناف";
  Object.assign(toggleBtn.style, {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: "10px",
    padding: "12px 0",
    background: "linear-gradient(90deg, #4f46e5, #3b82f6)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    letterSpacing: "0.5px",
    position: "relative",
    overflow: "hidden",
  });
  toggleBtn.onmouseover = () => (toggleBtn.style.transform = "translateY(-2px)");
  toggleBtn.onmouseleave = () => (toggleBtn.style.transform = "translateY(0)");

  const listWrapper = document.createElement("div");
  Object.assign(listWrapper.style, {
    display: "none",
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "10px",
    background: "#f9fafb",
    maxHeight: "220px",
    overflowY: "auto",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  });

  // Search input for ingredients
  const searchWrapper = document.createElement("div");
  Object.assign(searchWrapper.style, { position: "relative", marginBottom: "8px" });
  const searchInput = document.createElement("input");
  Object.assign(searchInput.style, {
    width: "100%",
    padding: "6px 30px 6px 10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "13px",
    outline: "none",
  });
  const searchIcon = document.createElement("span");
  searchIcon.innerHTML = "🔍";
  Object.assign(searchIcon.style, {
    position: "absolute",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    fontSize: "14px",
    color: "#999",
  });
  searchWrapper.appendChild(searchInput);
  searchWrapper.appendChild(searchIcon);
  listWrapper.appendChild(searchWrapper);

  // Filter while typing
  searchInput.addEventListener("input", () => {
    const filter = searchInput.value.toLowerCase();
    listWrapper.querySelectorAll(".ingredient-item").forEach(div => {
      div.style.display = div.dataset.name.toLowerCase().includes(filter) ? "flex" : "none";
    });
  });

  // Select all / deselect all controls
  const controlsDiv = document.createElement("div");
  Object.assign(controlsDiv.style, { display: "flex", justifyContent: "space-between", marginBottom: "10px" });
  const selectAllBtn = document.createElement("button");
  selectAllBtn.textContent = "اختيار الكل";
  const deselectAllBtn = document.createElement("button");
  deselectAllBtn.textContent = "إلغاء الكل";
  [selectAllBtn, deselectAllBtn].forEach(btn => {
    Object.assign(btn.style, {
      background: btn === selectAllBtn ? "#10b981" : "#ef4444",
      color: "#fff",
      border: "none",
      padding: "6px 12px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: "500",
      transition: "0.2s",
      boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    });
    btn.onmouseover = () => (btn.style.opacity = "0.85");
    btn.onmouseleave = () => (btn.style.opacity = "1");
  });
  controlsDiv.appendChild(selectAllBtn);
  controlsDiv.appendChild(deselectAllBtn);
  listWrapper.appendChild(controlsDiv);

  // Populate ingredient items
  ingredientsList.forEach(ing => {
    const div = document.createElement("div");
    div.className = "ingredient-item";
    div.dataset.name = ing.name;
    Object.assign(div.style, {
      display: "flex",
      alignItems: "center",
      marginBottom: "6px",
      padding: "6px 8px",
      borderRadius: "6px",
      transition: "0.2s",
      cursor: "pointer",
    });
    div.onmouseover = () => (div.style.background = "#e0f2fe");
    div.onmouseleave = () => (div.style.background = "transparent");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = ing.id;
    checkbox.id = `ingredient_${ing.id}`;
    checkbox.classList.add("ingredientCheckbox"); // important
    checkbox.style.marginRight = "8px";

    const label = document.createElement("label");
    label.htmlFor = `ingredient_${ing.id}`;
    label.textContent = ing.name;
    label.style.flex = "1";

    div.appendChild(checkbox);
    div.appendChild(label);
    listWrapper.appendChild(div);
  });

  selectAllBtn.onclick = () => listWrapper.querySelectorAll("input[type=checkbox]").forEach(cb => (cb.checked = true));
  deselectAllBtn.onclick = () => listWrapper.querySelectorAll("input[type=checkbox]").forEach(cb => (cb.checked = false));

  toggleBtn.onclick = () => {
    // require hospital selected before showing ingredient list (same as imports)
    if (!document.getElementById("hospitalSelectReports")?.value) {
      showMessage("error", "حدد المستشفى أولاً");
      return;
    }
    listWrapper.style.display = listWrapper.style.display === "none" ? "block" : "none";
  };

  container.appendChild(toggleBtn);
  container.appendChild(listWrapper);
}

/**
 * Generate damaged/perished report
 */
export async function generateDamagedReport(report_type) {
  if (!Array.isArray(hospitalsList) || hospitalsList.length === 0) {
    await loadHospitals();
  }

  const hospitalIdRaw = document.getElementById("hospitalSelectReports")?.value || "";
  const hospitalId = hospitalIdRaw ? Number(hospitalIdRaw) : null;
  const ingredientCheckboxes = document.querySelectorAll(".ingredientCheckbox:checked");
  const ingredientIds = Array.from(ingredientCheckboxes).map(cb => Number(cb.value));

  let start_date = "";
  let end_date = "";

  if (report_type === "daily") {
    const monthVal = document.getElementById("dailyMonth")?.value;
    const customFrom = document.getElementById("dailyCustomFrom")?.value;
    const customTo = document.getElementById("dailyCustomTo")?.value;
    if (customFrom && customTo) {
      start_date = customFrom;
      end_date = customTo;
    } else if (monthVal) {
      const [y, m] = monthVal.split("-").map(Number);
      start_date = formatDateLocal(new Date(y, m - 1, 1));
      end_date = formatDateLocal(new Date(y, m, 0));
    }
  } else if (report_type === "monthly") {
    const yearVal = document.getElementById("monthlyYear")?.value;
    if (yearVal) {
      start_date = formatDateLocal(new Date(yearVal, 0, 1));
      end_date = formatDateLocal(new Date(yearVal, 11, 31));
    } else {
      start_date = document.getElementById("monthlyCustomFrom")?.value || "";
      end_date = document.getElementById("monthlyCustomTo")?.value || "";
    }
  } else if (report_type === "yearly") {
    const yFrom = document.getElementById("yearlyFrom")?.value;
    const yTo = document.getElementById("yearlyTo")?.value;
    if (yFrom && yTo) {
      start_date = formatDateLocal(new Date(yFrom, 0, 1));
      end_date = formatDateLocal(new Date(yTo, 11, 31));
    }
  }

  if (!start_date || !end_date || !hospitalId) {
    showMessage("error", "اختر مستشفى وفترة التقرير الصحيحة");
    return;
  }

  // clear previous results and ensure the report container won't create its own scrollbar
  clearReportResults();
  const rr = document.getElementById("reportResults");
  if (rr) {
    rr.style.overflow = "visible";
    rr.style.maxHeight = "none";
    rr.style.width = "100%";
  }

  showLoading(true);
  console.log("📤 get_perished_report payload:", {
    hospitalId,
    ingredientIds,
    start_date,
    end_date,
    report_type,
  });

  try {
    const response = await get_perished_report(hospitalId, ingredientIds, start_date, end_date, report_type);
    showLoading(false);
    console.log("📊 استجابة تقرير التالف (raw):", response);

    let rowsData = [];
    const rowsRaw = response?.data?.rows;
    if (rowsRaw && typeof rowsRaw === "object") {
      Object.entries(rowsRaw).forEach(([period, obj]) => {
        if (Array.isArray(obj.ingredients)) {
          obj.ingredients.forEach(ing => {
            rowsData.push({
              period,
              ingredient_name: ing?.name || "",
              quantity: ing?.quantity ?? 0,
              unit: ing?.unit || "",
            });
          });
        }
      });
    }

    console.log("➡ Formatted rowsData (for table):", rowsData);

    if (rowsData.length === 0) {
      renderEmptyMessage("لا توجد بيانات للفترة المحددة.");
      return;
    }

    const headers = ["الفترة", "الصنف", "الكمية", "الوحدة"];
    const rows = rowsData.map(item => [item.period, item.ingredient_name, item.quantity, item.unit]);

    // ensure reportResults style in case something else set it
    if (rr) {
      rr.style.overflow = "visible";
      rr.style.maxHeight = "none";
      rr.style.width = "100%";
    }

    renderTable(
      headers,
      rows,
      "",
      "reportChart",
      {
        tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: rowsData.map(r => r.period) },
        yAxis: { type: "value", name: "الكمية" },
        series: [
          {
            name: "الكمية",
            type: "bar",
            data: rowsData.map(r => parseFloat(r.quantity) || 0),
            itemStyle: { color: "#f44336" },
          },
        ],
      }
    );

    // total block below the table
    const totalQuantity = rowsData.reduce((sum, row) => sum + (parseFloat(row.quantity) || 0), 0);
    const totalDiv = document.createElement("div");
    totalDiv.style.marginTop = "20px";
    totalDiv.style.textAlign = "center";
    totalDiv.style.fontSize = "16px";
    totalDiv.style.fontWeight = "bold";
    totalDiv.style.color = "#1f2937";
    totalDiv.innerHTML = `
      <p>إجمالي الكمية: ${totalQuantity}</p>
      <p>إجمالي عدد الأصناف: ${rowsData.length}</p>
    `;
    document.getElementById("reportResults").appendChild(totalDiv);
  } catch (error) {
    showLoading(false);
    console.error("خطأ أثناء جلب تقرير التالف:", error);
    renderEmptyMessage("حدث خطأ أثناء جلب التقرير.");
    showMessage("error", "حدث خطأ أثناء جلب التقرير");
  }
}

/**
 * Setup damaged report UI + bind print button (safe single binding)
 */
export function setupDamagedReport() {
  const hospitalDiv = document.getElementById("hospitalDiv");
  const ingredientsDiv = document.getElementById("ingredientsDiv");
  if (hospitalDiv) hospitalDiv.style.display = "block";
  if (ingredientsDiv) ingredientsDiv.style.display = "block";

  const hospitalSelect = document.getElementById("hospitalSelectReports");
  if (hospitalSelect) {
    hospitalSelect.innerHTML = '<option value="" disabled selected>اختر مستشفى</option>';
  }
  const ingredientSelect = document.getElementById("ingredientSelect");
  if (ingredientSelect) {
    ingredientSelect.innerHTML = '<option value="" disabled selected>اختر صنف</option>';
  }

  loadHospitals();

  // ensure reportResults won't produce its own scrollbar on load
  const rr = document.getElementById("reportResults");
  if (rr) {
    rr.style.overflow = "visible";
    rr.style.maxHeight = "none";
    rr.style.width = "100%";
  }

  // bind print button once
  const printBtn = document.getElementById("printReportBtn");
  if (printBtn && !printBtn.dataset.bound) {
    printBtn.addEventListener("click", () => {
      const reportContainer = document.getElementById("reportResults");
      if (!reportContainer) {
        showMessage("error", "لا يوجد بيانات لطباعتها.");
        return;
      }
      const hasTable = !!reportContainer.querySelector("table");
      const hasChart = !!reportContainer.querySelector("[id$='Chart'], canvas");
      if (!hasTable && !hasChart) {
        showMessage("warning", "⚠ لا يوجد بيانات لطباعتها.");
        return;
      }

      // Open print window with report content only
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        showMessage("error", "تعذر فتح نافذة الطباعة، تحقق من إعدادات المتصفح.");
        return;
      }

      const styles = `
        <style>
          body { direction: rtl; font-family: Arial, Helvetica, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 14px; }
          table, th, td { border: 1px solid #ddd; }
          th, td { padding: 8px; text-align: right; }
          p { margin: 6px 0; }
        </style>
      `;

      printWindow.document.write(`<html><head><title>طباعة التقرير</title>${styles}</head><body>`);
      // clone the content to avoid side-effects
      printWindow.document.write(reportContainer.innerHTML);
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    });
    printBtn.dataset.bound = "1";
  }
}
