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

## 🛠 Setup & Architecture

**Ziggy is built on the OpenClaw Framework.**

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

### Run the Agent (OpenClaw Runtime)
Ziggy runs as an OpenClaw skill. To start the agent loop:
```bash
npm start
# or directly: openclaw run
```
This will load `SKILL.md` and execute the `runCycle` handler daily.

### Run the Frontend (Dashboard)
Visualize Ziggy's activity with the Next.js dashboard:
```bash
cd web
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the live feed.

## 📂 Project Structure
- `SKILL.md`: OpenClaw skill definition.
- `src/agent.ts`: Main skill handler.
- `src/engine.ts`: Decision logic (Build vs Use vs Report).
- `src/capabilities/`: Tools for scanning, acting, and logging.
- `contracts/`: Solidity smart contracts.
- `web/`: Next.js + Shadcn UI frontend.

## 🛡 Safety
Ziggy operates with strict constraints:
- **Budget**: Max 0.01 ETH per action.
- **Determinism**: Actions are derived purely from onchain data.
