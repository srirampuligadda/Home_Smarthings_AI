## 1. Setup and Project Scaffold

- [x] 1.1 Initialize the Next.js application in the workspace root using non-interactive options.
- [x] 1.2 Set up environment configurations (.env) containing Gemini API keys and SmartThings access tokens.
- [x] 1.3 Create global styling guidelines and CSS custom variables in Next.js for dark-mode glassmorphism.
- [x] 1.4 Add the Gemini system instruction file `prompts/system-prompt.md` to define the consultant guidelines.

## 2. SmartThings Bridge API & Permissions

- [x] 2.1 Implement the Next.js API Route `/api/devices` to fetch device status cache, and `/api/routines` to fetch defined routines from SmartThings.
- [x] 2.2 Add graceful error mapping to intercept HTTP 403 or 401 exceptions from SmartThings (such as when using read-only scopes like `devices:read`), returning a clean JSON error response.
- [x] 2.3 Set up backend simulation middleware to divert approved actions to `logs/simulation_audit.log` on the local file system when Simulation Mode is enabled.

## 3. Gemini Strategy Consultant & Staging

- [x] 3.1 Initialize the Gemini AI model in the Next.js route `/api/chat` using the official Google Gen AI SDK, loading instructions from `prompts/system-prompt.md`.
- [x] 3.2 Declare function-calling tool schemas for Gemini, strictly limiting options to `listRoutines` and `stageRoutineTrigger` (no direct individual device switch controls allowed).
- [x] 3.3 Configure the Gemini chat session to act as a "Smart Home Strategy Consultant" that analyzes device states/logs and formats advice using the exact Markdown Blueprint template structure.
- [x] 3.4 Implement the `/api/pending-actions` endpoint to store in-memory payloads of intercepted tool calls, assigning each a unique pending ID.
- [x] 3.5 Hook the `/api/chat` route to intercept tool executions and append them to `/api/pending-actions` instead of executing them immediately.

## 4. Premium Dashboard Interface

- [x] 4.1 Construct the React page layout with responsive device grid status cards, routine execution triggers, and chat consultant widgets.
- [x] 4.2 Build the "Pending AI Actions" notification queue panel, rendering all queued routines from `/api/pending-actions` with "Approve" and "Deny" action buttons.
- [x] 4.3 Add a sticky header header-switch component to toggle the active state of "Simulation Mode" on the backend.
- [x] 4.4 Style the dashboard with backdrop-filter blur panels, neon borders, pulse glows on active actions, and smooth animated text responses.
- [x] 4.5 Implement visual alert banners that display actionable warning prompts if a routine execute request returns a 403 error.
- [x] 4.6 Show the Smart Things API, Hub and Google Gemini API Connection Status on the top of the page.

## 5. Production Docker Containerization

- [x] 5.1 Create a highly optimized, multi-stage Node.js `Dockerfile` targeting production optimization.
- [x] 5.2 Write `docker-compose.yml` defining port mappings and persistent local volume mounts (`logs/`, `cache/`, and `.env.local`) to securely store data on the Mac across restarts.

## 6. Automated Testing & Security Scan Reports

- [x] 6.1 Set up Jest or Vitest config files, environment variables, and script triggers for local unit/integration mock testing.
- [x] 6.2 Configure ESLint with `eslint-plugin-security` or a local container vulnerability scanner to detect security anomalies.
- [x] 6.3 Write an automated verification script `scripts/verify-change.js` to run test suites and code scans, producing a "Before/After" differential report log comparing coverage, passing rates, and vulnerability counts.

## 7. Dynamic Architectural Diagrams

- [x] 7.1 Author a dedicated `ARCHITECTURE.md` file containing a clean system design diagram rendered using Mermaid.js markdown syntax.
- [x] 7.2 Ensure the Mermaid diagram explicitly illustrates the Docker isolation boundary, local cache volume mounts, Jest/Vitest test environment, local static security scanners, and external REST APIs.
- [x] 7.3 Implement a strict validation check: verify and update the Mermaid diagram automatically for any system modification.

## 8. Security & Safety Verification

- [x] 8.1 Test that natural language instructions (e.g. "make it dark downstairs") do not issue direct device toggles and are constrained to triggers of corresponding routines.
- [x] 8.2 Validate that staged routine actions are intercepted, listed in the queue, and only executed upon clicking "Approve".
- [x] 8.3 Verify that Simulation Mode logs entries to the persistent log file on the Mac storage, bypassing network requests to SmartThings.
- [x] 8.4 Test simulated 403 errors to verify that the permission banner is displayed with advice to use Simulation Mode.
- [x] 8.5 Validate that the Gemini consultant recommends optimization routines matching the strict Markdown Blueprint template structure when analyzing mock sensor logs.
