import * as commonfunction from "./commonfunction.js"
import * as invoice from "../../storage/invoice.js"
console.log("admin_invoice.js loaded")

let suppliersList = []
let invoiceItems = []

async function loadSuppliers() {
  try {
    const select = document.getElementById("editSupplierName")
    if (!select) return
    const response = await getSuppliers()
    suppliersList = response.data || []
    select.innerHTML = `<option value="" disabled selected>اختر المورد</option>`
    suppliersList.forEach((supplier) => {
      const option = document.createElement("option")
      option.value = supplier.id
      option.textContent = supplier.name
      select.appendChild(option)
    })
  } catch (error) {
    console.error("خطأ أثناء تحميل الموردين:", error)
    commonfunction.showMessage("error", "فشل في تحميل الموردين")
  }
}

function getSupplierNameById(id) {
  const supplier = suppliersList.find(s => s.id === id)
  return supplier ? supplier.name : "غير معروف"
}

async function loadInvoiceItems() {
  try {
    const select = document.getElementById("invoiceItemSelect")
    if (!select) return
    const response = await getIngredients()
    const ingredients = response.data || []
    invoiceItems = ingredients
    select.innerHTML = `<option value="" disabled selected>اختر الصنف</option>`
    ingredients.forEach((ingredient) => {
      const option = document.createElement("option")
      option.value = ingredient.id
      option.textContent = ingredient.name
      option.dataset.unit = ingredient.unit
      select.appendChild(option)
    })
    commonfunction.setItems(ingredients)
  } catch (error) {
    console.error("خطأ أثناء تحميل الأصناف:", error)
    commonfunction.showMessage("error", "فشل في تحميل الأصناف")
  }
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
  const quantity = Number.parseFloat(quantityElement.value.trim())
  const price = Number.parseFloat(priceElement.value.trim())
  const item = invoiceItems.find((i) => i.id == itemId)
const supplierSelect = document.getElementById("editSupplierName");
const supplierId = supplierSelect ? supplierSelect.value : null;
if (
  !itemId ||
  !item ||
  isNaN(quantity) ||
  quantity <= 0 ||
  isNaN(price) ||
  (price <= 0 && supplierId != "2")
) {
  commonfunction.showMessage("warning", "يرجى ملء جميع الحقول المطلوبة بشكل صحيح");
  return;
}
  const currentInvoiceItems = invoice.getCurrentInvoiceItems()
  const existingItemIndex = currentInvoiceItems.findIndex((invItem) => invItem.itemId == itemId)
  if (existingItemIndex !== -1) {
    currentInvoiceItems[existingItemIndex].quantity += quantity
    currentInvoiceItems[existingItemIndex].total =
      currentInvoiceItems[existingItemIndex].quantity * currentInvoiceItems[existingItemIndex].price
  } else {
    const invoiceItem = {
      itemId: itemId,
      itemName: item.name,
      unit: item.unit,
      quantity: quantity,
      price: price,
      total: quantity * price,
    }
    currentInvoiceItems.push(invoiceItem)
  }
  invoice.setCurrentInvoiceItems(currentInvoiceItems)
  invoice.renderInvoiceItems()
  invoice.updateInvoiceTotal()
  const itemUnit = document.getElementById("invoiceItemUnit")
  const clearBtn = document.getElementById("clearInvoiceItemBtn")
  if (itemSelectElement) itemSelectElement.value = ""
  if (itemUnit) itemUnit.value = ""
  if (quantityElement) quantityElement.value = ""
  if (priceElement) priceElement.value = ""
  if (clearBtn) clearBtn.disabled = true
  commonfunction.showMessage("success", "تم إضافة العنصر للفاتورة")
  setTimeout(calculateRemainingAmount, 100)
}

export function handleInvoiceItemSelect() {
  const select = document.getElementById("invoiceItemSelect")
  const selectedItem = invoiceItems.find((item) => item.id == select.value)
  if (selectedItem) {
    document.getElementById("invoiceItemUnit").value = selectedItem.unit
    const clearBtn = document.getElementById("clearInvoiceItemBtn")
    if (clearBtn) {
      clearBtn.disabled = false
    }
  }
}

export function calculateRemainingAmount() {
  const totalElement = document.getElementById("invoiceTotal")
  const paidAmountElement = document.getElementById("invoicePaidAmount")
  const remainingElement = document.getElementById("invoiceRemainingAmount")
  if (!totalElement || !paidAmountElement || !remainingElement) return
  const total = Number.parseFloat(totalElement.textContent) || 0
  let paidAmount = Number.parseFloat(paidAmountElement.value) || 0
    if (paidAmount > total) {
    paidAmount = total
    paidAmountElement.value = paidAmount.toFixed(2)
    commonfunction.showMessage("warning", "المبلغ المدفوع لا يمكن أن يكون أكبر من المجموع الكلي")
  }
  const remaining = total - paidAmount
  remainingElement.textContent = remaining.toFixed(2)
  if (remaining < 0) {
    remainingElement.style.color = "red"
  } else if (remaining === 0) {
    remainingElement.style.color = "green"
  } else {
    remainingElement.style.color = "orange"
  }
}

export async function saveInvoice() {
  console.log("حفظ الفاتورة - بدء العملية")
  const dateElement = document.getElementById("invoiceDate")
  const supplierElement = document.getElementById("editSupplierName")
  const totalElement = document.getElementById("invoiceTotal")
  const paidAmountElement = document.getElementById("invoicePaidAmount")
  const notesElement = document.getElementById("invoiceNotes")
  if (!dateElement || !supplierElement || !totalElement || !paidAmountElement) {
    commonfunction.showMessage("error", "خطأ في النموذج - العناصر المطلوبة غير موجودة")
    return
  }
  const date = dateElement.value
  const supplierRawValue = supplierElement.value
  const supplierId = supplierRawValue === "main" ? null : parseInt(supplierRawValue)
  const total = Number.parseFloat(totalElement.textContent) || 0
  const paidAmount = Number.parseFloat(paidAmountElement.value) || 0
  const notes = notesElement.value.trim() || ""
  const currentInvoiceItems = invoice.getCurrentInvoiceItems()
  if (!date || supplierRawValue === "" || currentInvoiceItems.length === 0) {
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
    const importResponse = await addImport(supplierId, date, paidAmount, ingredients, notes)
    if (importResponse.data && importResponse.data.id) {
      commonfunction.showMessage("success", "تم حفظ الفاتورة بنجاح وتحديث كميات الأصناف")
      const invoiceForm = document.getElementById("invoiceForm")
      const createBtn = document.getElementById("createNewInvoiceBtn")
      if (invoiceForm) invoiceForm.style.display = "none"
      if (createBtn) createBtn.style.display = "block"
      invoice.setCurrentInvoiceItems([])
      invoice.renderInvoiceItems()
      paidAmountElement.value = ""
      calculateRemainingAmount()
      await renderSavedInvoices()
    }
  } catch (error) {
    console.error("Error saving invoice:", error)
    commonfunction.showMessage("error", "حدث خطأ أثناء حفظ الفاتورة: " + (error.message || "خطأ غير معروف"))
  } finally {
    commonfunction.showLoading(false)
  }
}

export function startNewInvoice() {
  console.log("إنشاء فاتورة جديدة")
  const invoiceForm = document.getElementById("invoiceForm")
  const createBtn = document.getElementById("createNewInvoiceBtn")
  const supplierSelect = document.getElementById("supplierName")
  const otherSupplierContainer = document.getElementById("otherSupplierContainer")
  const otherSupplierSelect = document.getElementById("otherSupplierSelect")
  invoiceForm.style.display = "block"
  createBtn.style.display = "none"
  const today = new Date().toISOString().split("T")[0]
  document.getElementById("invoiceDate").value = today
  invoice.setCurrentInvoiceItems([])
  invoice.renderInvoiceItems()
  invoice.updateInvoiceTotal()
  supplierSelect.value = ""
  otherSupplierContainer.style.display = "none"
  otherSupplierSelect.innerHTML = '<option value="" disabled selected>اختر المورد</option>'
  supplierSelect.onchange = async function () {
    if (this.value === "other") {
      otherSupplierContainer.style.display = "block"
      otherSupplierSelect.innerHTML = '<option value="" disabled selected>جاري التحميل...</option>'
      try {
        const response = await getSuppliers()
        otherSupplierSelect.innerHTML = '<option value="" disabled selected>اختر المورد</option>'
        response.data.forEach((supplier) => {
          const option = document.createElement("option")
          option.value = supplier.id
          option.textContent = supplier.name
          otherSupplierSelect.appendChild(option)
        })
      } catch (error) {
        console.error("فشل تحميل الموردين:", error)
        commonfunction.showMessage("error", "حدث خطأ أثناء تحميل الموردين")
      }
    } else {
      otherSupplierContainer.style.display = "none"
    }
  }
  commonfunction.showMessage("info", "تم إنشاء فاتورة جديدة")
}

export function cancelInvoice() {
  console.log("إلغاء الفاتورة")
  const invoiceForm = document.getElementById("invoiceForm")
  const createBtn = document.getElementById("createNewInvoiceBtn")
  const paidAmountElement = document.getElementById("invoicePaidAmount")
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
      if (paidAmountElement) paidAmountElement.value = ""
      invoice.setCurrentInvoiceItems([])
      invoice.renderInvoiceItems()
      calculateRemainingAmount()
      commonfunction.showMessage("info", "تم إلغاء الفاتورة")
    }
  })
}

export function clearInvoiceItemSelection() {
  document.getElementById("invoiceItemSelect").value = ""
  document.getElementById("invoiceItemUnit").value = ""
  document.getElementById("clearInvoiceItemBtn").disabled = true
}

export async function setupInvoiceSection() {
  console.log("إعداد قسم الفواتير")
  await loadSuppliers()
  await loadInvoiceItems()
  await renderSavedInvoices()
  const createNewInvoiceBtn = document.getElementById("createNewInvoiceBtn")
  if (createNewInvoiceBtn) createNewInvoiceBtn.onclick = startNewInvoice
  const addItemBtn = document.getElementById("addItemToInvoiceBtn")
  if (addItemBtn) addItemBtn.onclick = addItemToInvoice
  const saveInvoiceBtn = document.getElementById("saveInvoiceBtn")
  if (saveInvoiceBtn) saveInvoiceBtn.onclick = saveInvoice
  const cancelInvoiceBtn = document.getElementById("cancelInvoiceBtn")
  if (cancelInvoiceBtn) cancelInvoiceBtn.onclick = cancelInvoice
  const invoiceItemSelect = document.getElementById("invoiceItemSelect")
  if (invoiceItemSelect) invoiceItemSelect.onchange = handleInvoiceItemSelect
  const clearInvoiceItemBtn = document.getElementById("clearInvoiceItemBtn")
  if (clearInvoiceItemBtn) clearInvoiceItemBtn.onclick = clearInvoiceItemSelection
  const closeModalBtn = document.getElementById("closeInvoiceModalBtn")
  if (closeModalBtn) closeModalBtn.onclick = invoice.closeInvoiceModal
  const modal = document.getElementById("invoiceDetailsModal")
  if (modal) {
    modal.onclick = (e) => {
      if (e.target === modal) invoice.closeInvoiceModal()
    }
  }
  const paidAmountElement = document.getElementById("invoicePaidAmount")
  if (paidAmountElement) {
    paidAmountElement.addEventListener("input", calculateRemainingAmount)
  }
  const supplierSelect = document.getElementById("editSupplierName");
  if (supplierSelect) {
    supplierSelect.onchange = () => {
      handleSupplierChangeLockPrice();
    };
    handleSupplierChangeLockPrice();
  }
  console.log("تم إعداد قسم الفواتير بنجاح")
}


export async function viewInvoiceDetails(invoiceIndex) {
  try {
    commonfunction.showLoading(true);
    const offset = (currentPage - 1) * pageSize;
    const response = await getImports(pageSize, offset);
    const invoices = response.data?.data || [];
    const filteredInvoices = invoices.filter(inv => inv.ingredients && inv.ingredients.length > 0);
    const invoice = filteredInvoices[invoiceIndex];
    if (!invoice) {
      commonfunction.showMessage("error", "الفاتورة غير موجودة");
      return;
    }
    const globalIndex = offset + invoiceIndex;
    showInvoiceModal(invoice, globalIndex);
  } catch (error) {
    console.error("Error loading invoice details:", error);
    commonfunction.showMessage("error", "حدث خطأ أثناء تحميل تفاصيل الفاتورة");
  } finally {
    commonfunction.showLoading(false);
  }
}

let currentPage = 1;
let pageSize = 12;
let totalItems = 0;

export async function renderSavedInvoices(page = 1) {
  console.log("عرض الفواتير المحفوظة - صفحة:", page);
  const importContent = document.getElementById("importContent");
  if (!importContent || importContent.style.display === "none") {
    console.log("تبويب الوارد غير مفتوح - تأجيل عرض الفواتير");
    return;
  }
  const savedInvoicesList = document.getElementById("savedInvoicesList");
  const noInvoicesMsg = document.getElementById("noInvoicesMsg");
  if (!savedInvoicesList || !noInvoicesMsg) {
    console.log("عناصر الفواتير غير موجودة في DOM");
    return;
  }
  try {
    commonfunction.showLoading(true);
    currentPage = page;
    const offset = (page - 1) * pageSize;
    const response = await getImports(pageSize, offset);
    const invoices = response.data?.data || [];
    const total = response.data?.total || 0;
    totalItems = typeof total === "number" ? total : invoices.length;
    const filteredInvoices = invoices.filter(inv => inv.ingredients && inv.ingredients.length > 0);
    savedInvoicesList.innerHTML = "";
    if (filteredInvoices.length === 0) {
      console.log("لا توجد فواتير لعرضها");
      noInvoicesMsg.style.display = "block";
      return;
    }
    noInvoicesMsg.style.display = "none";
    const startingSerialNumber = totalItems - (page - 1) * pageSize;
    filteredInvoices.forEach((invoice, index) => {
      let supplierName = getSupplierNameById(invoice.supplier_id);
      const totalAmount = invoice.ingredients.reduce((sum, item) => {
        return sum + Number(item.unit_cost || 0) * Number(item.quantity || 0);
      }, 0);
      const invoiceCard = document.createElement("div");
      invoiceCard.className = "invoice-card";
      invoiceCard.innerHTML = `
        <div class="invoice-card-header">
          <div class="invoice-number">فاتورة ${startingSerialNumber - index}</div>
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
          <button class="view-btn" onclick="admin_invoice.viewInvoiceDetails(${index})">
            <i class="fas fa-eye"></i> عرض التفاصيل
          </button>
        </div>
      `;
      savedInvoicesList.appendChild(invoiceCard);
    });
    renderPagination(page);
  } catch (error) {
    console.error("Error loading invoices:", error);
    commonfunction.showMessage("error", "حدث خطأ أثناء تحميل الفواتير");
  } finally {
    commonfunction.showLoading(false);
  }
}

function renderPagination(activePage) {
  const paginationContainer = document.getElementById("paginationContainer");
  if (!paginationContainer) return;
  paginationContainer.innerHTML = "";
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
      btn.addEventListener("click", () => renderSavedInvoices(page));
    }
    paginationContainer.appendChild(btn);
  };
  createButton("«", activePage - 1, false, activePage === 1);
  if (activePage > 3) {
    createButton("1", 1, activePage === 1);
    if (activePage > 4) {
      const span = document.createElement("span");
      span.textContent = "...";
      span.className = "px-2 text-gray-500";
      paginationContainer.appendChild(span);
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
      paginationContainer.appendChild(span);
    }
    createButton(totalPages, totalPages, activePage === totalPages);
  }
  createButton("»", activePage + 1, false, activePage === totalPages);
}


export async function showInvoiceModal(invoice, invoiceIndex) {
  const modal = document.getElementById("invoiceDetailsModal")
  const modalContent = document.getElementById("invoiceDetailsContent")
  try {
    commonfunction.showLoading(true)
    let supplierName = getSupplierNameById(invoice.supplier_id)
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
    <button class="modal-close-btn" onclick="admin_invoice.closeInvoiceModal()">x</button>
    <div class="invoice-details-section">
      <div class="invoice-details-header">
        <h4>تفاصيل فاتورة وارد </h4>
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
        <div class="detail-item">
          <div class="detail-label">المبلغ المدفوع</div>
          <div class="detail-value">${paidAmount.toFixed(2)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">المبلغ المتبقي</div>
          <div class="detail-value">${remainingAmount.toFixed(2)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">الملاحظات</div>
          <div class="detail-value">${notes}</div>
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
    modalContent.style.display = "flex"
    modal.dataset.level = 2
    modal.style.display = "flex"
  } catch (error) {
    console.log("خطأ في showInvoiceModal:", error)
    commonfunction.showMessage("error", "حدث خطأ أثناء عرض تفاصيل الفاتورة")
  } finally {
    commonfunction.showLoading(false)
  }
}

function handleSupplierChangeLockPrice() {
  const supplierSelect = document.getElementById("editSupplierName");
  const priceInput = document.getElementById("invoiceItemPrice");
  if (!supplierSelect || !priceInput) return;
  if (supplierSelect.value === "2") {
    priceInput.value = "0";
    priceInput.disabled = true;
  } else {
    priceInput.disabled = false;
    priceInput.value = "";
  }
}

export const removeItemFromInvoice = invoice.removeItemFromInvoice
export const closeInvoiceModal = invoice.closeInvoiceModal
export const updateInvoiceItemsList = invoice.updateInvoiceItemsList

window.admin_invoice = {
  viewInvoiceDetails,
  removeItemFromInvoice,
  closeInvoiceModal,
  updateInvoiceItemsList,
}