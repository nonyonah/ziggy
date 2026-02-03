import { scanNetwork } from './capabilities/baseScan';
import { decideAction } from './engine';
import { deployContract, interactContract, logJournal, publishUpdate } from './capabilities/actions';
import { Address } from 'viem';

// Configuration
const JOURNAL_ADDRESS = process.env.JOURNAL_ADDRESS as Address; // Will be undefined initially

async function cycle() {
    console.log(`\n--- Starting Cycle at ${new Date().toISOString()} ---`);

    // 1. Scan
    const signals = await scanNetwork();

    // 2. Decide
    const action = decideAction(signals);
    console.log(`Chose action: ${action}`);

    // If Journal doesn't exist yet, we might want to deploy it first (Self-bootstrapping)
    // For this demo, we can assume we deploy one if not set, or just deploy one now.
    let journalAddr = JOURNAL_ADDRESS;
    if (!journalAddr) {
        console.log("No Journal Address found in env. Deploying ZiggyJournal first...");
        journalAddr = await deployContract('ZiggyJournal' as any); // Type cast for simplicity in demo
        console.log(`*** SET THIS IN ENV: JOURNAL_ADDRESS=${journalAddr} ***`);
    }

    try {
        if (action === 'BUILD') {
            const apps = ['Poll', 'Counter', 'Guestbook', 'ExperimentalERC20'] as const;
            const choice = apps[Math.floor(Math.random() * apps.length)];
            const reason = `High activity detected (${signals.newContracts} new contracts). Expanding infrastructure via ${choice}.`;

            const newContract = await deployContract(choice);
            await interactContract(newContract, choice);

            const logTx = await logJournal(journalAddr, 'BUILD', newContract, reason);

            await publishUpdate({
                timestamp: new Date().toISOString(),
                action: 'BUILD',
                details: `Deployed ${choice} on Base. ${reason}`,
                txHash: logTx
            });

        } else if (action === 'USE') {
            // In a real app we'd find an existing popular contract. Here we'll deploy a temp one or use a hardcoded one to interact.
            // For demo purposes, let's deploy a Counter and use it immediately.
            const target = await deployContract('Counter');
            const reason = `Volume spiking (${signals.volumeDelta.toFixed(2)}%). Participating in the economy.`;

            await interactContract(target, 'Counter');
            const logTx = await logJournal(journalAddr, 'USE', target, reason);

            await publishUpdate({
                timestamp: new Date().toISOString(),
                action: 'USE',
                details: `Interacted with contract at ${target}. ${reason}`,
                txHash: logTx
            });

        } else { // REPORT
            const reason = `Quiet day. NewContracts=${signals.newContracts}, VolumeDelta=${signals.volumeDelta.toFixed(2)}%.`;
            const logTx = await logJournal(journalAddr, 'REPORT', null, reason);

            await publishUpdate({
                timestamp: new Date().toISOString(),
                action: 'REPORT',
                details: `Ecosystem Report: ${reason}`,
                txHash: logTx
            });
        }
    } catch (error) {
        console.error("Cycle failed:", error);
    }
}

// OpenClaw Handler
export async function runCycle() {
    await cycle();
}

// Keep standalone execution for manual testing if needed
if (require.main === module) {
    if (process.argv.includes('--once')) {
        cycle();
    } else {
        console.log("Ziggy Agent: Please run via OpenClaw or use --once flag.");
    }
}
