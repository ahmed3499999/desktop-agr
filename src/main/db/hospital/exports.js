import {get_db} from '../shared.js'
import {get_ingredient,update_ingredient_quantity} from './ingredients.js'

function get_export_meals(export_id) {
    const db = get_db()
    const get_meals = db.prepare("SELECT * FROM ExportsMeals WHERE export_id = ?")
    const meals = get_meals.all(export_id)
    return meals
}

function get_export_ingredients(export_id) {
    const db = get_db()
    const st=db.prepare("SELECT * FROM ExportsIngredients WHERE export_id = ?")
    let rows=st.all(export_id)
    for (let i=0;i<rows.length;i++) {
        rows[i]['ingredient']=get_ingredient(rows[i]['ingredient_id'])
    }
    return rows
}

function get_exports(hos_id, limit, offset) {
    const db = get_db()
    const st=db.prepare("SELECT * FROM ExportsHistory WHERE hos_id = ? ORDER BY date DESC LIMIT ? OFFSET ?")
    const rows = st.all(hos_id, limit, offset)
    for (let i=0;i<rows.length;i++) {
        rows[i]['meals']=get_export_meals(rows[i]['id'])
        rows[i]['ingredients']=get_export_ingredients(rows[i]['id'])
    }
    return rows
}
function get_exports_count(hos_id) {
    const db = get_db()
    const st=db.prepare("SELECT COUNT(*) FROM ExportsHistory WHERE hos_id = ?")
    const row=st.get(hos_id)
    return row['COUNT(*)']
}

function create_export(hos_id,dest_hos_id,note,date,meeals,ingredients) {
    const db = get_db()
    const transaction = db.transaction(() => {
        const st = db.prepare("INSERT INTO ExportsHistory (hos_id, destination_hos_id, note, date) VALUES (?, ?, ?, ?)")
        const info = st.run(hos_id, dest_hos_id, note, date)
        const export_id = info.lastInsertRowid
        const st_meals = db.prepare("INSERT INTO ExportsMeals  VALUES (?,?,?,?,?)")
        for (let i = 0; i < meeals.length; i++) {
            st_meals.run(export_id, meeals[i].patient_type, meeals[i].schedule_name, meeals[i].qunatity, meeals[i].cost)
        }
        const st_ingredients = db.prepare("INSERT INTO ExportsIngredients  VALUES (?,?,?)")
        for (let i = 0; i < ingredients.length; i++) {
            st_ingredients.run(export_id, ingredients[i].ingredient_id, ingredients[i].quantity)
            update_ingredient_quantity(ingredients[i].ingredient_id, -ingredients[i].quantity)
        }
    })
    transaction()
}
// create_export(1,1,"note","2024-10-10",[{patient_type:"adult",schedule_name:"standard",qunatity:10,cost:5}],[{ingredient_id:1,quantity:2}])

function delete_export(export_id) {
    const db = get_db()
    const transaction = db.transaction(() => {
        const st = db.prepare("DELETE FROM ExportsMeals WHERE export_id = ?")
        st.run(export_id)
        const st2 = db.prepare("DELETE FROM ExportsIngredients WHERE export_id = ?")
        st2.run(export_id)
        const st3 = db.prepare("DELETE FROM ExportsHistory WHERE id = ?")
        st3.run(export_id)
    })
    transaction()
}

function update_export(export_id, dest_hos_id, note, date, meeals, ingredients) {
    const db = get_db()
    const transaction = db.transaction(() => {
        const st = db.prepare("UPDATE ExportsHistory SET destination_hos_id = ?, note = ?, date = ? WHERE id = ?")
        st.run(dest_hos_id, note, date, export_id)
        const st2 = db.prepare("DELETE FROM ExportsMeals WHERE export_id = ?")
        st2.run(export_id)
        const st_meals = db.prepare("INSERT INTO ExportsMeals  VALUES (?,?,?,?,?)")
        for (let i = 0; i < meeals.length; i++) {
            st_meals.run(export_id, meeals[i].patient_type, meeals[i].schedule_name, meeals[i].qunatity, meeals[i].cost)
        }
        const st3 = db.prepare("DELETE FROM ExportsIngredients WHERE export_id = ?")
        st3.run(export_id)
        const st_ingredients = db.prepare("INSERT INTO ExportsIngredients  VALUES (?,?,?)")
        for (let i = 0; i < ingredients.length; i++) {
            st_ingredients.run(export_id, ingredients[i].ingredient_id, ingredients[i].quantity)
        }
    })
    transaction()
}
export {
    get_exports,
    get_exports_count,
    create_export,
    delete_export,
    update_export
}
