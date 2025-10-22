const database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')
const { get_db } = require('../shared.js')

function get_import_count(hos_id) {
    const db = get_db();
    const st = db.prepare('  SELECT COUNT(*) FROM ImportsHistory WHERE hos_id = ? AND id IN (SELECT import_id FROM ImportsIngredients)')
    const row = st.get(hos_id)
    db.close()
    return row['COUNT(*)']
}


function get_all_import_ingredients(hos_id) {
    const db = get_db();
    const st = db.prepare('SELECT ingredient_id,quantity,unit_cost FROM ImportsIngredients WHERE import_id = ?')
    const rows = st.all(hos_id)
    db.close()
    return rows
}

function get_supplier_imports(hos_id, supplier_id, limit, offset) {
    const db = get_db()
    const st = db.prepare("SELECT * FROM ImportsHistory WHERE hos_id = ? AND supplier_id = ? AND id IN (SELECT import_id FROM ImportsIngredients) ORDER BY date DESC LIMIT ? OFFSET ?")
    const rows = st.all(hos_id, supplier_id, limit, offset)
    for (let i = 0; i < rows.length; i++) {
        rows[i]['ingredients'] = get_all_import_ingredients(rows[i]['id'])
    }
    db.close()
    return rows
}

function get_hospital_imports(hos_id, limit, offset) {
    const db = get_db()
    const st = db.prepare("SELECT * FROM ImportsHistory WHERE hos_id = ? AND id IN (SELECT import_id FROM ImportsIngredients) ORDER BY date DESC LIMIT ? OFFSET ?")
    const rows = st.all(hos_id, limit, offset)
    for (let i = 0; i < rows.length; i++) {
        rows[i]['ingredients'] = get_all_import_ingredients(rows[i]['id'])
    }
    db.close()
    return rows
}

function add_import(supplier_id, hos_id, date, ingredients, amount_paid, note) {
    const db = get_db()
    const insert_import = db.prepare("INSERT INTO ImportsHistory (supplier_id, hos_id, date, amount_paid, note) VALUES (?, ?, ?, ?, ?)")
    const result = insert_import.run(supplier_id, hos_id, date, amount_paid, note)
    const import_id = result.lastInsertRowid
    const insert_ingredient = db.prepare("INSERT INTO ImportsIngredients (import_id, ingredient_id, quantity, unit_cost) VALUES (?, ?, ?, ?)")
    const insert_ingredient_transaction = db.transaction((ingredients) => {
        for (const ingredient of ingredients) {
            insert_ingredient.run(import_id, ingredient.ingredient_id, ingredient.quantity, ingredient.unit_cost)
        }
    })
    insert_ingredient_transaction(ingredients)
    db.close()
    return import_id
}

function update_import(import_id, supplier_id, date, ingredients, amount_paid, note) {
    const db = get_db()
    const update_import = db.prepare("UPDATE ImportsHistory SET supplier_id = ?, date = ?, amount_paid = ?, note = ? WHERE id = ?")
    update_import.run(supplier_id, date, amount_paid, note, import_id)
    const delete_ingredients = db.prepare("DELETE FROM ImportsIngredients WHERE import_id = ?")
    delete_ingredients.run(import_id)
    const insert_ingredient = db.prepare("INSERT INTO ImportsIngredients (import_id, ingredient_id, quantity, unit_cost) VALUES (?, ?, ?, ?)")
    const insert_ingredient_transaction = db.transaction((ingredients) => {
        for (const ingredient of ingredients) {
            insert_ingredient.run(import_id, ingredient.ingredient_id, ingredient.quantity, ingredient.unit_cost)
        }
    })
    insert_ingredient_transaction(ingredients)
    db.close()
    return import_id
}

function delete_Import(import_id) {
    const db = get_db()
    const delete_ingredients = db.prepare('DELETE FROM ImportsIngredients WHERE import_id = ?')
    delete_ingredients.run(import_id)
    const delete_import = db.prepare("DELETE FROM ImportsHistory WHERE id = ?")
    delete_import.run(import_id)
    db.close()
}
module.exports = {
    get_import_count,
    get_hospital_imports,
    get_supplier_imports,
    add_import,
    update_import,
    delete_Import,
    get_all_import_ingredients
}

console.log(get_all_import_ingredients(1))