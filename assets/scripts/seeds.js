const { readFile } = require("./utils.js");

function seedData(pool){
  // Global constant for sql data
  const seedData = {};
  
  // Read roles data from JSON, parse and store
  seedData.rolesJSON = JSON.parse(readFile("./db/roles.json", true));
  
  // Read employees data from JSON, parse and store
  seedData.employeesJSON = JSON.parse(readFile("./db/employees.json", true));
  
  // Begin with deleting roles/employee data, if present
  pool
    .query("DELETE FROM employees")
    .then(() => {
      return pool.query("DELETE FROM roles");
    })
    .then(() => {
      // Query data from departments created via seeds.sql
      return pool.query("SELECT id, name FROM departments");
    })
    .then((data) => {
      // Store departments data in seedData object
      const { rows } = data;
      seedData.departmentsMap = rows;
  
      // Begin constructtion of roles data for insert
      const roleValuesForInsert = [];
  
      // Iterate through roles data from json file
      for (const row of seedData.rolesJSON) {
        // Populate department_id values for roles from department data
        row.department_id = mapIdField(
          "name",
          row.department_id,
          "id",
          seedData.departmentsMap
        );
  
        // Format roles data for psql insert
        const rowValues = [row.title, row.salary, row.department_id];
  
        // Push values to var for later insert
        roleValuesForInsert.push(rowValues);
      }
  
      // Insert roles
      return pool.query(
        `INSERT INTO roles (title, salary, department_id) VALUES ${formatValues(
          roleValuesForInsert
        )}`
      );
    })
    .then(() => {
      // Query inserted roles for Id values
      return pool.query("SELECT id, title FROM roles");
    })
    .then((data) => {
      // Locally store roles data
      const { rows } = data;
  
      // Begin construction of employees data for insert
      const employeeValuesForInsert = [];
  
      // Iterate through employees data from json file
      for (const row of seedData.employeesJSON) {
        // Populate role_id field from queried roles data
        row.role_id = mapIdField("title", row.role_id, "id", rows);
  
        // Add row data to to-insert array
        employeeValuesForInsert.push([
          row.first_name,
          row.last_name,
          row.role_id,
        ]);
      }
  
      // Insert employees
      return pool.query(
        `INSERT INTO employees (first_name, last_name, role_id) VALUES ${formatValues(
          employeeValuesForInsert
        )}`
      );
    })
    .then(() => {
      return true;
    })
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
  for (const subArray of values) {
    // Collect values formatted in loop instance
    const valuesWithFormatting = [];

    // Iterate through sub-array
    for (const value of subArray) {
      // Format values in sub-array based on type

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


module.exports = seedData;