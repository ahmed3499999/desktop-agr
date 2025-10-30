let hos_id = 1;

function getIngredients() {
    return new Promise((resolve, reject) => resolve(window.ingredientsDB.get_hospital_ingredients(hos_id)))
};

function addIngredient(name, unit, return_cost = 0, quantity = 0) {
    return new Promise((resolve, reject) => resolve(window.ingredientsDB.create_ingredient(hos_id, name, unit, return_cost, quantity)))
};

function updateIngredient(id, name, unit, return_cost = 0, quantity = 0) {
    return new Promise((resolve, reject) => resolve(window.ingredientsDB.update_ingredient(id, name, unit, return_cost, quantity)))
};

// دوال الموردين من اول هنا
function getSuppliers() {
    return GET(suppliers_endpoint());
};

function getSupplierDebt(supplier_id) {
    return GET(suppliers_endpoint(supplier_id) + '/debt')
}

function getSupplierPayments(supplier_id, limit, offset){
    return GET(suppliers_endpoint(supplier_id) + `/payments?limit=${limit}&offset=${offset}`);
}

function addSupplier(name, contact_info) {
    const data = {
        name: name,
        contact_info: contact_info
    };

    return POST(suppliers_endpoint(), data);
};

function updateSupplier(supplier_id, name, contact_info) {
    const data = {
        name: name,
        contact_info: contact_info
    };
    
    return PUT(suppliers_endpoint(supplier_id), data);
}

function getSupplierImports(supplier_id, limit, offset) {
    return GET(suppliers_endpoint(supplier_id) + `?limit=${limit}&offset=${offset}`);
}

// دوال الواردات من اول هنا

function getImports(limit = 100, offset = 0){
    return new Promise((resolve, reject) => resolve(window.importsDB.get_hospital_imports(1, limit, offset)));
}

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
    const data = {
        'supplier_id': supplier_id,
        'date': date,
        'ingredients': ingredients,
        'amount_paid': amount_paid,
        'note': note
    };

    return POST(imports_endpoint(), data);
}

function updateImport(import_id, supplier_id, date, amount_paid, ingredients, note = ""){
    data = {
        'supplier_id': supplier_id,
        'date': date,
        'ingredients': ingredients,
        'amount_paid': amount_paid,
        'note': note
    }

    return PUT(imports_endpoint(import_id), data);
};

function deleteImport(import_id) {
    return DELETE(imports_endpoint(import_id));
};

// دوال المرتجع من هنا
function getReturns(limit, offset) {
    return GET(returns_endpoint() + `?limit=${limit}&offset=${offset}`);
}

//ingredients = list of objects containing the keys: ingredient_id, quantity
function apiAddReturn(date, ingredients) {
 const data = {
    date: date,
    ingredients: ingredients
  };

  return POST(returns_endpoint(), data);
}

//ingredients = list of objects containing the keys: ingredient_id, quantity
function updateReturn(return_id, date, ingredients) {
    data = {
        'date':date,
        'ingredients':ingredients
    }

    return PUT(returns_endpoint(return_id), data);
}

function deleteReturn(return_id) {
    return DELETE(returns_endpoint(return_id));
}

// هنا دوال الهالك
function getPerished(limit, offset) {
    return GET(perished_endpoint() + `?limit=${limit}&offset=${offset}`);
}

//ingredients = list of objects containing the keys: ingredient_id, quantity
function addPerished(date, ingredients) {
    data = {
        'date':date,
        'ingredients':ingredients
    }

    return POST(perished_endpoint(), data);
}

//ingredients = list of objects containing the keys: ingredient_id, quantity
function updatePerished(perished_id, date, ingredients) {
    data = {
        'date':date,
        'ingredients':ingredients
    }
    return PUT(perished_endpoint(perished_id), data);
}

function deletePerished(perished_id) {
    return DELETE(perished_endpoint(perished_id))
}

// هنا دوال المصروفات
function getPayments(limit, offset){
    return GET(payments_endpoint() + `?limit=${limit}&offset=${offset}`)
}

function addPayment(cost, purpose, date){
    data = {
        'date': date,
        'purpose': purpose,
        'cost': cost
    };

    return POST(payments_endpoint(), data);
}

function updatePayment(payment_id, cost, purpose, date) {
    data = {
        'date': date,
        'purpose': purpose,
        'cost': cost
    };

    return PUT(payments_endpoint(payment_id), data);    
}

function deletePayment(payment_id) {
    return DELETE(payments_endpoint(payment_id));
}

// هنا الوجبات و الجداول
function getSchedules() {
    return GET(schedules_endpoint());
}

function addSchedule(patient_type, schedule_name, note, cost) {
    data = {
        'patient_type': patient_type,
        'schedule_name': schedule_name,
        'note': note,
        'cost': cost
    }

    return POST(schedules_endpoint(), data);
}

function updateSchedule(schedule_id, patient_type, schedule_name, note, cost) {
    data = {
        'patient_type': patient_type,
        'schedule_name': schedule_name,
        'note': note,
        'cost': cost
    }

    return PUT(schedules_endpoint(schedule_id), data);
}

function deleteSchedule(schedule_id) {
    return DELETE(schedules_endpoint(schedule_id));
}

function addScheduleMeal(schedule_id, weekday, ingredients) {
    data = {
        'schedule_id': schedule_id,
        'weekday': weekday,
        'ingredients': ingredients
    }

    return POST(meals_endpoint(), data);
}

function updateScheduleMeal(meal_id, ingredients) {
    data = {
        'ingredients': ingredients
    }

    return PUT(meals_endpoint(meal_id), data);
}

function getExports(limit, offset) {
    return GET(exports_endpoint() + `?limit=${limit}&offset=${offset}`);
}

// meals=[{schedule_name, patient_type, quantity, cost}]
//ingredients=[{ingredient_id, quantity}]
// dest_hos_id = id of hospital that will be exported to
function addExport(date, meals, ingredients, note = '', dest_hos_id = null) {
    data = {
        'date': date,
        'meals': meals,
        'ingredients': ingredients,
        'dest_hos_id': dest_hos_id,
        'note': note
    };

    return POST(exports_endpoint(), data);
}

function updateExport(export_id, date, meals, ingredients, note = '', dest_hos_id = null) {
    data = {
        'date': date,
        'meals': meals,
        'ingredients': ingredients,
        'dest_hos_id': dest_hos_id,
        'note': note
    }

    return PUT(exports_endpoint(export_id), data);
}

function deleteExport(export_id) {
    return DELETE(exports_endpoint(export_id));
}

// hospital functions
function get_hospitals() {
    return GET(hospital_management_endpoint());
}

function get_hospital_ingredients(hos_id) {
    return GET(hospital_management_endpoint('ingredients') + `/${hos_id}`);
}

function add_hospital(hospital_name, username, password) {
    data = {
        'name': hospital_name,
        'username': username,
        'password': password
    }

    return POST(hospital_management_endpoint(), data);
}

function update_hospital(hos_id, hospital_name, username, password) {
    data = {
        'name': hospital_name,
        'username': username,
        'password': password
    }

    return PUT(hospital_management_endpoint(hos_id), data);
}

function delete_hospital(hos_id) {
    return DELETE(hospital_management_endpoint(hos_id));
}

function get_supplier_report(supplier_id, start_date, end_date, report_type) {
    const data = {
        'supplier_id': supplier_id,
        'start_date': start_date,
        'end_date': end_date,
        'report_type': report_type
    }
    
    return POST(reports_endpoint('supplier'), data);
}

function get_returns_report(hospital_id, ingredient_ids, start_date, end_date, report_type) {
    const data = {
        'hospital_id': hospital_id,
        'ingredient_ids': ingredient_ids,
        'start_date': start_date,
        'end_date': end_date,
        'report_type': report_type
    }
    
    return POST(reports_endpoint('returns'), data)
}

function get_payments_report(hospital_id, start_date, end_date, report_type) {
    const data = {
        'hospital_id': hospital_id,
        'start_date': start_date,
        'end_date': end_date,
        'report_type': report_type
    }

    return POST(reports_endpoint('payments'), data);
}

function get_meals_report(hospital_id, start_date, end_date, report_type) {
    const data = {
        'hospital_id': hospital_id,
        'start_date': start_date,
        'end_date': end_date,
        'report_type': report_type
    }

    return POST(reports_endpoint('meals'), data);
}


function get_import_report(supplier_id, hospital_id, ingredient_id, start_date, end_date, report_type) {
    const data = {
        'supplier_id': supplier_id,
        'hospital_id': hospital_id,
        'ingredient_id': ingredient_id,
        'start_date': start_date,
        'end_date': end_date,
        'report_type': report_type
    }
    return POST(reports_endpoint('imports'), data);
}

function get_perished_report(hospital_id, ingredient_ids, start_date, end_date, report_type) {
    const data = {
        'hospital_id': hospital_id,
        'ingredient_ids': ingredient_ids,
        'start_date': start_date,
        'end_date': end_date,
        'report_type': report_type
    }   
    return POST(reports_endpoint('perished'), data);
}

function get_exports_report(hospital_id, ingredient_ids, start_date, end_date, report_type) {
    const data = {
        'hospital_id': hospital_id,
        'ingredient_ids': ingredient_ids,
        'start_date': start_date,
        'end_date': end_date,
        'report_type': report_type
    }   
    return POST(reports_endpoint('exports'), data);
}
