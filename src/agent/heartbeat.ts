/**
 * HEARTBEAT - Main Agent Loop
 * Orchestrates PERCEIVE → DECIDE → ACT → EVOLVE → NARRATE cycle
 */

import { perceive, quickHealthCheck, type MarketPerception } from './modules/perceive';
import { decide, formatDecisionLog, type Decision } from './modules/decide';
import { act, formatActionLog, type ActionResult } from './modules/act';
import { evolve, loadMemory, getPerformanceSummary } from './modules/evolve';
import {
    generateHeartbeatUpdate,
    generateActionUpdate,
    generateMilestoneUpdate,
    postUpdate,
    getQuickStatus,
} from './modules/narrate';
import {
    pushToDashboard,
    createActionUpdate as createDashboardUpdate,
    createHeartbeatUpdate as createDashboardHeartbeat,
} from './modules/dashboard';
import { getTreasuryStats } from './wallet';
import { AGENT_CONFIG } from './config';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Heartbeat State
// ============================================================================

interface HeartbeatState {
    lastRun: Date | null;
    runCount: number;
    isRunning: boolean;
}

let state: HeartbeatState = {
    lastRun: null,
    runCount: 0,
    isRunning: false,
};

// ============================================================================
// Heartbeat Log
// ============================================================================

const HEARTBEAT_LOG = path.join(process.cwd(), 'logs', 'HEARTBEAT.md');

function logHeartbeat(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;

    console.log(logEntry.trim());

    // Ensure logs directory exists
    const logsDir = path.dirname(HEARTBEAT_LOG);
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }

    // Append to log file
    fs.appendFileSync(HEARTBEAT_LOG, logEntry, 'utf-8');
}

// ============================================================================
// Main Heartbeat Loop
// ============================================================================

export async function runHeartbeat(): Promise<void> {
    if (state.isRunning) {
        logHeartbeat('Heartbeat already running, skipping');
        return;
    }

    state.isRunning = true;
    state.runCount++;

    logHeartbeat(`=== HEARTBEAT #${state.runCount} START ===`);

    try {
        // Health check
        const isHealthy = await quickHealthCheck();
        if (!isHealthy) {
            logHeartbeat('❌ Health check failed - aborting heartbeat');
            await postUpdate(generateMilestoneUpdate('Health check failed', loadMemory()));
            return;
        }

        // PERCEIVE
        logHeartbeat('📡 PERCEIVE: Gathering market data...');
        const perception = await perceive();
        logHeartbeat(`Treasury: $${perception.treasury.usdcFormatted} USDC`);
        logHeartbeat(`Best Morpho APY: ${perception.bestMorphoAPY.toFixed(2)}%`);
        logHeartbeat(`Best Aerodrome APY: ${perception.bestAerodromeAPY.toFixed(2)}%`);

        if (perception.warnings.length > 0) {
            logHeartbeat(`⚠️ Warnings: ${perception.warnings.join(', ')}`);
        }

        // DECIDE
        logHeartbeat('🧠 DECIDE: Analyzing opportunities...');
        const decision = decide(perception);
        logHeartbeat(formatDecisionLog(decision));

        // ACT
        logHeartbeat(`⚡ ACT: Executing ${decision.action}...`);
        const result = await act(decision);
        logHeartbeat(formatActionLog(result));

        // Get updated treasury
        const treasuryAfter = (await getTreasuryStats()).totalValueUSD;

        // EVOLVE
        logHeartbeat('📚 EVOLVE: Updating memory...');
        const memory = evolve(perception, decision, result, treasuryAfter);
        logHeartbeat(getPerformanceSummary());

        // NARRATE
        logHeartbeat('📢 NARRATE: Generating update...');
        const update = decision.action === 'HOLD'
            ? generateHeartbeatUpdate(perception, decision)
            : generateActionUpdate(perception, decision, result, memory);

        await postUpdate(update);

        // PUSH TO DASHBOARD
        logHeartbeat('📊 DASHBOARD: Pushing update...');
        const dashboardUpdate = decision.action === 'HOLD'
            ? createDashboardHeartbeat(perception, memory)
            : createDashboardUpdate(perception, decision, result, memory, update.body);
        const dashboardSuccess = await pushToDashboard(dashboardUpdate);
        logHeartbeat(dashboardSuccess ? '✅ Dashboard updated' : '⚠️ Dashboard push failed (will retry)');

        // Check milestones
        await checkAndPostMilestones(memory);

        state.lastRun = new Date();
        logHeartbeat(`=== HEARTBEAT #${state.runCount} COMPLETE ===`);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logHeartbeat(`❌ HEARTBEAT ERROR: ${errorMessage}`);
    } finally {
        state.isRunning = false;
    }
}

// ============================================================================
// Milestone Checking
// ============================================================================

async function checkAndPostMilestones(memory: ReturnType<typeof loadMemory>): Promise<void> {
    const milestones = [
        { threshold: 10, message: '+10% growth reached!' },
        { threshold: 20, message: '+20% growth - Token deployment eligible!' },
        { threshold: 30, message: '+30% growth - Zig energy rising!' },
        { threshold: 50, message: '+50% growth - Vault deployment eligible!' },
        { threshold: 100, message: '+100% growth - Treasury doubled! 🚀' },
    ];

    for (const milestone of milestones) {
        if (memory.totalGrowthPercent >= milestone.threshold) {
            const alreadyAchieved = memory.lessons.some(l =>
                l.includes(`${milestone.threshold}%`)
            );

            if (!alreadyAchieved) {
                logHeartbeat(`🎉 MILESTONE: ${milestone.message}`);
                await postUpdate(generateMilestoneUpdate(milestone.message, memory));
            }
        }
    }
}

// ============================================================================
// Scheduler
// ============================================================================

let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

export function startHeartbeatScheduler(): void {
    if (heartbeatInterval) {
        console.log('[HEARTBEAT] Scheduler already running');
        return;
    }

    console.log(`[HEARTBEAT] Starting scheduler (interval: ${AGENT_CONFIG.heartbeatIntervalMs}ms)`);

    // Run immediately
    runHeartbeat();

    // Then schedule
    heartbeatInterval = setInterval(runHeartbeat, AGENT_CONFIG.heartbeatIntervalMs);
}

export function stopHeartbeatScheduler(): void {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
        console.log('[HEARTBEAT] Scheduler stopped');
    }
}

export function getHeartbeatState(): HeartbeatState {
    return { ...state };
}

// ============================================================================
// Manual Trigger (for testing)
// ============================================================================

export async function triggerHeartbeat(): Promise<void> {
    console.log('[HEARTBEAT] Manual trigger');
    await runHeartbeat();
}

// ============================================================================
// CLI Entry Point
// ============================================================================

if (require.main === module) {
    console.log('🛸 Starting Ziggy Heartbeat...');
    startHeartbeatScheduler();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n[HEARTBEAT] Shutting down...');
        stopHeartbeatScheduler();
        process.exit(0);
    });
}
