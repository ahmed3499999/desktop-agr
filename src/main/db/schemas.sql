PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS SupplierPayments;
DROP TABLE IF EXISTS ExportsIngredient;
DROP TABLE IF EXISTS MealsIngredients;
DROP TABLE IF EXISTS ImportsIngredients;
DROP TABLE IF EXISTS ImportsHistory;
DROP TABLE IF EXISTS Suppliers;
DROP TABLE IF EXISTS Meals;
DROP TABLE IF EXISTS Schedules;
DROP TABLE IF EXISTS PatientTypes;
DROP TABLE IF EXISTS ReturnsIngredients;
DROP TABLE IF EXISTS PerishedIngredients;
DROP TABLE IF EXISTS ExportsIngredients;
DROP TABLE IF EXISTS ExportsMeals;
DROP TABLE IF EXISTS ExportsHistory;
DROP TABLE IF EXISTS Ingredients;
DROP TABLE IF EXISTS Payments;
DROP TABLE IF EXISTS ReturnsHistory;
DROP TABLE IF EXISTS PerishedHistory;
DROP TABLE IF EXISTS Hospitals;

CREATE TABLE Hospitals (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    name TEXT NOT NULL
);

CREATE TABLE Users (
    username TEXT PRIMARY KEY NOT NULL,
    password TEXT NOT NULL,
    hos_id INTEGER NOT NULL,
    FOREIGN KEY (hos_id) REFERENCES Hospitals(id) ON DELETE CASCADE
);

CREATE TABLE Ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    hos_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    return_cost REAL NOT NULL DEFAULT 0.00,
    quantity REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (hos_id) REFERENCES Hospitals(id) ON DELETE CASCADE
);

CREATE TABLE ReturnsHistory (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    hos_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY (hos_id) REFERENCES Hospitals(id) ON DELETE CASCADE
);

CREATE TABLE ReturnsIngredients (
    return_id INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    PRIMARY KEY (return_id, ingredient_id),
    FOREIGN KEY (return_id) REFERENCES ReturnsHistory(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES Ingredients(id)
);

CREATE TABLE PerishedHistory (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    hos_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY (hos_id) REFERENCES Hospitals(id) ON DELETE CASCADE
);

CREATE TABLE PerishedIngredients (
    perished_id INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    PRIMARY KEY (perished_id, ingredient_id),
    FOREIGN KEY (perished_id) REFERENCES PerishedHistory(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES Ingredients(id)
);

CREATE TABLE Schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    hos_id INTEGER NOT NULL,
    patient_type TEXT NOT NULL,
    schedule_name TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT "",
    cost REAL NOT NULL,
    FOREIGN KEY (hos_id) REFERENCES Hospitals(id) ON DELETE CASCADE
);

CREATE TABLE Meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    schedule_id INTEGER NOT NULL,
    weekday INTEGER NOT NULL,
    UNIQUE (schedule_id, weekday),
    FOREIGN KEY (schedule_id) REFERENCES Schedules(id) ON DELETE CASCADE
);

CREATE TABLE MealsIngredients (
    meal_id INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    PRIMARY KEY (meal_id, ingredient_id),
    FOREIGN KEY (meal_id) REFERENCES Meals(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES Ingredients(id)
);

CREATE TABLE Suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    name TEXT NOT NULL,
    contact_info TEXT NOT NULL
);

CREATE TABLE ImportsHistory (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    hos_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    amount_paid REAL NOT NULL,
    note TEXT NOT NULL,
    FOREIGN KEY (supplier_id) REFERENCES Suppliers(id),
    FOREIGN KEY (hos_id) REFERENCES Hospitals(id) ON DELETE CASCADE
);

CREATE TABLE ImportsIngredients (
    import_id INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    unit_cost REAL NOT NULL,
    PRIMARY KEY (import_id, ingredient_id),
    FOREIGN KEY (import_id) REFERENCES ImportsHistory(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES Ingredients(id)
);

CREATE TABLE ExportsHistory (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    hos_id INTEGER NOT NULL,
    destination_hos_id INTEGER DEFAULT NULL,
    date TEXT NOT NULL,
    note TEXT NOT NULL,
    FOREIGN KEY (hos_id) REFERENCES Hospitals(id) ON DELETE CASCADE,
    FOREIGN KEY (destination_hos_id) REFERENCES Hospitals(id)
);

CREATE TABLE ExportsIngredients (
    export_id INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    PRIMARY KEY (export_id, ingredient_id),
    FOREIGN KEY (export_id) REFERENCES ExportsHistory(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES Ingredients(id)
);

CREATE TABLE ExportsMeals (
    export_id INTEGER NOT NULL,
    patient_type TEXT NOT NULL,
    schedule_name TEXT NOT NULL,
    quantity REAL NOT NULL,
    cost REAL NOT NULL,
    FOREIGN KEY (export_id) REFERENCES ExportsHistory(id) ON DELETE CASCADE
);

CREATE TABLE Payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    hos_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    purpose TEXT NOT NULL,
    cost REAL NOT NULL,
    FOREIGN KEY (hos_id) REFERENCES Hospitals(id) ON DELETE CASCADE
);

INSERT INTO Hospitals(id, name) VALUES (1, 'main');
INSERT INTO Users VALUES (
    'ahmed',
    'scrypt:32768:8:1$E4zoMvz3lLGOZHXo$1843b503744a7d685a03e97bdd64cc32378d8e949ec5707c702e69b886653ec8869636b44c0a1fcb18e6aaf94ec9d476388899b5f4abb2b2b6e287351d3f942c',
    1
);
INSERT INTO Suppliers VALUES (1, 'اخري', '');
INSERT INTO Suppliers VALUES (2, 'المخزن الرئيسي', '');
