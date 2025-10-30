export const unitTypes = {
  وزن: ["كجم", "جم", "طن"],
  حجم: ["لتر", "مل", "م³"],
  عدد: ["قطعة", "عبوة", "كرتونة"],
  "طول/مسافة": ["متر", "سم", "مللي"],
};

export function storageTabs(tabName) {
    if (tabName === "الوارد") {
        document.getElementById("importContent").style.display = "block"
        console.log("عرض تبويب الوارد")
        updateInvoiceItemsList()
        renderSavedInvoices()
    } else if (tabName === "الصادر") {
        document.getElementById("exportContent").style.display = "block"
        loadExportData()
    } else if (tabName === "المرتجع") {
        document.getElementById("returnsContent").style.display = "block"
        loadReturnsData()
        updateReturnAndDamagedItemsList()
    } else if (tabName === "الهالك") {
        document.getElementById("damagedContent").style.display = "block"
        loadDamagedData()
        updateReturnAndDamagedItemsList()
    } else if (tabName === "قائمة الوجبات") {
        document.getElementById("mealsListContent").style.display = "block"
    } else {
        document.getElementById("mainContent").style.display = "block"
    }
}