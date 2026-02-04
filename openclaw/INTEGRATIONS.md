# Ziggy Dashboard Integration

> Rules for pushing agent state to the public dashboard at https://ziggyyield.vercel.app

## When to Push Updates

Push to dashboard after:
1. **Every major action**: compound, migrate, deposit, withdraw, deploy
2. **Milestone reached**: 10%, 20%, 30%, 50%, 100% growth
3. **Heartbeat**: Every 4-hour check-in (even if HOLD action)
4. **Error/Alert**: If anomaly detected or action failed

## How to Push

Use the dashboard module to send structured updates:

```typescript
import { pushToDashboard, createActionUpdate } from './modules/dashboard';

// After action execution
const update = createActionUpdate(perception, decision, result, memory, narrative);
await pushToDashboard(update);
```

## Payload Format

```json
{
  "timestamp": "2026-02-04T14:30:00Z",
  "action": "compounded_rewards",
  "details": {
    "protocol": "Morpho",
    "pool": "USDC Vault",
    "amount_usdc": 0.45,
    "new_treasury_usdc": 125.67,
    "apy_current": 12.8,
    "tx_hash": "0xabc123..."
  },
  "narrative": "Ziggy zigged: Compounded 0.45 USDC from Morpho. Treasury now $125.67 (+0.36%)",
  "milestone": "treasury_growth_20pct"
}
```

## Environment Variables

Required in agent environment:
- `ZIGGY_DASHBOARD_URL`: Base URL (default: https://ziggyyield.vercel.app)
- `ZIGGY_DASHBOARD_SECRET`: Shared secret for authentication

## Social Post Integration

Always include dashboard link in social posts:
```
"Ziggy update: [action]. Treasury $XXX (+Y%).
Dashboard: https://ziggyyield.vercel.app/dashboard
Tx: https://basescan.org/tx/[hash]"
```

## Fallback Behavior

If dashboard push fails:
1. Log error to MEMORY.md
2. Continue with social post (narrative)
3. Retry on next heartbeat
