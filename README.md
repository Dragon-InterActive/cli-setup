# CLI-Setup

## Introduction

CLI-Setup is a streamlined installation and configuration tool designed for automated project setup. It manages package installations, environment configurations, database initialization, and optional Docker support.

## Prerequisites

Before running CLI-Setup, ensure the following requirements are met:

- Node.js (Lastest LTS recommended)
- `package.json` must contain:

  ```json
  "type": "module"
  ```

- Optional: Docker (if `docker_compose` is enabled in the configuration)

## Configuration (`setup.config.json`)

CLI-Setup relies on a configuration file (setup.config.json) to define installation parameters. Below is a sample structure:

```json
{
  "packageManager": ["npm", "pnpm"],
  "installDependencies": true,
  "docker_compose": true,
  "cleanup_after_production": true,
  "environments": {
    "dev": [
      { "name": "DATABASE_HOST", "message": "Enter database host:", "default": "localhost" },
      { "name": "DATABASE_USER", "message": "Enter database user:", "default": "root" },
      { "name": "DATABASE_PASSWORD", "message": "Enter database password:", "type": "password" },
      { "name": "APP_PORT", "message": "Enter development port:", "default": 3000 }
    ],
    "prod": [
      { "name": "DATABASE_HOST", "message": "Enter database host:", "default": "db.prod.example.com" },
      { "name": "DATABASE_USER", "message": "Enter database user:", "default": "admin" },
      { "name": "DATABASE_PASSWORD", "message": "Enter database password:", "type": "password" },
      { "name": "APP_PORT", "message": "Enter production port:", "default": 8080 }
    ]
  },
  "sql_files": [
    "01-tables.sql",
    "02-views.sql",
    "03-procedures.sql"
  ]
}
```

## Key Configuration Options

- `packageManager` &dash; Defines which package managers are supoorted (`npm` and/or `pnpm`).
- `installDependencies` &dash; If `true`, installs dependencies after cloning the repository.
- `docker_compose` &dash; If `true`, attempts  to run docker-compose up -d.
- `cleanup_after_production` &dash; If `true`, removes setup files after a production installation.
- `environments` &dash; Defines interactive prompts for `dev` (development) and `prod` (production) setups.
- `sql_files` &dash; Lists SQL files to execute in order during database setup.

## License

This project is licensed under the **MPL-2.0 License**.

Feel free to fork! 🚀
