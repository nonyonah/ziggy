# Ziggy - Autonomous DeFi Yield Agent

Ziggy is an autonomous agent designed to hunt for USDC yields on the Base blockchain. It perceives market conditions, decides on strategies (Morpho, Aerodrome), acts on-chain, and narrates its journey.

## 🏗 Directory Structure

- **`src/agent/`**: Core agent logic (TypeScript).
  - `heartbeat.ts`: Main loop (perceive → decide → act → evolve).
  - `modules/`: Autonomous capabilities.
  - `protocols/`: DeFi integrations.
- **`frontend/`**: Next.js dashboard for visualization.
- **`contracts/`**: Smart contracts ($ZIGGY token, Vaults).
- **`openclaw/`**: Agent personality (`SOUL.md`), rules (`USER.md`), and integration docs.

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- An Ethereum wallet private key (Base chain recommended)
- Privy App ID (for frontend)
- Google Gemini API Key (optional, for OpenClaw/AI features)

### Installation

1.  **Install Dependencies**:
    ```bash
    npm install
    cd frontend && npm install && cd ..
    ```

2.  **Environment Setup**:
    - Agent: Copy `.env.example` to `.env` and fill in `PRIVATE_KEY`, `RPC_URL`, etc.
    - Frontend: Copy `frontend/.env.example` to `frontend/.env.local` and fill in `NEXT_PUBLIC_PRIVY_APP_ID`.

3.  **OpenClaw Setup**:
    This project uses [OpenClaw](https://openclaw.ai) for agent runtime capabilities and potential future enhancements.
    
    Ensure OpenClaw is set up (run once):
    ```bash
    npx openclaw onboard
    ```
    *Follow the prompts to configure your local gateway and API keys.*

## 🏃‍♂️ Running Ziggy

### 1. Start the Agent (Heartbeat)
The agent runs on a 4-hour loop (configurable).

```bash
# Run in development mode
npm run dev

# Run in production mode
npm start
```

### 2. Start the Frontend Dashboard
The dashboard visualizes Ziggy's state and receives autonomous updates.

```bash
cd frontend
npm run dev
```
Visit http://localhost:3000 to see Ziggy in action.

## 🦞 OpenClaw Integration

Ziggy includes OpenClaw as a development dependency.
- **CLI**: Use `npx openclaw` to interact with the OpenClaw runtime.
- **Configuration**: `openclaw/` directory contains agent personality files potentially usable by OpenClaw skills or other AI runtimes.
- **Gateway**: The OpenClaw Gateway service provides a local interface for monitoring and tool execution (http://localhost:18789).

## 🛠 Development

- **Build Agent**: `npm run build`
- **Build Frontend**: `cd frontend && npm run build`
- **Lint**: `npm run lint` (if configured)

## 📄 License
MIT
