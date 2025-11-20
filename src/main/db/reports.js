// reports.js
import { get_db } from "./shared";

function placeholders(arr) {
  return arr.map(() => '?').join(',');
}

function sumArray(rows, key) {
  return rows.reduce((acc, r) => acc + (Number(r[key] || 0)), 0);
}

function ensureArray(x) {
  if (x == null) return [];
  return Array.isArray(x) ? x : [x];
}

export function supplierReport(supplierId, startDate, endDate, reportType) {
  const db = get_db();
  const period =
    reportType === "yearly" ? "%Y" : reportType === "monthly" ? "%Y-%m" : "%Y-%m-%d";

  // query rows for period
  const sql = `
    SELECT
      strftime('${period}', date) AS period,
      SUM(amount_paid) AS total_paid,
      COALESCE(SUM(unit_cost * quantity), 0) AS total_due
    FROM ImportsHistory
    LEFT JOIN ImportsIngredients ON ImportsHistory.id = ImportsIngredients.import_id
    WHERE supplier_id = ?
      AND date BETWEEN ? AND ?
    GROUP BY period
    ORDER BY period;
  `;
  const rows = db.prepare(sql).all(supplierId, startDate, endDate);

  const periodDebt =
    sumArray(rows, "total_due") - sumArray(rows, "total_paid");

  const totalSql = `
    SELECT
      SUM(unit_cost * quantity) - SUM(amount_paid) AS total_debt
    FROM ImportsHistory
    LEFT JOIN ImportsIngredients ON ImportsHistory.id = ImportsIngredients.import_id
    WHERE supplier_id = ?;
  `;
  const totalRow = db.prepare(totalSql).get(supplierId);
  const totalDebt = totalRow ? Number(totalRow.total_debt || 0) : 0;

  return {
    rows,
    period_debt: periodDebt,
    total_debt: totalDebt,
  };
}


export function paymentsReport(hospitalId, startDate, endDate, reportType) {
  const db = get_db();
  let rows;
  if (reportType === "daily") {
    const sql = `
      SELECT
        strftime('%Y-%m-%d', date) AS period,
        cost AS total_paid,
        purpose
      FROM Payments
      WHERE hos_id = ?
        AND date BETWEEN ? AND ?
      ORDER BY period;
    `;
    rows = db.prepare(sql).all(hospitalId, startDate, endDate);

    // transform into daily grouped structure with purposes
    const dailyRows = {};
    for (const r of rows) {
      const p = r.period;
      if (!dailyRows[p]) dailyRows[p] = { purposes: {} };
      dailyRows[p].purposes[r.purpose] = (dailyRows[p].purposes[r.purpose] || 0) + Number(r.total_paid || 0);
    }
    for (const k of Object.keys(dailyRows)) {
      dailyRows[k].total = Object.values(dailyRows[k].purposes).reduce((a, b) => a + b, 0);
    }
    const total = Object.values(dailyRows).reduce((a, b) => a + (b.total || 0), 0);
    return { rows: dailyRows, total };
  } else {
    const period = reportType === "yearly" ? "%Y" : "%Y-%m";
    const sql = `
      SELECT
        strftime('${period}', date) AS period,
        SUM(cost) AS total_paid
      FROM Payments
      WHERE hos_id = ?
        AND date BETWEEN ? AND ?
      GROUP BY period
      ORDER BY period;
    `;
    rows = db.prepare(sql).all(hospitalId, startDate, endDate);
    const total = sumArray(rows, "total_paid");
    return { rows, total };
  }
}


export function importReport(supplierIds, hospitalId, ingredientIds, startDate, endDate, reportType) {
  const db = get_db();
  supplierIds = ensureArray(supplierIds);
  ingredientIds = ensureArray(ingredientIds);

  const doFilterSuppliers = supplierIds.length > 0;
  const doFilterIngredients = ingredientIds.length > 0;

  const period =
    reportType === "yearly" ? "%Y" : reportType === "monthly" ? "%Y-%m" : "%Y-%m-%d";

  const whereSupplier = doFilterSuppliers ? `ImportsHistory.supplier_id IN (${placeholders(supplierIds)})` : `1=1`;
  const whereIngredient = doFilterIngredients ? `ImportsIngredients.ingredient_id IN (${placeholders(ingredientIds)})` : `1=1`;

  const sql = `
    SELECT
      strftime('${period}', date) AS period,
      Ingredients.name AS ingredient_name,
      Ingredients.unit AS unit,
      ImportsIngredients.quantity AS quantity,
      Suppliers.name AS supplier_name,
      ImportsIngredients.unit_cost AS unit_cost,
      (ImportsIngredients.unit_cost * ImportsIngredients.quantity) AS total_cost
    FROM ImportsHistory
    JOIN ImportsIngredients ON ImportsHistory.id = ImportsIngredients.import_id
    JOIN Ingredients ON ImportsIngredients.ingredient_id = Ingredients.id
    JOIN Suppliers ON ImportsHistory.supplier_id = Suppliers.id
    WHERE ${whereSupplier}
      AND ImportsHistory.hos_id = ?
      AND ${whereIngredient}
      AND date BETWEEN ? AND ?
    ORDER BY period, Ingredients.name;
  `;

  const params = [];
  if (doFilterSuppliers) params.push(...supplierIds);
  params.push(hospitalId);
  if (doFilterIngredients) params.push(...ingredientIds);
  params.push(startDate, endDate);

  const rows = db.prepare(sql).all(...params);

  // group by period
  const grouped = {};
  for (const r of rows) {
    const p = r.period;
    if (!grouped[p]) grouped[p] = { ingredients: [], total_cost: 0 };
    grouped[p].ingredients.push({
      name: r.ingredient_name,
      unit: r.unit,
      cost: Number(r.unit_cost || 0),
      quantity: Number(r.quantity || 0),
      supplier: r.supplier_name,
      total_cost: Number(r.total_cost || 0),
    });
    grouped[p].total_cost += Number(r.total_cost || 0);
  }

  // totals across selections (ingredients summary)
  let totals = [];
  if (supplierIds.length === 0) {
    // if user did not restrict suppliers but we still need totals for selected ingredientIds/hospital/date
    // We'll query only by ingredientIds if present, else all.
  }
  // totals query requires ingredientIds to not be empty to match original behavior.
  const totalsWhereSupplier = supplierIds.length > 0 ? `supplier_id IN (${placeholders(supplierIds)})` : `1=1`;
  const totalsWhereIngredients = ingredientIds.length > 0 ? `ImportsIngredients.ingredient_id IN (${placeholders(ingredientIds)})` : `1=1`;

  const totalsSql = `
    SELECT 
      Ingredients.name AS ingredient_name,
      SUM(ImportsIngredients.quantity) AS total_quantity,
      SUM(ImportsIngredients.unit_cost * ImportsIngredients.quantity) AS total_cost
    FROM ImportsHistory
    JOIN ImportsIngredients ON ImportsHistory.id = ImportsIngredients.import_id
    JOIN Ingredients ON ImportsIngredients.ingredient_id = Ingredients.id
    WHERE ${totalsWhereSupplier}
      AND ImportsHistory.hos_id = ?
      AND ${totalsWhereIngredients}
      AND date BETWEEN ? AND ?
    GROUP BY Ingredients.name;
  `;

  const totalsParams = [];
  if (supplierIds.length > 0) totalsParams.push(...supplierIds);
  totalsParams.push(hospitalId);
  if (ingredientIds.length > 0) totalsParams.push(...ingredientIds);
  totalsParams.push(startDate, endDate);

  totals = db.prepare(totalsSql).all(...totalsParams);

  return { rows: grouped, totals };
}

/**
 * returnsReport(hospitalId, ingredientIds, startDate, endDate, reportType)
 * ingredientIds is array (may be empty -> all)
 */
export function returnsReport(hospitalId, ingredientIds, startDate, endDate, reportType) {
  const db = get_db();
  ingredientIds = ensureArray(ingredientIds);

  const period =
    reportType === "yearly" ? "%Y" : reportType === "monthly" ? "%Y-%m" : "%Y-%m-%d";

  const whereIngredients = ingredientIds.length > 0 ? `RI.ingredient_id IN (${placeholders(ingredientIds)})` : `1=1`;

  const sql = `
    SELECT
      strftime('${period}', date) AS period,
      Ingredients.return_cost AS return_cost,
      Ingredients.name AS name,
      Ingredients.unit AS unit,
      RI.quantity AS quantity,
      Ingredients.return_cost * RI.quantity AS total
    FROM ReturnsHistory AS RH
    INNER JOIN ReturnsIngredients AS RI ON RH.id = RI.return_id
    INNER JOIN Ingredients ON RI.ingredient_id = Ingredients.id
    WHERE RH.hos_id = ?
      AND ${whereIngredients}
      AND date BETWEEN ? AND ?
    ORDER BY period;
  `;

  const params = [hospitalId];
  if (ingredientIds.length > 0) params.push(...ingredientIds);
  params.push(startDate, endDate);

  const rows = db.prepare(sql).all(...params);

  const grouped = {};
  for (const r of rows) {
    const p = r.period;
    if (!grouped[p]) grouped[p] = { ingredients: [], total: 0 };
    grouped[p].ingredients.push({
      name: r.name,
      unit: r.unit,
      cost: Number(r.return_cost || 0),
      quantity: Number(r.quantity || 0),
    });
    grouped[p].total += Number(r.total || 0);
  }

  const totalCost = Object.values(grouped).reduce((acc, v) => acc + (v.total || 0), 0);

  // total ingredients aggregated across periods
  const totalIngredients = {};
  for (const periodObj of Object.values(grouped)) {
    for (const ing of periodObj.ingredients) {
      totalIngredients[ing.name] = (totalIngredients[ing.name] || 0) + ing.quantity;
    }
  }

  return { rows: grouped, total_cost: totalCost, total_ingredients: totalIngredients };
}

/**
 * perishedReport(hospitalId, ingredientIds, startDate, endDate, reportType)
 */
export function perishedReport(hospitalId, ingredientIds, startDate, endDate, reportType) {
  const db = get_db();
  ingredientIds = ensureArray(ingredientIds);

  const period =
    reportType === "yearly" ? "%Y" : reportType === "monthly" ? "%Y-%m" : "%Y-%m-%d";

  const whereIngredients = ingredientIds.length > 0 ? `PI.ingredient_id IN (${placeholders(ingredientIds)})` : `1=1`;

  const sql = `
    SELECT
      strftime('${period}', date) AS period,
      Ingredients.name AS name,
      Ingredients.unit AS unit,
      PI.quantity AS quantity
    FROM PerishedIngredients AS PI
    INNER JOIN Ingredients ON PI.ingredient_id = Ingredients.id
    JOIN PerishedHistory AS PH ON PI.perished_id = PH.id
    WHERE PH.hos_id = ?
      AND ${whereIngredients}
      AND date BETWEEN ? AND ?
    ORDER BY date DESC;
  `;

  const params = [hospitalId];
  if (ingredientIds.length > 0) params.push(...ingredientIds);
  params.push(startDate, endDate);

  const rows = db.prepare(sql).all(...params);

  // Group
  const grouped = {};
  for (const r of rows) {
    const p = r.period;
    const name = r.name;
    const unit = r.unit;
    const qty = Number(r.quantity || 0);
    if (!grouped[p]) grouped[p] = { ingredients: {} };
    if (!grouped[p].ingredients[name]) grouped[p].ingredients[name] = { name, unit, quantity: 0 };
    grouped[p].ingredients[name].quantity += qty;
  }

  // convert ingredients maps to arrays
  for (const p of Object.keys(grouped)) {
    grouped[p].ingredients = Object.values(grouped[p].ingredients);
  }

  // totals
  const totalsSql = `
    SELECT 
      Ingredients.name AS ingredient_name,
      SUM(PI.quantity) AS total_quantity
    FROM PerishedIngredients AS PI
    INNER JOIN Ingredients ON PI.ingredient_id = Ingredients.id
    JOIN PerishedHistory AS PH ON PI.perished_id = PH.id
    WHERE PH.hos_id = ?
      AND ${whereIngredients}
      AND date BETWEEN ? AND ?
    GROUP BY Ingredients.name;
  `;
  const totals = db.prepare(totalsSql).all(...params);

  return { rows: grouped, totals };
}

/**
 * mealsReport(hospitalId, startDate, endDate, reportType)
 * Returns grouped by period: meals list + ingredients list + period totals
 */
export function mealsReport(hospitalId, startDate, endDate, reportType) {
  const db = get_db();
  const period =
    reportType === "yearly" ? "%Y" : reportType === "monthly" ? "%Y-%m" : "%Y-%m-%d";

  const mealsSql = `
    SELECT
      strftime('${period}', EH.date) AS period,
      EM.patient_type AS patient_type,
      EM.schedule_name AS schedule_name,
      EM.quantity AS quantity,
      EM.cost AS cost,
      EM.cost * EM.quantity AS total_cost
    FROM ExportsHistory AS EH
    INNER JOIN ExportsMeals AS EM ON EH.id = EM.export_id
    WHERE EH.hos_id = ?
      AND EH.date BETWEEN ? AND ?
    ORDER BY period;
  `;
  const mealsRows = db.prepare(mealsSql).all(hospitalId, startDate, endDate);

  const ingredientsSql = `
    SELECT
      strftime('${period}', EH.date) AS period,
      I.name AS name,
      I.unit AS unit,
      EI.quantity AS quantity
    FROM ExportsHistory AS EH
    INNER JOIN ExportsIngredients AS EI ON EH.id = EI.export_id
    INNER JOIN Ingredients AS I ON EI.ingredient_id = I.id
    WHERE EH.hos_id = ?
      AND EH.date BETWEEN ? AND ?
    ORDER BY period;
  `;
  const ingredientsRows = db.prepare(ingredientsSql).all(hospitalId, startDate, endDate);

  const grouped = {};
  for (const r of mealsRows) {
    const p = r.period;
    if (!grouped[p]) grouped[p] = { meals: [], ingredients: {}, total: 0 };
    const total = Number(r.cost || 0) * Number(r.quantity || 0);
    grouped[p].meals.push({
      patient_type: r.patient_type,
      schedule_name: r.schedule_name,
      quantity: Number(r.quantity || 0),
      cost: Number(r.cost || 0),
      total,
    });
    grouped[p].total += total;
  }

  for (const r of ingredientsRows) {
    const p = r.period;
    if (!grouped[p]) grouped[p] = { meals: [], ingredients: {}, total: 0 };
    const name = r.name;
    if (!grouped[p].ingredients[name]) grouped[p].ingredients[name] = { unit: r.unit, quantity: 0 };
    grouped[p].ingredients[name].quantity += Number(r.quantity || 0);
  }

  // convert ingredient maps to lists
  for (const p of Object.keys(grouped)) {
    grouped[p].ingredients = Object.entries(grouped[p].ingredients).map(([name, v]) => ({ name, unit: v.unit, quantity: v.quantity }));
  }

  const grandTotal = Object.values(grouped).reduce((acc, v) => acc + (v.total || 0), 0);
  return { rows: grouped, total: grandTotal };
}

/**
 * exportsIngredientsReport(hosId, ingredientsIds, startDate, endDate, reportType)
 * if hosId === 1, include destination hospital name as 'dest'
 */
export function exportsIngredientsReport(hosId, ingredientsIds, startDate, endDate, reportType) {
  const db = get_db();
  ingredientsIds = ensureArray(ingredientsIds);

  const period =
    reportType === "yearly" ? "%Y" : reportType === "monthly" ? "%Y-%m" : "%Y-%m-%d";

  const whereIngredients = ingredientsIds.length > 0 ? `EI.ingredient_id IN (${placeholders(ingredientsIds)})` : `1=1`;
  const joinDest = hosId === 1 ? `INNER JOIN Hospitals AS H ON EH.destination_hos_id = H.id` : '';
  const selectDest = hosId === 1 ? `, H.name AS dest` : '';

  const sql = `
    SELECT
      strftime('${period}', EH.date) AS period,
      I.name AS name,
      I.unit AS unit
      ${selectDest},
      EI.quantity AS quantity
    FROM ExportsHistory AS EH
    INNER JOIN ExportsIngredients AS EI ON EH.id = EI.export_id
    INNER JOIN Ingredients AS I ON EI.ingredient_id = I.id
    ${joinDest}
    WHERE EH.hos_id = ?
      AND ${whereIngredients}
      AND EH.date BETWEEN ? AND ?
    ORDER BY period;
  `;

  const params = [hosId];
  if (ingredientsIds.length > 0) params.push(...ingredientsIds);
  params.push(startDate, endDate);

  const rows = db.prepare(sql).all(...params);

  const grouped = {};
  for (const r of rows) {
    const p = r.period;
    const name = r.name;
    const unit = r.unit;
    const qty = Number(r.quantity || 0);
    const dest = hosId === 1 ? r.dest : 0;
    if (!grouped[p]) grouped[p] = { ingredients: [] };
    grouped[p].ingredients.push({ name, unit, quantity: qty, dest });
  }

  // totals summary
  const totalsSql = `
    SELECT 
      I.id AS ingredient_id,
      I.name AS ingredient_name,
      SUM(EI.quantity) AS total_quantity
    FROM ExportsHistory AS EH
    INNER JOIN ExportsIngredients AS EI ON EH.id = EI.export_id
    INNER JOIN Ingredients AS I ON EI.ingredient_id = I.id
    WHERE EH.hos_id = ?
      AND ${whereIngredients}
      AND EH.date BETWEEN ? AND ?
    GROUP BY I.id, I.name;
  `;
  const totalsParams = [hosId];
  if (ingredientsIds.length > 0) totalsParams.push(...ingredientsIds);
  totalsParams.push(startDate, endDate);

  const totals = db.prepare(totalsSql).all(...totalsParams);

  return { rows: grouped, totals };
}
