import {get_db} from '../shared.js'

function get_ingredient(ingredient_id) {
    const db =get_db()
    const st = db.prepare('SELECT * FROM Ingredients WHERE id = ?')
    const row = st.get(ingredient_id)
    return row
}

function get_hospital_ingredients(hos_id) {
    const db = get_db()
    const st = db.prepare('SELECT * FROM Ingredients WHERE hos_id = ?')
    const rows = st.all(hos_id)
    return rows
}

function create_ingredient(hos_id,name,unit,return_cost , quantity){
    const db = get_db()
    const st = db.prepare('INSERT INTO Ingredients (hos_id, name, unit , return_cost, quantity) values (?,?,?,?,?)')
    const info = st.run(hos_id,name,unit,return_cost , quantity)
    const ingredient_id = info.lastInsertRowid
    return {"id":ingredient_id}
}

function update_ingredient(ingredient_id,name,unit,return_cost , quantity){
    const db = get_db()
    const st = db.prepare('UPDATE Ingredients SET name = ?, unit = ?, return_cost = ?, quantity = ? WHERE id = ?')
    st.run(name,unit,return_cost , quantity, ingredient_id)
}
function delete_ingredient(ingredient_id){
    const db = get_db()
    const st = db.prepare('DELETE FROM Ingredients WHERE id = ?')
    st.run(ingredient_id)
}

function update_ingredient_quantity(ingredient_id, quantity){
    const db = get_db()
    const st = db.prepare('UPDATE Ingredients SET quantity = ? + quantity WHERE id = ?')
    st.run(quantity, ingredient_id)
}

export {
    get_ingredient,
    get_hospital_ingredients,
    create_ingredient,
    update_ingredient,
    delete_ingredient,
    update_ingredient_quantity
}

export default {
    get_ingredient,
    get_hospital_ingredients,
    create_ingredient,
    update_ingredient,
    delete_ingredient
}