## ADDED Requirements

### Requirement: Multi-Stage Production Containerization
The system-operations SHALL pack the Next.js application into a highly optimized, two-stage Docker image (builder and runner), using a custom `Dockerfile` and a `docker-compose.yml` service wrapper.

#### Scenario: Verify Docker cache mounts and persistence
- **WHEN** the container restarts or re-deploys via `docker-compose up`
- **THEN** configuration settings, `logs/simulation_audit.log`, and cached device metrics persist securely on the host Mac directory mapping without data loss

### Requirement: Architecture Diagram Automated Verification
The system-operations SHALL maintain a dedicated `ARCHITECTURE.md` file in the root containing a system flow diagram matching Mermaid.js markdown specification.

#### Scenario: Automated validation of Mermaid architecture diagram
- **WHEN** any backend route, scanner component, or configuration directory structure is updated
- **THEN** the Mermaid diagram MUST be verified and edited to illustrate the updated system flow, displaying the Docker isolation perimeter, Jest/Vitest runners, Trivy scanner integrations, and external API connectors

### Requirement: Before/After Quality & Security Snapshot Report
The system-operations SHALL execute a verification script that captures baseline quality snapshots before implementation and validates results after implementation.

#### Scenario: Running differential security scan reports
- **WHEN** the validation runner is executed
- **THEN** it performs unit testing (via Jest/Vitest) and local code security scans, generating a consolidated log showing:
  - Code coverage comparison percentages (Before vs. After)
  - Unit/Integration test success count
  - Scan vulnerability counts (with a target of zero packages)
