import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
const importsDB = require('../../main/db/hospital/imports')

contextBridge.exposeInMainWorld('importsDB', {
  get_import_count: (hos_id) => importsDB.get_import_count(hos_id),
  get_hospital_imports: (hos_id, limit, offset) => importsDB.get_hospital_imports(hos_id, limit, offset),
  get_supplier_imports: (hos_id, supplier_id, limit, offset) => importsDB.get_supplier_imports(hos_id, supplier_id, limit, offset),
  add_import: (supplier_id, hos_id, date, ingredients, amount_paid, note) => importsDB.add_import(supplier_id, hos_id, date, ingredients, amount_paid, note),
  update_import: (import_id, supplier_id, date, ingredients, amount_paid, note) => importsDB.update_import(import_id, supplier_id, date, ingredients, amount_paid, note),
  delete_Import: (import_id) => importsDB.delete_Import(import_id),
  get_all_import_ingredients: (hos_id) => importsDB.get_all_import_ingredients(hos_id)
})
