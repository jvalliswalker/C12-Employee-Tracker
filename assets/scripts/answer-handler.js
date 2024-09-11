const inquirer = require("inquirer");
const {promisify} = require('util');

class AnswerHandler {
  constructor(answer, pool){
    this.answer = answer;
    this.pool = pool;
    this.followupQuestionData;
    this.answerRouter = this.router[answer];
    this.CRUDStatement = this.answerRouter.statement;
  }

  router = {
    "View all departments": {
      statement: 'SELECT id AS "Id", name as "Department Name" FROM departments'
    },
    "View all roles": {
      statement: (
        'SELECT r.id AS "Role Id", r.title AS "Title", r.salary AS "Salary", d.name AS "Department Name"'+
        'FROM roles r JOIN departments d ON r.department_id = d.id'
      )
    },
    "View all employees": {
      statement: (
        'SELECT e.id AS "Employee Id", e.first_name AS "First Name", e.last_name AS "Last Name", '+
        'r.title AS "Role", ee.first_name AS "Manager First Name", ee.last_name AS "Manager Last Name" '+
        'FROM employees e '+
        'INNER JOIN roles r ON e.role_id = r.id '+
        'LEFT JOIN employees ee ON '+
        'e.manager_id = ee.id'
      )
    },
    'Add a department': {
      questions: [
        {
          name: 'test',
          message: 'Test question'
        }
      ],
      statement: 'INSERT INTO departments VALUES'
    },
    'Add a role': {
      // questions: [],
      statement: 'INSERT INTO roles VALUES'
    },
    'Add a employee': {
      // questions: [],
      statements: 'INSERT INTO'
    },
    "Update an employee role": {
      // questions: [],
      statement: ''
    }
  };

  get followupQuestions() {
    return this.answerRouter.questions;
  }

  promptFollowup(){
    return inquirer.prompt(this.followupQuestions)
      .then((answers) => {
        this.followupAnswers = answers;
        return this;
      });
  }

  async runCRUD() {
    return this.pool.query(this.CRUDStatement)
      .then((data) => {
        this.CRUDStatementData = data.rows;
        return this;
      });
  }

  displayCRUDResults() {
    console.table(this.CRUDStatementData);
  }
}

module.exports = AnswerHandler;