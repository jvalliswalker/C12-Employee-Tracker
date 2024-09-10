const inquirer = require("inquirer");

function questionRouter(pool){

  const main = [
    {
      name: 'main',
      message: 'Please select an option',
      type: 'list',
      choices: [
        "View all departments",
        "View all roles",
        "View all employees",
        "Add a department",
        "Add a role",
        "Add an employee",
        "Update an employee role",
      ]
    }
  ]
  
  const queryRouter = {
    'View all departments': 'SELECT id, name FROM departments',
    'View all roles': (
      'SELECT r.id AS "Role Id", r.title AS "Title", r.salary AS "Salary", d.name AS "Department Name"'+
      'FROM roles r JOIN departments d ON r.department_id = d.id'
    ),
    'View all employees': (
      'SELECT e.id, e.first_name, e.last_name, r.title, ee.first_name, ee.last_name '+
      'FROM employees e '+
      'INNER JOIN roles r ON e.role_id = r.id '+
      'LEFT JOIN employees ee ON '+
      'e.manager_id = ee.id'
    )
  }
  
  function renderData(queryString, pool){
  
    pool.query(queryString).then(data => {
      const { rows } = data;
  
      console.log(rows);
    });
  }

  renderData(queryRouter['View all roles'], pool);
}

// function prettifyData(rowData){

//   const tableColumns = {
//     'departments': ['id','name'],
//     'roles': ['id','title','salary'],
//     // 'employees'
//   }
// }

module.exports = questionRouter;