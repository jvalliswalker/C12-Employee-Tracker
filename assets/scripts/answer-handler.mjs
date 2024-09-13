import inquirer from "inquirer";

// Handler class for answers from main menu loop
class AnswerHandler {
  // constructor takes inquirer answer and pool object
  constructor(answer, pool) {
    // If answer is "Exit", end the program
    if (answer == "Exit") {
      process.exit();
    }
    // Otherwise, assign  properties
    this.answer = answer;
    this.pool = pool;
    this.answerRouter = this.router[answer];
    this.CRUDStatement = this.answerRouter.statement;
    this.statementType = this.answerRouter.statementType;
    this.relatedDataMap = {};
  }

  // Main question menu
  static mainQuestions = [
    {
      name: "main",
      message: "Please select an option",
      type: "list",
      choices: [
        "View all departments",
        "View all roles",
        "View all employees",
        "Add a department",
        "Add a role",
        "Add an employee",
        "Update an employee role",
        "Exit",
      ],
    },
  ];

  // Map of answer values to sub-handler objects
  router = {
    "View all departments": {
      statement:
        'SELECT id AS "Id", name as "Department Name" FROM departments ORDER BY name',
      statementType: "query",
    },
    "View all roles": {
      statement:
        'SELECT r.id AS "Role Id", r.title AS "Title", r.salary AS "Salary", d.name AS "Department Name"' +
        "FROM roles r JOIN departments d ON r.department_id = d.id " +
        "ORDER BY r.title",
      statementType: "query",
    },
    "View all employees": {
      statement:
        'SELECT e.id AS "Employee Id", e.first_name AS "First Name", e.last_name AS "Last Name", ' +
        'r.title AS "Title", r.salary AS "Salary", concat_ws(\' \',ee.first_name, ee.last_name) AS "Manager" ' +
        "FROM employees e " +
        "INNER JOIN roles r ON e.role_id = r.id " +
        "LEFT JOIN employees ee ON " +
        "e.manager_id = ee.id " +
        "ORDER BY e.first_name",
      statementType: "query",
    },
    "Add a department": {
      questions: [
        {
          name: "name",
          message: "Enter the department name",
        },
      ],
      statement: "INSERT INTO departments",
      statementType: "insert",
      completionStatement: "New department added to database",
    },
    "Add a role": {
      questions: [
        {
          name: "title",
          message: "Enter the role title",
        },
        {
          name: "salary",
          message: "Enter the role's salary",
          type: "number",
        },
        {
          name: "department_id",
          message: "Select the department this role belongs to",
          type: "list",
          choices: [],
          requiresChoicePopulation: true,
          relatedDataName: "departments",
        },
      ],
      statement: "INSERT INTO roles",
      completionStatement: "New role added to database",
      statementType: "insert",
      relatedDataQueries: {
        departments: "SELECT id, name FROM departments ORDER BY name",
      },
    },
    "Add an employee": {
      questions: [
        {
          name: "first_name",
          message: "Enter a first name",
        },
        {
          name: "last_name",
          message: "Enter a last name",
        },
        {
          name: "role_id",
          message: "Select a role for this employee",
          type: "list",
          choices: [],
          requiresChoicePopulation: true,
          relatedDataName: "roles",
        },
        {
          name: "manager_id",
          message: "Select a manager",
          type: "list",
          choices: ["No manager"],
          requiresChoicePopulation: true,
          relatedDataName: "employees",
        },
      ],
      statement: "INSERT INTO employees",
      statementType: "insert",
      completionStatement: "New employee added to database",
      relatedDataQueries: {
        roles: "SELECT id, title FROM roles ORDER BY title",
        employees:
          "SELECT id, first_name, last_name FROM employees ORDER BY first_name",
      },
    },
    "Update an employee role": {
      questions: [
        {
          name: "employee_id",
          message: "Select an employee",
          choices: [],
          requiresChoicePopulation: true,
          relatedDataName: "employees",
          type: "list",
        },
        {
          name: "role_id",
          message: "Select a new role",
          choices: [],
          requiresChoicePopulation: true,
          relatedDataName: "roles",
          type: "list",
        },
      ],
      statement: "UPDATE employees",
      statementType: "update",
      completionStatement: "New employee role updated",
      relatedDataQueries: {
        employees:
          "SELECT id, first_name, last_name FROM employees ORDER BY first_name",
        roles: "SELECT id, title FROM roles ORDER BY title",
      },
    },
  };

  get followupQuestions() {
    return this.answerRouter.questions;
  }

  // ===============
  // Process Methods
  // ===============

  // Handle follow-up questions designated by answerRouter
  promptFollowup() {
    // Check if answerRouter contains a related data query
    if (this.answerRouter.relatedDataQueries) {
      // If so, get related data
      return this.getRelatedData()
        .then(() => {
          // Populate answerRouter follow-up question choices
          // with returned related data
          this.populateListQuestionsWithRelatedData();
        })
        .then(() => {
          // Initiate follow-up prompt
          return this.askFollowupQuestions();
        });
    } else {
      // Initiate follow-up prompt
      return this.askFollowupQuestions();
    }
  }

  // Query related data
  async getRelatedData() {
    // Loop through queries listed in answerRouter
    for (const key of Object.keys(this.answerRouter.relatedDataQueries)) {
      // Call query and store in loop variable
      const queryResults = await this.pool.query(
        this.answerRouter.relatedDataQueries[key]
      );
      const nameToIdMap = {};

      // Store each row from query results
      for (const row of queryResults.rows) {
        // Get "name" field from table from getNameValue()
        const nameEquivalentField = this.getNameValue(row, key);
        // Store in local map
        nameToIdMap[nameEquivalentField] = row.id;
      }

      // Store loop nameToIdMap in class property
      this.relatedDataMap[key] = nameToIdMap;
    }
    return;
  }

  // Populate "choice" values for follow-up prompt
  // from related data from query
  populateListQuestionsWithRelatedData() {
    // Get follow-up questions from answerRouter
    const followupPromptQuestions = this.answerRouter.questions;

    // Loop through follow-up questions
    for (const question of followupPromptQuestions) {
      // If question is of type list, assign corresponding related
      // data queried earlier to "choices" property of question
      if (question.type == "list") {
        const keys = Object.keys(this.relatedDataMap[question.relatedDataName]);
        question.choices = [].concat(question.choices, keys);
      }
    }
  }

  // Begin new inquirer.prompt for follow-up questions
  askFollowupQuestions() {
    // Begin prompt
    return inquirer.prompt(this.followupQuestions).then((answers) => {
      // Loop through returned question and answers
      for (const question of Object.keys(answers)) {
        const answer = answers[question];

        // Determine and store which related data collection
        // the current question belongs to (if applicable)
        let relatedMapKey;
        if (question == "role_id") {
          relatedMapKey = "roles";
        } else if (question == "manager_id") {
          relatedMapKey = "employees";
        } else if (question == "department_id") {
          relatedMapKey = "departments";
        } else if (question == "employee_id") {
          relatedMapKey = "employees";
        }

        // If question relates to related data
        if (relatedMapKey) {
          // Convert answer selected by user into Id of corresponding related data set
          const relatedDataRecordId = this.relatedDataMap[relatedMapKey][answer];
          // If chosen option maps to Id in related data
          if(relatedDataRecordId){
            // Set answer for question to related data Id
            answers[question] = relatedDataRecordId;

            // Special handling for update option
            if (relatedMapKey == "employees") {
              // Store Id of record to update in class property
              this.idOfRecordToUpdate = answers[question];
            }
          }
          // If choice has no equivalent Id in related data
          else {
            // Remove question and answer from consideration
            delete answers[question];
          }
        }
      }
      // Store all answers in class property
      this.followupAnswers = answers;
      // Return self for future function calls
      return this;
    });
  }

  // Run the designated Cread/Read/Edit/Delete function
  runCRUD() {
    if (this.followupAnswers) {
      // Format fields and values for CRUD statement
      const fields = this.formatFieldsForCRUD(
        Object.keys(this.followupAnswers)
      );
      const values = this.formatValuesForCRUD(
        Object.values(this.followupAnswers)
      );
      let formattedCRUDStatement;

      // Format CRUD statement for insert
      if (this.statementType == "insert") {
        formattedCRUDStatement = `${this.CRUDStatement} (${fields}) VALUES (${values}) `;
      }
      // Format CRUD statement for update
      else if (this.statementType == "update") {
        formattedCRUDStatement =
          `${this.CRUDStatement} SET (${fields}) = (${values}) ` +
          `WHERE id = ${this.idOfRecordToUpdate}`;
      }
      // Store info in class properties
      this.CRUDStatement = formattedCRUDStatement;
      this.completionStatement = this.answerRouter.completionStatement;
    }

    // Run statement in pool query
    return this.pool.query(this.CRUDStatement).then((data) => {
      // Store returned data in class property
      this.CRUDStatementData = data.rows;
      // Return self for future function calls
      return this;
    });
  }

  // Display results of CRUD statement in console
  displayCRUDResults() {
    console.table(this.CRUDStatementData);
  }

  // ==============
  // Helper Methods
  // ==============

  // Heper method, determines which field should be used to populate
  // text displayed to user in question choice list
  getNameValue(row, tableName) {
    if (tableName == "employees") {
      return `${row.first_name} ${row.last_name}`;
    }
    if (tableName == "roles") {
      return row.title;
    }
    if (tableName == "departments") {
      return row.name;
    } else {
      throw new Error(`table name not found for ${tableName}`);
    }
  }

  // Format answers from prompt for SQL statement
  formatValuesForCRUD(values) {
    const formattedValues = [];

    for (const value of values) {
      if (typeof value == "string") {
        formattedValues.push(`'${value}'`);
      } 
      else {
        formattedValues.push(value);
      }
    }

    return formattedValues.join(",");
  }

  // Format fields from prompt questions for SQL statement
  formatFieldsForCRUD(fields) {
    const formattedFields = [];

    for (const field of fields) {
      if (field == "employee_id") {
        formattedFields.push("id");
      } else {
        formattedFields.push(field);
      }
    }

    return formattedFields.join(",");
  }
}

export { AnswerHandler };
