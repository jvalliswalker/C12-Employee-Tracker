import inquirer from "inquirer";

class AnswerHandler {
  constructor(answer, pool){
    this.answer = answer;
    this.pool = pool;
    this.answerRouter = this.router[answer];
    this.CRUDStatement = this.answerRouter.statement;
    this.statementType = this.answerRouter.statementType;
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
        'r.title AS "Title", r.salary AS "Salary", concat_ws(\' \',ee.first_name, ee.last_name) AS "Manager" '+
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
      statement: 'INSERT INTO departments',
      statementType: 'insert',
      completionStatement: 'New department added to database'
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
      statement: 'INSERT INTO roles',
      completionStatement: 'New role added to database',
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
      statement: 'INSERT INTO employees',
      statementType: 'insert',
      completionStatement: 'New employee added to database',
      relatedDataQueries: {
        roles: 'SELECT id, title FROM roles',
        employees: 'SELECT id, first_name, last_name FROM employees',
      }
    },
    "Update an employee role": {
      questions: [
        {
          name: 'employee_id',
          message: 'Select an employee',
          choices: [],
          requiresChoicePopulation: true,
          relatedDataName: 'employees',
          type: 'list'
        },
        {
          name: 'role_id',
          message: 'Select a new role',
          choices: [],
          requiresChoicePopulation: true,
          relatedDataName: 'roles',
          type: 'list'
        }
      ],
      statement: 'UPDATE employees',
      statementType: 'update',
      completionStatement: 'New employee role updated',
      relatedDataQueries: {
        employees: 'SELECT id, first_name, last_name FROM employees',
        roles: 'SELECT id, title FROM roles'
      }
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
      throw new Error(`table name not found for ${tableName}`);
    }
  }

  populateListQuestionsWithRelatedData(){

    const questions = this.answerRouter.questions;

    for(const question of questions){
      if(question.type == 'list'){
        const keys = Object.keys(this.relatedDataMap[question.relatedDataName]);
        question.choices = [].concat(question.choices, keys);
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
      for(const question of Object.keys(answers)){
        const answer = answers[question];
        let relatedMapKey;
        if(question == 'role_id'){
          relatedMapKey = 'roles';
        }
        else if(question == 'manager_id'){
          relatedMapKey = 'employees';
        }
        else if(question == 'department_id'){
          relatedMapKey = 'departments';
        }
        else if(question == 'employee_id'){
          relatedMapKey = 'employees';
        }

        if(relatedMapKey){
          answers[question] = this.relatedDataMap[relatedMapKey][answer];
          if(relatedMapKey == 'employees'){
            this.idOfRecordToUpdate = answers[question];
          }
        }
      }
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

  formatValuesForCRUD(values){

    const formattedValues = [];
    
    for(const value of values){
      if(typeof value == 'string'){
        formattedValues.push(`'${value}'`);
      }
      else{
        formattedValues.push(value)
      }
    }

    return formattedValues.join(',');
  }

  formatFieldsForCRUD(fields){

    const formattedFields = []

    for(const field of fields){
      if(field == 'employee_id'){
        formattedFields.push('id');
      }
      else{
        formattedFields.push(field);
      }
    }

    return formattedFields.join(',');
  }

  runCRUD() {

    if(this.followupAnswers){

      const fields = this.formatFieldsForCRUD(Object.keys(this.followupAnswers));
      const values = this.formatValuesForCRUD(Object.values(this.followupAnswers));
      let formattedCRUDStatement;

      if(this.statementType == 'insert'){
        formattedCRUDStatement = `${this.CRUDStatement} (${fields}) VALUES (${values}) `;
      }
      else if(this.statementType == 'update'){
        formattedCRUDStatement = (
          `${this.CRUDStatement} SET (${fields}) = (${values}) ` +
          `WHERE id = ${this.idOfRecordToUpdate}`
        );
      }
      this.CRUDStatement = formattedCRUDStatement;
      this.completionStatement = this.answerRouter.completionStatement;
    }

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