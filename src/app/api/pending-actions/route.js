import { NextResponse } from 'next/server';
import { getPendingActions, approvePendingAction, denyPendingAction, getSimulationMode, writeAuditLog, addLog } from '@/lib/state';

export async function GET() {
  return NextResponse.json(getPendingActions());
}

export async function POST(req) {
  try {
    const { actionId, actionType } = await req.json();

    if (!actionId || !actionType) {
      return NextResponse.json({ error: 'Missing actionId or actionType parameters' }, { status: 400 });
    }

    if (actionType === 'approve') {
      const action = approvePendingAction(actionId);
      if (!action) {
        return NextResponse.json({ error: 'Action not found or already processed' }, { status: 404 });
      }

      // Execute the routine trigger now that the user has approved it
      const token = process.env.SMARTTHINGS_TOKEN;
      const isSimulation = getSimulationMode();

      if (isSimulation) {
        writeAuditLog(action.routineId, action.routineName);
        addLog(`[APPROVED HITL] Simulated Routine ${action.routineName} executed and logged to simulation_audit.log.`);
        return NextResponse.json({ success: true, simulated: true, action });
      }

      // Handle read-only token behaves
      if (token && token.toLowerCase().includes('read')) {
        addLog(`[APPROVED HITL] Write execution blocked: SmartThings token has read-only permissions.`);
        return NextResponse.json(
          { error: 'Permission Denied: Write action blocked. Your SmartThings token is set to read-only (devices:read).' },
          { status: 403 }
        );
      }

      if (!token || token === 'your_smartthings_token_here') {
        return NextResponse.json(
          { error: 'Configuration Error: No SmartThings Token configured. Enable Simulation Mode to test routine triggers.' },
          { status: 403 }
        );
      }

      const res = await fetch(`https://api.smartthings.com/v1/scenes/${action.routineId}/execute`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.status === 403 || res.status === 401) {
        addLog(`[APPROVED HITL] Write execution blocked: SmartThings API returned 403 Forbidden.`);
        return NextResponse.json(
          { error: 'Permission Denied: Write action blocked. Your SmartThings token is set to read-only (devices:read).' },
          { status: 403 }
        );
      }

      if (!res.ok) {
        throw new Error(`SmartThings execution returned status ${res.status}`);
      }

      addLog(`[APPROVED HITL] Routine ${action.routineName} executed successfully on SmartThings Cloud.`);
      return NextResponse.json({ success: true, simulated: false, action });
    } 
    
    if (actionType === 'deny') {
      const action = denyPendingAction(actionId);
      if (!action) {
        return NextResponse.json({ error: 'Action not found or already processed' }, { status: 404 });
      }
      return NextResponse.json({ success: true, action });
    }

    return NextResponse.json({ error: 'Invalid actionType. Use "approve" or "deny".' }, { status: 400 });
  } catch (err) {
    addLog(`Error processing pending action: ${err.message}`);
    return NextResponse.json({ error: `Action processing failed: ${err.message}` }, { status: 500 });
  }
}
