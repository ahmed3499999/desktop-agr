import * as commonfunction from "../commonfunction.js";

console.log("Loading item.js");

export const unitsByType = {
  وزن: ["كجم", "جم", "طن"],
  حجم: ["لتر", "مل"],
  عدد: ["قطعة", "رغيف", "كيس", "عبوة", "باكيت", "كوب"],
};

export function clearItemForm() {
  document.getElementById("itemName").value = "";
  document.getElementById("itemCost").value = "";
  document.getElementById("unitSubtype").value = "";
}

export async function addItem() {
  const btn = document.getElementById("addItemBtn");

  if (btn.disabled) return;

  btn.disabled = true;

  const name = document.getElementById("itemName").value.trim();
  const unit = document.getElementById("unitSubtype").value;
  const cost = parseFloat(document.getElementById("itemCost").value) || 0;

  if (!name || !unit) {
    commonfunction.showMessage("warning", "يرجى إدخال اسم الصنف واختيار الوحدة");
    btn.disabled = false;
    return;
  }

  try {
    commonfunction.showLoading(true);
    const response = await addIngredient(name, unit, cost);
    if (response.data) {
      commonfunction.showMessage("success", "تم إضافة الصنف بنجاح");
      clearItemForm();  // مسح الحقول بعد الإضافة مباشرة
      await loadItems();
    }
  } catch (error) {
    commonfunction.showMessage("error", "حدث خطأ: " + error.message);
  } finally {
    commonfunction.showLoading(false);
    btn.disabled = false;
  }
}

export async function loadItems() {
  try {
    commonfunction.showLoading(true);
    const response = await getIngredients();
    if (response.data) {
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
      <td>${item.return_cost ? item.return_cost.toFixed(2) : "0.00"}</td>
      <td>
        <button class="edit-btn" data-id="${item.id}">
          <i class="fa-solid fa-pen-to-square"></i> تعديل
        </button>
      </td>
    `;
    itemsTableBody.appendChild(row);
  });
}

export async function openEditForm(id) {
  const item = commonfunction.getItems().find((i) => i.id === id);
  if (!item) return;

  commonfunction.setEditingItemId(id);

  document.getElementById("editItemNameModal").value = item.name;
  document.getElementById("editItemCostModal").value = item.return_cost || 0;

  // ✅ إضافة الكمية
  document.getElementById("editItemQuantityModal").value = item.quantity || 0;

  const unitTypeSelect = document.getElementById("editUnitTypeModal");
  const unitSubtypeSelect = document.getElementById("editUnitSubtypeModal");

  let foundType = "";
  for (const type in unitsByType) {
    if (unitsByType[type].includes(item.unit)) {
      foundType = type;
      break;
    }
  }

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

  document.getElementById("editItemModal").style.display = "flex";
}

