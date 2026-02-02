import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

// Use baseSepolia for Dev/Test, switching to base mainnet would require just changing the import
const client = createPublicClient({
    chain: baseSepolia,
    transport: http()
});

export interface ChainSignals {
    newContracts: number;
    volumeDelta: number;
    reason: string;
}

export async function scanNetwork(): Promise<ChainSignals> {
    console.log("Scanning Base network for real signals...");

    // Get latest block
    const latestBlock = await client.getBlock({ includeTransactions: true });
    // Get a block from ~100 blocks ago (approx 3-4 mins) to compare short term trend, 
    // or we could just look at the current block 'fullness'
    const pastBlock = await client.getBlock({ blockNumber: latestBlock.number - BigInt(100), includeTransactions: true });

    const txCount = latestBlock.transactions.length;
    const pastTxCount = pastBlock.transactions.length;

    // A simple proxy for "volume delta": Change in transaction count
    const volumeDelta = pastTxCount > 0 ? ((txCount - pastTxCount) / pastTxCount) * 100 : 0;

    // A proxy for "new contracts": just counting txs is imperfect but acceptable for an autonomous agent 
    // without an indexer. We can look at "contract creation" txs if we iterate, but strict counting is heavy.
    // Let's stick to total TX count as a general "activity" signal, but map it to our internal 'contracts' metric
    // simply by scaling. 
    // IMPROVEMENT: We can check if any tx in the block had 'to' as null (contract creation).
    let newContracts = 0;
    for (const tx of latestBlock.transactions) {
        // In viem, transactions are objects if includeTransactions: true
        if (typeof tx !== 'string' && !tx.to) {
            newContracts++;
        }
    }

    return {
        newContracts,
        volumeDelta,
        reason: `Block #${latestBlock.number}: ${txCount} txs, ${newContracts} deployments.`
    };
}
