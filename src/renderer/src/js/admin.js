import * as commonfunction from "./commonfunction.js";
sessionStorage.setItem("hos_id", 1);

document.addEventListener('DOMContentLoaded', () => {
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const mobileSidebar = document.getElementById('mobileSidebar');
    const closeSidebar = document.getElementById('closeSidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');

    hamburgerMenu.addEventListener('click', () => {
        mobileSidebar.classList.add('active');
        mobileOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    closeSidebar.addEventListener('click', closeMobileMenu);
    mobileOverlay.addEventListener('click', closeMobileMenu);

    document.querySelectorAll('.main-menu > li').forEach(menuItem => {
        menuItem.addEventListener('click', (e) => {
            const submenu = menuItem.querySelector('.submenu');
            if (submenu) {
                e.stopPropagation();
                submenu.classList.toggle('show');
            } else {
                closeMobileMenu();
            }
        });
    });

    document.querySelectorAll('.submenu li a').forEach(link => {
        link.addEventListener('click', (e) => handleTabClick(e, link));
    });

    document.querySelectorAll(".logout-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            commonfunction
                .showConfirm("هل أنت متأكد من تسجيل الخروج؟")
                .then((confirmed) => {
                    if (confirmed) {
                        commonfunction.showMessage("info", "تم تسجيل الخروج بنجاح");
                        sessionStorage.removeItem("token");
                        sessionStorage.removeItem("hospitalName");
                        document.location.href = "index.html";
                    }
                });
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) closeMobileMenu();
    });

    function closeMobileMenu() {
        mobileSidebar.classList.remove('active');
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = '';
        document.querySelectorAll('.submenu').forEach(sub => sub.classList.remove('show'));
    }

    async function handleTabClick(e, el) {
        e.preventDefault();
        const tab = el.dataset.tab;
        const category = el.dataset.category;
        if (tab && category) {
            if (currentCategory === category && currentTab === tab && isMobile()) {
                closeMobileMenu();
                return;
            }
            await selectCategory(category, el.closest('.has-submenu'));
            await selectTab(tab);
            closeMobileMenu();
        }
    }
    window.handleMobileTabClick = handleTabClick;
});

const tabsWrapper = document.getElementById("tabsWrapper");

const tabContent = {
    المخزن: {
        tabs: {
            "الأصناف": { modulePath: "./Admin/adminstorage/admin_item.js", setupFunction: "setupStorageSection" },
            "الصادر": { modulePath: "./Admin/adminstorage/admin_export.js", setupFunction: "setupExportSection" },
            "الوارد": { modulePath: "./Admin/adminstorage/admin_invoice.js", setupFunction: "setupInvoiceSection" },
            "الهالك": { modulePath: "./Admin/adminstorage/admin_damaged.js", setupFunction: "setupDamagedSection" }
        }
    },
    المستشفيات: {
        tabs: {
            "إدارة المستشفيات": { modulePath: "./Admin/admin_hospital.js", setupFunction: "setupHospitalSection" }
        }
    },
    الموردين: {
        tabs: {
            "إدارة الموردين": { modulePath: "./Admin/admin_supplier.js", setupFunction: "setupSupplierSection" }
        }
    },
    المصروفات: {
        tabs: {
            "إدارة المصروفات": { modulePath: "./Admin/admin_expenses.js", setupFunction: "loadExpensesData" }
        }
    },
    التقارير: { // فئة جديدة للتقارير
        tabs: {
            "عرض التقارير": { modulePath: "./Admin/Reports/admin_reports.js", setupFunction: "setupReportsSection" }
        }
    }
};

let currentCategory = "المخزن";
let currentTab = Object.keys(tabContent[currentCategory].tabs)[0];

async function init() {
    console.log("تم تحميل النظام");
    setupEventListeners();
    generateTabs(currentCategory);
    await selectTab(currentTab);
    commonfunction.updateReturnAndDamagedItemsList();
}

function setupEventListeners() {
    document.querySelectorAll('.nav-item:not(.logout-btn)').forEach(nav => {
        nav.addEventListener('click', async () => {
            const category = nav.getAttribute('data-category');
            await selectCategory(category, nav);
        });
    });
}

function generateTabs(category) {
    const tabs = Object.keys(tabContent[category].tabs);
    tabsWrapper.innerHTML = "";
    tabs.forEach((tab) => {
        const tabButton = document.createElement("button");
        tabButton.className = `tab-button ${tab === currentTab ? "active" : ""}`;
        tabButton.textContent = tab;
        tabButton.addEventListener("click", async () => {
            await selectTab(tab);
        });
        tabsWrapper.appendChild(tabButton);
    });
}

async function selectTab(tab) {
    currentTab = tab;
    document.querySelectorAll(".tab-button").forEach((btn) => {
        btn.classList.toggle("active", btn.textContent.trim() === tab);
    });
    document.querySelectorAll("[id$='Content']").forEach(el => el.style.display = "none");
    const sectionId = getSectionIdByTab(tab);
    if (sectionId) {
        const sectionElement = document.getElementById(sectionId);
        if (sectionElement) {
            sectionElement.style.display = "block";
            await loadTabContent();
        } else {
            console.warn(`⚠️ العنصر ${sectionId} مش موجود في الصفحة`);
        }
    }
}

function getSectionIdByTab(tab) {
    const map = {
        "الأصناف": "storageContent",
        "الصادر": "exportContent",
        "الوارد": "importContent",
        "الهالك": "damagedContent",
        "إدارة المصروفات": "expensesContent",
        "إدارة المستشفيات": "hospitalsContent",
        "إدارة الموردين": "suppliersContent",
        "عرض التقارير": "reportsContent" // إضافة التقارير
    };
    return map[tab] || null;
}

async function loadTabContent() {
    try {
        const tabConfig = tabContent[currentCategory].tabs[currentTab];
        if (!tabConfig) return;
        const { modulePath, setupFunction } = tabConfig;
        if (!modulePath || !setupFunction) return;
        const module = await import(modulePath);
        if (typeof module[setupFunction] === "function") {
            await module[setupFunction]();
        }
    } catch (err) {
        console.error(`خطأ في تحميل تبويب "${currentTab}" للفئة "${currentCategory}":`, err);
    }
}

function isMobile() {
    return window.innerWidth <= 768;
}

async function selectCategory(category, navItem) {
    if (currentCategory === category) {
        if (isMobile()) return;
        await selectTab(currentTab);
        return;
    }
    currentCategory = category;
    document.querySelectorAll(".nav-item").forEach((nav) => nav.classList.remove("active"));
    if (navItem) navItem.classList.add("active");
    document.querySelectorAll("[id$='Content']").forEach(el => el.style.display = "none");
    generateTabs(category);
    if (!isMobile()) {
        currentTab = Object.keys(tabContent[category].tabs)[0];
        await selectTab(currentTab);
    }
}

document.addEventListener("DOMContentLoaded", init);
