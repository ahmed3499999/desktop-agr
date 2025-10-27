import * as commonfunction from "./commonfunction.js";

console.log("Expense module loaded");

// إعدادات الباجينج
let currentPage = 1;
const pageSize = 10; // عدد العناصر في الصفحة
let totalItems = 0;

export async function addExpense() {
  const btn = document.getElementById("addExpenseBtn");
  if (btn.disabled) return;
  btn.disabled = true;

  const dateInput = document.getElementById("expenseDate");
  const cost = parseFloat(document.getElementById("expenseAmount").value);
  const purpose = document.getElementById("expenseDesc").value.trim();
  const date = dateInput.value;

  if (!date || !cost || cost <= 0 || !purpose) {
    commonfunction.showMessage("warning", "يرجى ملء جميع الحقول المطلوبة");
    btn.disabled = false;
    return;
  }

  try {
    commonfunction.showLoading(true);
    await addPayment(cost, purpose, date);
    commonfunction.showMessage("success", "تم إضافة المصروف بنجاح");

    const currentDate = date;
    document.getElementById("expenseAmount").value = "";
    document.getElementById("expenseDesc").value = "";
    dateInput.value = currentDate;

    await loadExpensesData(currentPage);
  } catch (error) {
    console.error("Error adding expense:", error);
    commonfunction.showMessage("error", "حدث خطأ أثناء إضافة المصروف");
  } finally {
    commonfunction.showLoading(false);
    btn.disabled = false;
  }
}

export async function loadExpensesData(page = 1) {
  try {
    commonfunction.showLoading(true);

    const offset = (page - 1) * pageSize;
    const response = await getPayments(pageSize, offset);
    console.log("API Response:", response);

    // ✅ Extract items safely
    const expenses = response?.data?.data || [];

    // ✅ Total comes directly from API
    totalItems = response?.data?.total ?? expenses.length;

    currentPage = page;

    console.log(
      `📊 Loaded page ${page}, totalItems = ${totalItems}, got = ${expenses.length}`
    );

    renderExpensesTable(expenses);
    renderPagination(page);
  } catch (error) {
    console.error("Error loading expenses:", error);
    commonfunction.showMessage("error", "حدث خطأ أثناء تحميل المصروفات");
  } finally {
    commonfunction.showLoading(false);
  }
}


export function renderExpensesTable(expenses) {
  const tableBody = document.getElementById("expensesTableBody");
  const emptyMessage = document.getElementById("expensesEmptyMessage");
  const table = document.querySelector(".data-table");

  tableBody.innerHTML = "";

  if (!expenses || expenses.length === 0) {
    emptyMessage.style.display = "block";
    table.style.display = "none";
    return;
  }

  emptyMessage.style.display = "none";
  table.style.display = "table";

  // تجميع حسب التاريخ
  const groupedData = {};
  expenses.forEach((entry) => {
    const rawDate = entry.date;
    if (!groupedData[rawDate]) groupedData[rawDate] = [];
    groupedData[rawDate].push(entry);
  });

  const sortedDates = Object.keys(groupedData).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  sortedDates.forEach((rawDate) => {
    const arabicDate = commonfunction.formatArabicDate(rawDate);
    const items = groupedData[rawDate];

    items.forEach((expense, index) => {
      const row = document.createElement("tr");

      if (index === 0) {
        row.classList.add("date-group-start");
        const dateCell = document.createElement("td");
        dateCell.textContent = arabicDate;
        dateCell.className = "date-cell-group";
        dateCell.setAttribute("rowspan", items.length);
        row.appendChild(dateCell);
      }

      const costCell = document.createElement("td");
      costCell.textContent = parseFloat(expense.cost || 0).toFixed(2);
      row.appendChild(costCell);

      const purposeCell = document.createElement("td");
      purposeCell.textContent = expense.purpose;
      row.appendChild(purposeCell);

      const actionCell = document.createElement("td");
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.innerHTML = `<i class="fas fa-trash-alt"></i> حذف`;
      deleteBtn.onclick = () => handleDeleteExpense(expense.id);
      actionCell.appendChild(deleteBtn);
      row.appendChild(actionCell);

      tableBody.appendChild(row);
    });
  });
}

// ✅ Pagination الذكي
function renderPagination(activePage) {
  const paginationDiv = document.getElementById("expensesPagination");
  if (!paginationDiv) return;

  paginationDiv.innerHTML = "";

  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return;

  const createButton = (label, page, active = false, disabled = false) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.className =
      "px-3 py-1 mx-1 border rounded transition " +
      (active
        ? "bg-blue-500 text-white font-bold"
        : "bg-white text-black hover:bg-gray-100");

    if (disabled) {
      btn.disabled = true;
      btn.classList.add("opacity-50", "cursor-not-allowed");
    } else {
      btn.addEventListener("click", () => loadExpensesData(page));
    }

    paginationDiv.appendChild(btn);
  };

  // Previous
  createButton("«", activePage - 1, false, activePage === 1);

  if (activePage > 3) {
    createButton("1", 1, activePage === 1);
    if (activePage > 4) {
      const span = document.createElement("span");
      span.textContent = "...";
      span.className = "px-2 text-gray-500";
      paginationDiv.appendChild(span);
    }
  }

  const startPage = Math.max(1, activePage - 2);
  const endPage = Math.min(totalPages, activePage + 2);

  for (let i = startPage; i <= endPage; i++) {
    createButton(i, i, i === activePage);
  }

  if (activePage < totalPages - 2) {
    if (activePage < totalPages - 3) {
      const span = document.createElement("span");
      span.textContent = "...";
      span.className = "px-2 text-gray-500";
      paginationDiv.appendChild(span);
    }
    createButton(totalPages, totalPages, activePage === totalPages);
  }

  createButton("»", activePage + 1, false, activePage === totalPages);
}

async function handleDeleteExpense(id) {
  const confirmed = await commonfunction.showConfirm(
    "هل أنت متأكد من حذف هذا المصروف؟"
  );
  if (!confirmed) return;

  try {
    commonfunction.showLoading(true);
    await deletePayment(id);
    commonfunction.showMessage("success", "تم حذف المصروف بنجاح");
    await loadExpensesData(currentPage);
  } catch (err) {
    console.error("Error deleting expense:", err);
    commonfunction.showMessage("error", "حدث خطأ أثناء حذف المصروف");
  } finally {
    commonfunction.showLoading(false);
  }
}

export function setDefaultExpenseDate() {
  const expenseDateInput = document.getElementById("expenseDate");
  if (expenseDateInput) {
    expenseDateInput.valueAsDate = new Date();
  }
}


