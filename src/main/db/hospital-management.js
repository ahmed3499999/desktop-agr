import { get_db } from "./shared";

function get_hospitals() {
    const rows = get_db().prepare("SELECT * FROM Hospitals").all();
    return rows.map(row => ({
        hos_id: row.id,
        hos_name: row.name
    }));
}

function add_hospital(name) {
    const id = get_db().prepare("INSERT INTO Hospitals (name) VALUES (?)").run(name).lastInsertRowid;
    return { hos_id: id };
}

function update_hospital(hos_id, name) {
    get_db().prepare("UPDATE Hospitals SET name = ? WHERE id = ?").run(name, hos_id);
}

function delete_hospital(hos_id) {
    get_db().prepare("DELETE FROM Hospitals WHERE id = ?").run(hos_id);
}

export {
    get_hospitals,
    add_hospital,
    update_hospital,
    delete_hospital
}