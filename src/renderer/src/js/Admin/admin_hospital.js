console.log("admin_hospital.js loaded");

export function setupHospitalSection() {
  loadHospitals();

  // زر إضافة مستشفى
  const addBtn = document.getElementById("addHospitalBtn");
  if (addBtn) {
    const newBtn = addBtn.cloneNode(true);
    addBtn.replaceWith(newBtn);
    newBtn.addEventListener("click", async () => {
      const name = document.getElementById("hospitalName").value.trim();
      const username = document.getElementById("hospitalUsername").value.trim();
      const password = document.getElementById("hospitalPassword").value.trim();
      if (!name || !username || !password) {
        alert("يرجى ملء جميع الحقول");
        return;
      }
      try {
        await add_hospital(name, username, password);
        document.getElementById("hospitalName").value = "";
        document.getElementById("hospitalUsername").value = "";
        document.getElementById("hospitalPassword").value = "";
        loadHospitals();
      } catch (error) {
        console.error("حدث خطأ أثناء الإضافة:", error);
        alert("فشل في إضافة المستشفى، حاول مرة أخرى.");
      }
    });
  }

  // زر حفظ التعديل
  const saveBtn = document.querySelector("#editHospitalModal .save-btn");
  if (saveBtn) {
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.replaceWith(newSaveBtn);
    newSaveBtn.addEventListener("click", async () => {
      const id = document.getElementById("editHospitalId").value;
      const name = document.getElementById("editHospitalName").value;
      const username = document.getElementById("editHospitalUsername").value;
      const password = document.getElementById("editHospitalPassword").value;
      await update_hospital(id, name, username, password || null);
      closeEditHospitalModal();
      loadHospitals();
    });
  }

  // زر إغلاق المودال (×)
  const closeBtn = document.querySelector("#editHospitalModal .modal-close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeEditHospitalModal);
  }

  // زر إلغاء التعديل
  const cancelBtn = document.getElementById("cancelEditHospitalBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeEditHospitalModal);
  }
}

function closeEditHospitalModal() {
  const modal = document.getElementById("editHospitalModal");
  modal.style.display = "none";
  document.body.classList.remove("modal-open");
}

export async function loadHospitals() {
  try {
    const response = await get_hospitals();
    const hospitals = response.data;
    const tableBody = document.getElementById("hospitalsTableBody");
    if (!tableBody) return console.error('Element with id "hospitalsTableBody" not found.');
    tableBody.innerHTML = "";
    if (hospitals.length === 0) {
      document.getElementById("hospitalsEmptyMessage").style.display = "block";
      return;
    } else {
      document.getElementById("hospitalsEmptyMessage").style.display = "none";
    }
    hospitals.forEach((hospital) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${hospital.hos_name}</td>
        <td>${hospital.username}</td>
        <td style="display: flex; gap: 4px;">
          <button class="view-btn" data-id="${hospital.hos_id}" data-name="${hospital.hos_name}">عرض</button>
          <button class="edit-btn" data-id="${hospital.hos_id}" data-name="${hospital.hos_name}" data-username="${hospital.username}">تعديل</button>
          <button class="delete-btn" data-id="${hospital.hos_id}">حذف</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
    attachEditDeleteEvents();
  } catch (error) {
    console.error("خطأ في تحميل المستشفيات:", error);
  }
}

export async function handleAddHospitalForm(e) {
  e.preventDefault();
  const name = document.getElementById("addHospitalName").value;
  const username = document.getElementById("addHospitalUsername").value;
  const password = document.getElementById("addHospitalPassword").value;
  await add_hospital(name, username, password);
  document.getElementById("addHospitalForm").reset();
  document.getElementById("addHospitalModal").style.display = "none";
  loadHospitals();
}

function attachEditDeleteEvents() {
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const hospitalId = this.getAttribute("data-id");
      const deleteModal = document.getElementById("deleteHospitalModal");
      deleteModal.style.display = "flex";
      document.body.classList.add("modal-open");

      // إعادة تعيين الأزرار داخل مودال الحذف
      const oldConfirmBtn = document.getElementById("confirmDeleteHospital");
      const oldCancelBtn1 = document.getElementById("cancelDeleteHospital");
      const oldCancelBtn2 = document.getElementById("cancelDeleteHospitalBtn");

      const newConfirmBtn = oldConfirmBtn.cloneNode(true);
      const newCancelBtn1 = oldCancelBtn1.cloneNode(true);
      const newCancelBtn2 = oldCancelBtn2.cloneNode(true);

      oldConfirmBtn.replaceWith(newConfirmBtn);
      oldCancelBtn1.replaceWith(newCancelBtn1);
      oldCancelBtn2.replaceWith(newCancelBtn2);

      const confirmBtn = document.getElementById("confirmDeleteHospital");
      const cancelBtn1 = document.getElementById("cancelDeleteHospital");
      const cancelBtn2 = document.getElementById("cancelDeleteHospitalBtn");

      confirmBtn.addEventListener("click", async () => {
        try {
          await delete_hospital(hospitalId);
          deleteModal.style.display = "none";
          document.body.classList.remove("modal-open");
          loadHospitals();
        } catch (error) {
          console.error("فشل في الحذف:", error);
          alert("حدث خطأ أثناء محاولة حذف المستشفى.");
        }
      });

      [cancelBtn1, cancelBtn2].forEach((btn) => {
        btn.addEventListener("click", () => {
          deleteModal.style.display = "none";
          document.body.classList.remove("modal-open");
        });
      });
    });
  });

  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const id = this.getAttribute("data-id");
      const name = this.getAttribute("data-name");
      const username = this.getAttribute("data-username");
      document.getElementById("editHospitalId").value = id;
      document.getElementById("editHospitalName").value = name;
      document.getElementById("editHospitalUsername").value = username;
      document.getElementById("editHospitalPassword").value = "";
      document.getElementById("editHospitalModal").style.display = "flex";
      document.body.classList.add("modal-open");
    });
  });

  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const id = this.getAttribute("data-id");
      const name = this.getAttribute("data-name");
      sessionStorage.setItem("hos_id", id);
      sessionStorage.setItem("hospitalNameFromAdmin", name);

      console.log("✅ View button clicked and stored:", {
        hos_id: id,
        hospitalNameFromAdmin: name,
      });

      requestAnimationFrame(() => {
        window.location.href = "user.html";
      });
    });
  });
}
