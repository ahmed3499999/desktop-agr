// db.js
import Database from 'better-sqlite3';

let db;
let app; // will hold Electron's app if available

try {
  // Dynamically import Electron only if it's present
  const electron = await import('electron');
  app = electron.app;
} catch {
  // Not running in Electron — ignore
  app = null;
}

export function get_db() {
  if (!db) {
    db = new Database('D:/agr.db');
    setupAutoClose();
  }
  return db;
}

function setupAutoClose() {
  // In Electron
  if (app) {
    app.on('will-quit', () => {
      if (db && !db.closed) {
        console.log('Closing SQLite database (Electron)...');
        db.close();
        db = null;
      }
    });
  }

  // In Node.js or tests
  process.on('exit', () => {
    if (db && !db.closed) {
      db.close();
      db = null;
    }
  });
}