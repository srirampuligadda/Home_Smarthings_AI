## Why

Smart home systems currently rely on rigid automation rules, schedules, and complex UI configurations, making them unintelligent and difficult to personalize. Integrating Samsung SmartThings with Google's Gemini API bridges this gap by enabling natural language understanding (NLU) to dynamically query and trigger home automation. However, direct AI command execution poses safety and security risks. This proposal introduces strict security and safety guardrails, including Human-in-the-Loop (HITL) action approval, simulation modes, and restricted tooling scope, all orchestrated via a secure Next.js web application. Additionally, the AI is styled as a "Smart Home Strategy Consultant," identifying routine optimization opportunities and recommending actionable Routine Blueprints based on sensor logs, even with read-only SmartThings token permissions. To ensure long-term maintenance, production-grade security, and ease of deployment, this proposal also introduces strict containerization, automated testing/vulnerability scanning harnesses, and dynamic architectural diagrams.

## What Changes

- **NEW** Local Bridge backend built with Next.js App Router API Routes, orchestrating SmartThings device states, managing pending actions, and executing authorized routines.
- **NEW** Gemini API agent acting as a "Smart Home Strategy Consultant," analyzing sensor data/logs for optimization opportunities and recommending structured SmartThings Routine Blueprints.
- **NEW** Human-in-the-Loop (HITL) staging mechanism where all AI-generated actions are intercepted and held in a temporary `/api/pending-actions` queue state for user review.
- **NEW** Premium Smart Home Dashboard UI using modern web design principles (glassmorphism, vibrant dark mode, smooth micro-animations, and responsive layouts) built as a Next.js application.
- **NEW** Staging queue panel ("Pending AI Actions") in the UI for visual approval/denial of queued commands.
- **NEW** "Simulation Mode" toggle in the UI that redirects executed commands to a local audit log file instead of SmartThings Cloud when enabled.
- **NEW** Graceful error handling for token permissions, handling `403 Forbidden` errors if the SmartThings token is read-only (`devices:read`).
- **NEW** Multi-stage production `Dockerfile` and a `docker-compose.yml` configuration mapping local persistent data folders (logs, cache, configuration).
- **NEW** Automated testing (Jest/Vitest) and static security scan (ESLint security plugin or Snyk/Trivy container scanner) yielding a detailed "Before/After" report format.
- **NEW** Dedicated `ARCHITECTURE.md` file featuring Mermaid.js architectural diagrams illustrating the Docker boundaries, volume mounts, testing harness, scanner layer, and APIs, enforced by automated diagram verification guidelines.

## Capabilities

### New Capabilities
- `smartthings-bridge`: Interacts with the Samsung SmartThings API to discover devices, fetch current states, list scenes/routines, handle read-only token restrictions gracefully, and trigger scenes/routines with safety guardrails.
- `gemini-orchestrator`: Uses the Gemini API as a "Smart Home Strategy Consultant" to analyze home context, identify optimization opportunities, and format actionable "SmartThings Routine Blueprints" using a strict markdown template.
- `dashboard-interface`: Provides a modern Next.js dashboard UI featuring device cards, a chat widget, a "Pending AI Actions" queue panel, and a "Simulation Mode" toggle.
- `system-operations`: Orchestrates Docker multi-stage containerization, local persistent volume mounts, the Jest/Vitest testing suite, security vulnerability scanner reports, and Mermaid.js diagram automated verification.

### Modified Capabilities
<!-- None. This is the initial system initialization. -->

## Impact

- **Backend API**: Next.js App Router APIs (`/api/devices`, `/api/routines`, `/api/chat`, `/api/pending-actions`) handling state caching, LLM execution, and staging state.
- **Frontend Assets**: Premium Next.js React client with real-time state synchronization, interactive command validation queue, and simulation logging.
- **Third-Party APIs**: Samsung SmartThings API and Google Gemini API (using `@google/genai` SDK).
- **Configuration & Audit**: Environment file `.env` for keys, system prompt definition file `prompts/system-prompt.md`, and a persistent local audit file `audit.log` (on the local Mac environment) for simulation outputs.
- **Infrastructure**: Production multi-stage Docker configurations, `docker-compose.yml`, test suites, security vulnerability scanners, and dynamic `ARCHITECTURE.md` drawings.
