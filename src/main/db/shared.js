const Database = require('better-sqlite3')
const path = require('path')
const filePath = path.join(__dirname, 'agr.db');

function get_db(){
    const db = new Database(filePath)
    return db
}

module.exports = {
    get_db
}