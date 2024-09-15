import { readFile } from "./utils.js";
import { connectToDatabase } from "./db-connector.js";

seedData(await connectToDatabase());

async function seedData(pool) {
  const seedData = {};
  const tableDataDeletionQueries = [
    "DELETE FROM employees",
    "DELETE FROM roles",
    "DELETE FROM departments",
  ];

  // Read departments, roles, and employee data from JSON, parse and store
  seedData.departmentsJSON = JSON.parse(readFile("./db/departments.json"));
  seedData.rolesJSON = JSON.parse(readFile("./db/roles.json"));
  seedData.employeesJSON = JSON.parse(readFile("./db/employees.json"));

  // Delete all employee_tracker tables if present
  for (const deletionQuery of tableDataDeletionQueries) {
    await pool.query(deletionQuery);
  }

  // Insert departments from seed data
  await pool.query(
    buildInsertStatement("departments", ["name"], seedData.departmentsJSON)
  );

  // Query department data and build name-to-id map
  const departmentData = await pool.query("SELECT id, name FROM departments");
  const departmentNameToIdMap = getNameToIdMap(
    "name",
    "id",
    departmentData.rows
  );
  // Map department Ids to roles data
  mapIdsFromNames(seedData.rolesJSON, "department_id", departmentNameToIdMap);
  // Insert roles from seed data
  await pool.query(
    buildInsertStatement(
      "roles",
      ["title", "salary", "department_id"],
      seedData.rolesJSON
    )
  );

  // Query role data and build name-to-id map
  const roleData = await pool.query("SELECT id, title FROM roles");
  const roleNameToIdMap = getNameToIdMap("title", "id", roleData.rows);
  // Map role ids to employee data
  mapIdsFromNames(seedData.employeesJSON, "role_id", roleNameToIdMap);
  // Insert employees from seed data
  await pool.query(
    buildInsertStatement(
      "employees",
      ["first_name", "last_name", "role_id"],
      seedData.employeesJSON
    )
  );
}

// Helper function, builds SQL insert statement
function buildInsertStatement(tableName, fields, values) {
  const statement = `INSERT INTO ${tableName} (${fields.join(
    ","
  )}) VALUES ${formatValues(values)}`;
  return statement;
}

// Helper function, uses name-to-id map to set Ids
// of specified field to each row of passed data
function mapIdsFromNames(data, idField, nameToIdMap) {
  for (const row of data) {
    row[idField] = nameToIdMap[row[idField]];
  }
}

// Helper function, creates map of "name" value from data
// and matches to corresponding row Id
function getNameToIdMap(nameField, idField, data) {
  const map = {};
  for (const row of data) {
    map[row[nameField]] = row[idField];
  }

  return map;
}

// Helper function, matches id from sourceData base on value from row to update
// - matchField: the field that should be refernced from sourceData against matchValue
// - matchValue: the value that indicates the desired row has been found
// - idField: the field holding the row Id in sourceData
// - sourceData: the data queried from postgreSQL
function mapIdField(matchField, matchValue, idField, sourceData) {
  // Iterate through source data
  for (const row of sourceData) {
    // If current row's value at 'matchField' column matches 'matchValue', return the value at sourceData[idField]
    if (row[matchField] == matchValue) {
      return row[idField];
    }
  }
  // If no values matched and for loop completed without return, return null
  return null;
}

// Helper function, formats array-of-arrays data into psql INSERT ready VALUES format
function formatValues(values) {
  const formattedStrings = [];

  // Iterate through initial array
  for (const record of values) {
    // Collect values formatted in loop instance
    const valuesWithFormatting = [];

    // Iterate through sub-array
    for (const field of Object.keys(record)) {
      // Format values in sub-array based on type
      const value = record[field];

      // Format numbers
      if (typeof value === "number") {
        valuesWithFormatting.push(value);
      }
      // Format strings
      else if (typeof value === "string") {
        valuesWithFormatting.push(`'${value}'`);
      }
    }

    // Nest formatted values in parenthesis and join with commas
    const finalString = `(${valuesWithFormatting.join(",")})`;

    // Push to output array
    formattedStrings.push(finalString);
  }

  // Return all formatted strings, joined with commas
  return formattedStrings.join(",");
}

export { seedData };
