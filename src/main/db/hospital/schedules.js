import { get_db } from "../shared.js";
import { get_ingredient } from "./ingredients.js";

function get_meals_ingredients(meal_ids) {
    const db = get_db();
    const st = db.prepare('SELECT * FROM MealsIngredients WHERE meal_id = ?');
    const row = st.all(meal_ids);
    let meals_ingredients = []
    for (let i = 0; i < row.length; i++) {
        const ingredient = get_ingredient(row[i].ingredient_id);
        meals_ingredients.push({
            ingredient: ingredient,
            quantity: row[i].quantity
        });
    }  
    return meals_ingredients;
}

function get_schedule_meals(schedule_id) {
    const db =get_db();
    const st = db.prepare('SELECT * FROM Meals WHERE schedule_id = ?');
    const row = st.all(schedule_id);
    for (let i = 0; i < row.length; i++) {
        row[i].ingredients = get_meals_ingredients([row[i].id]);
    }
    return row;
}
function get_hospital_schedules(hos_id) {
    const db = get_db();
    const st = db.prepare('SELECT * FROM Schedules WHERE hos_id = ? ');
    const row = st.all(hos_id);
    let schedules = []
    for (let i = 0; i < row.length; i++) {
        const meals = get_schedule_meals(row[i].id);
        schedules.push({
            'schedule_id': row[i].id,
            'hos_id': row[i].hos_id,
            'patient_type': row[i].patient_type,
            'schedule_name': row[i].schedule_name,
            'meals': meals,
            'cost': row[i].cost,
            'note': row[i].note
        });
    }
    return schedules;
}
function create_schedule(hos_id, patient_type, schedule_name, note, cost) {
    const db = get_db();
    const st = db.prepare('INSERT INTO Schedules (hos_id, patient_type, schedule_name, note, cost) VALUES (?,?,?,?,?)');
    const info = st.run(hos_id, patient_type, schedule_name, note, cost);
    return info.lastInsertRowid;
}

function delete_schedule(schedule_id) {
    const db = get_db();
    const st = db.prepare('SELECT id FROM Meals WHERE schedule_id = ?');
    const meals = st.all(schedule_id);
    for (let i = 0; i < meals.length; i++) {
        const del_st = db.prepare('DELETE FROM MealsIngredients WHERE meal_id = ?');
        del_st.run(meals[i].id);
    }
    const del_meal_st = db.prepare('DELETE FROM Meals WHERE schedule_id = ?');
    del_meal_st.run(schedule_id);
    const del_schedule_st = db.prepare('DELETE FROM Schedules WHERE id = ?');
    del_schedule_st.run(schedule_id);
}
delete_schedule(1);
function update_schedule(schedule_id,  schedule_name,patient_type, note, cost) {
    const db =get_db();
    const st = db.prepare('UPDATE Schedules SET schedule_name = ?, patient_type = ?, note = ?, cost = ? WHERE id = ?');
    st.run(schedule_name, patient_type, note, cost, schedule_id);
}
function create_schedule_meal(schedule_id, weekday, ingredients) {
    const db = get_db();
    const st = db.prepare('INSERT INTO Meals (schedule_id, weekday) VALUES (?, ?)');
    const info = st.run(schedule_id, weekday);
    const meal_id = info.lastInsertRowid;
    const ing_st = db.prepare('INSERT INTO MealsIngredients (meal_id, ingredient_id, quantity) VALUES (?, ?, ?)');
    for (let i = 0; i < ingredients.length; i++) {
        ing_st.run(meal_id, ingredients[i].ingredient_id, ingredients[i].quantity);
    }
    return meal_id;
}
function update_schedule_meal(meal_id, ingredients) {
    const db = get_db();
    const del_st = db.prepare('DELETE FROM MealsIngredients WHERE meal_id = ?');
    del_st.run(meal_id);
    const ing_st = db.prepare('INSERT INTO MealsIngredients (meal_id, ingredient_id, quantity) VALUES (?, ?, ?)');
    for (let i = 0; i < ingredients.length; i++) {
        ing_st.run(meal_id, ingredients[i].ingredient_id, ingredients[i].quantity);
    }
}
export {
    get_hospital_schedules,
    create_schedule,
    delete_schedule,
    update_schedule,
    create_schedule_meal,
    update_schedule_meal
};