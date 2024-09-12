import inquirer from "inquirer";
import { runSetup } from "./assets/scripts/setup.js";
import { AnswerHandler } from "./assets/scripts/answer-handler.mjs";

const questionsMain = [
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

function promptMain(pool) {
  // Begin prompt for main "menu"
  inquirer
    .prompt(questionsMain)
    .then((answerObject) => {
      // Initiatize handler from answers and pool
      const answerHandler = new AnswerHandler(answerObject.main, pool);
      return answerHandler;
    })
    .then((answerHandler) => {
      if (answerHandler.followupQuestions) {
        return answerHandler.promptFollowup();
      } else {
        return answerHandler;
      }
    })
    .then((answerHandler) => {
      return answerHandler.runCRUD();
    })
    .then((answerHandler) => {
      if(answerHandler.completionStatement){
        console.log(answerHandler.completionStatement);
      }
      else{
        answerHandler.displayCRUDResults();
      }
      promptMain(pool);
    });
}

runSetup().then((pool) => {
  promptMain(pool);
});
