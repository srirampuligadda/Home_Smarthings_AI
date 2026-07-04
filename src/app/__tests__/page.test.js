import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../page';

// Mock fetch globally
global.fetch = jest.fn();

describe('Home Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation for the 3 API calls made in fetchData
    global.fetch.mockImplementation((url) => {
      if (url === '/api/status') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            gemini: 'Connected',
            smartthings: 'Connected',
            hub: 'Online'
          })
        });
      }
      if (url === '/api/devices') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 'dev-1', name: 'Test Device', room: 'Living Room', capabilities: ['switch'], state: { switch: 'on' } }
          ])
        });
      }
      if (url === '/api/routines') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 'rt-1', name: 'Good Morning' }
          ])
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it('renders the dashboard header correctly', async () => {
    render(<Home />);
    
    expect(screen.getByText('SmartThings Gemini Bridge')).toBeInTheDocument();
  });

  it('fetches and displays connection status', async () => {
    render(<Home />);
    
    await waitFor(() => {
      expect(screen.getByText('SmartThings API:')).toBeInTheDocument();
      // The word "Connected" should appear multiple times for Gemini and SmartThings
      const connectedElements = screen.getAllByText('Connected');
      expect(connectedElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('fetches and displays devices', async () => {
    render(<Home />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Device')).toBeInTheDocument();
      expect(screen.getByText('Living Room')).toBeInTheDocument();
    });
  });

  it('fetches and displays routines', async () => {
    render(<Home />);
    
    await waitFor(() => {
      expect(screen.getByText('Good Morning')).toBeInTheDocument();
      expect(screen.getByText('ID: rt-1')).toBeInTheDocument();
    });
  });
});
