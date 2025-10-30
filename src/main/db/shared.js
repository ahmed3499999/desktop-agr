import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'


export function get_db(){
    const db = new Database("D:/agr.db")
    return db
}