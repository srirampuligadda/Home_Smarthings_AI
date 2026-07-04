'use client';

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [devices, setDevices] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [pendingActions, setPendingActions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [simulationMode, setSimulationMode] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your **Smart Home Strategy Consultant**.\n\nI can analyze your smart home logs for optimization opportunities or stage routines safely for your approval.\n\n* Try asking: **"Suggest routine optimizations based on logs"**\n* Or: **"Activate Good Night Routine"**' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const chatEndRef = useRef(null);

  // Initial fetch
  useEffect(() => {
    fetchData();
    // Poll every 3 seconds for live state sync
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const fetchData = async () => {
    try {
      // Fetch config & logs
      const configRes = await fetch('/api/config');
      if (configRes.ok) {
        const configData = await configRes.json();
        setSimulationMode(configData.simulationMode);
        setLogs(configData.logs || []);
      }

      // Fetch connection status
      const statusRes = await fetch('/api/status');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setConnectionStatus(statusData);
      }

      // Fetch devices
      const devicesRes = await fetch('/api/devices');
      if (devicesRes.ok) {
        const devicesData = await devicesRes.json();
        setDevices(devicesData);
      } else if (devicesRes.status === 403) {
        setErrorMessage('SmartThings Read Access Blocked: Check API Token configuration.');
      }

      // Fetch routines
      const routinesRes = await fetch('/api/routines');
      if (routinesRes.ok) {
        const routinesData = await routinesRes.json();
        setRoutines(routinesData);
      }

      // Fetch pending actions
      const pendingRes = await fetch('/api/pending-actions');
      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        setPendingActions(pendingData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const toggleSimulation = async () => {
    try {
      const nextMode = !simulationMode;
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulationMode: nextMode })
      });
      if (res.ok) {
        setSimulationMode(nextMode);
        setErrorMessage(null);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to toggle simulation mode', err);
    }
  };

  const executeRoutineDirect = async (routineId, routineName) => {
    setErrorMessage(null);
    try {
      const res = await fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routineId, routineName })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Execution failed.');
      } else {
        fetchData();
      }
    } catch (err) {
      setErrorMessage(`Network error executing routine: ${err.message}`);
    }
  };

  const handlePendingAction = async (actionId, actionType) => {
    setErrorMessage(null);
    try {
      const res = await fetch('/api/pending-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId, actionType })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || `Failed to ${actionType} action.`);
      } else {
        fetchData();
      }
    } catch (err) {
      setErrorMessage(`Network error handling pending action: ${err.message}`);
    }
  };

  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText;
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      });
      const data = await res.json();
      setIsTyping(false);

      if (res.ok) {
        setChatMessages(prev => [...prev, { role: 'assistant', text: data.response }]);
        fetchData();
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', text: `⚠️ Error matching intent: ${data.error}` }]);
      }
    } catch (err) {
      setIsTyping(false);
      setChatMessages(prev => [...prev, { role: 'assistant', text: `⚠️ Network error: ${err.message}` }]);
    }
  };

  // Helper to format assistant markdown output simply
  const formatMarkdown = (text) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('### ')) {
        return <h3 key={i} className="chat-h3">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('* **Why:**') || line.startsWith('- **Why:**')) {
        return <p key={i} className="chat-bullet"><strong>Why:</strong> {line.replace(/^[*-]\s+\*\*Why:\*\*\s+/, '')}</p>;
      }
      if (line.startsWith('* **If') || line.startsWith('- **If')) {
        return <p key={i} className="chat-bullet"><strong>If (Triggers & Conditions):</strong></p>;
      }
      if (line.startsWith('* **Then') || line.startsWith('- **Then')) {
        return <p key={i} className="chat-bullet"><strong>Then (Actions):</strong></p>;
      }
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return <li key={i} className="chat-list-item">{line.replace(/^[*-]\s+/, '')}</li>;
      }
      return <p key={i} className="chat-p">{line}</p>;
    });
  };

  return (
    <div className="dashboard-container">
      {/* Sticky Header */}
      <header className="dashboard-header glass-panel">
        <div className="header-logo">
          <span className="logo-icon">🔮</span>
          <h1>SmartThings Gemini Bridge</h1>
        </div>
        
        <div className="header-actions">
          <div className={`status-badge ${simulationMode ? 'simulation' : 'cloud'}`}>
            {simulationMode ? 'SIMULATION ACTIVE' : 'CLOUD CONNECTED'}
          </div>
          
          <div className="toggle-container">
            <span className="toggle-label">Simulation Mode</span>
            <button 
              onClick={toggleSimulation}
              className={`toggle-switch ${simulationMode ? 'active' : ''}`}
            >
              <div className="toggle-thumb" />
            </button>
          </div>
        </div>
      </header>

      {/* Connection Status Bar */}
      {connectionStatus && (
        <div className="connection-status-bar glass-panel">
          <div className="status-item">
            <span className="status-label">SmartThings API:</span>
            <span className={`status-value ${connectionStatus.smartthings === 'Connected' ? 'status-success' : (connectionStatus.smartthings === 'Simulation Mode' ? 'status-warning' : 'status-error')}`}>{connectionStatus.smartthings}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Hub:</span>
            <span className={`status-value ${connectionStatus.hub === 'Online' ? 'status-success' : (connectionStatus.hub === 'SmartThings Hub' ? 'status-warning' : 'status-error')}`}>{connectionStatus.hub}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Gemini API:</span>
            <span className={`status-value ${connectionStatus.gemini === 'Connected' ? 'status-success' : 'status-warning'}`}>{connectionStatus.gemini}</span>
          </div>
        </div>
      )}

      {/* Main Alert Banner */}
      {errorMessage && (
        <div className="alert-banner glass-panel">
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">
            <p>{errorMessage}</p>
            <span className="alert-tip">Tip: Enable <strong>Simulation Mode</strong> to bypass SmartThings execution and test automations locally.</span>
          </div>
          <button className="alert-close" onClick={() => setErrorMessage(null)}>✕</button>
        </div>
      )}

      {/* Grid Layout */}
      <div className="dashboard-grid">
        
        {/* Left Side: Staging Queue & Logs */}
        <div className="grid-left">
          
          {/* HITL Staging Queue */}
          <section className="glass-panel queue-section pulse-gold-active">
            <div className="section-header">
              <h2>Gemini AI Recommended Actions</h2>
              <span className="badge-count gold">{pendingActions.length}</span>
            </div>
            
            {pendingActions.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🛡️</span>
                <p>No pending actions. Gemini is operating safely in consultation mode.</p>
              </div>
            ) : (
              <div className="action-list">
                {pendingActions.map(action => (
                  <div key={action.id} className="action-card glass-panel">
                    <div className="action-details">
                      <h4>{action.routineName}</h4>
                      <p className="routine-id">ID: {action.routineId}</p>
                      <p className="action-time">Queued at: {new Date(action.timestamp).toLocaleTimeString()}</p>
                    </div>
                    <div className="action-buttons">
                      <button 
                        onClick={() => handlePendingAction(action.id, 'approve')}
                        className="btn-approve"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handlePendingAction(action.id, 'deny')}
                        className="btn-deny"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Devices Grid */}
          <section className="glass-panel devices-section">
            <div className="section-header">
              <h2>Smart Devices</h2>
              <span className="badge-count cyan">{devices.length}</span>
            </div>
            <div className="devices-grid">
              {devices.map(device => (
                <div key={device.id} className="device-card glass-panel">
                  <div className="device-header">
                    <h3>{device.name}</h3>
                    <span className="device-room">{device.room}</span>
                  </div>
                  <div className="device-body">
                    {device.state?.switch && (
                      <div className="state-row">
                        <span>Power</span>
                        <span className={`status-dot ${device.state.switch === 'on' ? 'on' : 'off'}`}>
                          {device.state.switch.toUpperCase()}
                        </span>
                      </div>
                    )}
                    {device.state?.level !== undefined && (
                      <div className="state-row">
                        <span>Brightness</span>
                        <span>{device.state.level}%</span>
                      </div>
                    )}
                    {device.state?.temperature !== undefined && (
                      <div className="state-row">
                        <span>Temp</span>
                        <span>{device.state.temperature}°F</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Routines List */}
          <section className="glass-panel routines-section">
            <div className="section-header">
              <h2>SmartThings Routines</h2>
            </div>
            <div className="routines-list">
              {routines.map(routine => (
                <div key={routine.id} className="routine-row glass-panel">
                  <div className="routine-info">
                    <h4>{routine.name}</h4>
                    <p className="routine-id">ID: {routine.id}</p>
                  </div>
                  <button 
                    onClick={() => executeRoutineDirect(routine.id, routine.name)}
                    className="btn-run"
                  >
                    Run
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Side: Chat Assistant & Live Logs */}
        <div className="grid-right">
          
          {/* Chat Consultant Panel */}
          <section className="glass-panel chat-section">
            <div className="section-header chat-header">
              <div className="consultant-title">
                <h2>Smart Home Strategy Consultant</h2>
                <p>Gemini 2.5 Flash • Optimization Advisor</p>
              </div>
              <span className="pulse-dot active" />
            </div>

            <div className="chat-messages-container">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`chat-bubble-wrapper ${msg.role}`}>
                  <div className="chat-avatar">{msg.role === 'assistant' ? '🔮' : '👤'}</div>
                  <div className="chat-bubble">
                    {msg.role === 'assistant' ? formatMarkdown(msg.text) : msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="chat-bubble-wrapper assistant">
                  <div className="chat-avatar">🔮</div>
                  <div className="chat-bubble typing">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={sendChatMessage} className="chat-input-form">
              <input
                type="text"
                placeholder="Ask for routine optimization strategy recommendations..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isTyping}
              />
              <button type="submit" disabled={isTyping || !inputText.trim()}>
                Ask
              </button>
            </form>
          </section>

          {/* System Audit & Activity Logs */}
          <section className="glass-panel logs-section">
            <div className="section-header">
              <h2>System Logs & Sensor Audits</h2>
            </div>
            <div className="logs-container">
              {logs.length === 0 ? (
                <p className="empty-logs">Logs terminal empty.</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="log-entry">
                    <span className="log-time">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className="log-text">{log.event}</span>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>
      </div>

      <style jsx global>{`
        .dashboard-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
        }

        .header-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          font-size: 24px;
        }

        .header-logo h1 {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.025em;
          background: linear-gradient(to right, var(--text-primary), var(--accent-cyan));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .status-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 9999px;
          letter-spacing: 0.05em;
          border: 1px solid transparent;
        }

        .status-badge.simulation {
          background: rgba(251, 191, 36, 0.1);
          color: var(--accent-gold);
          border-color: var(--accent-gold-glow);
          box-shadow: 0 0 10px rgba(251, 191, 36, 0.15);
        }

        .status-badge.cloud {
          background: rgba(52, 211, 153, 0.1);
          color: var(--accent-green);
          border-color: var(--accent-green-glow);
          box-shadow: 0 0 10px rgba(52, 211, 153, 0.15);
        }

        .toggle-container {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .toggle-label {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .toggle-switch {
          width: 44px;
          height: 24px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid var(--border-light);
          cursor: pointer;
          position: relative;
          transition: background 0.3s;
        }

        .toggle-switch.active {
          background: var(--accent-cyan);
        }

        .toggle-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: transform 0.3s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .toggle-switch.active .toggle-thumb {
          transform: translateX(20px);
        }

        /* Alert Banner */
        .alert-banner {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px 20px;
          border-color: var(--accent-red);
          background: rgba(248, 113, 113, 0.08);
          position: relative;
        }

        .alert-icon {
          font-size: 20px;
        }

        .alert-content p {
          font-weight: 600;
          color: var(--accent-red);
          margin-bottom: 4px;
          font-size: 14px;
        }

        .alert-tip {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .alert-close {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 14px;
          position: absolute;
          top: 16px;
          right: 20px;
        }

        /* Grid */
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 900px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        .grid-left, .grid-right {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Sections */
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-light);
        }

        .section-header h2 {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--text-primary);
        }

        .badge-count {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.1);
        }

        .badge-count.gold {
          background: rgba(251, 191, 36, 0.2);
          color: var(--accent-gold);
        }

        .badge-count.cyan {
          background: rgba(6, 182, 212, 0.2);
          color: var(--accent-cyan);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
          color: var(--text-secondary);
        }

        .empty-icon {
          font-size: 32px;
          margin-bottom: 12px;
          opacity: 0.5;
        }

        .empty-state p {
          font-size: 13px;
        }

        /* Queue cards */
        .action-list {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .action-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 18px;
          background: rgba(255, 255, 255, 0.02);
          border-color: rgba(251, 191, 36, 0.15);
        }

        .action-details h4 {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .routine-id {
          font-family: monospace;
          font-size: 11px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .action-time {
          font-size: 10px;
          color: var(--accent-gold);
          margin-top: 4px;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .btn-approve, .btn-deny, .btn-run {
          font-size: 12px;
          font-weight: 700;
          padding: 8px 14px;
          border-radius: 8px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-approve {
          background: var(--accent-green);
          color: #060913;
        }

        .btn-approve:hover {
          box-shadow: 0 0 12px var(--accent-green-glow);
          transform: translateY(-1px);
        }

        .btn-deny {
          background: transparent;
          border-color: var(--border-light);
          color: var(--accent-red);
        }

        .btn-deny:hover {
          background: rgba(248, 113, 113, 0.1);
          border-color: var(--accent-red-glow);
        }

        /* Devices */
        .devices-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
          padding: 16px;
        }

        .device-card {
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
        }

        .device-header h3 {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .device-room {
          font-size: 10px;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .device-body {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
        }

        .state-row {
          display: flex;
          justify-content: space-between;
          color: var(--text-secondary);
        }

        .status-dot {
          font-weight: 700;
          font-size: 10px;
          padding: 1px 6px;
          border-radius: 4px;
        }

        .status-dot.on {
          background: rgba(6, 182, 212, 0.15);
          color: var(--accent-cyan);
        }

        .status-dot.off {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
        }

        /* Routines */
        .routines-list {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .routine-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.01);
        }

        .routine-info h4 {
          font-size: 13px;
          font-weight: 600;
        }

        .btn-run {
          background: var(--bg-panel-hover);
          border-color: var(--border-light);
          color: var(--text-primary);
        }

        .btn-run:hover {
          border-color: var(--accent-cyan);
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.2);
          transform: translateY(-1px);
        }

        /* Chat Consultant Widget */
        .chat-section {
          height: 480px;
          display: flex;
          flex-direction: column;
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .consultant-title h2 {
          font-size: 14px;
          font-weight: 700;
        }

        .consultant-title p {
          font-size: 11px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-green);
          box-shadow: 0 0 8px var(--accent-green-glow);
        }

        .chat-messages-container {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .chat-bubble-wrapper {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          max-width: 85%;
        }

        .chat-bubble-wrapper.user {
          margin-left: auto;
          flex-direction: row-reverse;
        }

        .chat-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--bg-panel-hover);
          border: 1px solid var(--border-light);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .chat-bubble {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13.5px;
          line-height: 1.5;
        }

        .chat-bubble-wrapper.assistant .chat-bubble {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-light);
          color: var(--text-primary);
        }

        .chat-bubble-wrapper.user .chat-bubble {
          background: var(--accent-cyan-glow);
          border: 1px solid var(--accent-cyan);
          color: var(--text-primary);
        }

        /* Format assistant prompt responses */
        .chat-h3 {
          font-size: 14px;
          font-weight: 700;
          color: var(--accent-gold);
          margin-top: 12px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .chat-bullet {
          font-size: 13px;
          color: var(--text-primary);
          margin-top: 6px;
        }

        .chat-list-item {
          font-size: 12.5px;
          color: var(--text-secondary);
          margin-left: 16px;
          margin-top: 3px;
          list-style-type: square;
        }

        .chat-p {
          margin-bottom: 8px;
        }

        .chat-p:last-child {
          margin-bottom: 0;
        }

        /* Typing indicator */
        .typing {
          display: flex;
          gap: 4px;
          padding: 14px 18px;
        }

        .typing .dot {
          width: 6px;
          height: 6px;
          background: var(--text-secondary);
          border-radius: 50%;
          animation: typing-bounce 1.4s infinite ease-in-out both;
        }

        .typing .dot:nth-child(1) { animation-delay: -0.32s; }
        .typing .dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes typing-bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }

        .chat-input-form {
          display: flex;
          padding: 16px;
          border-top: 1px solid var(--border-light);
          gap: 10px;
        }

        .chat-input-form input {
          flex: 1;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 10px 16px;
          color: white;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
        }

        .chat-input-form input:focus {
          border-color: var(--accent-cyan);
        }

        .chat-input-form button {
          background: var(--accent-cyan);
          color: #060913;
          font-weight: 700;
          font-size: 13px;
          padding: 0 18px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .chat-input-form button:hover {
          opacity: 0.9;
        }

        .chat-input-form button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Logs console */
        .logs-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 250px;
        }

        .logs-container {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          font-family: 'Courier New', Courier, monospace;
          font-size: 11.5px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: rgba(0, 0, 0, 0.3);
          border-bottom-left-radius: 16px;
          border-bottom-right-radius: 16px;
        }

        .log-entry {
          display: flex;
          gap: 8px;
          line-height: 1.4;
        }

        .log-time {
          color: var(--accent-cyan);
          flex-shrink: 0;
        }

        .log-text {
          color: var(--text-secondary);
        }

        .empty-logs {
          color: var(--text-secondary);
          opacity: 0.4;
        }
      `}</style>
    </div>
  );
}
