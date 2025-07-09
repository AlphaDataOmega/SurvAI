### 🔄 Project Awareness & Context

* **Always read `PLANNING.md`** at the start of a new conversation to understand the project's architecture, goals, style, and constraints.
* **Check `TASK.md`** before starting a new task. If the task isn’t listed, add it with a brief description and today's date.
* **Use consistent naming conventions, file structure, and architecture patterns** as described in `PLANNING.md`.
* **Use project-specific virtual environments or service containers** where applicable.

### 🧱 Code Structure & Modularity

* **Never create a file longer than 500 lines of code.** If a file approaches this limit, refactor by splitting it into modules or helper files.
* **Organize code into clearly separated modules**, grouped by feature or responsibility.
* For React components:

  * Use functional components with hooks.
  * Keep components presentational where possible.
  * Use co-located files for styles, logic, and tests where applicable.
* For backend (Node/Express or Next.js API routes):

  * Group routes by domain (e.g., `/auth`, `/offers`, `/questions`).
  * Use `Prisma` for schema and DB interaction.
* Use clear, consistent imports.

### 🧪 Testing & Reliability

* **Always create unit tests for new features** (functions, components, endpoints).
* **Update tests immediately** after changing any logic.
* **Use Jest** (or appropriate tooling) for unit and integration tests.
* **Create a `/tests` folder** that mirrors the main project structure.

  * Include at least:

    * 1 test for expected behavior
    * 1 edge case
    * 1 intentional failure

### ✅ Task Completion

* **Mark completed tasks in `TASK.md`** immediately after finishing them.
* **Log new subtasks or discovered requirements** under a “Discovered During Work” section in `TASK.md`.

### 📎 Style & Conventions

* **Use React + TypeScript** for all front-end code.
* **Use Prisma** for backend ORM, and follow schema-first development.
* **Use Prettier and ESLint** to enforce code formatting and linting.
* **Write docstrings and inline comments** to explain logic.
* Format docstrings using Google style:

```ts
/**
 * Brief summary.
 *
 * @param paramName - Description
 * @returns Type - Description
 */
```

### 📚 Documentation & Explainability

* **Update `README.md`** whenever new features, configs, or commands are added.
* **Update `PLANNING.md` and milestone documents** to reflect architectural or feature changes.
* **Comment any non-obvious logic** inline.
* **Add `# Reason:` comments** to explain complex or non-intuitive logic.

### 🧠 AI Behavior Rules

* **Never assume missing context. Ask for clarification if uncertain.**
* **Never hallucinate libraries or functions.** Stick to verified packages and known APIs.
* **Confirm file paths, module names, and exports before using in code or tests.**
* **Never delete or overwrite existing code** unless specifically directed to do so by a `TASK.md` instruction.
* **Follow Golden Rules always:** stay modular, document continuously, and test proactively.
* **ALWAYS UPDTATE DOCUMENTATION AFTER ADDING NEW FEATURES OR CHANGING EXISTING ONES**
