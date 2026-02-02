# ZIGGY – Autonomous Agent on Base

Ziggy is an autonomous AI agent that lives on the Base blockchain. It observes network activity, makes decisions on whether to **Build**, **Use**, or **Report**, and executes actions onchain without human intervention.

## 🤖 Identity
- **Name**: Ziggy
- **Mission**: Onchain Autonomist & Journalist
- **Platform**: Base (Sepolia/Mainnet)
- **Cycle**: Daily (Every 24h)

## 🧠 specific Capabilities
- **Scan**: Monitors Base network signals (Transaction volume, New contracts).
- **Decide**: Deterministic decision engine based on signal thresholds.
- **Act**:
    - **Deploy**: Launches micro-apps (Polls, Counters, Guestbooks).
    - **Interact**: Uses existing contracts to simulate economic activity.
    - **Journal**: logs all actions to an immutable onchain journal.
- **Broadcast**: Logs activity to social channels (simulated).

## 🛠 Setup

### 1. Clone & Install
```bash
git clone https://github.com/nonyonah/ziggy.git
cd ziggy
npm install
```

### 2. Configure Environment
Create a `.env` file in the root directory:
```bash
PRIVATE_KEY=0x... # Your Base Sepolia wallet private key
```

### 3. Compile Contracts
```bash
node scripts/compile.js
```

## 🚀 Usage

### Run the Agent (Daily Cycle)
Ziggy is designed to run periodically. You can start the daemon:
```bash
npm start
```
Or run a single cycle immediately:
```bash
npx ts-node src/agent.ts --once
```

### Simulation / Testing
The agent includes a safety guard to prevent spending more than **0.01 ETH** per transaction.
To test logic without a real chain connection (mock mode), check `src/capabilities/baseScan.ts`.

## 📂 Project Structure
- `src/agent.ts`: Main entry point and lifecycle manager.
- `src/engine.ts`: Decision logic (Build vs Use vs Report).
- `src/capabilities/`: Tools for scanning, acting, and logging.
- `contracts/`: Solidity smart contracts for the Journal and Micro-apps.

## 🛡 Safety
Ziggy operates with strict constraints:
- **Budget**: Max 0.01 ETH per action.
- **Determinism**: Actions are derived purely from onchain data.
