/**
 * EVOLVE Module
 * Updates memory, learns from actions, tracks performance
 */

import * as fs from 'fs';
import * as path from 'path';
import { type ActionResult } from './act';
import { type Decision } from './decide';
import { type MarketPerception } from './perceive';

// ============================================================================
// Memory Types
// ============================================================================

export interface MemoryEntry {
    timestamp: string;
    action: string;
    treasuryBefore: string;
    treasuryAfter: string;
    pnlDelta: string;
    txHash?: string;
    notes: string;
}

export interface AgentMemory {
    seedAmount: number;
    currentValue: number;
    totalGrowthPercent: number;
    totalCompounded: number;
    successfulActions: number;
    failedActions: number;
    lastAction: string;
    lessons: string[];
    entries: MemoryEntry[];
}

// ============================================================================
// Memory File Path
// ============================================================================

const MEMORY_FILE = path.join(process.cwd(), 'logs', 'MEMORY.md');

// ============================================================================
// Memory Management
// ============================================================================

export function loadMemory(): AgentMemory {
    try {
        if (!fs.existsSync(MEMORY_FILE)) {
            return createInitialMemory();
        }

        const content = fs.readFileSync(MEMORY_FILE, 'utf-8');
        return parseMemoryFile(content);
    } catch (error) {
        console.error('[EVOLVE] Error loading memory:', error);
        return createInitialMemory();
    }
}

function createInitialMemory(): AgentMemory {
    return {
        seedAmount: 0,
        currentValue: 0,
        totalGrowthPercent: 0,
        totalCompounded: 0,
        successfulActions: 0,
        failedActions: 0,
        lastAction: 'INIT',
        lessons: [],
        entries: [],
    };
}

function parseMemoryFile(content: string): AgentMemory {
    // Parse MEMORY.md format
    const memory = createInitialMemory();

    const lines = content.split('\n');
    for (const line of lines) {
        if (line.startsWith('Seed Amount:')) {
            memory.seedAmount = parseFloat(line.split(':')[1]) || 0;
        } else if (line.startsWith('Current Value:')) {
            memory.currentValue = parseFloat(line.split(':')[1]) || 0;
        } else if (line.startsWith('Total Growth:')) {
            memory.totalGrowthPercent = parseFloat(line.split(':')[1]) || 0;
        } else if (line.startsWith('Total Compounded:')) {
            memory.totalCompounded = parseFloat(line.split(':')[1]) || 0;
        } else if (line.startsWith('Successful Actions:')) {
            memory.successfulActions = parseInt(line.split(':')[1]) || 0;
        } else if (line.startsWith('Failed Actions:')) {
            memory.failedActions = parseInt(line.split(':')[1]) || 0;
        } else if (line.startsWith('- Lesson:')) {
            memory.lessons.push(line.replace('- Lesson:', '').trim());
        }
    }

    return memory;
}

export function saveMemory(memory: AgentMemory): void {
    const content = formatMemoryFile(memory);

    // Ensure logs directory exists
    const logsDir = path.dirname(MEMORY_FILE);
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }

    fs.writeFileSync(MEMORY_FILE, content, 'utf-8');
    console.log('[EVOLVE] Memory saved');
}

function formatMemoryFile(memory: AgentMemory): string {
    const lines = [
        '# Ziggy Agent Memory',
        '',
        '## Performance Stats',
        `Seed Amount: $${memory.seedAmount.toFixed(2)}`,
        `Current Value: $${memory.currentValue.toFixed(2)}`,
        `Total Growth: ${memory.totalGrowthPercent.toFixed(2)}%`,
        `Total Compounded: $${memory.totalCompounded.toFixed(2)}`,
        `Successful Actions: ${memory.successfulActions}`,
        `Failed Actions: ${memory.failedActions}`,
        `Last Action: ${memory.lastAction}`,
        '',
        '## Lessons Learned',
        ...memory.lessons.map(l => `- Lesson: ${l}`),
        '',
        '## Action History',
        '| Timestamp | Action | Treasury Before | Treasury After | PnL | Notes |',
        '|-----------|--------|-----------------|----------------|-----|-------|',
        ...memory.entries.slice(-20).map(e =>
            `| ${e.timestamp} | ${e.action} | ${e.treasuryBefore} | ${e.treasuryAfter} | ${e.pnlDelta} | ${e.notes} |`
        ),
    ];

    return lines.join('\n');
}

// ============================================================================
// Update Memory After Action
// ============================================================================

export function evolve(
    perception: MarketPerception,
    decision: Decision,
    result: ActionResult,
    treasuryAfter: number
): AgentMemory {
    console.log('[EVOLVE] Updating memory...');

    const memory = loadMemory();
    const treasuryBefore = perception.treasury.totalValueUSD;
    const pnlDelta = treasuryAfter - treasuryBefore;

    // Update stats
    memory.currentValue = treasuryAfter;
    if (memory.seedAmount === 0) {
        memory.seedAmount = treasuryBefore; // First run = seed
    }
    memory.totalGrowthPercent = ((treasuryAfter - memory.seedAmount) / memory.seedAmount) * 100;
    memory.lastAction = decision.action;

    if (result.success) {
        memory.successfulActions++;
        if (pnlDelta > 0) {
            memory.totalCompounded += pnlDelta;
        }
    } else {
        memory.failedActions++;
    }

    // Add entry
    const entry: MemoryEntry = {
        timestamp: new Date().toISOString(),
        action: decision.action,
        treasuryBefore: `$${treasuryBefore.toFixed(2)}`,
        treasuryAfter: `$${treasuryAfter.toFixed(2)}`,
        pnlDelta: `${pnlDelta >= 0 ? '+' : ''}$${pnlDelta.toFixed(2)}`,
        txHash: result.txHash,
        notes: decision.reasoning[0] || '',
    };
    memory.entries.push(entry);

    // Learn from patterns
    const lesson = deriveLesson(memory, decision, result);
    if (lesson) {
        memory.lessons.push(lesson);
        console.log(`[EVOLVE] New lesson: ${lesson}`);
    }

    saveMemory(memory);
    return memory;
}

// ============================================================================
// Pattern Recognition / Learning
// ============================================================================

function deriveLesson(
    memory: AgentMemory,
    decision: Decision,
    result: ActionResult
): string | null {
    // Simple pattern recognition

    // If we've had 3+ successful Morpho deposits
    const morphoSuccesses = memory.entries.filter(
        e => e.action === 'DEPOSIT_MORPHO' && !e.notes.includes('failed')
    ).length;

    if (morphoSuccesses === 3) {
        return 'Morpho deposits consistently successful - consider increasing allocation';
    }

    // If Aerodrome actions fail frequently
    const aeroFailures = memory.entries.filter(
        e => e.action.includes('AERODROME') && e.notes.includes('failed')
    ).length;

    if (aeroFailures >= 2) {
        return 'Aerodrome actions showing failures - investigate IL or slippage';
    }

    // Check for sustained growth
    if (memory.totalGrowthPercent >= 10 && memory.lessons.length === 0) {
        return `Reached ${memory.totalGrowthPercent.toFixed(0)}% growth - strategy working`;
    }

    return null;
}

// ============================================================================
// Memory Queries
// ============================================================================

export function getPerformanceSummary(): string {
    const memory = loadMemory();

    return [
        `📊 Ziggy Performance Summary`,
        `━━━━━━━━━━━━━━━━━━━━━━`,
        `💰 Treasury: $${memory.currentValue.toFixed(2)}`,
        `📈 Growth: ${memory.totalGrowthPercent >= 0 ? '+' : ''}${memory.totalGrowthPercent.toFixed(2)}%`,
        `🔄 Compounded: $${memory.totalCompounded.toFixed(2)}`,
        `✅ Success rate: ${((memory.successfulActions / (memory.successfulActions + memory.failedActions)) * 100 || 0).toFixed(0)}%`,
        `📝 Lessons: ${memory.lessons.length}`,
    ].join('\n');
}
