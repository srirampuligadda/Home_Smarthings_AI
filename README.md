# SmartThings Gemini Bridge 🧠🏠

[![CI](https://github.com/srirampuligadda/Home_Smarthings_AI/actions/workflows/ci.yml/badge.svg)](https://github.com/srirampuligadda/Home_Smarthings_AI/actions/workflows/ci.yml)

Welcome to the **SmartThings Gemini Bridge**—an intelligent, AI-powered Smart Home manager. This project bridges the gap between Google's powerful **Gemini 2.5 Flash** large language model and the **Samsung SmartThings** ecosystem. 

It acts as an autonomous AI consultant for your smart home, analyzing device states, understanding context, and safely recommending routines to improve your daily living environment.

## 🌟 Key Features

- **Real-time Synchronization:** Fetches and tracks the state of your SmartThings devices (lights, sensors, switches) and pre-configured scenes/routines in real-time.
- **AI-Powered Recommendations:** Gemini 2.5 Flash analyzes your home's current state and intelligently suggests new routines or actions based on context (e.g. turning off lights if no motion is detected).
- **Human-in-the-Loop (HITL) Safety:** The AI cannot execute destructive actions autonomously. All AI-generated actions are placed in a staging queue where you must explicitly approve or reject them.
- **Simulation Mode:** Don't have a real SmartThings Hub or API token handy? The app gracefully falls back to a highly realistic local simulation mode for safe testing and development.
- **Live Audit Logs:** Complete transparency into what the AI is thinking, what actions it generated, and how the system state is mutating.

## 🏗 Architecture

This project is built using modern web standards for speed and reliability:
- **Framework:** Next.js (App Router)
- **Frontend UI:** React with Tailwind-inspired Vanilla CSS (Glassmorphism design)
- **State Management:** In-memory local cache simulation for rapid UI prototyping
- **Testing:** Comprehensive Jest & React Testing Library suite automated via GitHub Actions

## 🚀 Getting Started

First, run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Environment Variables
To connect to the real APIs, create a `.env.local` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
SMARTTHINGS_TOKEN=your_smartthings_token_here
```
*(If you leave these empty, the app will automatically run in Simulation Mode).*
