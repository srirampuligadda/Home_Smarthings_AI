import { NextResponse } from 'next/server';
import { getDevices, getSimulationMode } from '@/lib/state';

export async function GET() {
  const token = process.env.SMARTTHINGS_TOKEN;
  const isSimulation = getSimulationMode();

  // If Simulation Mode is active or no token is provided, return our high-fidelity mock devices
  if (isSimulation || !token || token === 'your_smartthings_token_here') {
    return NextResponse.json(getDevices());
  }

  try {
    const res = await fetch('https://api.smartthings.com/v1/devices', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.status === 403 || res.status === 401) {
      return NextResponse.json(
        { error: 'Permission Denied: Ensure your SmartThings token has the required read permissions.' },
        { status: 403 }
      );
    }

    if (!res.ok) {
      throw new Error(`SmartThings returned status ${res.status}`);
    }

    const data = await res.json();
    const items = data.items || [];

    // Fetch states for each device in parallel
    const devices = await Promise.all(
      items.map(async (item) => {
        let state = { switch: 'off' };
        let room = 'SmartThings Room';

        try {
          const statusRes = await fetch(`https://api.smartthings.com/v1/devices/${item.deviceId}/status`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          if (statusRes.ok) {
            const statusData = await statusRes.json();
            const mainComp = statusData.components?.main || {};

            if (mainComp.switch?.switch) {
              state.switch = mainComp.switch.switch.value || 'off';
            }
            if (mainComp.switchLevel?.level) {
              state.level = mainComp.switchLevel.level.value;
            }
            if (mainComp.temperatureMeasurement?.temperature) {
              state.temperature = mainComp.temperatureMeasurement.temperature.value;
            } else if (mainComp.thermostat?.temperature) {
              state.temperature = mainComp.thermostat.temperature.value;
            }
          }
        } catch (err) {
          console.error(`Failed to fetch status for device ${item.deviceId}:`, err);
        }

        return {
          id: item.deviceId,
          name: item.label || item.name,
          room: room,
          capabilities: item.components?.[0]?.capabilities?.map(c => c.id) || [],
          state: state
        };
      })
    );

    return NextResponse.json(devices);
  } catch (err) {
    console.error("GET /api/devices error:", err);
    return NextResponse.json(
      { error: `Failed to fetch devices: ${err.message}. Falling back to cached simulation data.` },
      { status: 500 }
    );
  }
}
