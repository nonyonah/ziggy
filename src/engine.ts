import { ChainSignals } from './capabilities/baseScan';

export type ActionType = 'BUILD' | 'USE' | 'REPORT';

export function decideAction(signals: ChainSignals): ActionType {
    console.log(`Deciding action based on signals: New Contracts=${signals.newContracts}, Volume Delta=${signals.volumeDelta}%`);
    if (signals.reason) console.log(`[SIGNAL REASON] ${signals.reason}`);

    if (signals.newContracts > 10) {
        return 'BUILD';
    } else if (signals.volumeDelta > 5) {
        return 'USE';
    } else {
        return 'REPORT';
    }
}
