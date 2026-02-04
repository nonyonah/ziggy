import { formatUnits, type Address, getAddress } from 'viem';
import { getPublicClient } from '../wallet';
import { ADDRESSES } from '../config';

// ============================================================================
// Aerodrome Types
// ============================================================================

export interface AerodromePool {
    address: Address;
    name: string;
    token0: Address;
    token1: Address;
    stable: boolean;
    apy: number;
    tvl: bigint;
    tvlFormatted: string;
    userLpBalance: bigint;
    userLpFormatted: string;
    pendingRewards: bigint;
}

// ============================================================================
// Pool Discovery
// ============================================================================

// Known Aerodrome USDC pools on Base (use getAddress for checksum)
// getAddress is now imported at the top of the file

const AERODROME_USDC_POOLS: { address: Address; name: string; stable: boolean }[] = [
    {
        // USDC/WETH volatile pool
        address: getAddress('0xb4885bc63399bf2509c05d4a4f6c85c9c6a6e2c5') as Address,
        name: 'USDC/WETH',
        stable: false,
    },
    // {
    //     // USDC/USDbC stable pool (CL pool - not compatible with getReserves)
    //     // address: getAddress('0x27a8afa3bd49406e48a074350fb7b2020c43bD69') as Address,
    //     // name: 'USDC/USDbC',
    //     // stable: true,
    // },
];

// Pair ABI for basic reads
const PAIR_ABI = [
    {
        name: 'getReserves',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [
            { name: '_reserve0', type: 'uint112' },
            { name: '_reserve1', type: 'uint112' },
            { name: '_blockTimestampLast', type: 'uint32' },
        ],
    },
    {
        name: 'token0',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [
            { name: 'reserve0', type: 'uint256' },
            { name: 'reserve1', type: 'uint256' },
            { name: 'blockTimestampLast', type: 'uint256' },
        ],
    },
    {
        name: 'token0',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'address' }],
    },
    {
        name: 'token1',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'address' }],
    },
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
] as const;

// Known Aerodrome USDC/WETH pool on Base Mainnet (volatile)
const AERODROME_USDC_WETH_POOL = getAddress('0xb4885Bc63399bF5099C05D4A4F6c85C9C6a6e2C5');

export async function getAerodromePools(): Promise<AerodromePool[]> {
    const client = getPublicClient();
    const pools: AerodromePool[] = [];

    const USDC = ADDRESSES.USDC;
    const WETH = '0x4200000000000000000000000000000000000006' as Address;

    try {
        // Use known pool address directly instead of factory lookup
        const pairAddress = AERODROME_USDC_WETH_POOL;

        // Get reserves
        const reserves = await client.readContract({
            address: pairAddress,
            abi: PAIR_ABI,
            functionName: 'getReserves',
        });

        const [reserve0, reserve1] = reserves;
        const tvl = reserve0 + reserve1;

        // Get user LP balance
        let userLpBalance = 0n;
        const walletAddress = process.env.ZIGGY_WALLET_ADDRESS as Address;
        if (walletAddress) {
            userLpBalance = await client.readContract({
                address: pairAddress,
                abi: PAIR_ABI,
                functionName: 'balanceOf',
                args: [walletAddress],
            });
        }

        pools.push({
            address: pairAddress,
            name: 'USDC/WETH',
            token0: USDC,
            token1: WETH,
            stable: false,
            apy: await fetchAerodromeAPY(pairAddress),
            tvl,
            tvlFormatted: formatUnits(tvl, 6),
            userLpBalance,
            userLpFormatted: formatUnits(userLpBalance, 18),
            pendingRewards: 0n,
        });
    } catch (error) {
        console.error(`[AERODROME] Error fetching pool USDC/WETH:`, error);
    }

    return pools;
}

// ============================================================================
// APY Fetching
// ============================================================================

async function fetchAerodromeAPY(poolAddress: Address): Promise<number> {
    try {
        const response = await fetch('https://yields.llama.fi/pools');
        const data = (await response.json()) as { data: Array<{ pool: string; project: string; chain: string; apy: number }> };

        const pool = data.data?.find(p =>
            p.pool.toLowerCase().includes(poolAddress.toLowerCase()) &&
            p.project.toLowerCase() === 'aerodrome' &&
            p.chain.toLowerCase() === 'base'
        );

        if (pool) {
            return pool.apy || 0;
        }

        return 8.0; // Placeholder for Aerodrome pools
    } catch (error) {
        console.error('[AERODROME] Error fetching APY:', error);
        return 8.0;
    }
}

// ============================================================================
// Pool Selection
// ============================================================================

export async function getBestAerodromePool(): Promise<AerodromePool | null> {
    const pools = await getAerodromePools();

    if (pools.length === 0) return null;

    // Filter stable pools (lower IL risk)
    const stablePools = pools.filter(p => p.stable);
    const targetPools = stablePools.length > 0 ? stablePools : pools;

    // Sort by APY
    targetPools.sort((a, b) => b.apy - a.apy);

    return targetPools[0] || null;
}

export async function getCurrentAerodromePosition(): Promise<AerodromePool | null> {
    const pools = await getAerodromePools();
    return pools.find(p => p.userLpBalance > 0n) || null;
}

// ============================================================================
// Swap Helpers
// ============================================================================

export function encodeAerodromeSwap(
    tokenIn: Address,
    tokenOut: Address,
    amountIn: bigint,
    minAmountOut: bigint,
    recipient: Address
): { to: Address; data: `0x${string}` } {
    // Would encode actual swap call via Aerodrome router
    return {
        to: ADDRESSES.AERODROME_ROUTER,
        data: '0x' as `0x${string}`,
    };
}

// ============================================================================
// Impermanent Loss Estimation
// ============================================================================

export function estimateImpermanentLoss(
    priceChangePercent: number
): number {
    // IL formula: 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
    const priceRatio = 1 + priceChangePercent / 100;
    const sqrtRatio = Math.sqrt(priceRatio);
    const ilPercent = (2 * sqrtRatio / (1 + priceRatio) - 1) * 100;

    return Math.abs(ilPercent);
}
