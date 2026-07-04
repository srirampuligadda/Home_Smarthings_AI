import { GET, POST } from '../route';
import { getSimulationMode, getRoutines } from '@/lib/state';

// Mock the dependencies
jest.mock('@/lib/state', () => ({
  getSimulationMode: jest.fn(),
  getRoutines: jest.fn(),
  writeAuditLog: jest.fn(),
  addLog: jest.fn(),
}));

describe('Routines API', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('GET /api/routines', () => {
    it('should return simulated routines if in simulation mode', async () => {
      getSimulationMode.mockReturnValue(true);
      const mockRoutines = [{ id: 'mock-1', name: 'Mock Routine' }];
      getRoutines.mockReturnValue(mockRoutines);

      const response = await GET();
      const data = await response.json();

      expect(data).toEqual(mockRoutines);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should map SmartThings scenes to local format when connected', async () => {
      getSimulationMode.mockReturnValue(false);
      process.env.SMARTTHINGS_TOKEN = 'valid-token';

      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          items: [
            { sceneId: 'st-1', sceneName: 'Good Morning' }
          ]
        })
      });

      const response = await GET();
      const data = await response.json();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.smartthings.com/v1/scenes',
        expect.objectContaining({
          headers: { Authorization: 'Bearer valid-token' }
        })
      );
      
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('st-1');
      expect(data[0].name).toBe('Good Morning');
      expect(data[0].active).toBe(false);
    });

    it('should handle SmartThings API errors', async () => {
      getSimulationMode.mockReturnValue(false);
      process.env.SMARTTHINGS_TOKEN = 'valid-token';

      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to fetch routines');
    });
  });

  describe('POST /api/routines', () => {
    it('should return 400 if routineId is missing', async () => {
      const mockReq = {
        json: jest.fn().mockResolvedValue({})
      };

      const response = await POST(mockReq);
      expect(response.status).toBe(400);
    });

    it('should handle simulated execution successfully', async () => {
      getSimulationMode.mockReturnValue(true);
      
      const mockReq = {
        json: jest.fn().mockResolvedValue({ routineId: 'routine-1', routineName: 'Test' })
      };

      const response = await POST(mockReq);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.simulated).toBe(true);
      expect(data.success).toBe(true);
    });
  });
});
