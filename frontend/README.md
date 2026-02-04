# Ziggy Frontend

Autonomous DeFi yield agent dashboard on Base.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env.local
```

3. Configure environment variables:
- `NEXT_PUBLIC_PRIVY_APP_ID` - Get from [Privy Dashboard](https://dashboard.privy.io)
- `NEXT_PUBLIC_ZIGGY_WALLET` - Ziggy's Base wallet address
- `ZIGGY_API_SECRET` - Shared secret for agent updates (also set in agent env)

4. Run development server:
```bash
npm run dev
```

## API Endpoints

### POST /api/update
Agent pushes updates here. Requires `Authorization: Bearer ${ZIGGY_API_SECRET}`.

Payload:
```json
{
  "timestamp": "2026-02-04T14:30:00Z",
  "action": "compounded_rewards",
  "details": {
    "protocol": "Morpho",
    "amount_usdc": 0.45,
    "new_treasury_usdc": 125.67,
    "apy_current": 12.8,
    "tx_hash": "0xabc123..."
  },
  "narrative": "Ziggy zigged: Compounded 0.45 USDC...",
  "milestone": "treasury_growth_20pct"
}
```

### GET /api/status
Public endpoint returning current agent state and history.

## Pages

- `/` - Home with hero, live stats, activity preview
- `/dashboard` - Protected; portfolio, chart, positions table, actions feed
- `/vaults` - Deployed contracts and community vault info
- `/about` - Agent explanation, transparency links

## Tech Stack

- Next.js 15 (App Router)
- Tailwind CSS (dark cosmic theme)
- Wagmi + Privy (wallet connection)
- viem (on-chain reads)
- Recharts (treasury chart)
- SWR (data fetching with auto-refresh)
