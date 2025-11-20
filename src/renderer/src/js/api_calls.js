hos_id = () => sessionStorage.getItem('hos_id');

function responsify(func) {
    return async (...args) => {
        try {
            const data = await func(...args);
            return { status: 200, data };
            } catch (err) {
            return { status: 500, error: err.message || String(err) };
        }
    };
}

function getIngredients() {
    return window.ingredientsDB.get_hospital_ingredients(hos_id())
};
getIngredients = responsify(getIngredients);

function addIngredient(name, unit, return_cost = 0, quantity = 0) {
    return window.ingredientsDB.create_ingredient(hos_id(), name, unit, return_cost, quantity)
};
addIngredient = responsify(addIngredient)

function updateIngredient(id, name, unit, return_cost = 0, quantity = 0) {
    return window.ingredientsDB.update_ingredient(id, name, unit, return_cost, quantity)
};
updateIngredient = responsify(updateIngredient)

// دوال الموردين من اول هنا
function getSuppliers() {
    return window.suppliersDB.get_all_suppliers(); 
};
getSuppliers = responsify(getSuppliers);

function getSupplierDebt(supplier_id) {
    return window.suppliersDB.get_supplier_debt(hos_id(), supplier_id);
}
getSupplierDebt = responsify(getSupplierDebt);

function getSupplierPayments(supplier_id, limit, offset){
    return window.suppliersDB.get_suppliers_payments(supplier_id, limit, offset);
}
getSupplierPayments = responsify(getSupplierPayments);

function addSupplier(name, contact_info) {
    return window.suppliersDB.create_supplier(name, contact_info);
};
addSupplier = responsify(addSupplier);

function updateSupplier(supplier_id, name, contact_info) {
    return window.suppliersDB.update_supplier(supplier_id, name, contact_info);
}
updateSupplier = responsify(updateSupplier);

function getSupplierImports(supplier_id, limit, offset) {
    return GET(suppliers_endpoint(supplier_id) + `?limit=${limit}&offset=${offset}`);
}

// دوال الواردات من اول هنا

function getImports(limit = 100, offset = 0){
    return window.importsDB.get_hospital_imports(hos_id(), limit, offset);
}
getImports = responsify(getImports)

// ingredients is an array of objects, each object contains ingredient_id, unit_cost, quantity
// example
// [
//     {
//         ingredient_id: 1,
//         unit_cost: 10.5,
//         quantity: 50
//     },
//     {
//         ingredient_id: 2,
//         unit_cost: 8.0,
//         quantity: 100
//     },
//     {
//         ingredient_id: 3,
//         unit_cost: 0.5,
//         quantity: 200
//     }
// ]

function addImport(supplier_id, date, amount_paid, ingredients = [], note = "") {
    return window.importsDB.add_import(supplier_id, hos_id(), date, ingredients, amount_paid, note);
}
addImport = responsify(addImport);

function updateImport(import_id, supplier_id, date, amount_paid, ingredients = [], note = "") {
    return window.importsDB.update_import(import_id, supplier_id, date, ingredients, amount_paid, note);
}
updateImport = responsify(updateImport);

function deleteImport(import_id) {
    return window.importsDB.delete_Import(import_id);
}
deleteImport = responsify(deleteImport);

// دوال المرتجع من هنا
function getReturns(limit, offset) {
    return window.returnsDB.get_hospital_returns(hos_id(), limit, offset);
}
getReturns = responsify(getReturns);

//ingredients = list of objects containing the keys: ingredient_id, quantity
function apiAddReturn(date, ingredients) {
  return window.returnsDB.create_return(hos_id(), ingredients, date);
}

//ingredients = list of objects containing the keys: ingredient_id, quantity
function updateReturn(return_id, date, ingredients) {
    return window.returnsDB.update_return(return_id, ingredients, date);
}
updateReturn = responsify(updateReturn);

function deleteReturn(return_id) {
    return window.returnsDB.delete_return(return_id);
}
deleteReturn = responsify(deleteReturn);

// هنا دوال الهالك
function getPerished(limit, offset) {
    return window.perishedDB.get_hospital_perished(hos_id(), limit, offset);
}
getPerished = responsify(getPerished);

//ingredients = list of objects containing the keys: ingredient_id, quantity
function addPerished(date, ingredients) {
    return window.perishedDB.create_perished(hos_id(), ingredients, date);
}

//ingredients = list of objects containing the keys: ingredient_id, quantity
function updatePerished(perished_id, date, ingredients) {
    return window.perishedDB.update_perished(perished_id, ingredients, date);
}
updatePerished = responsify(updatePerished);

function deletePerished(perished_id) {
    return window.perishedDB.delete_perished(perished_id);
}

// هنا دوال المصروفات
function getPayments(limit, offset){
    return window.paymentsDB.get_payment(hos_id(), limit, offset);
}
getPayments = responsify(getPayments);

function addPayment(cost, purpose, date){
    return window.paymentsDB.create_payment(hos_id(), date, purpose, cost);
}
addPayment = responsify(addPayment);

function updatePayment(payment_id, cost, purpose, date) {
    return window.paymentsDB.update_payment(payment_id, date, purpose, cost);
}
updatePayment = responsify(updatePayment);

function deletePayment(payment_id) {
    return window.paymentsDB.delete_payment(payment_id);
}
deletePayment = responsify(deletePayment);

// هنا الوجبات و الجداول
function getSchedules() {
    return window.schedulesDB.get_hospital_schedules(hos_id());
}
getSchedules = responsify(getSchedules);

function addSchedule(patient_type, schedule_name, note, cost) {
    return window.schedulesDB.create_schedule(hos_id(), patient_type, schedule_name, note, cost);
}
addSchedule = responsify(addSchedule);

function updateSchedule(schedule_id, patient_type, schedule_name, note, cost) {
    return window.schedulesDB.update_schedule(schedule_id,  schedule_name,patient_type, note, cost);
}
updateSchedule = responsify(updateSchedule);

function deleteSchedule(schedule_id) {
    return window.schedulesDB.delete_schedule(schedule_id);
}
deleteSchedule = responsify(deleteSchedule);

function addScheduleMeal(schedule_id, weekday, ingredients) {
    return window.schedulesDB.create_schedule_meal(schedule_id, weekday, ingredients);
}
addScheduleMeal = responsify(addScheduleMeal);

function updateScheduleMeal(meal_id, ingredients) {
    return window.schedulesDB.update_schedule_meal(meal_id, ingredients);
}
updateScheduleMeal = responsify(updateScheduleMeal);
 
function getExports(limit, offset) {
    return window.exportsDB.get_exports(hos_id(), limit, offset);
}
getExports = responsify(getExports);

// meals=[{schedule_name, patient_type, quantity, cost}]
//ingredients=[{ingredient_id, quantity}]
// dest_hos_id = id of hospital that will be exported to
function addExport(date, meals, ingredients, note = '', dest_hos_id = null) {
    return window.exportsDB.create_export(hos_id(), dest_hos_id, note, date, meals, ingredients);
}
addExport = responsify(addExport);

function updateExport(export_id, date, meals, ingredients, note = '', dest_hos_id = null) {
    return window.exportsDB.update_export(export_id, hos_id(), dest_hos_id, note, date, meals, ingredients);
}
updateExport = responsify(updateExport);

function deleteExport(export_id) {
    return window.exportsDB.delete_export(export_id);
}
deleteExport = responsify(deleteExport);

// hospital functions
function get_hospitals() {
    return window.hospitalsDB.get_hospitals();
}
get_hospitals = responsify(get_hospitals);

function get_hospital_ingredients(hos_id) {
    return GET(hospital_management_endpoint('ingredients') + `/${hos_id}`);
}

function add_hospital(hospital_name) {
    return window.hospitalsDB.add_hospital(hospital_name);
}
add_hospital = responsify(add_hospital);

function update_hospital(hos_id, hospital_name) {
    return window.hospitalsDB.update_hospital(hos_id, hospital_name);
}
update_hospital = responsify(update_hospital);

function delete_hospital(hos_id) {
    return window.hospitalsDB.delete_hospital(hos_id);
}
delete_hospital = responsify(delete_hospital);

function get_supplier_report(supplier_id, start_date, end_date, report_type) {
    return window.reportsDB.supplierReport(supplier_id, start_date, end_date, report_type);
}
get_supplier_report = responsify(get_supplier_report);

function get_returns_report(hospital_id, ingredient_ids, start_date, end_date, report_type) {
    return window.reportsDB.returnsReport(hospital_id, ingredient_ids, start_date, end_date, report_type);
}
get_returns_report = responsify(get_returns_report);

function get_payments_report(hospital_id, start_date, end_date, report_type) {
    return window.reportsDB.paymentsReport(hospital_id, start_date, end_date, report_type);
}
get_payments_report = responsify(get_payments_report);

function get_meals_report(hospital_id, start_date, end_date, report_type) {
    return window.reportsDB.mealsReport(hospital_id, start_date, end_date, report_type);
}
get_meals_report = responsify(get_meals_report);

function get_import_report(supplier_id, hospital_id, ingredient_id, start_date, end_date, report_type) {
    return window.reportsDB.importReport(supplier_id, hospital_id, ingredient_id, start_date, end_date, report_type);
}
get_import_report = responsify(get_import_report);

function get_perished_report(hospital_id, ingredient_ids, start_date, end_date, report_type) {
    return window.reportsDB.perishedReport(hospital_id, ingredient_ids, start_date, end_date, report_type);
}
get_perished_report = responsify(get_perished_report);

function get_exports_report(hospital_id, ingredient_ids, start_date, end_date, report_type) {
    return window.reportsDB.exportsIngredientsReport(hospital_id, ingredient_ids, start_date, end_date, report_type);
}
get_exports_report = responsify(get_exports_report);
