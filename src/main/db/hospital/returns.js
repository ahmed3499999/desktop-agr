import { get_db } from "../shared.js";
import { get_ingredient,update_ingredient_quantity} from "./ingredients.js";


function get_returns_count(hos_id) {
    const db = get_db();
    const st = db.prepare('SELECT COUNT(*) as count FROM ReturnsHistory WHERE hos_id = ?');
    const row = st.get(hos_id);
    return row.count;
}

function get_ingredients_return(return_id) {
    const db = get_db();
    const st =db.prepare('SELECT ingredient_id, quantity FROM ReturnsIngredients WHERE return_id = ?');
    const rows = st.all(return_id);
    if (rows.length === 0) {
        return null
    }
    let return_ingredients = [];
    for(let i=0; i<rows.length; i++){
        const ingredient = get_ingredient(rows[i].ingredient_id);
        return_ingredients.push({
            ingredient: ingredient,
            quantity: rows[i].quantity
        });
    }
    return return_ingredients;
}



function get_hospital_returns(hos_id,limit, offset) {
    console.log("Fetching returns for hospital ID:", hos_id, "with limit:", limit, "and offset:", offset);
    const db = get_db();
    const st = db.prepare('SELECT * FROM ReturnsHistory WHERE hos_id = ? LIMIT ? OFFSET ?');
    const rows = st.all(hos_id, limit, offset);
    if (rows.length === 0) {
        return [];
    }
    let returns = [];
    for(let i=0; i<rows.length; i++){
        const return_ingredients = get_ingredients_return(rows[i].id);
        returns.push({
            id: rows[i].id,
            hos_id: rows[i].hos_id,
            date: rows[i].date,
            ingredients: return_ingredients
        });
    }
    return {data:returns,count:get_returns_count(hos_id)};
}

function create_return(hos_id, ingredients, date) {
    const db = get_db();
    const transaction = get_db().transaction(() => {
        const db = get_db();
        const st = db.prepare('INSERT INTO ReturnsHistory (hos_id, date) VALUES (?, ?)');
        const info = st.run(hos_id, date);
        const return_id = info.lastInsertRowid;
        const st2 = db.prepare('INSERT INTO ReturnsIngredients (return_id, ingredient_id, quantity) VALUES (?, ?, ?)');

        for (let i = 0; i < ingredients.length; i++) {
            const db = get_db();
            st2.run(return_id, ingredients[i].ingredient_id, ingredients[i].quantity);
    

            update_ingredient_quantity(ingredients[i].ingredient_id, ingredients[i].quantity);
        }
        return return_id;
    });
    const return_id = transaction();
    return {"id":return_id};
}

function delete_return(return_id) {
    const db = get_db();
    const transaction = db.transaction(() => {
        const st = db.prepare('DELETE FROM ReturnsIngredients WHERE return_id = ?');
        st.run(return_id);
        const st2 = db.prepare('DELETE FROM ReturnsHistory WHERE id = ?');
        st2.run(return_id);
    });
    transaction();
}

function update_return(return_id, ingredients, date) {
    const db = get_db();
    const transaction = db.transaction(() => {
        const st = db.prepare('UPDATE ReturnsHistory SET date = ? WHERE id = ?');
        st.run(date, return_id);
        const st2 = db.prepare('DELETE FROM ReturnsIngredients WHERE return_id = ?');
        st2.run(return_id);
        for (let i = 0; i < ingredients.length; i++) {
            const st3 = db.prepare('INSERT INTO ReturnsIngredients (return_id, ingredient_id, quantity) VALUES (?, ?, ?)');
            st3.run(return_id, ingredients[i].ingredient_id, ingredients[i].quantity);
        }
    });
    transaction();
}

export {
    get_ingredients_return,
    get_hospital_returns,
    get_returns_count,
    create_return,
    delete_return,
    update_return
}

