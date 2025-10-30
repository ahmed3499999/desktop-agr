// expenses_report.js (updated, no extra whitespace under bold line)
console.log("expenses_report.js loaded");

import { renderTable, renderChart, clearReportResults, renderEmptyMessage } from "./admin_reports.js";
import { showMessage, showLoading } from "../adminstorage/commonfunction.js";

let hospitalsList = [];

/** تحويل التاريخ المحلي لصيغة YYYY-MM-DD */
function formatDateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** تحميل المستشفيات */
export async function loadHospitals() {
  try {
    const response = await get_hospitals();
    if (response && Array.isArray(response.data)) {
      hospitalsList = response.data;
      populateHospitalSelect();
    } else {
      showMessage("error", "فشل تحميل قائمة المستشفيات.");
    }
  } catch (error) {
    console.error("❌ خطأ أثناء جلب المستشفيات:", error);
    showMessage("error", "حدث خطأ أثناء جلب المستشفيات.");
  }
}

/** تعبئة المستشفيات */
function populateHospitalSelect() {
  const hospitalSelect = document.getElementById("hospitalSelectReports");
  const hospitalDiv = document.getElementById("hospitalDiv");
  if (!hospitalSelect || !hospitalDiv) return;
  hospitalDiv.style.display = "block";
  hospitalSelect.innerHTML = `<option value="" disabled selected>اختر مستشفى</option>`;
  hospitalsList.forEach(hospital => {
    const option = document.createElement("option");
    option.value = hospital.hos_id;
    option.textContent = hospital.hos_name;
    hospitalSelect.appendChild(option);
  });
}

/** توليد تقرير المصروفات */
export async function generateExpensesReport(report_type) {
  const hospitalSelect = document.getElementById("hospitalSelectReports");
  const hospitalId = hospitalSelect?.value;
  if (!hospitalId) {
    showMessage("error", "اختر المستشفى أولاً");
    return;
  }
  let start_date = "", end_date = "";
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
      showMessage("error", "اختر الشهر أو أدخل تواريخ مخصصة.");
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
  clearReportResults();
  showLoading(true);
  try {
    const response = await get_payments_report(hospitalId, start_date, end_date, report_type);
    showLoading(false);
    const rowsData = response?.data?.rows || [];
    const totalPaid = response?.data?.total || "0.00";
    const isEmptyRows = !rowsData ||
      (Array.isArray(rowsData) && rowsData.length === 0) ||
      (!Array.isArray(rowsData) && Object.keys(rowsData).length === 0);
    if (isEmptyRows) {
      renderEmptyMessage("لا توجد بيانات لهذه المستشفى في الفترة المحددة.");
      return;
    }
    if (report_type === "daily") {
      // -----------------------
      // GROUPED DAILY TABLE (date once per group + bold line under each group)
      // -----------------------
      const allPurposes = new Set();
      Object.values(rowsData).forEach(day => {
        if (day.purposes) Object.keys(day.purposes).forEach(p => allPurposes.add(p));
      });
      const purposesArray = Array.from(allPurposes);
      const headers = ["التاريخ", "الغرض", "قيمة الغرض", "إجمالي اليوم"];
      const container = document.getElementById("reportResults");
      if (!container) {
        renderEmptyMessage("مشكلة في واجهة النتائج.");
        return;
      }
      let html = `<div id="expensesChart" style="width:100%; height:400px; margin-bottom:20px;"></div>`;
      html += `<table class="data-table" id="analysisTable" style="width:100%;">`;
      html += `<thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>`;
      html += `<tbody>`;
      const entries = Object.entries(rowsData);
      entries.forEach(([date, day], idx) => {
        const purposes = Object.entries(day.purposes || {});
        const dayTotal = parseFloat(day.total || 0).toFixed(2);
        if (purposes.length === 0) {
          html += `<tr>
                     <td>${date}</td>
                     <td></td>
                     <td>0.00</td>
                     <td>${dayTotal}</td>
                   </tr>`;
        } else {
          purposes.forEach(([purpose, value], index) => {
            const valueStr = parseFloat(value || 0).toFixed(2);
            const isLastPurpose = index === purposes.length - 1;
            const borderStyle = (isLastPurpose && idx < entries.length - 1)
              ? "border-bottom:3px solid black;"
              : "";

            if (index === 0) {
              html += `<tr style="${borderStyle}">
                         <td rowspan="${purposes.length}">${date}</td>
                         <td>${purpose}</td>
                         <td>${valueStr}</td>
                         <td rowspan="${purposes.length}">${dayTotal}</td>
                       </tr>`;
            } else {
              html += `<tr style="${borderStyle}">
                         <td>${purpose}</td>
                         <td>${valueStr}</td>
                       </tr>`;
            }
          });
        }
      });
      html += `</tbody>`;
      html += `<tfoot>
                 <tr style="background:#f0f0f0;">
                   <td colspan="4" style="text-align:center;font-weight:600;">
                     إجمالي المدفوعات: <strong>${parseFloat(totalPaid).toFixed(2)}</strong>
                   </td>
                 </tr>
               </tfoot>`;
      html += `</table>`;
      container.innerHTML = html;
      // chart
      const pieSeriesData = purposesArray.map(purpose => {
        let totalForPurpose = 0;
        Object.values(rowsData).forEach(day => {
          totalForPurpose += parseFloat(day.purposes?.[purpose] || 0);
        });
        return { name: purpose, value: totalForPurpose };
      });
      const chartOptions = {
        tooltip: { trigger: "item", formatter: "{a} <br/>{b}: {c} ({d}%)" },
        legend: { orient: "vertical", left: "left", data: purposesArray },
        series: [
          {
            name: "الأغراض",
            type: "pie",
            radius: "60%",
            center: ["50%", "50%"],
            data: pieSeriesData,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)"
              }
            }
          }
        ]
      };
      renderChart("expensesChart", chartOptions);
    } else {
      // monthly/yearly
      const headers = ["الفترة", "إجمالي المدفوعات"];
      const rows = rowsData.map(item => [
        item.period || "",
        parseFloat(item.total_paid || 0).toFixed(2)
      ]);
      renderTable(
        headers,
        rows,
        `<tr style="background:#f0f0f0;">
           <td colspan="2" style="text-align:center;font-weight:600;">
             إجمالي المدفوعات: <strong>${parseFloat(totalPaid).toFixed(2)}</strong>
           </td>
         </tr>`,
        "expensesChart",
        {
          tooltip: { trigger: "axis" },
          legend: { data: ["إجمالي المدفوعات"] },
          xAxis: { type: "category", data: rowsData.map(d => d.period), name: "الفترة" },
          yAxis: { type: "value", name: "القيمة" },
          series: [{
            name: "إجمالي المدفوعات",
            type: "line",
            smooth: true,
            areaStyle: { opacity: 0.25 },
            data: rowsData.map(d => parseFloat(d.total_paid || 0))
          }]
        }
      );
    }
  } catch (error) {
    showLoading(false);
    renderEmptyMessage("حدث خطأ أثناء جلب التقرير.");
    showMessage("error", "حدث خطأ أثناء جلب التقرير");
  }
}

/** ربط كل شيء بالـ HTML */
export function setupExpensesReport() {
  const hospitalDiv = document.getElementById("hospitalDiv");
  const reportTypeSelect = document.getElementById("reportType");
  const reportModeDiv = document.getElementById("reportModeDiv");
  const reportModeSelect = document.getElementById("reportMode");
  const generateBtn = document.getElementById("generateReportBtn");
  if (!hospitalDiv || !reportTypeSelect || !reportModeDiv || !reportModeSelect || !generateBtn) return;
  reportModeDiv.style.display = "flex";
  if (reportTypeSelect.value === "financial") {
    hospitalDiv.style.display = "block";
    if (hospitalsList.length === 0) loadHospitals();
  }
  reportTypeSelect.addEventListener("change", async () => {
    clearReportResults();
    if (reportTypeSelect.value === "financial") {
      hospitalDiv.style.display = "block";
      if (hospitalsList.length === 0) await loadHospitals();
    } else {
      hospitalDiv.style.display = "none";
    }
  });
  generateBtn.addEventListener("click", async () => {
    const mode = reportModeSelect.value;
    if (!mode) {
      showMessage("error", "اختر طريقة التقرير أولاً");
      return;
    }
    if (reportTypeSelect.value === "financial") await generateExpensesReport(mode);
  });
}