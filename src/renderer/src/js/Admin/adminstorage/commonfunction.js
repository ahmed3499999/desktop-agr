export function getUnitSubtypeSelect() {
  return document.getElementById("unitSubtype");
}

let items = [];

export function setItems(data) {
  items = data;
}

export function getItems() {
  return items;
}

let editingItemId = null;

export function setEditingItemId(data) {
  editingItemId = data;
}

export function getEditingItemId() {
  return editingItemId;
}

export function showLoading(show) {
  const loadingElement = document.getElementById("loadingOverlay");
  if (loadingElement) {
    loadingElement.style.display = show ? "flex" : "none";
  }
}

export function showMessage(type, message) {
  const messageElement = document.createElement("div");
  messageElement.className = `custom-message ${type}`;
  messageElement.textContent = message;

  document.body.appendChild(messageElement);

  setTimeout(() => {
    messageElement.classList.add("fade-out");
    setTimeout(() => messageElement.remove(), 500);
  }, 3000);
}

export function formatArabicDate(dateString) {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString("ar-EG", options);
}

export function openAnalysisModal() {
  document.getElementById("expensesAnalysisModal").style.display = "flex";
}

export function closeAnalysisModal() {
  document.getElementById("expensesAnalysisModal").style.display = "none";
}


export function showConfirm(message) {
  return new Promise((resolve) => {
    const confirmElement = document.createElement("div");
    confirmElement.className = "custom-confirm";
    confirmElement.innerHTML = `
    <div class="confirm-content">
    <p>${message}</p>
    <div class="confirm-buttons">
    <button class="confirm-btn">نعم</button>
    <button class="cancel-btn">لا</button>
    </div>
    </div>
    `;

    document.body.appendChild(confirmElement);

    confirmElement
      .querySelector(".confirm-btn")
      .addEventListener("click", () => {
        confirmElement.remove();
        resolve(true);
      });

    confirmElement
      .querySelector(".cancel-btn")
      .addEventListener("click", () => {
        confirmElement.remove();
        resolve(false);
      });
  });
}

export async function updateReturnAndDamagedItemsList() {
  const returnItemSelect = document.getElementById("returnItemSelect");
  const damagedItemSelect = document.getElementById("damagedItemSelect");

  try {
    const response = await getIngredients();
    const items = response.data || [];

    if (returnItemSelect) {
      returnItemSelect.innerHTML =
        '<option value="" disabled selected>اختر الصنف</option>';
      items.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.name;
        option.dataset.unit = item.unit;
        option.dataset.cost = item.return_cost || 0;
        returnItemSelect.appendChild(option);
      });
    }

    if (damagedItemSelect) {
      damagedItemSelect.innerHTML =
        '<option value="" disabled selected>اختر الصنف</option>';
      items.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.name;
        option.dataset.unit = item.unit;
        damagedItemSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Error updating items list:", error);
    commonfunction.showMessage("error", "حدث خطأ أثناء تحديث قائمة الأصناف");
  }
}