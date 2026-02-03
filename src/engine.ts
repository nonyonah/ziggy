import { ChainSignals } from './capabilities/baseScan';

export type ActionType = 'BUILD' | 'USE' | 'REPORT';

const CONTRACT_THRESHOLD = 10;
const VOLUME_THRESHOLD = 5;

export function decideAction(signals: ChainSignals): ActionType {
    console.log(`Deciding action based on signals: New Contracts=${signals.newContracts}, Volume Delta=${signals.volumeDelta.toFixed(2)}%`);
    if (signals.reason) console.log(`[SIGNAL REASON] ${signals.reason}`);

    if (signals.newContracts > CONTRACT_THRESHOLD) {
        return 'BUILD';
    } else if (signals.volumeDelta > VOLUME_THRESHOLD) {
        return 'USE';
    } else {
        return 'REPORT';
    }
}
