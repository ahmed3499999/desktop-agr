const database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')
const { get_db } = require('../shared.js')
const { get } = require('http')

function get_ingredient(ingredient_id) {
    const db =get_db()
    const st = db.prepare('SELECT * FROM Ingredients WHERE id = ?')
    const row = st.get(ingredient_id)
    db.close()
    return row
}

function get_hospital_ingredients(hos_id) {
    const db = get_db()
    const st = db.prepare('SELECT * FROM Ingredients WHERE hos_id = ?')
    const rows = st.all(hos_id)
    db.close()
    return rows
}
function create_ingredient(hos_id,name,unit,return_cost , quantity){
    const db = get_db()
    const st = db.prepare('INSERT INTO Ingredients (hos_id, name, unit , return_cost, quantity) values (?,?,?,?,?)')
    const transaction = db.transaction((hos_id,name,unit,return_cost , quantity) => {
        st.run(hos_id,name,unit,return_cost , quantity)
    })
    transaction(hos_id,name,unit,return_cost , quantity)   
    const ingredient_id = st.lastInsertRowid
    db.close()
    return ingredient_id
}
function update_ingredient(ingredient_id,name,unit,return_cost , quantity){
    const db = get_db()
    const st = db.prepare('UPDATE Ingredients SET name = ?, unit = ?, return_cost = ?, quantity = ? WHERE id = ?')
    const transaction = db.transaction((ingredient_id,name,unit,return_cost , quantity) => {
        st.run(name,unit,return_cost , quantity, ingredient_id)
    })
    transaction(ingredient_id,name,unit,return_cost , quantity)   
    db.close()
}
function delete_ingredient(ingredient_id){
    const db = get_db()
    const st = db.prepare('DELETE FROM Ingredients WHERE id = ?')
    const transaction = db.transaction((ingredient_id) => {
        st.run(ingredient_id)
    })
    transaction(ingredient_id)   
    db.close()
}

module.exports = {
    get_ingredient,
    get_hospital_ingredients,
    create_ingredient,
    update_ingredient,
    delete_ingredient
}