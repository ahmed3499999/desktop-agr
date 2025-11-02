import fs from 'fs';
import { get_db } from './shared.js';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, 'schemas.sql');
fs.readFile(filePath, 'utf8', (err, data) =>{
    if (err) {
        console.error(err);
        return;
    }
    const db=get_db();
    db.exec(data);
    console.log('success reading file');
})