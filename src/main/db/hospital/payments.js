import {get_db} from '../shared.js'


function get_pymetnt_count(hos_id) {
    const db = get_db()
    const st = db.prepare('SELECT COUNT(*) as count FROM payments WHERE hos_id = ?')
    const row = st.get(hos_id)
    return row.count
}
function get_payment(hos_id, limit, offset) {
    const db = get_db()
    const st = db.prepare('SELECT * FROM payments WHERE hos_id = ? ORDER BY date DESC LIMIT ? OFFSET ?')
    const rows = st.all(hos_id, limit, offset)
    if (rows.length === 0) {
        return []
    }
    for (let i = 0; i < rows.length; i++) {
        rows[i].date = new Date(rows[i].date).toISOString()
    }
    return {data: rows, count: get_pymetnt_count(hos_id)}
}

function create_payment(hos_id, date, purpose, cost) {
    const db = get_db()
    const st = db.prepare('INSERT INTO payments (hos_id, date, purpose, cost) values (?,?,?,?)')
    const info = st.run(hos_id, date, purpose, cost)
    return info.lastInsertRowid
}


function delete_payment(payment_id) {
    const db = get_db()
    const st = db.prepare('DELETE FROM payments WHERE id = ?')
    st.run(payment_id)
}
function update_payment(payment_id, date, purpose, cost) {
    const db = get_db()
    const st = db.prepare('UPDATE payments SET date = ?, purpose = ?, cost = ? WHERE id = ?')
    st.run(date, purpose, cost, payment_id)
}
export {
    get_payment,
    create_payment,
    delete_payment,
    update_payment
}