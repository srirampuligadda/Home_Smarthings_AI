## ADDED Requirements

### Requirement: Device and Routine Discovery
The smartthings-bridge SHALL retrieve a list of all authorized devices and defined scenes/routines from the SmartThings REST API.

#### Scenario: Successful routines discovery
- **WHEN** the bridge initiates a list request for scenes or routines
- **THEN** it returns a collection of routine objects containing ID, name, and execution path

### Requirement: Read-Only Token Graceful Degradation
The smartthings-bridge SHALL capture and handle authentication/permission errors (HTTP 403 or 401) gracefully if the SmartThings token is set to read-only (`devices:read`).

#### Scenario: Routine execution with read-only token
- **WHEN** a routine execution request is sent to SmartThings but the API returns HTTP 403 Forbidden
- **THEN** the bridge intercepts the error, cancels execution, and returns a detailed permission error payload to the client interface

### Requirement: Simulation Mode Audit Logging
The smartthings-bridge SHALL check if Simulation Mode is enabled before issuing command payloads to the SmartThings API.

#### Scenario: Triggering routine in simulation mode
- **WHEN** a routine triggers while Simulation Mode is enabled
- **THEN** the bridge bypasses the SmartThings Cloud request, writes a structured record of the event (timestamp, routine ID, name) to `logs/simulation_audit.log` on the host machine, and returns a successful simulated response code
