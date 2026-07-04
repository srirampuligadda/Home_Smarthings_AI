import { 
  getDevices, 
  updateDeviceState, 
  getRoutines, 
  getPendingActions, 
  addPendingAction, 
  handlePendingAction,
  getLogs,
  getSimulationMode,
  setSimulationMode
} from '../state';

describe('Global State Management', () => {
  beforeEach(() => {
    // Reset any state mutation that tests might have caused
    // Since we rely on global, we test its functional mutators
  });

  it('should return initial mocked devices in simulation mode', () => {
    const devices = getDevices();
    expect(devices.length).toBeGreaterThan(0);
    expect(devices[0]).toHaveProperty('id');
    expect(devices[0]).toHaveProperty('state');
  });

  it('should update device state correctly', () => {
    const devices = getDevices();
    const testDevice = devices[0];
    const initialSwitch = testDevice.state.switch;
    const newSwitch = initialSwitch === 'on' ? 'off' : 'on';
    
    updateDeviceState(testDevice.id, 'switch', newSwitch);
    
    const updatedDevices = getDevices();
    const updatedTestDevice = updatedDevices.find(d => d.id === testDevice.id);
    expect(updatedTestDevice.state.switch).toBe(newSwitch);
  });

  it('should manage pending actions', () => {
    const routineId = 'routine-test-123';
    const routineName = 'Test Routine';
    
    const action = addPendingAction(routineId, routineName);
    
    expect(action).toHaveProperty('id');
    expect(action.routineId).toBe(routineId);
    expect(action.status).toBe('pending');
    
    let pending = getPendingActions();
    expect(pending.find(a => a.id === action.id)).toBeDefined();

    handlePendingAction(action.id, 'approve');
    
    pending = getPendingActions();
    expect(pending.find(a => a.id === action.id)).toBeUndefined();
  });

  it('should toggle simulation mode', () => {
    const initialMode = getSimulationMode();
    setSimulationMode(!initialMode);
    expect(getSimulationMode()).toBe(!initialMode);
    
    // reset
    setSimulationMode(initialMode);
  });
  
  it('should log events correctly', () => {
    const logs = getLogs();
    const initialLogCount = logs.length;
    
    addPendingAction('log-test-id', 'Log Test Routine');
    
    const updatedLogs = getLogs();
    expect(updatedLogs.length).toBeGreaterThan(initialLogCount);
    expect(updatedLogs[0].event).toContain('Log Test Routine'); // newest logs are added to the beginning or end depending on impl.
  });
});
