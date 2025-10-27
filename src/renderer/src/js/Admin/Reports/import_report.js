console.log("import_report.js loaded");

import { showMessage, showLoading } from "../adminstorage/commonfunction.js";
import { renderTable, renderChart, clearReportResults, renderEmptyMessage } from "./admin_reports.js";

let suppliersList = [];
let hospitalsList = [];
let ingredientsList = [];

function formatDateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function loadSuppliers() {
  try {
    const res = await getSuppliers();
    if (res && Array.isArray(res.data)) {
      suppliersList = res.data;
      populateSuppliers();
    } else {
      suppliersList = res?.data || [];
    }
  } catch (err) {
    console.error("خطأ أثناء جلب الموردين:", err);
    showMessage("error", "تعذر جلب الموردين");
    suppliersList = [];
  }
}

function populateSuppliers() {
  const container = document.getElementById("suppliersContainer");
  if (!container) return;
  container.innerHTML = "";
  // ensure supplier container won't produce the page-level scrollbar issue
  container.style.overflow = "visible";
  container.style.maxHeight = "none";

  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = "اختر الموردين";
  Object.assign(toggleBtn.style, {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: "100%", marginBottom: "10px", padding: "12px 0",
    background: "linear-gradient(90deg, #4f46e5, #3b82f6)",
    color: "#fff",
    border: "none", borderRadius: "12px", cursor: "pointer",
    fontWeight: "600", fontSize: "14px", transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
  });

  const listWrapper = document.createElement("div");
  Object.assign(listWrapper.style, {
    display: "none", border: "1px solid #ddd", borderRadius: "12px",
    padding: "10px", background: "#f9fafb", maxHeight: "220px", overflowY: "auto",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
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
    transform: "translateY(-50%)", pointerEvents: "none", fontSize: "14px", color: "#999"
  });
  searchWrapper.appendChild(searchInput);
  searchWrapper.appendChild(searchIcon);
  listWrapper.appendChild(searchWrapper);

  const controlsDiv = document.createElement("div");
  Object.assign(controlsDiv.style, { display: "flex", justifyContent: "space-between", marginBottom: "10px" });
  const selectAllBtn = document.createElement("button"); selectAllBtn.textContent = "اختيار الكل";
  const deselectAllBtn = document.createElement("button"); deselectAllBtn.textContent = "إلغاء الكل";
  [selectAllBtn, deselectAllBtn].forEach(btn => {
    Object.assign(btn.style, {
      background: btn === selectAllBtn ? "#10b981" : "#ef4444",
      color: "#fff", border: "none", padding: "6px 12px", borderRadius: "8px",
      cursor: "pointer", fontSize: "13px", fontWeight: "500",
      transition: "0.2s", boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
    });
    btn.onmouseover = () => btn.style.opacity = "0.85";
    btn.onmouseleave = () => btn.style.opacity = "1";
  });
  controlsDiv.appendChild(selectAllBtn); controlsDiv.appendChild(deselectAllBtn);
  listWrapper.appendChild(controlsDiv);

  suppliersList.forEach(s => {
    const div = document.createElement("div");
    div.className = "supplier-item"; div.dataset.name = s.name;
    Object.assign(div.style, { display: "flex", alignItems: "center", marginBottom: "6px",
      padding: "6px 8px", borderRadius: "6px", transition: "0.2s", cursor: "pointer" });
    div.onmouseover = () => div.style.background = "#e0f2fe";
    div.onmouseleave = () => div.style.background = "transparent";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox"; checkbox.value = s.id; checkbox.classList.add("supplierCheckbox");
    checkbox.style.marginRight = "8px";
    const label = document.createElement("label");
    label.textContent = s.name; label.style.flex = "1";
    div.appendChild(checkbox); div.appendChild(label); listWrapper.appendChild(div);
  });

  selectAllBtn.onclick = () => listWrapper.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = true);
  deselectAllBtn.onclick = () => listWrapper.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = false);
  toggleBtn.onclick = () => listWrapper.style.display = listWrapper.style.display === "none" ? "block" : "none";

  container.appendChild(toggleBtn); container.appendChild(listWrapper);
}

function populateIngredients() {
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
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
  });

  const listWrapper = document.createElement("div");
  Object.assign(listWrapper.style, {
    display: "none", border: "1px solid #ddd", borderRadius: "12px",
    padding: "10px", background: "#f9fafb", maxHeight: "220px", overflowY: "auto",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
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
    transform: "translateY(-50%)", pointerEvents: "none", fontSize: "14px", color: "#999"
  });
  searchWrapper.appendChild(searchInput);
  searchWrapper.appendChild(searchIcon);
  listWrapper.appendChild(searchWrapper);

  const controlsDiv = document.createElement("div");
  Object.assign(controlsDiv.style, { display: "flex", justifyContent: "space-between", marginBottom: "10px" });
  const selectAllBtn = document.createElement("button"); selectAllBtn.textContent = "اختيار الكل";
  const deselectAllBtn = document.createElement("button"); deselectAllBtn.textContent = "إلغاء الكل";
  [selectAllBtn, deselectAllBtn].forEach(btn => {
    Object.assign(btn.style, {
      background: btn === selectAllBtn ? "#10b981" : "#ef4444",
      color: "#fff", border: "none", padding: "6px 12px", borderRadius: "8px",
      cursor: "pointer", fontSize: "13px", fontWeight: "500",
      transition: "0.2s", boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
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
    checkbox.type = "checkbox"; checkbox.value = ing.id; checkbox.classList.add("ingredientCheckbox");
    checkbox.style.marginRight = "8px";
    const label = document.createElement("label");
    label.textContent = ing.name; label.style.flex = "1";
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

export async function generateImportReport(report_type) {
  // Ensure hospitals loaded (used for mapping names)
  if (!Array.isArray(hospitalsList) || hospitalsList.length === 0) {
    await loadHospitals();
  }

  const supplierCheckboxes = document.querySelectorAll(".supplierCheckbox:checked");
  const supplierIds = Array.from(supplierCheckboxes).map(cb => Number(cb.value));
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

  if (!start_date || !end_date) {
    showMessage("error", "اختر فترة التقرير الصحيحة");
    return;
  }

  // Remove any previous results and make sure report area won't create its own scrollbar
  clearReportResults();
  const rr = document.getElementById("reportResults");
  if (rr) {
    rr.style.overflow = "visible";
    rr.style.maxHeight = "none";
    rr.style.width = "100%";
  }

  showLoading(true);
  console.log("📤 get_import_report payload:", {
    suppliers: supplierIds,
    hospital: hospitalId,
    ingredients: ingredientIds,
    start_date,
    end_date,
    report_type
  });

  try {
    const response = await get_import_report(
      supplierIds,
      hospitalId,
      ingredientIds,
      start_date,
      end_date,
      report_type
    );
    showLoading(false);
    console.log("📊 استجابة تقرير الواردات (raw):", response);

    let rowsData = [];
    const rowsRaw = response?.data?.rows;
    if (rowsRaw && typeof rowsRaw === "object") {
      Object.entries(rowsRaw).forEach(([period, obj]) => {
        const objHospitalId = obj?.hospital_id ?? null;
        const objHospitalName = obj?.hospital_name ?? null;
        if (Array.isArray(obj.ingredients)) {
          obj.ingredients.forEach(ing => {
            const ingHospitalId = ing?.hospital_id ?? null;
            const ingHospitalName = ing?.hospital ?? ing?.hospital_name ?? null;
            const candidateHospitalId = (objHospitalId != null) ? objHospitalId
                                      : (ingHospitalId != null) ? ingHospitalId
                                      : hospitalId;
            let hospitalName = "";
            if (candidateHospitalId != null) {
              const found = hospitalsList.find(h => Number(h.hos_id) === Number(candidateHospitalId));
              if (found && found.hos_name) hospitalName = found.hos_name;
            }
            hospitalName = hospitalName || objHospitalName || ingHospitalName || "";
            rowsData.push({
              period,
              supplier_name: ing?.supplier || "",
              hospital_name: hospitalName,
              ingredient_name: ing?.name || "",
              quantity: ing?.quantity ?? 0,
              unit: ing?.unit || "",
              value: ing?.total_cost ?? ing?.value ?? 0
            });
          });
        }
      });
    }

    if (rowsData.length === 0) {
      renderEmptyMessage("لا توجد بيانات للفترة المحددة.");
      return;
    }

    // prepare table rows and chart
    const headers = ["الفترة", "المورد", "المستشفى", "الصنف", "الكمية", "الوحدة", "القيمة"];
    const rows = rowsData.map(item => [
      item.period,
      item.supplier_name,
      item.hospital_name,
      item.ingredient_name,
      item.quantity,
      item.unit,
      parseFloat(item.value).toFixed(2)
    ]);

    // ensure report container won't scroll on its own
    const reportContainer = document.getElementById("reportResults");
    if (reportContainer) {
      reportContainer.style.overflow = "visible";
      reportContainer.style.maxHeight = "none";
      reportContainer.style.width = "100%";
    }

    renderTable(
      headers,
      rows,
      "",
      "reportChart",
      {
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: rowsData.map(r => r.period) },
        yAxis: { type: 'value', name: 'القيمة' },
        series: [
          {
            name: 'القيمة',
            type: 'bar',
            data: rowsData.map(r => parseFloat(r.value) || 0)
          }
        ]
      }
    );

    // summary block (appended below the table)
    const totalCost = rowsData.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);
    const totalText = document.createElement("p");
    totalText.textContent = `إجمالي تكلفة الأصناف المختارة هو: ${totalCost.toFixed(2)} `;
    totalText.style.textAlign = "center";
    totalText.style.marginTop = "20px";
    totalText.style.fontSize = "16px";
    totalText.style.fontWeight = "bold";
    totalText.style.color = "#1f2937";
    document.getElementById("reportResults").appendChild(totalText);

    const totalDiv = document.createElement("div");
    totalDiv.style.marginTop = "20px";
    totalDiv.style.textAlign = "center";
    const totalQuantity = rowsData.reduce((sum, row) => sum + (row.quantity || 0), 0);
    totalDiv.innerHTML = `
      <p><strong>إجمالي الكمية: </strong>${totalQuantity}</p>
      <p><strong>إجمالي عدد الأصناف: </strong>${rowsData.length}</p>
    `;
    document.getElementById("reportResults").appendChild(totalDiv);

  } catch (error) {
    showLoading(false);
    console.error("خطأ أثناء جلب تقرير الواردات:", error);
    renderEmptyMessage("حدث خطأ أثناء جلب التقرير.");
    showMessage("error", "حدث خطأ أثناء جلب التقرير");
  }
}

export function setupImportReport() {
  const suppliersDiv = document.getElementById("suppliersDiv");
  const hospitalDiv = document.getElementById("hospitalDiv");
  const ingredientsDiv = document.getElementById("ingredientsDiv");
  if (suppliersDiv) suppliersDiv.style.display = "block";
  if (hospitalDiv) hospitalDiv.style.display = "block";
  if (ingredientsDiv) ingredientsDiv.style.display = "block";

  const supplierSelect = document.getElementById("supplierSelect");
  if (supplierSelect) {
    supplierSelect.innerHTML = '<option value="" disabled selected>اختر مورد</option>';
  }
  const hospitalSelect = document.getElementById("hospitalSelectReports");
  if (hospitalSelect) {
    hospitalSelect.innerHTML = '<option value="" disabled selected>اختر مستشفى</option>';
  }
  const ingredientSelect = document.getElementById("ingredientSelect");
  if (ingredientSelect) {
    ingredientSelect.innerHTML = '<option value="" disabled selected>اختر صنف</option>';
  }

  // load lists
  loadSuppliers();
  loadHospitals();

  // bind print button (only once)
  const printBtn = document.getElementById("printReportBtn");
  if (printBtn && !printBtn.dataset.bound) {
    printBtn.addEventListener("click", () => {
      const rr = document.getElementById("reportResults");
      if (!rr) {
        showMessage("error", "لا يوجد بيانات لطباعتها.");
        return;
      }
      // only allow print if a table or chart exists
      const hasTable = !!rr.querySelector("table");
      const hasChart = !!rr.querySelector("[id$='Chart'], canvas");
      if (!hasTable && !hasChart) {
        showMessage("error", "لا يوجد بيانات لطباعتها.");
        return;
      }

      // Open a print-only window with the report content
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        showMessage("error", "تعذر فتح نافذة الطباعة، تحقق من إعدادات النوافذ المنبثقة.");
        return;
      }
      const styles = `
        <style>
          body{font-family: Arial, Helvetica, sans-serif; direction: rtl; padding: 20px;}
          table{width:100%; border-collapse: collapse; font-size:14px;}
          table, th, td { border: 1px solid #ddd; }
          th, td { padding: 8px; text-align: right; }
          h1{font-size:18px}
        </style>
      `;
      printWindow.document.write(`<html><head><title>طباعة التقرير</title>${styles}</head><body>${rr.innerHTML}</body></html>`);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    });
    printBtn.dataset.bound = "1";
  }

  // ensure report area can't create its own scrollbar
  const rr = document.getElementById("reportResults");
  if (rr) {
    rr.style.overflow = "visible";
    rr.style.maxHeight = "none";
    rr.style.width = "100%";
  }
}
