import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Data storage path (in production, use Vercel Postgres / Upstash Redis)
const DATA_FILE = path.join(process.cwd(), 'data', 'agent-state.json');

interface ActionDetails {
    protocol?: string;
    amount_usdc?: number;
    new_treasury_usdc?: number;
    apy_current?: number;
    tx_hash?: string;
    pool?: string;
    position_type?: string;
}

interface AgentUpdate {
    timestamp: string;
    action: string;
    details: ActionDetails;
    narrative: string;
    milestone?: string;
}

interface AgentState {
    lastUpdate: string;
    treasury_usdc: number;
    current_apy: number;
    current_protocol: string;
    current_position: string;
    growth_percent: number;
    total_compounded: number;
    status: string;
    history: AgentUpdate[];
    milestones: string[];
}

// Initialize data file if not exists
async function ensureDataFile() {
    const dir = path.dirname(DATA_FILE);
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }

    try {
        await fs.access(DATA_FILE);
    } catch {
        const initialState: AgentState = {
            lastUpdate: new Date().toISOString(),
            treasury_usdc: 0,
            current_apy: 0,
            current_protocol: 'Idle',
            current_position: 'None',
            growth_percent: 0,
            total_compounded: 0,
            status: 'Initializing',
            history: [],
            milestones: [],
        };
        await fs.writeFile(DATA_FILE, JSON.stringify(initialState, null, 2));
    }
}

async function readState(): Promise<AgentState> {
    await ensureDataFile();
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
}

async function writeState(state: AgentState): Promise<void> {
    await ensureDataFile();
    await fs.writeFile(DATA_FILE, JSON.stringify(state, null, 2));
}

export async function POST(request: NextRequest) {
    // Verify authorization
    const authHeader = request.headers.get('Authorization');
    const expectedToken = `Bearer ${process.env.ZIGGY_API_SECRET}`;

    if (!authHeader || authHeader !== expectedToken) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const update: AgentUpdate = await request.json();

        // Validate required fields
        if (!update.timestamp || !update.action || !update.narrative) {
            return NextResponse.json(
                { error: 'Missing required fields: timestamp, action, narrative' },
                { status: 400 }
            );
        }

        // Read current state
        const state = await readState();

        // Update state from the update payload
        state.lastUpdate = update.timestamp;

        if (update.details?.new_treasury_usdc !== undefined) {
            state.treasury_usdc = update.details.new_treasury_usdc;
        }
        if (update.details?.apy_current !== undefined) {
            state.current_apy = update.details.apy_current;
        }
        if (update.details?.protocol) {
            state.current_protocol = update.details.protocol;
        }
        if (update.details?.pool) {
            state.current_position = update.details.pool;
        }
        if (update.details?.amount_usdc) {
            state.total_compounded += update.details.amount_usdc;
        }

        // Add to history (keep last 100 entries)
        state.history.unshift(update);
        if (state.history.length > 100) {
            state.history = state.history.slice(0, 100);
        }

        // Track milestones
        if (update.milestone && !state.milestones.includes(update.milestone)) {
            state.milestones.push(update.milestone);
        }

        // Update status from narrative
        state.status = update.narrative;

        // Write updated state
        await writeState(state);

        console.log(`[API] Update received: ${update.action}`);

        return NextResponse.json({
            success: true,
            message: 'Update received',
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('[API] Error processing update:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
