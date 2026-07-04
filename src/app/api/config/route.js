import { NextResponse } from 'next/server';
import { getSimulationMode, setSimulationMode, getSensorLogs } from '@/lib/state';

export async function GET() {
  return NextResponse.json({
    simulationMode: getSimulationMode(),
    logs: getSensorLogs()
  });
}

export async function POST(req) {
  try {
    const { simulationMode } = await req.json();
    if (simulationMode !== undefined) {
      setSimulationMode(simulationMode);
      return NextResponse.json({ success: true, simulationMode });
    }
    return NextResponse.json({ error: 'Missing simulationMode parameter' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
