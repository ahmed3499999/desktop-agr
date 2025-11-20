console.log("supplier_report.js loaded");

import { renderTable, renderChart, clearReportResults, renderEmptyMessage } from "./admin_reports.js";
import { showMessage, showLoading } from "../adminstorage/commonfunction.js";

let suppliersList = [];

// تحويل التاريخ المحلي إلى صيغة YYYY-MM-DD
function formatDateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ⚡ تحميل الموردين من الـ API
export async function loadSuppliers() {
  try {
    const response = await getSuppliers();
    if (response && Array.isArray(response.data)) {
      suppliersList = response.data;
      populateSupplierSelect();
    } else {
      console.warn("لم يتم جلب الموردين بشكل صحيح.", response);
      showMessage("error", "لم يتم جلب الموردين بشكل صحيح.");
    }
  } catch (error) {
    console.error("حدث خطأ أثناء جلب الموردين:", error);
    showMessage("error", "حدث خطأ أثناء جلب الموردين.");
  }
}

// إضافة الموردين إلى container مع search bar (واختيار واحد فقط)
function populateSupplierSelect() {
  const container = document.getElementById("suppliersContainer");
  if (!container) return;

  container.innerHTML = "";
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

  // Search bar
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

  // Supplier items
  suppliersList.forEach(s => {
    const div = document.createElement("div");
    div.className = "supplier-item";
    div.dataset.name = s.name;
    Object.assign(div.style, {
      display: "flex", alignItems: "center", marginBottom: "6px",
      padding: "6px 8px", borderRadius: "6px", transition: "0.2s", cursor: "pointer"
    });
    div.onmouseover = () => div.style.background = "#e0f2fe";
    div.onmouseleave = () => div.style.background = "transparent";

    const radio = document.createElement("input");
    radio.type = "radio"; radio.name = "supplierSelect"; radio.value = s.id;
    radio.style.marginRight = "8px";

    const label = document.createElement("label");
    label.textContent = s.name; label.style.flex = "1";

    div.appendChild(radio);
    div.appendChild(label);
    listWrapper.appendChild(div);
  });

  // Search functionality
  searchInput.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase();
    listWrapper.querySelectorAll(".supplier-item").forEach(item => {
      const name = item.dataset.name.toLowerCase();
      item.style.display = name.includes(term) ? "flex" : "none";
    });
  });

  toggleBtn.onclick = () => {
    listWrapper.style.display = listWrapper.style.display === "none" ? "block" : "none";
  };

  container.appendChild(toggleBtn);
  container.appendChild(listWrapper);
}

// الحصول على المورد المختار
function getSelectedSupplierId() {
  const selected = document.querySelector('input[name="supplierSelect"]:checked');
  return selected?.value || null;
}

// توليد تقرير الموردين
export async function generateSupplierReport(report_type) {
  const supplierId = getSelectedSupplierId();
  if (!supplierId) {
    showMessage("error", "اختر المورد أولاً");
    return;
  }

  let start_date = "";
  let end_date = "";

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
    } else {
      start_date = document.getElementById("monthlyCustomFrom")?.value || "";
      end_date = document.getElementById("monthlyCustomTo")?.value || "";
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
    const response = await get_supplier_report(supplierId, start_date, end_date, report_type);
    showLoading(false);

    const rowsData = response?.data?.rows || [];
    const periodDebt = response?.data?.period_debt || "0.00";
    const totalDebt = response?.data?.total_debt || "0.00";

    if (rowsData.length === 0) {
      renderEmptyMessage("لا توجد بيانات لهذا المورد في الفترة المحددة.");
      return;
    }

    const headers = ["الفترة", "إجمالي المدفوع", "إجمالي المستحق"];
    const rows = rowsData.map(item => [
      item.period,
      parseFloat(item.total_paid).toFixed(2),
      parseFloat(item.total_due).toFixed(2)
    ]);

    const footer = `
<tr style="background: linear-gradient(135deg, #f9fafb, #eef2f6);">
  <td colspan="3" 
      style="padding:18px; text-align:center; border:1px solid #d1d5db; border-radius:12px;
             box-shadow:0 3px 6px rgba(0,0,0,0.06); font-size:16px; font-weight:600; color:#334155;">
    <span style="margin:0 20px; font-weight:600;">
      <i style="margin-left:5px; color:#334155;" class="fas fa-calendar-week"></i>
      مديونية الفترة: <strong>${parseFloat(periodDebt).toFixed(2)}</strong>
    </span>
    <span style="color:#94a3b8; margin:0 10px;">|</span>
    <span style="margin:0 20px; font-weight:600;">
      <i style="margin-left:5px; color:#334155;" class="fas fa-wallet"></i>
      إجمالي المديونية: <strong>${parseFloat(totalDebt).toFixed(2)}</strong>
    </span>
  </td>
</tr>`;

    const chartData = rowsData.map(item => ({
      name: item.period,
      paid: parseFloat(item.total_paid),
      due: parseFloat(item.total_due)
    }));

    renderTable(
      headers,
      rows,
      footer,
      "reportChart",
      {
        tooltip: { trigger: 'axis' },
        legend: { data: ["المدفوع", "المستحق"] },
        xAxis: { type: 'category', data: chartData.map(d => d.name), name: 'الفترة' },
        yAxis: { type: 'value', name: 'القيمة' },
        series: [
          {
            name: 'المدفوع',
            type: 'line',
            smooth: true,
            areaStyle: { opacity: 0.25, color: '#4caf50' },
            data: chartData.map(d => d.paid),
            color: '#4caf50'
          },
          {
            name: 'المستحق',
            type: 'line',
            smooth: true,
            areaStyle: { opacity: 0.25, color: '#f44336' },
            data: chartData.map(d => d.due),
            color: '#f44336'
          }
        ]
      }
    );

    // ✅ Expand report results container
    const reportContainer = document.getElementById("reportResults");
    if (reportContainer) {
      reportContainer.style.maxHeight = "none";
      reportContainer.style.overflow = "visible";
    }

  } catch (error) {
    showLoading(false);
    console.error("حدث خطأ أثناء جلب التقرير:", error);
    renderEmptyMessage("حدث خطأ أثناء جلب التقرير.");
    showMessage("error", "حدث خطأ أثناء جلب التقرير");
  }
}

// ربط الواجهة
export function setupSupplierReport() {
  const supplierDiv = document.getElementById("suppliersDiv");
  const reportTypeSelect = document.getElementById("reportType");
  const reportModeSelect = document.getElementById("reportMode");
  const generateBtn = document.getElementById("generateReportBtn");
  const printBtn = document.getElementById("printReportBtn");

  if (!supplierDiv || !reportTypeSelect || !reportModeSelect || !generateBtn) return;

  const toggleSupplierDiv = () => {
    supplierDiv.style.display = reportTypeSelect.value === "suppliers" ? "block" : "none";
    if (reportTypeSelect.value === "suppliers" && suppliersList.length === 0) {
      loadSuppliers();
    }
    clearReportResults();
  };

  toggleSupplierDiv();
  reportTypeSelect.addEventListener("change", toggleSupplierDiv);

  generateBtn.addEventListener("click", async () => {
    if (reportTypeSelect.value !== "suppliers") return;
    const mode = reportModeSelect.value;
    if (!mode) {
      showMessage("error", "اختر طريقة التقرير أولاً");
      return;
    }
    await generateSupplierReport(mode);
  });

  // ✅ Print button logic
  if (printBtn) {
    printBtn.addEventListener("click", () => {
      const reportContent = document.getElementById("reportResults")?.innerHTML.trim();
      if (!reportContent) {
        showMessage("warning", "⚠ لا يوجد بيانات لطباعتها.");
        return;
      }
      window.print();
    });
  }
}
