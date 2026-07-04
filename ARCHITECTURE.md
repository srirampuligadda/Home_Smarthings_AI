# System Architecture

## Overview
This document outlines the architectural boundaries, containerization strategy, test harnesses, and external API connectors for the **SmartThings-Gemini Bridge**.

## Dynamic Architecture Flow
The following Mermaid.js diagram illustrates the complete end-to-end system flow.

> **Validation Constraint**: Any future system modifications to backend routes, Docker configuration, scanner integrations, or data persistence must be updated in this diagram automatically.

```mermaid
flowchart TD
    %% External Actors
    User([User / Browser])
    SmartThingsCloud[(Samsung SmartThings APIs)]
    GeminiCloud[(Google Gemini API)]

    %% Host Environment
    subgraph HostMac["Local Host Environment (Mac)"]
        
        %% Local Testing and Scanning Wrapper
        subgraph Automation["Before/After Automation Harness"]
            VerifyScript[scripts/verify-change.js]
            JestTest["Jest/Vitest Environment"]
            ESLintScan["Static Security Analyzer (eslint-plugin-security / Trivy)"]
            
            VerifyScript --> JestTest
            VerifyScript --> ESLintScan
        end

        %% Docker Isolation Boundary
        subgraph DockerEnv["Docker Compose Production Network (smartthings-gemini-bridge)"]
            
            %% Multi-Stage Build Context
            subgraph Runner["Next.js Node.js Runner Container"]
                NextRouter[Next.js App Router]
                
                %% Frontend
                Dashboard[Premium Dashboard UI]
                
                %% Backend APIs
                ApiDevices[/api/devices]
                ApiRoutines[/api/routines]
                ApiChat[/api/chat Orchestrator]
                ApiPending[/api/pending-actions HITL Queue]
                
                %% Linkages
                Dashboard <--> ApiPending
                Dashboard <--> ApiChat
                Dashboard <--> ApiDevices
                Dashboard <--> ApiRoutines
            end
        end

        %% Host Volume Mounts
        subgraph VolumeMounts["Local Persistent Volume Mounts"]
            LocalLogs[/logs/simulation_audit.log]
            LocalCache[/cache/]
            LocalEnv[/.env.local]
        end
    end

    %% Wiring connections
    User -->|Views & Interacts| Dashboard
    
    %% API Connectors
    ApiDevices -->|Fetch State (Read-only)| SmartThingsCloud
    ApiRoutines -->|Execute Action (403 fallback)| SmartThingsCloud
    ApiChat -->|Send Context & Receive Blueprint| GeminiCloud
    
    %% Volume mount mappings
    ApiPending -.->|Simulation Mode logging| LocalLogs
    NextRouter -.->|Persists data| LocalCache
    NextRouter -.->|Reads configuration| LocalEnv
    
    %% Scanner context
    Automation -.- DockerEnv
```

## Isolation boundaries & Data flow

1. **Docker Isolation Boundary**: The system runs inside a `node:20-alpine` production container. It isolates the Next.js runtime from the host system's configuration.
2. **Local Cache Volume Mounts**: Persistent state (such as the `logs/` and `cache/`) is mapped directly to the local file system on the Mac, surviving container destruction and restarts.
3. **Jest/Vitest & Scanning Harness**: The tests and security analyzers run on the outer host automation layer to scan the codebase prior to or after container deployment.
4. **External API Boundaries**: Traffic only leaves the network to hit `Samsung SmartThings` (for sensor context or execution) and `Google Gemini` (for intelligent analysis).
