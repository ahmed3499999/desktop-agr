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
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
);

CREATE TABLE Users (
    username TEXT PRIMARY KEY,
    password TEXT,
    hos_id INTEGER,
    FOREIGN KEY (hos_id) REFERENCES Hospitals(id) ON DELETE CASCADE
);

CREATE TABLE Ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hos_id INTEGER,
    name TEXT,
    unit TEXT,
    return_cost REAL,
    quantity INTEGER,
    FOREIGN KEY (hos_id) REFERENCES Hospitals(id) ON DELETE CASCADE
);

CREATE TABLE ReturnsHistory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hos_id INTEGER,
    date TEXT,
    FOREIGN KEY (hos_id) REFERENCES Hospitals(id) ON DELETE CASCADE
);

CREATE TABLE ReturnsIngredients (
    return_id INTEGER,
    ingredient_id INTEGER,
    quantity INTEGER,
    PRIMARY KEY (return_id, ingredient_id),
    FOREIGN KEY (return_id) REFERENCES ReturnsHistory(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES Ingredients(id)
);

CREATE TABLE PerishedHistory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hos_id INTEGER,
    date TEXT,
    FOREIGN KEY (hos_id) REFERENCES Hospitals(id) ON DELETE CASCADE
);

CREATE TABLE PerishedIngredients (
    perished_id INTEGER,
    ingredient_id INTEGER,
    quantity INTEGER,
    PRIMARY KEY (perished_id, ingredient_id),
    FOREIGN KEY (perished_id) REFERENCES PerishedHistory(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES Ingredients(id)
);

CREATE TABLE Schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hos_id INTEGER,
    patient_type TEXT,
    schedule_name TEXT,
    note TEXT,
    cost REAL,
    FOREIGN KEY (hos_id) REFERENCES Hospitals(id) ON DELETE CASCADE
);

CREATE TABLE Meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_id INTEGER,
    weekday INTEGER,
    UNIQUE (schedule_id, weekday),
    FOREIGN KEY (schedule_id) REFERENCES Schedules(id) ON DELETE CASCADE
);

CREATE TABLE MealsIngredients (
    meal_id INTEGER,
    ingredient_id INTEGER,
    quantity INTEGER,
    PRIMARY KEY (meal_id, ingredient_id),
    FOREIGN KEY (meal_id) REFERENCES Meals(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES Ingredients(id)
);

CREATE TABLE Suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    contact_info TEXT
);

CREATE TABLE ImportsHistory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hos_id INTEGER,
    supplier_id INTEGER,
    date TEXT,
    amount_paid REAL,
    note TEXT,
    FOREIGN KEY (supplier_id) REFERENCES Suppliers(id),
    FOREIGN KEY (hos_id) REFERENCES Hospitals(id) ON DELETE CASCADE
);

CREATE TABLE ImportsIngredients (
    import_id INTEGER,
    ingredient_id INTEGER,
    quantity INTEGER,
    unit_cost REAL,
    PRIMARY KEY (import_id, ingredient_id),
    FOREIGN KEY (import_id) REFERENCES ImportsHistory(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES Ingredients(id)
);

CREATE TABLE ExportsHistory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hos_id INTEGER,
    destination_hos_id INTEGER,
    date TEXT,
    note TEXT,
    FOREIGN KEY (hos_id) REFERENCES Hospitals(id) ON DELETE CASCADE,
    FOREIGN KEY (destination_hos_id) REFERENCES Hospitals(id)
);

CREATE TABLE ExportsIngredients (
    export_id INTEGER,
    ingredient_id INTEGER,
    quantity INTEGER,
    PRIMARY KEY (export_id, ingredient_id),
    FOREIGN KEY (export_id) REFERENCES ExportsHistory(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES Ingredients(id)
);

CREATE TABLE ExportsMeals (
    export_id INTEGER,
    patient_type TEXT,
    schedule_name TEXT,
    quantity INTEGER,
    cost REAL,
    FOREIGN KEY (export_id) REFERENCES ExportsHistory(id) ON DELETE CASCADE
);

CREATE TABLE Payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hos_id INTEGER,
    date TEXT,
    purpose TEXT,
    cost REAL,
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
