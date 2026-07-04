import { NextResponse } from 'next/server';
import { getSimulationMode } from '@/lib/state';

export async function GET() {
  const isSimulation = getSimulationMode();
  
  const geminiToken = process.env.GEMINI_API_KEY;
  const isGeminiConnected = geminiToken && geminiToken !== 'your_gemini_api_key_here';

  const stToken = process.env.SMARTTHINGS_TOKEN;
  const isStConnected = stToken && stToken !== 'your_smartthings_token_here';

  // Mock timestamp to demonstrate disconnected state tracking
  const lastConnectedTime = new Date(Date.now() - 7200000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}); 

  return NextResponse.json({
    gemini: isGeminiConnected ? 'Connected' : 'Local Fallback',
    smartthings: isSimulation ? 'Simulation Mode' : (isStConnected ? 'Connected' : `Disconnected (Last connected: ${lastConnectedTime})`),
    hub: isSimulation ? 'SmartThings Hub' : (isStConnected ? 'Online' : `Offline (Last connected: ${lastConnectedTime})`)
  });
}
