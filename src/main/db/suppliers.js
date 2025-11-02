import { get_db } from "./shared";

function get_supplier(supplier_id) {
    const st = get_db().prepare("SELECT * FROM Suppliers WHERE id = ?")
    return st.get(supplier_id)
}

function get_all_suppliers() {
    const st = get_db().prepare("SELECT * FROM Suppliers")
    return st.all()
}

function get_suppliers_payments(supplier_id, limit, offset) {
    const st = get_db().prepare("SELECT id, date, amount_paid, note FROM ImportsHistory WHERE supplier_id = ? AND NOT id IN (SELECT import_id FROM ImportsIngredients) ORDER BY date DESC LIMIT ? OFFSET ?")
    return { data: st.all(supplier_id, limit, offset), total: get_suppliers_payments_count(supplier_id) }
}

function get_suppliers_payments_count(supplier_id) {
    const st = get_db().prepare("SELECT COUNT(*) FROM ImportsHistory WHERE supplier_id = ? AND NOT id IN (SELECT import_id FROM ImportsIngredients)")
    return st.get(supplier_id)["COUNT(*)"]
}

function get_supplier_debt(hos_id, supplier_id) {
    const st = get_db().prepare(`
            SELECT 
                COALESCE(SUM(IH.amount_paid), 0) AS total_paid,
                COALESCE(SUM(II.quantity * II.unit_cost), 0) AS total_cost
            FROM ImportsHistory IH
            LEFT JOIN ImportsIngredients II ON IH.id = II.import_id
            WHERE IH.supplier_id = ? AND IH.hos_id = ?`)
    const row = st.get(supplier_id, hos_id)
    return { debt: row.total_cost - row.total_paid }
}

function create_supplier(name, contact_info) {
    const st = get_db().prepare("INSERT INTO Suppliers (name, contact_info) VALUES (?, ?)")
    const info = st.run(name, contact_info)
    return { supplier_id: info.lastInsertRowid}
}

function update_supplier(supplier_id, name, contact_info) {
    const st = get_db().prepare("UPDATE Suppliers SET name = ?, contact_info = ? WHERE id = ?")
    st.run(name, contact_info, supplier_id)
}

export {
    get_supplier,
    get_all_suppliers,
    get_suppliers_payments,
    get_supplier_debt,
    create_supplier,
    update_supplier
}