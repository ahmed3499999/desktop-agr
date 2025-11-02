import { contextBridge } from 'electron';
import * as ingredientsDB from '../main/db/hospital/ingredients';
import * as importsDB from '../main/db/hospital/imports';
import * as returnsDB from '../main/db/hospital/returns';
import * as exportsDB from '../main/db/hospital/exports';
import * as perishedDB from '../main/db/hospital/perished';
import * as paymentsDB from '../main/db/hospital/payments';
import * as schedulesDB from '../main/db/hospital/schedules';
import * as suppliersDB from '../main/db/suppliers';
import * as hospitalsDB from '../main/db/hospital-management';

contextBridge.exposeInMainWorld('hospitalsDB', {
  get_hospitals: () => hospitalsDB.get_hospitals(),
  add_hospital: (name) => hospitalsDB.add_hospital(name),
  update_hospital: (hos_id, name) => hospitalsDB.update_hospital(hos_id, name),
  delete_hospital: (hos_id) => hospitalsDB.delete_hospital(hos_id)
});

contextBridge.exposeInMainWorld('suppliersDB', {
  get_supplier: (supplier_id) => suppliersDB.get_supplier(supplier_id),
  get_all_suppliers: (hos_id) => suppliersDB.get_all_suppliers(hos_id),
  create_supplier: (hos_id, name, contact_info) => suppliersDB.create_supplier(hos_id, name, contact_info),
  update_supplier: (supplier_id, name, contact_info) => suppliersDB.update_supplier(supplier_id, name, contact_info),
});

contextBridge.exposeInMainWorld('importsDB', {
  get_import_count: (hos_id) => importsDB.get_import_count(hos_id),
  get_hospital_imports: (hos_id, limit, offset) => importsDB.get_hospital_imports(hos_id, limit, offset),
  get_supplier_imports: (hos_id, supplier_id, limit, offset) => importsDB.get_supplier_imports(hos_id, supplier_id, limit, offset),
  add_import: (supplier_id, hos_id, date, ingredients, amount_paid, note) => importsDB.add_import(supplier_id, hos_id, date, ingredients, amount_paid, note),
  update_import: (import_id, supplier_id, date, ingredients, amount_paid, note) => importsDB.update_import(import_id, supplier_id, date, ingredients, amount_paid, note),
  delete_Import: (import_id) => importsDB.delete_Import(import_id),
  get_all_import_ingredients: (hos_id) => importsDB.get_all_import_ingredients(hos_id)
});

contextBridge.exposeInMainWorld('ingredientsDB', {
  get_ingredient: (ingredient_id) => ingredientsDB.get_ingredient(ingredient_id),
  get_hospital_ingredients: (hos_id) => ingredientsDB.get_hospital_ingredients(hos_id),
  create_ingredient: (hos_id, name, unit, return_cost, quantity) => ingredientsDB.create_ingredient(hos_id, name, unit, return_cost, quantity),
  update_ingredient: (ingredient_id, name, unit, return_cost, quantity) => ingredientsDB.update_ingredient(ingredient_id, name, unit, return_cost, quantity),
  delete_ingredient: (ingredient_id) => ingredientsDB.delete_ingredient(ingredient_id)
})

contextBridge.exposeInMainWorld('returnsDB', {
  get_ingredients_return: (return_id) => returnsDB.get_ingredients_return(return_id),
  get_hospital_returns: (hos_id, limit, offset) => returnsDB.get_hospital_returns(hos_id, limit, offset),
  get_returns_count: (hos_id) => returnsDB.get_returns_count(hos_id),
  create_return: (hos_id, ingredients, date) => returnsDB.create_return(hos_id, ingredients, date),
  delete_return: (return_id) => returnsDB.delete_return(return_id),
  update_return: (return_id, ingredients, date) => returnsDB.update_return(return_id, ingredients, date)
})

contextBridge.exposeInMainWorld('exportsDB', {
  get_exports: (hos_id, limit, offset) => exportsDB.get_exports(hos_id, limit, offset),
  get_exports_count: (hos_id) => exportsDB.get_exports_count(hos_id),
  create_export: (hos_id, dest_hos_id, note, date, meeals, ingredients) => exportsDB.create_export(hos_id, dest_hos_id, note, date, meeals, ingredients),
  delete_export: (export_id) => exportsDB.delete_export(export_id),
  update_export: (export_id, dest_hos_id, note, date, meeals, ingredients) => exportsDB.update_export(export_id, dest_hos_id, note, date, meeals, ingredients),
  get_export_meals: (export_id) => exportsDB.get_export_meals(export_id),
  get_export_ingredients: (export_id) => exportsDB.get_export_ingredients(export_id)
});

contextBridge.exposeInMainWorld('perishedDB', {
  get_hospital_perished: (hos_id, limit, offset) => perishedDB.get_hospital_perished(hos_id, limit, offset),
  get_perished_count: (hos_id) => perishedDB.get_perished_count(hos_id),
  create_perished: (hos_id, ingredients, date) => perishedDB.create_perished(hos_id, ingredients, date),
  delete_perished: (perished_id) => perishedDB.delete_perished(perished_id),
  update_perished: (perished_id, ingredients, date) => perishedDB.update_perished(perished_id, ingredients, date)
});

contextBridge.exposeInMainWorld('paymentsDB', {
  get_payment: (hos_id, limit, offset) => paymentsDB.get_payment(hos_id, limit, offset),
  create_payment: (hos_id, date, purpose, cost) => paymentsDB.create_payment(hos_id, date, purpose, cost),
  delete_payment: (payment_id) => paymentsDB.delete_payment(payment_id),
  update_payment: (payment_id, date, purpose, cost) => paymentsDB.update_payment(payment_id, date, purpose, cost)
});

contextBridge.exposeInMainWorld('schedulesDB', {
  get_hospital_schedules: (hos_id) => schedulesDB.get_hospital_schedules(hos_id),
  create_schedule: (hos_id, patient_type, schedule_name, note, cost) => schedulesDB.create_schedule(hos_id, patient_type, schedule_name, note, cost),
  delete_schedule: (schedule_id) => schedulesDB.delete_schedule(schedule_id),
  update_schedule: (schedule_id, schedule_name,patient_type, note, cost) => schedulesDB.update_schedule(schedule_id,  schedule_name,patient_type, note, cost),
  create_schedule_meal: (schedule_id, weekday, ingredients) => schedulesDB.create_schedule_meal(schedule_id, weekday, ingredients),
  update_schedule_meal: (meal_id, ingredients) => schedulesDB.update_schedule_meal(meal_id, ingredients)
});
