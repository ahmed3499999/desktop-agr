import * as commonfunction from "../commonfunction.js";

console.log("Loading Export.js");

export async function loadExportData() {
  try {
    commonfunction.showLoading(true);

    // استخدام await للحصول على البيانات من الـ Promise
    const response = await getExports(10000, 0);
    
    // البيانات الفعلية موجودة في response.data.data بناءً على هيكل البيانات الذي عرضته
    const exportsData = response.data.data;

    if (exportsData && exportsData.length > 0) {
      renderExportTable(exportsData);
    } else {
      renderExportTable([]);
    }
  } catch (error) {
    console.error("Error loading export data:", error);
    commonfunction.showMessage("error", "حدث خطأ أثناء تحميل بيانات الصادر");
  } finally {
    commonfunction.showLoading(false);
  }
}

function renderExportTable(exportsData) {
  const exportTableBody = document.getElementById("exportTableBody");
  const exportEmptyMessage = document.getElementById("exportEmptyMessage");
  const exportTable = document.getElementById("exportTable");

  // التحقق من وجود عناصر DOM
  if (!exportTableBody || !exportEmptyMessage || !exportTable) {
    console.error("عناصر الجدول غير موجودة في DOM");
    return;
  }

  exportTableBody.innerHTML = "";

  if (!exportsData || exportsData.length === 0) {
    exportEmptyMessage.style.display = "block";
    exportTable.style.display = "none";
    return;
  }

  exportEmptyMessage.style.display = "none";
  exportTable.style.display = "table";

  const groupedData = {};

  exportsData.forEach((exportItem) => {
    const rawDate = exportItem.date;
    if (!groupedData[rawDate]) groupedData[rawDate] = {};

    // التحقق من وجود ingredients وهي مصفوفة
    if (exportItem.ingredients && Array.isArray(exportItem.ingredients)) {
      exportItem.ingredients.forEach((ingredientItem) => {
        // التحقق من وجود ingredient
        if (ingredientItem.ingredient) {
          const key = ingredientItem.ingredient.name;
          const unit = ingredientItem.ingredient.unit;
          if (!groupedData[rawDate][key]) {
            groupedData[rawDate][key] = {
              quantity: 0,
              unit: unit,
            };
          }
          groupedData[rawDate][key].quantity += ingredientItem.quantity;
        }
      });
    }
  });

  const sortedDates = Object.keys(groupedData).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  sortedDates.forEach((rawDate) => {
    // استخدام دالة formatArabicDate إذا كانت متاحة، وإلا استخدام التاريخ كما هو
    const arabicDate = commonfunction.formatArabicDate ? 
                      commonfunction.formatArabicDate(rawDate) : rawDate;
    
    const itemsMap = groupedData[rawDate];
    const items = Object.entries(itemsMap).map(([name, data]) => ({
      name,
      quantity: data.quantity,
      unit: data.unit,
    }));

    items.forEach((ingredient, index) => {
      const row = document.createElement("tr");

      if (index === 0) {
        const dateCell = document.createElement("td");
        dateCell.textContent = arabicDate;
        dateCell.className = "date-cell-group";
        dateCell.setAttribute("rowspan", items.length);
        row.appendChild(dateCell);
        row.classList.add("date-group-start");
        // إضافة فاصل للتاريخ مختلف اللون
        row.style.borderTop = "2px solid #a70f0fff";
      }

      row.innerHTML += `
        <td>${ingredient.name || ""}</td>
        <td>${ingredient.unit || ""}</td>
        <td>${ingredient.quantity}</td>
      `;

      exportTableBody.appendChild(row);
    });
  });
}