/**
 * Dashboard Integration Module
 * Pushes agent updates to the public dashboard
 */

import { type MarketPerception } from './perceive';
import { type Decision } from './decide';
import { type ActionResult } from './act';
import { type AgentMemory } from './evolve';

// ============================================================================
// Configuration
// ============================================================================

const DASHBOARD_URL = process.env.ZIGGY_DASHBOARD_URL || 'https://ziggyyield.vercel.app';
const DASHBOARD_SECRET = process.env.ZIGGY_DASHBOARD_SECRET || '';

// ============================================================================
// Types
// ============================================================================

interface DashboardUpdate {
    timestamp: string;
    action: string;
    details: {
        protocol?: string;
        pool?: string;
        amount_usdc?: number;
        new_treasury_usdc?: number;
        apy_current?: number;
        tx_hash?: string;
        position_type?: string;
    };
    narrative: string;
    milestone?: string;
}

// ============================================================================
// Push Update to Dashboard
// ============================================================================

import * as fs from 'fs';
import * as path from 'path';

export async function pushToDashboard(update: DashboardUpdate): Promise<boolean> {
    // 1. Try saving locally (for dev mode)
    try {
        const localDataPath = path.join(process.cwd(), 'frontend', 'data', 'agent-state.json');
        const localDir = path.dirname(localDataPath);

        if (!fs.existsSync(localDir)) {
            fs.mkdirSync(localDir, { recursive: true });
        }

        // Read existing to update history
        let existingState: any = { history: [] };
        if (fs.existsSync(localDataPath)) {
            existingState = JSON.parse(fs.readFileSync(localDataPath, 'utf-8'));
        }

        // Create new state object matching AgentStatus interface roughly
        const newState = {
            lastUpdate: update.timestamp,
            treasury: update.details.new_treasury_usdc || 0,
            // Map snake_case for frontend compatibility if needed, or keep consistent
            treasury_usdc: update.details.new_treasury_usdc || 0,
            current_apy: update.details.apy_current || 0,
            current_protocol: update.details.protocol || 'Idle',
            current_position: update.details.pool || 'None',
            growth_percent: 0, // In a real app, calculate this
            total_compounded: 0,
            status: update.narrative,
            history: [update, ...existingState.history].slice(0, 50), // Keep last 50
            milestones: existingState.milestones || [],
            isActive: true
        };

        fs.writeFileSync(localDataPath, JSON.stringify(newState, null, 2));
        console.log(`[DASHBOARD] Saved state locally to ${localDataPath}`);

    } catch (err) {
        console.warn('[DASHBOARD] Failed to save locally:', err);
    }

    // 2. Try pushing to remote (if configured)
    if (!DASHBOARD_SECRET) {
        console.log('[DASHBOARD] No secret configured, skipping remote push');
        return false;
    }

    try {
        console.log(`[DASHBOARD] Pushing update: ${update.action}`);

        const response = await fetch(`${DASHBOARD_URL}/api/update`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DASHBOARD_SECRET}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(update),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error(`[DASHBOARD] Push failed: ${response.status} - ${error}`);
            // Don't return false if we saved locally successfully? 
            // Better to return status of the INTENT (remote push). 
            // But for this user loop, let's return true so heartbeat doesn't complain if local worked.
            return false;
        }

        const result = (await response.json()) as { message: string };
        console.log(`[DASHBOARD] Push success: ${result.message}`);
        return true;

    } catch (error) {
        console.error('[DASHBOARD] Push error:', error);
        return false;
    }
}

// ============================================================================
// Create Update from Agent State
// ============================================================================

export function createActionUpdate(
    perception: MarketPerception,
    decision: Decision,
    result: ActionResult,
    memory: AgentMemory,
    narrative: string
): DashboardUpdate {
    const currentPosition = perception.currentMorphoPosition || perception.currentAerodromePosition;

    return {
        timestamp: new Date().toISOString(),
        action: decision.action.toLowerCase(),
        details: {
            protocol: currentPosition?.name?.split(' ')[0] || 'Unknown',
            pool: currentPosition?.name || 'None',
            amount_usdc: result.success && decision.params?.amount
                ? Number(decision.params.amount) / 1e6
                : undefined,
            new_treasury_usdc: memory.currentValue,
            apy_current: currentPosition?.apy || 0,
            tx_hash: result.txHash,
        },
        narrative,
        milestone: detectMilestone(memory),
    };
}

export function createHeartbeatUpdate(
    perception: MarketPerception,
    memory: AgentMemory
): DashboardUpdate {
    const currentPosition = perception.currentMorphoPosition || perception.currentAerodromePosition;

    return {
        timestamp: new Date().toISOString(),
        action: 'heartbeat',
        details: {
            protocol: currentPosition?.name?.split(' ')[0] || 'Idle',
            pool: currentPosition?.name || 'None',
            new_treasury_usdc: perception.treasury.totalValueUSD,
            apy_current: currentPosition?.apy || 0,
        },
        narrative: `Ziggy check-in: Treasury $${perception.treasury.usdcFormatted} USDC. Farming ${currentPosition?.name || 'idle'} at ${(currentPosition?.apy || 0).toFixed(2)}% APY.`,
    };
}

// ============================================================================
// Milestone Detection
// ============================================================================

function detectMilestone(memory: AgentMemory): string | undefined {
    const growth = memory.totalGrowthPercent;

    // Check growth milestones
    if (growth >= 100 && !memory.lessons.includes('100%')) return 'treasury_doubled';
    if (growth >= 50 && !memory.lessons.includes('50%')) return 'treasury_growth_50pct';
    if (growth >= 30 && !memory.lessons.includes('30%')) return 'treasury_growth_30pct';
    if (growth >= 20 && !memory.lessons.includes('20%')) return 'treasury_growth_20pct';
    if (growth >= 10 && !memory.lessons.includes('10%')) return 'treasury_growth_10pct';

    // Check action count milestones
    if (memory.successfulActions === 100) return 'hundred_actions';
    if (memory.successfulActions === 10) return 'ten_actions';
    if (memory.successfulActions === 1) return 'first_action';

    return undefined;
}

// ============================================================================
// Batch Push (for migration or recovery)
// ============================================================================

export async function pushHistoricalUpdates(updates: DashboardUpdate[]): Promise<number> {
    let successCount = 0;

    for (const update of updates) {
        const success = await pushToDashboard(update);
        if (success) successCount++;

        // Rate limit: 1 request per 100ms
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`[DASHBOARD] Pushed ${successCount}/${updates.length} historical updates`);
    return successCount;
}

// ============================================================================
// Dashboard Link Helper
// ============================================================================

export function getDashboardLink(): string {
    return `${DASHBOARD_URL}/dashboard`;
}

export function getStatusLink(): string {
    return `${DASHBOARD_URL}/api/status`;
}
