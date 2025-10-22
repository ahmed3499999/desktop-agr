const fs = require('fs')
const { get_db }= require('./shared.js')
const path = require('path')
const filePath = path.join(__dirname, 'schemas.sql');
const sql = fs.readFile(filePath, 'utf8', (err, data) =>{
    if (err) {
        console.error(err);
        return;
    }
    console.log('success reading file');
    db=get_db();
    db.exec(data);
})