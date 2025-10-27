import * as commonfunction from "./commonfunction.js";

console.log("Loading admin_item.js");

export const unitsByType = {
  وزن: ["كجم", "جم", "طن"],
  حجم: ["لتر", "مل"],
  عدد: ["قطعة", "رغيف", "كيس", "عبوة", "باكيت", "كوب"],
};

export function clearItemForm() {
  document.getElementById("itemName").value = "";
  commonfunction.getUnitSubtypeSelect().value = "";
}

export async function addItem() {
  const name = document.getElementById("itemName").value.trim();
  const unitElement = commonfunction.getUnitSubtypeSelect();
  const unit = unitElement?.value || "";
  if (!name || !unit) {
    commonfunction.showMessage("warning", "يرجى إدخال اسم الصنف واختيار الوحدة");
    return;
  }
  try {
    commonfunction.showLoading(true);
    const response = await addIngredient(name, unit);
    if (response.data) {
      commonfunction.showMessage("success", "تم إضافة الصنف بنجاح");
      clearItemForm();
      await loadItems();
    }
  } catch (error) {
    console.log(error.message)
  } finally {
    commonfunction.showLoading(false);
  }
}

export async function loadItems() {
  try {
    commonfunction.showLoading(true);
    const response = await getIngredients();
    if (response?.data) {
      commonfunction.setItems(response.data);
      renderItemsTable(response.data);
    }
  } catch (error) {
    console.error("Error loading items:", error);
    commonfunction.showMessage("error", "حدث خطأ أثناء تحميل الأصناف");
  } finally {
    commonfunction.showLoading(false);
  }
}

export function renderItemsTable(items) {
  const itemsTableBody = document.getElementById("itemsTableBody");
  const itemsEmptyMsg = document.getElementById("itemsEmptyMsg");
  itemsTableBody.innerHTML = "";
  if (!items || items.length === 0) {
    itemsEmptyMsg.style.display = "block";
    document.getElementById("itemsTable").style.display = "none";
    return;
  }
  itemsEmptyMsg.style.display = "none";
  document.getElementById("itemsTable").style.display = "table";
  items.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.unit}</td>
      <td>${item.quantity || 0}</td>
      <td>
        <button class="edit-btn" data-id="${item.id}">
          <i class="fa-solid fa-pen-to-square"></i> تعديل
        </button>
      </td>
    `;
    itemsTableBody.appendChild(row);
  });

  // نقل ربط أحداث الأزرار هنا بعد إنشاء الجدول بالكامل
  document.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const itemId = e.currentTarget.getAttribute('data-id');
      openEditModal(itemId); // تغيير اسم الدالة لتعكس الوظيفة بشكل أفضل
    });
  });
}

// تغيير اسم الدالة لتعكس أنها تفتح النموذج
export async function openEditModal(id) {
  const item = commonfunction.getItems().find((i) => String(i.id) === String(id));
  if (!item) {
    console.error('Item not found with id:', id);
    return;
  }

  // تعيين الـ id الذي يتم تعديله
  commonfunction.setEditingItemId(String(id));

  // تعبئة الحقول الأساسية
  document.getElementById("editItemName").value = item.name;

  // ✅ تعبئة حقل الكمية
  document.getElementById("editItemQuantity").value = item.quantity || 0;

  const unitTypeSelect = document.getElementById("editUnitType");
  const unitSubtypeSelect = document.getElementById("editUnitSubtype");

  // فتح النافذة
  document.getElementById("editItemModal").style.display = "block";

  // البحث عن نوع الوحدة المناسب
  let foundType = "";
  for (const type in unitsByType) {
    if (unitsByType[type].includes(item.unit)) {
      foundType = type;
      break;
    }
  }

  // تعبئة نوع الوحدة
  unitTypeSelect.value = foundType;
  unitSubtypeSelect.innerHTML = `<option value="" disabled>اختر الوحدة</option>`;

  if (foundType) {
    unitsByType[foundType].forEach((unit) => {
      const option = document.createElement("option");
      option.value = unit;
      option.textContent = unit;
      if (unit === item.unit) option.selected = true;
      unitSubtypeSelect.appendChild(option);
    });
    unitSubtypeSelect.disabled = false;
  } else {
    unitSubtypeSelect.disabled = true;
  }

  document.body.classList.add("modal-open");
}


export async function confirmEditItem() {
  console.log("Confirming edit item");
  const id = commonfunction.getEditingItemId();
  const name = document.getElementById("editItemName").value.trim();
  const unit = document.getElementById("editUnitSubtype").value;
  if (!name || !unit) {
    commonfunction.showMessage("warning", "يرجى إدخال اسم الصنف واختيار الوحدة");
    return;
  }
  try {
    commonfunction.showLoading(true);
    const response = await updateIngredient(id, name, unit, 0, document.getElementById("editItemQuantity").value);
    console.log("Response from updateIngredient:", response);
    if (response && response.status === 200) {  
      console.log("Item updated successfully:", response.data);
      commonfunction.showMessage("success", "تم تعديل الصنف بنجاح");

      // إغلاق المودال
      document.getElementById("editItemModal").style.display = "none";
      document.body.classList.remove("modal-open");

      // تحديث الجدول فورًا بعد التعديل
      await loadItems();
    }
  } catch (error) {
    console.error("Error editing item:", error);
    commonfunction.showMessage("error", "حدث خطأ أثناء تعديل الصنف");
  } finally {
    commonfunction.showLoading(false);
  }
}



export function setupStorageSection() {
  document.getElementById("storageContent").style.display = "block";
  
  // تحميل العناصر عند البدء
  loadItems();
  
  // ربط أحداث الأزرار
  document.getElementById("addItemBtn").addEventListener("click", addItem);
  document.getElementById("confirmEditBtnModal").addEventListener("click", confirmEditItem);
  
  // أحداث إغلاق النموذج
  document.getElementById("cancelEditBtnModal").addEventListener("click", () => {
    document.getElementById("editItemModal").style.display = "none";
    document.body.classList.remove("modal-open");
  });
  
  document.getElementById("closeModalBtn").addEventListener("click", () => {
    document.getElementById("editItemModal").style.display = "none";
    document.body.classList.remove("modal-open");
  });

  // أحداث تغيير نوع الوحدة
  document.getElementById("unitType").addEventListener("change", function() {
    const type = this.value;
    const subtypeSelect = commonfunction.getUnitSubtypeSelect();
    
    subtypeSelect.innerHTML = '<option value="" disabled selected>اختر الوحدة</option>';
    subtypeSelect.style.display = "inline-block";
    
    if (unitsByType[type]) {
      unitsByType[type].forEach((unit) => {
        const option = document.createElement("option");
        option.value = unit;
        option.textContent = unit;
        subtypeSelect.appendChild(option);
      });
    }
  });

  // أحداث تغيير نوع الوحدة في نموذج التعديل
  document.getElementById("editUnitType").addEventListener("change", function() {
    const selectedType = this.value;
    const subtypeSelect = document.getElementById("editUnitSubtype");
    
    subtypeSelect.innerHTML = '<option value="" disabled selected>اختر الوحدة</option>';
    
    if (unitsByType[selectedType]) {
      unitsByType[selectedType].forEach((unit) => {
        const option = document.createElement("option");
        option.value = unit;
        option.textContent = unit;
        subtypeSelect.appendChild(option);
      });
      subtypeSelect.disabled = false;
    } else {
      subtypeSelect.disabled = true;
    }
  });
}

// تأكد من تنفيذ الكود بعد تحميل DOM
document.addEventListener('DOMContentLoaded', function() {
  setupStorageSection();
});