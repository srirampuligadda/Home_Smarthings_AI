import { NextResponse } from 'next/server';
import { getRoutines, getSimulationMode, writeAuditLog, addLog } from '@/lib/state';

export async function GET() {
  const token = process.env.SMARTTHINGS_TOKEN;
  const isSimulation = getSimulationMode();

  if (isSimulation || !token || token === 'your_smartthings_token_here') {
    return NextResponse.json(getRoutines());
  }

  try {
    const res = await fetch('https://api.smartthings.com/v1/scenes', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.status === 403 || res.status === 401) {
      return NextResponse.json(
        { error: 'Permission Denied: Ensure your SmartThings token has the required permissions.' },
        { status: 403 }
      );
    }

    if (!res.ok) {
      throw new Error(`SmartThings returned status ${res.status}`);
    }

    const data = await res.json();
    const mappedItems = (data.items || []).map(scene => ({
      id: scene.sceneId || scene.id,
      name: scene.sceneName || scene.name,
      active: false
    }));
    return NextResponse.json(mappedItems);
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch routines: ${err.message}. Falling back to cached simulation data.` },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { routineId, routineName } = await req.json();
    const token = process.env.SMARTTHINGS_TOKEN;
    const isSimulation = getSimulationMode();

    if (!routineId) {
      return NextResponse.json({ error: 'Missing routineId parameter' }, { status: 400 });
    }

    addLog(`Initiating trigger for Routine: ${routineName || routineId}`);

    if (isSimulation) {
      writeAuditLog(routineId, routineName || 'Unnamed Routine');
      addLog(`[SIMULATION] Routine ${routineName || routineId} executed successfully and logged to simulation_audit.log.`);
      return NextResponse.json({ success: true, simulated: true });
    }

    // Direct execution via SmartThings API
    // Check if token behaves like a read-only token
    if (token && token.toLowerCase().includes('read')) {
      addLog(`Write execution blocked: SmartThings token has read-only permissions.`);
      return NextResponse.json(
        { error: 'Permission Denied: Write action blocked. Your SmartThings token is set to read-only (devices:read).' },
        { status: 403 }
      );
    }

    if (!token || token === 'your_smartthings_token_here') {
      return NextResponse.json(
        { error: 'Configuration Error: No SmartThings Token configured. Enable Simulation Mode to trigger routines.' },
        { status: 403 }
      );
    }

    const res = await fetch(`https://api.smartthings.com/v1/scenes/${routineId}/execute`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.status === 403 || res.status === 401) {
      addLog(`Write execution blocked: SmartThings API returned 403 Forbidden.`);
      return NextResponse.json(
        { error: 'Permission Denied: Write action blocked. Your SmartThings token is set to read-only (devices:read).' },
        { status: 403 }
      );
    }

    if (!res.ok) {
      throw new Error(`SmartThings execution returned status ${res.status}`);
    }

    addLog(`Routine ${routineName || routineId} executed successfully on SmartThings Cloud.`);
    return NextResponse.json({ success: true, simulated: false });
  } catch (err) {
    addLog(`Error executing routine: ${err.message}`);
    return NextResponse.json({ error: `Execution failed: ${err.message}` }, { status: 500 });
  }
}
