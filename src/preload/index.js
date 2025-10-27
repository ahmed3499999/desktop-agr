import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
const importsDB = require('../../main/db/hospital/imports')
const ingredientsDB = require('../../main/db/hospital/ingredients')

contextBridge.exposeInMainWorld('importsDB', {
  get_import_count: (hos_id) => importsDB.get_import_count(hos_id),
  get_hospital_imports: (hos_id, limit, offset) => importsDB.get_hospital_imports(hos_id, limit, offset),
  get_supplier_imports: (hos_id, supplier_id, limit, offset) => importsDB.get_supplier_imports(hos_id, supplier_id, limit, offset),
  add_import: (supplier_id, hos_id, date, ingredients, amount_paid, note) => importsDB.add_import(supplier_id, hos_id, date, ingredients, amount_paid, note),
  update_import: (import_id, supplier_id, date, ingredients, amount_paid, note) => importsDB.update_import(import_id, supplier_id, date, ingredients, amount_paid, note),
  delete_Import: (import_id) => importsDB.delete_Import(import_id),
  get_all_import_ingredients: (hos_id) => importsDB.get_all_import_ingredients(hos_id)
})
contextBridge.exposeInMainWorld('ingredientsDB', {
  get_ingredient: (ingredient_id) => ingredientsDB.get_ingredient(ingredient_id),
  get_hospital_ingredients: (hos_id) => ingredientsDB.get_hospital_ingredients(hos_id),
  create_ingredient: (hos_id, name, unit, return_cost, quantity) => ingredientsDB.create_ingredient(hos_id, name, unit, return_cost, quantity),
  update_ingredient: (ingredient_id, name, unit, return_cost, quantity) => ingredientsDB.update_ingredient(ingredient_id, name, unit, return_cost, quantity),
  delete_ingredient: (ingredient_id) => ingredientsDB.delete_ingredient(ingredient_id)
})
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

