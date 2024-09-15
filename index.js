// Imports
import inquirer from "inquirer";
import { runSetup } from "./assets/scripts/setup.js";
import { AnswerHandler } from "./assets/scripts/answer-handler.mjs";

// Script
runSetup().then((pool) => {
  promptMain(pool);
});

// Functions

function promptMain(pool) {
  // Begin prompt for main "menu"
  inquirer
    .prompt(AnswerHandler.mainQuestions)
    .then((answerObject) => {
      // Initiatize handler from answers and pool
      return new AnswerHandler(answerObject.main, pool);
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
      if (answerHandler.completionStatement) {
        console.log(answerHandler.completionStatement);
      } else {
        answerHandler.displayCRUDResults();
      }
      promptMain(pool);
    });
}
