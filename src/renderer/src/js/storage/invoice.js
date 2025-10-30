import * as commonfunction from "../commonfunction.js"
import * as item from "./item.js"
console.log("invoice.js loaded")

export let currentInvoiceItems = []
let currentPage = 1
const pageSize = 12 // عدد الفواتير في كل صفحة
let totalInvoicesCount = 0; // متغير لحفظ إجمالي عدد الفواتير

export function getCurrentInvoiceItems() {
  return currentInvoiceItems
}

export function setCurrentInvoiceItems(items) {
  currentInvoiceItems = items
}

function populateSupplierSelect() {
  const mainSelect = document.getElementById("supplierName")
  const otherSupplierDiv = document.getElementById("otherSupplierContainer")
  const otherSupplierSelect = document.getElementById("otherSupplierSelect")
  mainSelect.innerHTML = `
    <option value="" disabled selected>اختر المورد</option>
    <option value="main">المخزن الرئيسي</option>
    <option value="other">مورد آخر</option>
  `
  mainSelect.addEventListener("change", () => {
    const priceInput = document.getElementById("invoiceItemPrice");
    if (mainSelect.value === "main") {
        priceInput.value = 0;
        priceInput.readOnly = true;
    } else {
        priceInput.readOnly = false;
    }
  });
}

let supplierChangeListenerAttached = false;

export function createNewInvoice() {
  const importContent = document.getElementById("importContent");
  if (importContent && importContent.style.display === "none") {
    importContent.style.display = "block"; // افتح التبويب لو كان مقفول
  }
  const invoiceForm = document.getElementById("invoiceForm");
  const createBtn = document.getElementById("createNewInvoiceBtn");
  if (!invoiceForm || !createBtn) {
    console.error("❌ عناصر الفاتورة غير موجودة في DOM");
    commonfunction.showMessage("error", "عناصر الفاتورة غير موجودة");
    return;
  }
  const supplierSelect = document.getElementById("supplierName");
  const otherSupplierContainer = document.getElementById("otherSupplierContainer");
  const otherSupplierSelect = document.getElementById("otherSupplierSelect");
  invoiceForm.style.display = "block";
  createBtn.style.display = "none";
  const today = new Date().toISOString().split("T")[0];
  const invoiceDateInput = document.getElementById("invoiceDate");
  if (invoiceDateInput) invoiceDateInput.value = today;
  currentInvoiceItems = [];
  renderInvoiceItems();
  updateInvoiceTotal();
  if (supplierSelect) supplierSelect.value = "";
  if (otherSupplierContainer) otherSupplierContainer.style.display = "none";
  if (otherSupplierSelect) {
    otherSupplierSelect.innerHTML = '<option value="" disabled selected>اختر المورد</option>';
  }
  populateSupplierSelect();
  commonfunction.showMessage("info", "تم إنشاء فاتورة جديدة");
}

export function renderInvoiceItems() {
  const invoiceItemsBody = document.getElementById("invoiceItemsBody")
  const noInvoiceItemsMsg = document.getElementById("noInvoiceItemsMsg")
  if (!invoiceItemsBody || !noInvoiceItemsMsg) {
    console.log("عناصر جدول الفاتورة غير موجودة")
    return
  }
  invoiceItemsBody.innerHTML = ""
  if (currentInvoiceItems.length === 0) {
    noInvoiceItemsMsg.style.display = "block"
    return
  }
  noInvoiceItemsMsg.style.display = "none"
  currentInvoiceItems.forEach((item, index) => {
    const row = document.createElement("tr")
    row.innerHTML = `
    <td>${item.itemName}</td>
    <td>${item.unit}</td>
    <td>${item.quantity}</td>
    <td>${item.price.toFixed(2)}</td>
    <td>${item.total.toFixed(2)}</td>
    <td>
    <button class="delete-btn red-btn" onclick="invoice.removeItemFromInvoice(${index})">
      <i class="fas fa-trash"></i> حذف
    </button>
    </td>
    `
    invoiceItemsBody.appendChild(row)
  })
}

export function updateInvoiceTotal() {
  const total = currentInvoiceItems.reduce((sum, item) => sum + item.total, 0)
  const invoiceTotalElement = document.getElementById("invoiceTotal")
  if (invoiceTotalElement) {
    invoiceTotalElement.textContent = total.toFixed(2)
  }
}

// ✅ دالة جديدة لتحميل الفواتير مع Pagination
export async function loadSavedInvoices(page = 1) {
  try {
    commonfunction.showLoading(true);
    currentPage = page;
    const offset = (page - 1) * pageSize;

    const response = await getImports(pageSize, offset);

    if (response && response.data) {
      const invoices = response.data.data || [];
      let total = 0;

      if (typeof response.data.total === "number") {
        total = response.data.total;
        totalInvoicesCount = total; // حفظ إجمالي عدد الفواتير
      } else if (
        typeof response.data.total === "object" &&
        response.data.total !== null
      ) {
        const values = Object.values(response.data.total);
        total = values.length > 0 ? parseInt(values[0]) : 0;
        totalInvoicesCount = total; // حفظ إجمالي عدد الفواتير
      }

      renderSavedInvoices(invoices, total);
      renderPagination(total, page, pageSize);
    } else {
      renderSavedInvoices([]);
      renderPagination(0, 1, pageSize);
    }
  } catch (error) {
    console.error("❌ Error loading invoices:", error);
    commonfunction.showMessage("error", "حدث خطأ في تحميل الفواتير");
  } finally {
    commonfunction.showLoading(false);
  }
}

// ✅ دالة لعرض أزرار Pagination
function renderPagination(total, currentPage, pageSize) {
  const pagination = document.getElementById("invoicesPagination");
  if (!pagination) return;

  pagination.innerHTML = "";
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return;

  // helper: زرار
  const createButton = (label, page, active = false, disabled = false) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.className =
      "px-3 py-1 mx-1 border rounded transition " +
      (active ? "bg-blue-500 text-white font-bold" : "bg-white text-black hover:bg-gray-100");

    if (disabled) {
      btn.disabled = true;
      btn.classList.add("opacity-50", "cursor-not-allowed");
    } else {
      btn.addEventListener("click", () => loadSavedInvoices(page));
    }

    pagination.appendChild(btn);
  };

  // Previous
  createButton("«", currentPage - 1, false, currentPage === 1);

  // أول صفحة
  if (currentPage > 3) {
    createButton("1", 1, currentPage === 1);
    if (currentPage > 4) {
      const span = document.createElement("span");
      span.textContent = "...";
      span.className = "px-2 text-gray-500";
      pagination.appendChild(span);
    }
  }

  // الصفحات القريبة من الحالية
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  for (let i = startPage; i <= endPage; i++) {
    createButton(i, i, i === currentPage);
  }

  // آخر صفحة
  if (currentPage < totalPages - 2) {
    if (currentPage < totalPages - 3) {
      const span = document.createElement("span");
      span.textContent = "...";
      span.className = "px-2 text-gray-500";
      pagination.appendChild(span);
    }
    createButton(totalPages, totalPages, currentPage === totalPages);
  }

  // Next
  createButton("»", currentPage + 1, false, currentPage === totalPages);
}

// ✅ تعديل دالة renderSavedInvoices لاستخدام الأرقام المسلسلة
export function renderSavedInvoices(invoices, total) {
  console.log("عرض الفواتير المحفوظة")
  const importContent = document.getElementById("importContent")
  if (!importContent || importContent.style.display === "none") {
    console.log("تبويب الوارد غير مفتوح - تأجيل عرض الفواتير")
    return
  }
  const savedInvoicesList = document.getElementById("savedInvoicesList")
  const noInvoicesMsg = document.getElementById("noInvoicesMsg")
  if (!savedInvoicesList || !noInvoicesMsg) {
    console.log("عناصر الفواتير غير موجودة في DOM")
    return
  }

  savedInvoicesList.innerHTML = ""
  if (!Array.isArray(invoices) || invoices.length === 0) {
    console.log("لا توجد فواتير لعرضها")
    noInvoicesMsg.style.display = "block"
    return
  }
  noInvoicesMsg.style.display = "none"
  
  // حساب الرقم المسلسل الأول بناءً على إجمالي عدد الفواتير والصفحة الحالية
  const startSerialNumber = total - ((currentPage - 1) * pageSize);
  
  invoices.forEach((invoice, index) => {
    let supplierName = "غير معروف"
    if (invoice.supplier_id == 1) supplierName = "مورد آخر"
    else if (invoice.supplier_id == 2) supplierName = "المخزن الرئيسي"
    const totalAmount = invoice.ingredients.reduce((sum, item) => {
      return sum + Number(item.unit_cost || 0) * Number(item.quantity || 0)
    }, 0)
    
    // حساب الرقم المسلسل (ينقص تدريجياً)
    const serialNumber = startSerialNumber - index;
    
    const invoiceCard = document.createElement("div")
    invoiceCard.className = "invoice-card"
    invoiceCard.innerHTML = `
      <div class="invoice-card-header">
        <div class="invoice-number">فاتورة ${serialNumber}</div>
        <div class="invoice-date">${commonfunction.formatArabicDate(invoice.date)}</div>
      </div>
      <div class="invoice-card-body">
        <div class="invoice-info-item">
          <div class="invoice-info-label">المورد</div>
          <div class="invoice-info-value">${supplierName}</div>
        </div>
        <div class="invoice-info-item">
          <div class="invoice-info-label">عدد العناصر</div>
          <div class="invoice-info-value">${invoice.ingredients.length}</div>
        </div>
        <div class="invoice-info-item">
          <div class="invoice-info-label">المجموع الكلي</div>
          <div class="invoice-info-value">${totalAmount.toFixed(2)}</div>
        </div>
      </div>
      <div class="invoice-card-actions">
        <button class="view-btn" onclick="invoice.viewInvoiceDetails(${invoice.id || index}, ${serialNumber})">
          <i class="fas fa-eye"></i> عرض التفاصيل
        </button>
      </div>
    `
    savedInvoicesList.appendChild(invoiceCard)
  })
}

// ✅ تصحيح دالة viewInvoiceDetails لتمرير الرقم المسلسل
export async function viewInvoiceDetails(invoiceId, serialNumber) {
  try {
    commonfunction.showLoading(true);
    // جلب جميع الفواتير بدون pagination للعثور على الفاتورة المحددة
    const response = await getImports(1000, 0); // جلب عدد كبير من الفواتير
    if (response && response.data && response.data.data) {
      const invoice = response.data.data.find(inv => inv.id === invoiceId);
      if (!invoice) {
        commonfunction.showMessage("error", "لم يتم العثور على الفاتورة");
        return;
      }
      showInvoiceModal(invoice, invoiceId, serialNumber);
    }
  } catch (error) {
    console.error("Error loading invoice details:", error);
    commonfunction.showMessage("error", "حدث خطأ أثناء تحميل تفاصيل الفاتورة");
  } finally {
    commonfunction.showLoading(false);
  }
}

// ✅ تعديل دالة showInvoiceModal لإظهار الرقم المسلسل
export async function showInvoiceModal(invoice, invoiceId, serialNumber) {
  const modal = document.getElementById("invoiceDetailsModal")
  const modalContent = document.getElementById("invoiceDetailsContent")
  try {
    commonfunction.showLoading(true)
    let supplierName = "غير معروف"
    if (invoice.supplier_id == 1) supplierName = "مورد آخر"
    else if (invoice.supplier_id == 2) supplierName = "المخزن الرئيسي"
    const totalAmount = invoice.ingredients.reduce((sum, item) => {
      return sum + Number(item.unit_cost || 0) * Number(item.quantity || 0)
    }, 0)
    const itemsTable = invoice.ingredients
      .map((item) => {
        const ingredient = item.ingredient || {
          name: "غير معروف",
          unit: "غير معروف",
        }
        const itemQuantity = Number(item.quantity || 0)
        const itemUnitCost = Number(item.unit_cost || 0)
        const itemTotal = itemQuantity * itemUnitCost
        return `
          <tr>
            <td>${ingredient.name || "غير معروف"}</td>
            <td>${ingredient.unit || "غير معروف"}</td>
            <td>${itemQuantity}</td>
            <td>${itemUnitCost.toFixed(2)}</td>
            <td>${itemTotal.toFixed(2)}</td>
          </tr>
        `
      })
      .join("")
    const paidAmount = Number(invoice.amount_paid || 0)
    const remainingAmount = totalAmount - paidAmount
    const notes = invoice.note?.trim() || "لا توجد ملاحظات"
    modalContent.innerHTML = `
      <div class="invoice-details-section">
        <div class="invoice-details-header">
          <h4>فاتورة رقم ${serialNumber}</h4>
        </div>
        <div class="invoice-details-grid">
          <div class="detail-item">
            <div class="detail-label">التاريخ</div>
            <div class="detail-value">${commonfunction.formatArabicDate(invoice.date)}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">المورد</div>
            <div class="detail-value">${supplierName}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">عدد العناصر</div>
            <div class="detail-value">${invoice.ingredients.length}</div>
          </div>
        </div>
      </div>
      <div class="invoice-items-section">
        <h4><i class="fas fa-list"></i> عناصر الفاتورة</h4>
        <table class="modal-table">
          <thead>
            <tr>
              <th>الصنف</th>
              <th>الوحدة</th>
              <th>الكمية</th>
              <th>سعر الوحدة</th>
              <th>المجموع</th>
            </tr>
          </thead>
          <tbody>
            ${itemsTable}
          </tbody>
        </table>
      </div>
      <div class="invoice-summary">
        <div class="summary-row">
          <span>المجموع الكلي:</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
      </div>
    `
    modal.style.display = "flex"
  } catch (error) {
    console.log("خطأ في showInvoiceModal:", error)
    commonfunction.showMessage("error", "حدث خطأ أثناء عرض تفاصيل الفاتورة")
  } finally {
    commonfunction.showLoading(false)
  }
}

export function closeInvoiceModal() {
  const modal = document.getElementById("invoiceDetailsModal")
  modal.style.display = "none"
}

export function addItemToInvoice() {
  console.log("إضافة عنصر للفاتورة")
  const itemSelectElement = document.getElementById("invoiceItemSelect")
  const quantityElement = document.getElementById("invoiceItemQuantity")
  const priceElement = document.getElementById("invoiceItemPrice")
  if (!itemSelectElement || !quantityElement || !priceElement) {
    commonfunction.showMessage("error", "عناصر النموذج غير موجودة")
    return
  }

  const itemId = itemSelectElement.value
  const selectedItem = commonfunction.getItems().find((i) => i.id == itemId)
  const quantity = parseFloat(quantityElement.value.trim())
  let price = parseFloat(priceElement.value.trim())

  const supplierElement = document.getElementById("supplierName")
  const isMainSupplier = supplierElement && supplierElement.value === "main"

  // إذا المخزن الرئيسي، نجبر السعر على 0
  if (isMainSupplier) price = 0

  if (!itemId || isNaN(quantity) || quantity <= 0 || isNaN(price) || (!isMainSupplier && price <= 0)) {
    commonfunction.showMessage("warning", "يرجى ملء جميع الحقول المطلوبة بشكل صحيح")
    return
  }

  const existingItemIndex = currentInvoiceItems.findIndex((invItem) => invItem.itemId == itemId)
  if (existingItemIndex !== -1) {
    currentInvoiceItems[existingItemIndex].quantity += quantity
    currentInvoiceItems[existingItemIndex].total =
      currentInvoiceItems[existingItemIndex].quantity * currentInvoiceItems[existingItemIndex].price
  } else {
    const invoiceItem = {
      itemId: itemId,
      itemName: selectedItem.name,
      unit: selectedItem.unit,
      quantity: quantity,
      price: price,
      total: quantity * price,
    }
    currentInvoiceItems.push(invoiceItem)
  }

  renderInvoiceItems()
  updateInvoiceTotal()

  const itemUnit = document.getElementById("invoiceItemUnit")
  const clearBtn = document.getElementById("clearInvoiceItemBtn")
  if (itemSelectElement) itemSelectElement.value = ""
  if (itemUnit) itemUnit.value = ""
  if (quantityElement) quantityElement.value = ""
  if (priceElement) priceElement.value = ""
  if (clearBtn) clearBtn.disabled = true

  commonfunction.showMessage("success", "تم إضافة العنصر للفاتورة")
}

export function removeItemFromInvoice(index) {
  commonfunction.showConfirm("هل أنت متأكد من حذف هذا العنصر من الفاتورة؟").then((confirmed) => {
    if (confirmed) {
      currentInvoiceItems.splice(index, 1)
      renderInvoiceItems()
      updateInvoiceTotal()
      commonfunction.showMessage("success", "تم حذف العنصر من الفاتورة")
    }
  })
}

export function cancelInvoice() {
  console.log("إلغاء الفاتورة")
  const invoiceForm = document.getElementById("invoiceForm")
  const createBtn = document.getElementById("createNewInvoiceBtn")
  commonfunction.showConfirm("هل أنت متأكد من إلغاء الفاتورة؟").then((confirmed) => {
    if (confirmed) {
      if (invoiceForm) invoiceForm.style.display = "none"
      if (createBtn) createBtn.style.display = "block"
      const itemSelect = document.getElementById("invoiceItemSelect")
      const itemUnit = document.getElementById("invoiceItemUnit")
      const itemQuantity = document.getElementById("invoiceItemQuantity")
      const itemPrice = document.getElementById("invoiceItemPrice")
      if (itemSelect) itemSelect.value = ""
      if (itemUnit) itemUnit.value = ""
      if (itemQuantity) itemQuantity.value = ""
      if (itemPrice) itemPrice.value = ""
      currentInvoiceItems = []
      renderInvoiceItems()
      commonfunction.showMessage("info", "تم إلغاء الفاتورة")
    }
  })
}

export async function saveInvoice() {
  console.log("حفظ الفاتورة - بدء العملية")
  const dateElement = document.getElementById("invoiceDate")
  const supplierElement = document.getElementById("supplierName")
  const totalElement = document.getElementById("invoiceTotal")
  const notesElement = document.getElementById("invoiceNotes") // 🟡 جديد
  if (!dateElement || !supplierElement || !totalElement) {
    console.error("Required form elements not found:", {
      dateElement: !!dateElement,
      supplierElement: !!supplierElement,
      totalElement: !!totalElement,
    })
    commonfunction.showMessage("error", "خطأ في النموذج - العناصر المطلوبة غير موجودة")
    return
  }
  const date = dateElement.value
  let supplierId = "";
  if (supplierElement.value === "main") {
      supplierId = 2; // المخزن الرئيسي
  } else if (supplierElement.value === "other") {
      supplierId = 1; // مورد آخر
  }
  const total = Number.parseFloat(totalElement.textContent) || 0
  const notes = notesElement ? notesElement.value.trim() : "" // 🟡 جديد
  console.log("🔍 فحص قيم الفاتورة قبل الحفظ:", {
      date: date || "(فارغ)",
      supplierId: supplierId || "(فارغ)",
      total,
      notes: notes || "(فارغ)",
      itemsCount: currentInvoiceItems.length,
      items: currentInvoiceItems,
  });
  if (!date || !supplierId || currentInvoiceItems.length === 0) {
    console.log("فشل في التحقق من الشروط:", {
      hasDate: !!date,
      hasSupplierId: !!supplierId,
      hasItems: currentInvoiceItems.length > 0,
    })
    commonfunction.showMessage("warning", "يرجى ملء جميع الحقول المطلوبة وإضافة عناصر للفاتورة")
    return
  }
  try {
    commonfunction.showLoading(true)
    const ingredients = currentInvoiceItems.map((item) => ({
      ingredient_id: item.itemId,
      unit_cost: item.price,
      quantity: item.quantity,
    }))
    console.log("بيانات الفاتورة:", {
      supplierId,
      date,
      paidAmount: 0,
      total,
      notes,
      ingredientsCount: ingredients.length,
    })
    const importResponse = await addImport(supplierId, date, 0, ingredients, notes) // ✅ ملاحظات مضافة
    if (importResponse.data && importResponse.data.id) {
      commonfunction.showMessage("success", "تم حفظ الفاتورة بنجاح وتحديث كميات الأصناف")
      const invoiceForm = document.getElementById("invoiceForm")
      const createBtn = document.getElementById("createNewInvoiceBtn")
      if (invoiceForm) invoiceForm.style.display = "none"
      if (createBtn) createBtn.style.display = "block"
      currentInvoiceItems = []
      renderInvoiceItems()
      await item.loadItems()
      await loadSavedInvoices(1) // ✅ تحميل الصفحة الأولى بعد الحفظ
    }
  } catch (error) {
    console.error("Error saving invoice:", error)
    commonfunction.showMessage("error", "حدث خطأ أثناء حفظ الفاتورة: " + (error.message || "خطأ غير معروف"))
  } finally {
    commonfunction.showLoading(false)
  }
}

export function handleInvoiceItemSelect() {
  const select = document.getElementById("invoiceItemSelect")
  const selectedItem = commonfunction.getItems().find((item) => item.id == select.value)
  if (selectedItem) {
    document.getElementById("invoiceItemUnit").value = selectedItem.unit
    document.getElementById("clearInvoiceItemBtn").disabled = false
  }
}

export function clearInvoiceItemSelection() {
  document.getElementById("invoiceItemSelect").value = ""
  document.getElementById("invoiceItemUnit").value = ""
  document.getElementById("clearInvoiceItemBtn").disabled = true
}

export async function updateInvoiceItemsList() {
  const invoiceItemSelect = document.getElementById("invoiceItemSelect")
  if (!invoiceItemSelect) {
    console.log("قائمة الأصناف غير موجودة")
    return
  }
  try {
    commonfunction.showLoading(true)
    const response = await getIngredients()
    if (response.data) {
      commonfunction.setItems(response.data)
      invoiceItemSelect.innerHTML = '<option value="" disabled selected>اختر الصنف</option>'
      response.data.forEach((item) => {
        const option = document.createElement("option")
        option.value = item.id
        option.textContent = item.name
        option.dataset.unit = item.unit
        invoiceItemSelect.appendChild(option)
      })
    }
  } catch (error) {
    console.error("Error updating invoice items list:", error)
    commonfunction.showMessage("error", "حدث خطأ أثناء تحميل قائمة الأصناف")
  } finally {
    commonfunction.showLoading(false)
  }
}

window.invoice = {
  removeItemFromInvoice,
  loadSavedInvoices, // ✅ إضافة الدالة الجديدة للـ window object
  viewInvoiceDetails // ✅ إضافة هذه الدالة أيضًا
}