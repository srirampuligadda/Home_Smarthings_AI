## Context

The SmartThings-Gemini Bridge is a secure, local smart home assistant orchestrator built as a Next.js application. It connects Samsung SmartThings Routines to Google's Gemini AI with strict safety controls, preventing direct AI execution of physical actions without user approval. Additionally, it configures Gemini's role as a "Smart Home Strategy Consultant" that analyzes sensor logs and recommends optimization opportunities using a strict markdown template. To support local production hosting and long-term security, it includes a multi-stage production Docker environment, Jest/Vitest testing and automated security scanners, and Mermaid.js system architecture diagram tracking.

### System Architecture Overview

```
                      +---------------------------------------+
                      |       Smart Home Dashboard UI         |
                      |  (React/Next.js Premium Glassmorphic) |
                      |    - Device & Routine View            |
                      |    - Chat Consultant Widget           |
                      |    - Pending AI Actions Queue Panel   |
                      |    - Simulation Mode Toggle Button    |
                      +-------------------+-------------------+
                                          | REST API / SSE Events
                                          v
                      +---------------------------------------+
                      |           Next.js API Routes          |
                      |  - State Cache  - Pending Actions     |
                      |  - Read-Only Token Handler (403)      |
                      |  - Audit Log    - Gemini Orchestrator |
                      +-------+-----------------------+-------+
                              |                       |
            SmartThings APIs  |                       |  Gemini APIs
            (Webhooks/REST)   v                       v  (Consultant / Blueprints)
                      +---------------+       +---------------+
                      | SmartThings   |       | Google Gemini |
                      | Cloud Platform|       | API Endpoint  |
                      +---------------+       +---------------+
```

## Goals / Non-Goals

**Goals:**
- **Human-in-the-Loop (HITL) Execution**: Intercept all AI-generated routine-trigger requests, staging them in an in-memory queue (`/api/pending-actions`) on the server. Command execution only occurs after explicit user confirmation on the UI.
- **AI Consultant Role**: Restructure the Gemini model's system prompt as a "Smart Home Strategy Consultant." The AI scans historical/real-time device sensor logs and suggests actionable routine updates.
- **Structured Recommendations**: Mandate that the AI format all proposed smart home routines according to a strict, standardized markdown template defining the Why, If (Triggers), and Then (Actions).
- **Strict Read/Write Isolation**: Gracefully handle `403 Forbidden` API states when executing actions with a read-only token (`devices:read`).
- **Simulation Mode**: Allow the user to toggle "Simulation Mode" in the UI. When active, all approved actions are recorded to a local audit file (`simulation_audit.log`) on the server's local storage instead of calling the SmartThings Cloud API.
- **Restricted LLM Scope**: Restrict the Gemini model's tool capabilities solely to listing and triggering defined SmartThings Routines, rather than direct device switches.
- **Production Containerization**: Packages the application into a multi-stage production Docker image with local mount persistence on Mac for caches and logs.
- **Diagram Maintenance**: Declares a dedicated `ARCHITECTURE.md` file hosting Mermaid.js visual flows, requiring the agent to automatically verify the diagrams for design adjustments.
- **Quality & Security Reports**: Implements testing (Jest/Vitest) and local scanning (eslint-plugin-security or Snyk/Trivy), using a custom script to generate a "Before/After" report comparing test coverage and package vulnerability states.

**Non-Goals:**
- Direct device-level parameter adjustments (e.g., setting thermostat degrees directly via LLM). All changes must go through pre-defined SmartThings Routines.
- Multi-user authentication database. Security is maintained through local execution and local environment tokens.

## Decisions

### Decision 1: Next.js App Router Framework
The project will be built as a unified Next.js application instead of Express/static assets.
- **Rationale**: Next.js App Router provides API routes for backend logic (fetching SmartThings APIs, running Gemini API, storing queue state) and React for the interactive UI. This keeps the codebase unified in a single repository while supporting advanced UI state tracking.
- **Staging State**: Pending actions will be stored in an in-memory array on the server, exposed via `/api/pending-actions`.
- **Alternative considered**: Express backend + React frontend separate builds. Rejected as a single Next.js project is cleaner and easier to initialize and run locally.

### Decision 2: Restricted Tooling Scope to SmartThings Routines
The Gemini prompt will be configured with a toolset limited to:
1. `listRoutines()`: Fetches names and IDs of available SmartThings Routines.
2. `stageRoutineTrigger(routineId, routineName)`: Stages a routine execution request in the queue.
- **Rationale**: Direct toggle of device switches by an LLM is high-risk (e.g., accidentally opening locks or disabling heating). Restricting tools to pre-defined Routines ensures the AI operates only within user-defined safety boundaries.
- **Alternative considered**: Direct device controls. Rejected due to security risks.

### Decision 3: Human-in-the-Loop (HITL) Action Staging Queue
When the user talks to the Gemini assistant, the backend does not execute the routine immediately.
- **Execution Flow**:
  1. User says: "Prepare the house for sleep."
  2. Gemini matches intent to tool `stageRoutineTrigger(routineId="bedtime-routine-id", routineName="Good Night Routine")`.
  3. The Next.js API intercepts this call, assigns a unique ID, and appends it to `/api/pending-actions`.
  4. The client UI polls or receives SSE, rendering a card in the "Pending AI Actions" queue.
  5. The user reviews the action and clicks "Approve" (sends POST to `/api/pending-actions/approve` to trigger SmartThings) or "Deny" (removes from queue).

### Decision 4: Simulation Mode and Read-Only Graceful Handling
- **Simulation Toggle**: The UI has a sticky header toggle for Simulation Mode. When set to `true`, a flag is stored in the backend config. Any approved command is diverted to `logs/simulation_audit.log` with a timestamp and parameters, skipping SmartThings.
- **Read-Only Token Protection**: If a command execution attempts to call SmartThings but the API returns `403 Forbidden` (e.g. read-only token `devices:read`), the backend returns a clean, detailed error payload. The UI displays a warning banner instructing the user to check their SmartThings token permissions or enable Simulation Mode.

### Decision 5: Consultant System Prompt File
We will store the Gemini system prompt in a dedicated file at `prompts/system-prompt.md`.
- **Rationale**: Externalizing the prompt simplifies updates, keeps model configuration decoupled from runtime middleware code, and allows OpenSpec blueprints to trace model expectations.
- **Formatting Template**: The system prompt strictly forces Gemini to format recommendations using the following template:
  ```markdown
  ### 📋 Suggested New Routine: [Routine Name]
  * **Why:** [Rationale, energy savings, or comfort benefit based on sensor data/logs]
  * **If (Triggers & Conditions):**
    - [Trigger 1]
    - [Condition 1]
  * **Then (Actions):**
    - [Action 1]
    - [Action 2]
  ```

### Decision 6: Mermaid.js Architecture Verification in ARCHITECTURE.md
We will maintain a dedicated `ARCHITECTURE.md` file using Mermaid.js markdown flow diagrams.
- **Constraint**: Any future change to project endpoints, components, or files must trigger a matching Mermaid block update. The diagram highlights the Docker isolation perimeter, cache mounts, Jest test runners, the Trivy/eslint-plugin-security scanning layers, and external REST boundaries.

### Decision 7: Multi-Stage Production Containerization
We will build a two-stage `Dockerfile` (Build stage -> Production Runner stage) and a `docker-compose.yml` orchestrator.
- **Persistency**: Volume mappings map local paths `logs/`, `cache/`, and `.env.local` inside the container. This preserves logs, config choices, and simulation registries across container updates or host computer reboots.

### Decision 8: Automated "Before/After" Security & Quality Snapshot Harness
An integration script `scripts/verify-change.js` (or similar) will run BEFORE `/opsx:apply` and AFTER `/opsx:apply` to produce differential audit logs.
- **Report Details**: Documents code coverage percentage, count of passing Jest/Vitest unit and mock API integration tests, and number of package vulnerabilities reported by the local scan (eslint-plugin-security or snyk/trivy checks).

## Risks / Trade-offs

- **[Risk]** Data loss of pending actions on server restart -> **[Mitigation]** The pending queue is lightweight and session-based. A notification is shown if the session resets.
- **[Risk]** User frustration with prompt execution latency -> **[Mitigation]** The UI immediately inserts a "Thinking..." bubble in the chat window, and the "Pending AI Actions" panel has an active pulse animation while Gemini processes the query.
- **[Risk]** Multi-stage build size overhead -> **[Mitigation]** The production stage only copies package.json, next.config, and built static outputs (.next) along with node_modules, omitting devDependencies, ensuring a lean and fast build.
