import { get_db } from "../shared.js";
import { get_ingredient,update_ingredient_quantity} from "./ingredients.js";

function get_perished_count(hos_id) {
    const db = get_db();
    const st = db.prepare('SELECT COUNT(*) as count FROM PerishedHistory WHERE hos_id = ?');
    const row = st.get(hos_id);
    return row.count;
}

function get_all_perished_ingredients(perished_id){
    const db = get_db();
    const st =db.prepare('SELECT ingredient_id, quantity FROM PerishedIngredients WHERE perished_id = ?');
    let rows = st.all(perished_id);
    if (rows.length === 0) {
        return [];
    }
    let perished_ingredients = [];
    for(let i=0; i<rows.length; i++){
        const ingredient = get_ingredient(rows[i].ingredient_id);
        perished_ingredients.push({
            ingredient: ingredient,
            quantity: rows[i].quantity
        });
    }
    return perished_ingredients;
}
function get_hospital_perished(hos_id, limit, offset) {
    const db = get_db();
    const st = db.prepare('SELECT * FROM PerishedHistory WHERE hos_id = ? ORDER BY date DESC LIMIT ? OFFSET ?');
    const rows = st.all(hos_id, limit, offset);
    if (rows.length === 0) {
        return [];
    }
    let perisheds = [];
    for(let i=0; i<rows.length; i++){
        const perished_ingredients = get_all_perished_ingredients(rows[i].id);
        perisheds.push({
            id: rows[i].id,
            date: rows[i].date,
            ingredients: perished_ingredients
        });
    }
    return {data:perisheds,count:get_perished_count(hos_id)};
}

function create_perished(hos_id, ingredients, date) {
    const db = get_db();    
    const transaction = get_db().transaction(() => {
        const db = get_db();
        const st = db.prepare('INSERT INTO PerishedHistory (hos_id, date) VALUES (?, ?)');
        const info = st.run(hos_id, date);
        const perished_id = info.lastInsertRowid;
        const st2 = db.prepare('INSERT INTO PerishedIngredients (perished_id, ingredient_id, quantity) VALUES (?, ?, ?)');
        for (let i = 0; i < ingredients.length; i++) {
            const db = get_db();
            st2.run(perished_id, ingredients[i].ingredient_id, ingredients[i].quantity);
            update_ingredient_quantity(ingredients[i].ingredient_id, -ingredients[i].quantity);
        }
        return perished_id;
    });
    return transaction();
}
function delete_perished(perished_id) {
    const db = get_db();    
    const transaction = get_db().transaction(() => {
        const db = get_db();
        const st = db.prepare('DELETE FROM PerishedIngredients WHERE perished_id = ?');
        st.run(perished_id);
        const st2 = db.prepare('DELETE FROM PerishedHistory WHERE id = ?');
        st2.run(perished_id);
    }
    );
    transaction();
}
function update_perished(perished_id, ingredients, date) {
    const db = get_db();
    const transaction = get_db().transaction(() => {
        const db = get_db();
        const st = db.prepare('UPDATE PerishedHistory SET date = ? WHERE id = ?');
        st.run(date, perished_id);
        const st2 = db.prepare('DELETE FROM PerishedIngredients WHERE perished_id = ?');
        st2.run(perished_id);
        const st3 = db.prepare('INSERT INTO PerishedIngredients (perished_id, ingredient_id, quantity) VALUES (?, ?, ?)');
        for (let i = 0; i < ingredients.length; i++) {
            const db = get_db();
            st3.run(perished_id, ingredients[i].ingredient_id, ingredients[i].quantity);
        }
    });
    transaction();
}
export {
    get_hospital_perished,
    get_perished_count,
    create_perished,
    delete_perished,
    update_perished,
    get_all_perished_ingredients
};
