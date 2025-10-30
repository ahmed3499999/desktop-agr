import * as admin_invoice from "./adminstorage/admin_invoice.js";
console.log("admin_supplier.js loaded!");

let selectedSupplier = null;
let editingSupplierId = null;

let currentInvoicesPage = 1;
const invoicesPageSize = 4;
let totalInvoices = 0;

let currentImportsPage = 1;
const importsPageSize = 5;
let totalImports = 0;

export function setupSupplierSection() {
  loadSuppliers();
  const addBtn = document.getElementById("addSupplierBtn");
  if (addBtn) {
    const newAddBtn = addBtn.cloneNode(true);
    addBtn.replaceWith(newAddBtn);
    newAddBtn.addEventListener("click", async () => {
      const name = document.getElementById("supplierName").value.trim();
      const contact = document.getElementById("supplierContact").value.trim();
      if (!name) return alert("برجاء كتابة اسم المورد");
      try {
        await addSupplier(name, contact);
        clearSupplierForm();
        loadSuppliers();
      } catch (err) {
        console.error("خطأ في إضافة المورد:", err);
        alert("حدث خطأ أثناء إضافة المورد");
      }
    });
  }
  const addImportBtn = document.getElementById("addImportBtn");
  if (addImportBtn) {
    const newAddImportBtn = addImportBtn.cloneNode(true);
    addImportBtn.replaceWith(newAddImportBtn);
    newAddImportBtn.addEventListener("click", async () => {
      if (!selectedSupplier) return alert("يجب اختيار مورد أولاً");
      const date = document.getElementById("importDate").value;
      const amountPaid = parseFloat(document.getElementById("importAmountPaid").value);
      const note = document.getElementById("importNote").value;
      if (!date || isNaN(amountPaid)) {
        alert("يجب إدخال التاريخ والمبالغ بشكل صحيح");
        return;
      }
      try {
        await addImport(selectedSupplier.id, date, amountPaid, [], note);
        document.getElementById("importDate").value = "";
        document.getElementById("importAmountPaid").value = "";
        document.getElementById("importNote").value = "";
        loadSupplierImports(selectedSupplier.id, selectedSupplier.name);
      } catch (err) {
        console.error("فشل إضافة وارد بدون مكونات:", err);
        alert("حدث خطأ أثناء إضافة الوارد");
      }
    });
  }
  const saveBtn = document.getElementById("saveEditSupplierBtn");
  if (saveBtn) {
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.replaceWith(newSaveBtn);
    newSaveBtn.addEventListener("click", saveEditSupplier);
  }
  window.editSupplier = openEditModal;
  window.viewSupplierImports = loadSupplierImports;
  const importDateEl = document.getElementById("importDate");
  if (importDateEl) {
    importDateEl.value = new Date().toISOString().split("T")[0];
  }
}

function clearSupplierForm() {
  const nameEl = document.getElementById("supplierName");
  const contactEl = document.getElementById("supplierContact");
  if (nameEl) nameEl.value = "";
  if (contactEl) contactEl.value = "";
}

async function loadSuppliers() {
  try {
    const res = await getSuppliers();
    const suppliers = res.data || [];
    const tbody = document.getElementById("suppliersTableBody");
    const emptyMsg = document.getElementById("suppliersEmptyMessage");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (!suppliers.length) {
      if (emptyMsg) emptyMsg.style.display = "block";
      return;
    }
    if (emptyMsg) emptyMsg.style.display = "none";
    suppliers.forEach(supplier => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${supplier.name}</td>
        <td>${supplier.contact_info || "-"}</td>
        <td>
          <button class="view-btn" onclick="viewSupplierImports(${supplier.id}, '${supplier.name}')">
            <i class="fas fa-file-import"></i> الواردات
          </button>
          <button class="edit-btn" onclick="editSupplier(${supplier.id}, '${supplier.name}', '${supplier.contact_info || ""}')">
            <i class="fas fa-edit"></i> تعديل
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("فشل تحميل الموردين:", err);
  }
}

async function loadSupplierImports(supplierId, supplierName, page = 1) {
  try {
    selectedSupplier = { id: supplierId, name: supplierName };
    const offset = (page - 1) * importsPageSize;
    let debt = "0.00";
    try {
      const debtRes = await getSupplierDebt(supplierId);
      debt = debtRes?.data?.debt ?? "0.00";
    } catch (err) {
      console.warn("فشل في جلب مديونية المورد:", err);
    }
    const res = await getSupplierPayments(supplierId, importsPageSize, offset);
    const imports = res?.data?.data || [];
    totalImports = res?.data?.total || imports.length;
    currentImportsPage = page;
    const popup = document.getElementById("supplierImportsPopup");
    if (popup) popup.style.display = "block";
    const nameEl = document.getElementById("selectedSupplierName");
    if (nameEl) {
      nameEl.innerHTML = `${supplierName} <br><small style="color:#d9534f;">المديونية: ${debt}</small>`;
    }
    const tbody = document.getElementById("supplierImportsTableBody");
    const emptyMsg = document.getElementById("importsEmptyMessage");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (!imports.length) {
      if (emptyMsg) emptyMsg.style.display = "block";
    } else {
      if (emptyMsg) emptyMsg.style.display = "none";
      imports.forEach(imp => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${formatDateArabic(imp.date)}</td>
          <td>${imp.amount_paid}</td>
          <td>${imp.note || "-"}</td>
        `;
        tbody.appendChild(tr);
      });
    }
    await loadSupplierInvoicesWithItems(supplierId);
    renderImportsPagination(supplierId);
  } catch (err) {
    console.error("فشل تحميل واردات المورد:", err);
    alert("حدث خطأ أثناء تحميل الواردات");
  }
}

function renderImportsPagination(supplierId) {
  const paginationEl = document.getElementById("importsPagination");
  if (!paginationEl) return;
  const totalPages = Math.ceil(totalImports / importsPageSize);
  paginationEl.innerHTML = "";
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
      btn.addEventListener("click", () => loadSupplierImports(supplierId, selectedSupplier.name, page));
    }
    paginationEl.appendChild(btn);
  };
  createButton("«", currentImportsPage - 1, false, currentImportsPage === 1);
  if (currentImportsPage > 3) {
    createButton("1", 1, currentImportsPage === 1);
    if (currentImportsPage > 4) {
      const span = document.createElement("span");
      span.textContent = "...";
      span.className = "px-2 text-gray-500";
      paginationEl.appendChild(span);
    }
  }
  const startPage = Math.max(1, currentImportsPage - 2);
  const endPage = Math.min(totalPages, currentImportsPage + 2);
  for (let i = startPage; i <= endPage; i++) {
    createButton(i, i, i === currentImportsPage);
  }
  if (currentImportsPage < totalPages - 2) {
    if (currentImportsPage < totalPages - 3) {
      const span = document.createElement("span");
      span.textContent = "...";
      span.className = "px-2 text-gray-500";
      paginationEl.appendChild(span);
    }
    createButton(totalPages, totalPages, currentImportsPage === totalPages);
  }
  createButton("»", currentImportsPage + 1, false, currentImportsPage === totalPages);
}

function openEditModal(id, name, contact) {
  editingSupplierId = id;
  const nameEl = document.getElementById("editSupplierName1");
  const contactEl = document.getElementById("editSupplierContact");
  if (nameEl) nameEl.value = name;
  if (contactEl) contactEl.value = contact;
  const modal = document.getElementById("editSupplierModal");
  if (modal) modal.style.display = "block";
}

async function saveEditSupplier() {
  const name = (document.getElementById("editSupplierName1")?.value || "").trim();
  const contact = (document.getElementById("editSupplierContact")?.value || "").trim();
  if (!name) return alert("يجب إدخال اسم المورد");
  try {
    await updateSupplier(editingSupplierId, name, contact);
    const modal = document.getElementById("editSupplierModal");
    if (modal) modal.style.display = "none";
    loadSuppliers();
  } catch (err) {
    console.error("خطأ في تعديل المورد:", err);
  }
}

// 🔹 دالة لتنسيق التاريخ بالعربي
function formatDateArabic(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

async function loadSupplierInvoicesWithItems(supplierId, page = 1) {
  try {
    const res = await getSupplierImports(supplierId, 100, 0); // نجيب كل الفواتير
    const imports = res?.data || [];
    totalInvoices = imports.length;
    currentInvoicesPage = page;
    const start = (page - 1) * invoicesPageSize;
    const end = start + invoicesPageSize;
    const pagedInvoices = imports.slice(start, end);
    const container = document.getElementById("supplierInvoicesCards");
    if (!container) return;
    container.innerHTML = "";
    if (pagedInvoices.length === 0) {
      container.innerHTML = "<p>لا توجد فواتير لهذا المورد</p>";
      return;
    }
    pagedInvoices.forEach((invoice, idx) => {
      const totalAmount = (invoice.ingredients || []).reduce(
        (sum, item) =>
          sum + Number(item.unit_cost || 0) * Number(item.quantity || 0),
        0
      );
      const card = document.createElement("div");
      card.className = "invoice-card";
      card.innerHTML = `
        <div><strong>فاتورة ${(start + idx) + 1}</strong> - ${formatDateArabic(invoice.date)}</div>
        <div>المبلغ المدفوع: ${invoice.amount_paid}</div>
        <div>عدد الأصناف: ${invoice.ingredients?.length || 0}</div>
        <div>إجمالي التكلفة: ${totalAmount.toFixed(2)}</div>
      `;
      const btn = document.createElement("button");
      btn.textContent = "عرض التفاصيل";
      btn.style.backgroundColor = "#3b82f6";
      btn.style.color = "white";
      btn.style.border = "none";
      btn.style.padding = "5px 10px";
      btn.style.borderRadius = "5px";
      btn.style.cursor = "pointer";
      btn.addEventListener("click", () => {
        admin_invoice.showInvoiceModal(invoice, start + idx);
      });
      card.appendChild(btn);
      container.appendChild(card);
    });
    renderInvoicesPagination(supplierId);
  } catch (err) {
    console.error("خطأ في تحميل فواتير المورد:", err);
  }
}

function renderInvoicesPagination(supplierId) {
  const paginationEl = document.getElementById("invoicesPagination");
  if (!paginationEl) return;
  const totalPages = Math.ceil(totalInvoices / invoicesPageSize);
  paginationEl.innerHTML = "";
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
      btn.addEventListener("click", () => loadSupplierInvoicesWithItems(supplierId, page));
    }
    paginationEl.appendChild(btn);
  };
  createButton("«", currentInvoicesPage - 1, false, currentInvoicesPage === 1);
  if (currentInvoicesPage > 3) {
    createButton("1", 1, currentInvoicesPage === 1);
    if (currentInvoicesPage > 4) {
      const span = document.createElement("span");
      span.textContent = "...";
      span.className = "px-2 text-gray-500";
      paginationEl.appendChild(span);
    }
  }
  const startPage = Math.max(1, currentInvoicesPage - 2);
  const endPage = Math.min(totalPages, currentInvoicesPage + 2);
  for (let i = startPage; i <= endPage; i++) {
    createButton(i, i, i === currentInvoicesPage);
  }
  if (currentInvoicesPage < totalPages - 2) {
    if (currentInvoicesPage < totalPages - 3) {
      const span = document.createElement("span");
      span.textContent = "...";
      span.className = "px-2 text-gray-500";
      paginationEl.appendChild(span);
    }
    createButton(totalPages, totalPages, currentInvoicesPage === totalPages);
  }
  createButton("»", currentInvoicesPage + 1, false, currentInvoicesPage === totalPages);
}

function closeSupplierImportsPopup() {
  document.getElementById('supplierImportsPopup').style.display = 'none';
}

function closeEditSupplierModal() {
  document.getElementById('editSupplierModal').style.display = 'none';
}

window.closeEditSupplierModal = closeEditSupplierModal;
window.closeSupplierImportsPopup = closeSupplierImportsPopup;
