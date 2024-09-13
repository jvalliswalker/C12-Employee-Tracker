import inquirer from "inquirer";
import { seedData } from "./seeds.js";
import { readFile, writeFile } from "./utils.js";
import { connectToDatabase } from "./db-connector.js";

// Parent function, handles:
// - Credentials collection and assignment
// - Pool connection
// - Database seeding
async function runSetup() {
  // Read contents of local credentials file
  const credentials = readFile("postgres.env");
  // Flag if credentials contains flag indicating setup has been run
  const setupNeeded = !credentials.includes("setup-complete");

  // Call function to collect and set Postgres
  // environmental variables, if needed
  if (setupNeeded) {
    await setupEnvironmentmentalVariables();
  }

  // Create pool
  const pool = await connectToDatabase();

  // Seed database with data, if needed
  if (setupNeeded) {
    seedData(pool);
  }

  // Return pg pool
  return pool;
}

// Collect and set Postgres environmental variables
async function setupEnvironmentmentalVariables() {
  // Setup credentials questions
  const questionsCredentials = [
    {
      name: "setup_username",
      message: "Please enter your postgres username",
    },
    {
      name: "setup_password",
      message: "Please enter your postgres password",
    },
  ];

  // Get credentials via inquirer
  return inquirer
    .prompt(questionsCredentials)
    .then((answers) => {
      // Set credentials values from answers
      const credentialsData = {
        HOST: "localhost",
        DATABASE: "employee_tracker",
        USER: answers.setup_username,
        PASSWORD: answers.setup_password,
      };

      return credentialsData;
    })
    .then((credentialsData) => {
      // Format credentials data for .env file
      const envString = [
        `USER=${credentialsData.USER}`,
        `PASSWORD=${credentialsData.PASSWORD}`,
        `HOST=${credentialsData.HOST}`,
        `DATABASE=${credentialsData.DATABASE}`,
        "setup-complete",
      ];

      // Write data to local postgres.env
      writeFile("postgres.env", envString.join("\n"), "overwrite");

      return;
    });
}

export { runSetup };
