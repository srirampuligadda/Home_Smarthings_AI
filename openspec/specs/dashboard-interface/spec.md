## ADDED Requirements

### Requirement: Pending AI Actions Queue Panel
The dashboard-interface SHALL display a dedicated, interactive "Pending AI Actions" notification queue panel showcasing all routines queued for execution by Gemini.

#### Scenario: Visual review and approval of queued actions
- **WHEN** an action is staged in the `/api/pending-actions` queue
- **THEN** it renders a card showing the routine name and a timestamp, alongside explicit "Approve" and "Deny" action buttons

### Requirement: Simulation Mode Toggle
The dashboard-interface SHALL display a persistent and toggleable Simulation Mode switch in the UI header.

#### Scenario: Enable simulation mode
- **WHEN** the user toggles the Simulation Mode switch on the dashboard
- **THEN** the client sends a state update API call to the backend, changes the header status banner to "SIMULATION ACTIVE" in neon yellow, and logs subsequent actions to the audit file rather than executing them in the cloud

### Requirement: Permission Error Notification Banner
The dashboard-interface SHALL render a clear, warning banner when a command fails due to insufficient SmartThings token permissions (e.g. HTTP 403 / read-only).

#### Scenario: Handling 403 state change error
- **WHEN** the backend returns an authorization error (HTTP 403) from a routine trigger attempt
- **THEN** the dashboard clears the loading state and displays an error alert: "Permission Denied: Ensure your SmartThings token is not read-only, or toggle Simulation Mode to test locally."
