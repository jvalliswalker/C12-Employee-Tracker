import inquirer from "inquirer";

class AnswerHandler {
  constructor(answer, pool){
    this.answer = answer;
    this.pool = pool;
    this.followupQuestionData;
    this.answerRouter = this.router[answer];
    this.CRUDStatement = this.answerRouter.statement;
    // this.relatedData = {};
    this.relatedDataMap = {};
  }

  router = {
    "View all departments": {
      statement: 'SELECT id AS "Id", name as "Department Name" FROM departments',
      statementType: 'query'
    },
    "View all roles": {
      statement: (
        'SELECT r.id AS "Role Id", r.title AS "Title", r.salary AS "Salary", d.name AS "Department Name"'+
        'FROM roles r JOIN departments d ON r.department_id = d.id'
      ),
      statementType: 'query'
    },
    "View all employees": {
      statement: (
        'SELECT e.id AS "Employee Id", e.first_name AS "First Name", e.last_name AS "Last Name", '+
        'r.title AS "Role", ee.first_name AS "Manager First Name", ee.last_name AS "Manager Last Name" '+
        'FROM employees e '+
        'INNER JOIN roles r ON e.role_id = r.id '+
        'LEFT JOIN employees ee ON '+
        'e.manager_id = ee.id'
      ),
      statementType: 'query'
    },
    'Add a department': {
      questions: [
        {
          name: 'name',
          message: 'Enter the department name'
        }
      ],
      statement: 'INSERT INTO departments VALUES',
      statementType: 'insert'
    },
    'Add a role': {
      questions: [
        {
          name: 'title',
          message: 'Enter the role title'
        },
        {
          name: 'salary',
          message: 'Enter the role\'s salary',
          type: 'number'
        },
        {
          name: 'department_id',
          message: 'Select the department this role belongs to',
          type: 'list',
          choices: [],
          requiresChoicePopulation: true,
          relatedDataName: 'departments'
        }
      ],
      statement: 'INSERT INTO roles VALUES',
      statementType: 'insert',
      relatedDataQueries: {
        departments: 'SELECT id, name FROM departments'
      }
    },
    'Add an employee': {
      questions: [
        {
          name: 'first_name',
          message: 'Enter a first name'
        },
        {
          name: 'last_name',
          message: 'Enter a last name'
        },
        {
          name: 'role_id',
          message: 'Select a role for this employee',
          type: 'list',
          choices: [],
          requiresChoicePopulation: true,
          relatedDataName: 'roles'
        },
        {
          name: 'manager_id',
          message: 'Select a manager',
          type: 'list',
          choices: ['No manager'],
          requiresChoicePopulation: true,
          relatedDataName: 'employees'
        }
      ],
      statement: 'INSERT INTO',
      statementType: 'insert',
      relatedDataQueries: {
        roles: 'SELECT id, title FROM roles',
        employees: 'SELECT id, first_name, last_name FROM employees',
      }
    },
    "Update an employee role": {
      // questions: [],
      statement: '',
      statementType: 'update'
    }
  };

  get followupQuestions() {
    return this.answerRouter.questions;
  }

  getNameValue(row, tableName){
    if(tableName == 'employees'){
      return `${row.first_name} ${row.last_name}`;
    }
    if(tableName == 'roles'){
      return row.title;
    }
    else{
      return row.name;
    }
  }

  populateListQuestionsWithRelatedData(){

    const questions = this.answerRouter.questions;

    for(const question of questions){
      if(question.type == 'list'){
        const keys = Object.keys(this.relatedDataMap[question.relatedDataName]);
        question.choices = [...keys];
      }
    }
  }

  async getRelatedData(){

    for(const key of Object.keys(this.answerRouter.relatedDataQueries)){
      const queryResults = await this.pool.query(this.answerRouter.relatedDataQueries[key]);
      const nameToIdMap = {}

      for(const row of queryResults.rows){
        nameToIdMap[this.getNameValue(row, key)] = row.id;
      }

      this.relatedDataMap[key] = nameToIdMap;
    }
    return;
  }

  askFollowupQuestions(){
    return inquirer.prompt(this.followupQuestions)
    .then((answers) => {
      this.followupAnswers = answers;
      return this;
    });
  }

  promptFollowup(){
    if(this.answerRouter.relatedDataQueries){
      return this.getRelatedData()
        .then(() => {
          this.populateListQuestionsWithRelatedData();
        })
        .then( () => {
          return this.askFollowupQuestions();
        });
    }
    else{
      return this.askFollowupQuestions();
    }
  }

  runCRUD() {
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

export { AnswerHandler };