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
      console.log('answerHandler.followupQuestions');
      console.log(answerHandler.followupQuestions);
      if (answerHandler.followupQuestions) {
        console.log('calling promptFollowup');
        return answerHandler.promptFollowup();
      } else {
        return answerHandler;
      }
    })
    .then((answerHandler) => {
      return answerHandler.runCRUD();
    })
    .then((answerHandler) => {
      answerHandler.displayCRUDResults();
      promptMain(pool);
    });
}

runSetup().then((pool) => {
  promptMain(pool);
});
