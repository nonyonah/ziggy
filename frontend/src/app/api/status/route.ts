import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'agent-state.json');

interface AgentState {
    lastUpdate: string;
    treasury_usdc: number;
    current_apy: number;
    current_protocol: string;
    current_position: string;
    growth_percent: number;
    total_compounded: number;
    status: string;
    history: Array<{
        timestamp: string;
        action: string;
        details: Record<string, unknown>;
        narrative: string;
        milestone?: string;
    }>;
    milestones: string[];
}

async function readState(): Promise<AgentState> {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        // Return default state if file doesn't exist
        return {
            lastUpdate: new Date().toISOString(),
            treasury_usdc: 0,
            current_apy: 0,
            current_protocol: 'Initializing',
            current_position: 'None',
            growth_percent: 0,
            total_compounded: 0,
            status: 'Agent starting up...',
            history: [],
            milestones: [],
        };
    }
}

export async function GET() {
    try {
        const state = await readState();

        // Add computed fields
        const response = {
            ...state,
            // Computed: time since last update
            secondsSinceUpdate: Math.floor(
                (Date.now() - new Date(state.lastUpdate).getTime()) / 1000
            ),
            // Computed: is agent active (updated in last 6 hours)
            isActive: (Date.now() - new Date(state.lastUpdate).getTime()) < 6 * 60 * 60 * 1000,
            // Recent history (last 10 for quick view)
            recentHistory: state.history.slice(0, 10),
            // Full history count
            totalActions: state.history.length,
        };

        return NextResponse.json(response, {
            headers: {
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
            },
        });

    } catch (error) {
        console.error('[API] Error reading status:', error);
        return NextResponse.json(
            { error: 'Failed to read agent status' },
            { status: 500 }
        );
    }
}
