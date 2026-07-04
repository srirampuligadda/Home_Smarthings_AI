import fs from 'fs';
import path from 'path';

// Initialize global states to survive Hot Module Replacement (HMR) in Next.js development
if (!global.stateInitialized) {
  global.devicesCache = [
    { id: 'living-room-light', name: 'Living Room Light', room: 'Living Room', capabilities: ['switch', 'switchLevel'], state: { switch: 'on', level: 90 } },
    { id: 'kitchen-light', name: 'Kitchen Light', room: 'Kitchen', capabilities: ['switch'], state: { switch: 'off' } },
    { id: 'bedroom-light', name: 'Bedroom Light', room: 'Bedroom', capabilities: ['switch', 'switchLevel'], state: { switch: 'off', level: 40 } },
    { id: 'thermostat', name: 'Smart Thermostat', room: 'Hallway', capabilities: ['thermostatMode', 'temperature'], state: { thermostatMode: 'cool', temperature: 74 } },
    { id: 'living-room-motion', name: 'Living Room Motion Sensor', room: 'Living Room', capabilities: ['motionSensor', 'temperature'], state: { motion: 'inactive', temperature: 72 } }
  ];

  global.routinesCache = [
    { id: 'routine-energy-saver', name: 'Energy Saver Mode', active: false },
    { id: 'routine-good-night', name: 'Good Night Routine', active: false },
    { id: 'routine-movie-night', name: 'Movie Night Mode', active: false },
    { id: 'routine-welcome-home', name: 'Welcome Home Routine', active: false }
  ];

  global.pendingActions = [];
  global.simulationMode = true; // default to true for safety
  
  // Historical sensor logs illustrating optimization opportunities (e.g. AC cooling empty room)
  global.sensorLogs = [
    { timestamp: '2026-07-04T07:00:00Z', event: 'Living Room Motion Sensor has been inactive for 180 minutes.' },
    { timestamp: '2026-07-04T07:15:00Z', event: 'Smart Thermostat remains set to Cool (74°F) despite no activity downstairs.' },
    { timestamp: '2026-07-04T08:00:00Z', event: 'Living Room Light remains ON (90% level) despite no activity.' },
    { timestamp: '2026-07-04T09:30:00Z', event: 'Bedroom Light turned ON.' },
    { timestamp: '2026-07-04T09:45:00Z', event: 'Bedroom Light set to 40% level.' }
  ];
  
  global.stateInitialized = true;
}

export const getDevices = () => global.devicesCache;
export const updateDeviceState = (id, capability, value) => {
  const device = global.devicesCache.find(d => d.id === id);
  if (device) {
    device.state[capability] = value;
    addLog(`Device ${device.name} updated: ${capability} -> ${value}`);
  }
};

export const getRoutines = () => global.routinesCache;
export const getPendingActions = () => global.pendingActions;

export const addPendingAction = (routineId, routineName) => {
  const action = {
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    routineId,
    routineName,
    timestamp: new Date().toISOString(),
    status: 'pending'
  };
  global.pendingActions.push(action);
  addLog(`AI queued pending action: ${routineName} (${routineId})`);
  return action;
};

export const approvePendingAction = (actionId) => {
  const index = global.pendingActions.findIndex(a => a.id === actionId);
  if (index !== -1) {
    const action = global.pendingActions[index];
    action.status = 'approved';
    global.pendingActions.splice(index, 1);
    addLog(`User approved action: ${action.routineName}`);
    return action;
  }
  return null;
};

export const denyPendingAction = (actionId) => {
  const index = global.pendingActions.findIndex(a => a.id === actionId);
  if (index !== -1) {
    const action = global.pendingActions[index];
    global.pendingActions.splice(index, 1);
    addLog(`User denied action: ${action.routineName}`);
    return action;
  }
  return null;
};

export const getSimulationMode = () => global.simulationMode;
export const setSimulationMode = (mode) => {
  global.simulationMode = mode;
  addLog(`Simulation Mode set to: ${mode}`);
};

export const getSensorLogs = () => global.sensorLogs;

export const addLog = (message) => {
  const timestamp = new Date().toISOString();
  global.sensorLogs.unshift({ timestamp, event: message });
  if (global.sensorLogs.length > 100) {
    global.sensorLogs.pop();
  }
};

// Writes a record of simulated command execution to a local audit log on Mac
export const writeAuditLog = (routineId, routineName) => {
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  const logPath = path.join(logDir, 'simulation_audit.log');
  const entry = `[${new Date().toISOString()}] SIMULATED ROUTINE EXECUTION - ID: ${routineId}, Name: ${routineName}\n`;
  fs.appendFileSync(logPath, entry);
};
