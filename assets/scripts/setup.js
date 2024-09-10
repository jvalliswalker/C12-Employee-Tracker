const inquirer = require('inquirer');
const seedData = require('./seeds.js');
const { readFile, writeFile } = require('./utils.js');
const { connectToDatabase } = require('./db-connector.js');


async function setEnvironmentalVariables(){
  const questionsCredentials  = [
    {
      name: 'setup_username',
      message: 'Please enter your postgres username'
    },
    {
      name: 'setup_password',
      message: 'Please enter your postgres password'
    }
  ];
  
  return inquirer.prompt(questionsCredentials)
    .then(answers => {
      const credentialsData = {
        HOST: 'localhost',
        DATABASE: 'employee_tracker',
        USER: answers.setup_username,
        PASSWORD: answers.setup_password
      }
  
      return credentialsData;
    })
    .then(credentialsData => {
  
      const envString = [
        `USER=${credentialsData.USER}`,
        `PASSWORD=${credentialsData.PASSWORD}`,
        `HOST=${credentialsData.HOST}`,
        `DATABASE=${credentialsData.DATABASE}`,
        'setup-complete'
      ];
      writeFile('postgres.env', envString.join('\n'), writeType='overwrite'
      );

      return;
    })
}

async function runSetup() {

  const credentials = readFile('postgres.env');
  let setupNeeded = !credentials.includes('setup-complete');
  
  return setupEnvironment(setupNeeded)
    .then(() => {
      const pool = connectToDatabase()
      seedData(pool)
      return pool;
    })
}


async function setupEnvironment(setupNeeded) {
  if(setupNeeded){
    return setEnvironmentalVariables()
  }
  return;
}

module.exports = runSetup;