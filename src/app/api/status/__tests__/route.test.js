import { GET } from '../route';
import { getSimulationMode } from '@/lib/state';

// Mock the state dependency
jest.mock('@/lib/state', () => ({
  getSimulationMode: jest.fn(),
}));

describe('GET /api/status', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return simulation mode status when getSimulationMode is true', async () => {
    getSimulationMode.mockReturnValue(true);

    const response = await GET();
    const data = await response.json();

    expect(data.smartthings).toBe('Simulation Mode');
    expect(data.hub).toBe('SmartThings Hub');
  });

  it('should return connected when tokens are set and simulation is false', async () => {
    getSimulationMode.mockReturnValue(false);
    process.env.GEMINI_API_KEY = 'real-gemini-key';
    process.env.SMARTTHINGS_TOKEN = 'real-smartthings-key';

    const response = await GET();
    const data = await response.json();

    expect(data.gemini).toBe('Connected');
    expect(data.smartthings).toBe('Connected');
    expect(data.hub).toBe('Online');
  });

  it('should return disconnected/fallback when tokens are missing or default and simulation is false', async () => {
    getSimulationMode.mockReturnValue(false);
    process.env.GEMINI_API_KEY = 'your_gemini_api_key_here';
    process.env.SMARTTHINGS_TOKEN = 'your_smartthings_token_here';

    const response = await GET();
    const data = await response.json();

    expect(data.gemini).toBe('Local Fallback');
    expect(data.smartthings).toContain('Disconnected');
    expect(data.hub).toContain('Offline');
  });
});
