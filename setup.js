#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import inquirer from "inquirer";

// Load configuration file
const config = JSON.parse(fs.readFileSync("setup.config.json", "utf-8"));

// Check if a module is installed globally
function isModuleInstalled(moduleName) {
  try {
    execSync(`npm list -g ${moduleName}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// Detect package manager (npm or pnpm)
async function detectPackageManager() {
  const availableManagers = config.packageManager || ["npm"];

  if (availableManagers.length > 1) {
    const answer = await inquirer.prompt([
      {
        type: "list",
        name: "packageManager",
        message: "Which package manager do you want to use?",
        choices: availableManagers
      }
    ]);
    return answer.packageManager;
  }

  return availableManagers[0];
}

// Initialize project (install node_modules)
async function initializeProject(packageManager) {
  console.log(`📦 Installing dependencies using ${packageManager}...`);
  execSync(`${packageManager} install`, { stdio: "inherit" });
  console.log("✅ Dependencies installed!");
}

// Select environment (dev, prod)
async function selectEnvironment() {
  const envChoices = Object.keys(config.environments);
  if (envChoices.length === 1) return envChoices[0];

  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "environment",
      message: "Select the environment:",
      choices: envChoices
    }
  ]);
  return answer.environment;
}

// Run database setup
async function runDatabaseSetup() {
  console.log("📂 Checking for SQL files...");
  if (!fs.existsSync("sql")) {
    console.log("⚠️ No `sql/` directory found. Skipping database setup.");
    return;
  }

  const sqlFiles = config.sql_files || [];
  if (sqlFiles.length === 0) {
    console.log("⚠️ No SQL files defined in `setup.config.json`. Skipping database setup.");
    return;
  }

  console.log("📂 Running SQL files in order...");
  for (const file of sqlFiles) {
    const filePath = path.join("sql", file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ SQL file not found: ${file}`);
      continue;
    }
    console.log(`📑 Executing ${file}...`);
    execSync(`PGPASSWORD="${process.env.DATABASE_PASSWORD}" psql -h ${process.env.DATABASE_HOST} -U ${process.env.DATABASE_USER} -d ${process.env.DATABASE_NAME} -f ${filePath}`, { stdio: "inherit" });
  }
  console.log("✅ Database setup complete!");
}

// Setup wizard
async function setupWizard() {
  if (fs.existsSync(".env")) {
    console.log("⚠️ .env file already exists! Aborting setup.");
    return;
  }

  const environment = await selectEnvironment();
  const questions = config.environments[environment];

  if (!questions || questions.length === 0) {
    console.log(`⚠️ No questions defined for ${environment}. Skipping setup wizard.`);
    return;
  }

  const answers = await inquirer.prompt(questions);

  // Write to .env file
  const envContent = Object.entries(answers).map(([key, value]) => `${key}=${value}`).join("\n");
  fs.writeFileSync(".env", envContent);
  console.log(`✅ .env file created for ${environment} environment!`);

  // Run database setup after .env is created
  await runDatabaseSetup();
}

// Cleanup for production
async function cleanupSetupFiles() {
  if (!config.cleanup_after_production) return;
  console.log("🗑️ Cleaning up setup files...");
  const filesToRemove = ["setup.js", "setup.config.json"];
  const directoriesToRemove = ["sql"];

  // Remove individual files
  for (const file of filesToRemove) {
    if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`🗑️ Removed: ${file}`);
    }
  }

  // Remove directories and their contents
  for (const dir of directoriesToRemove) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true});
        console.log(`🗑️ Removed directory: ${dir}`);
    }
  }
  console.log("✅ Cleanup complete!");
}

// Run Docker-Compose if enabled in config
async function runDockerCompose() {
  if (config.docker_compose) {
    console.log("🐳 Running Docker-Compose...");
    execSync("docker-compose up -d", { stdio: "inherit" });
    console.log("✅ Docker-Compose started!");
  }
}

// Execute main setup process
(async () => {
  try {
    const packageManager = await detectPackageManager();
    await initializeProject(packageManager);
    await setupWizard();
    await runDockerCompose();

    // Remove setup files if production
    if (await selectEnvironment() === "prod") {
      await cleanupSetupFiles();
    }
  } catch (error) {
    console.error("❌ Error during setup:", error);
  }
})();