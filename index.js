const inquirer = require("inquirer");
const runSetup = require("./assets/scripts/setup.js");

runSetup().then((pool) => {
  console.log(pool);

  pool
    .query("SELECT id, first_name, last_name, role_id FROM employees", [])
    .then((results) => {
      const { rows } = results;

      console.log(rows);
    });
});
