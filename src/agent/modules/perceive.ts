/**
 * PERCEIVE Module
 * Collects real-time market data, treasury status, and protocol positions
 */

import { getTreasuryStats, getPublicClient, type TreasuryStats } from '../wallet';
import { getMorphoVaults, type MorphoVaultData } from '../protocols/morpho';
import { getAerodromePools, type AerodromePool } from '../protocols/aerodrome';
import { AGENT_CONFIG } from '../config';

// ============================================================================
// Market Perception Types
// ============================================================================

export interface MarketPerception {
    timestamp: Date;

    // Treasury
    treasury: TreasuryStats;

    // Opportunities
    morphoVaults: MorphoVaultData[];
    aerodromePools: AerodromePool[];

    // Current positions
    currentMorphoPosition: MorphoVaultData | null;
    currentAerodromePosition: AerodromePool | null;

    // Best opportunities
    bestMorphoAPY: number;
    bestAerodromeAPY: number;

    // Chain state
    gasPrice: bigint;
    gasPriceGwei: string;

    // Health checks
    isHealthy: boolean;
    warnings: string[];
}

// ============================================================================
// Main Perception Function
// ============================================================================

export async function perceive(): Promise<MarketPerception> {
    console.log('[PERCEIVE] Gathering market data...');

    const warnings: string[] = [];
    const client = getPublicClient();

    // Fetch all data in parallel
    const [treasury, morphoVaults, aerodromePools, gasPrice] = await Promise.all([
        getTreasuryStats().catch(err => {
            warnings.push(`Treasury fetch failed: ${err.message}`);
            return null;
        }),
        getMorphoVaults().catch(err => {
            warnings.push(`Morpho fetch failed: ${err.message}`);
            return [];
        }),
        getAerodromePools().catch(err => {
            warnings.push(`Aerodrome fetch failed: ${err.message}`);
            return [];
        }),
        client.getGasPrice().catch(() => 0n),
    ]);

    // Find current positions
    const currentMorphoPosition = morphoVaults.find(v => v.userDeposit > 0n) || null;
    const currentAerodromePosition = aerodromePools.find(p => p.userLpBalance > 0n) || null;

    // Find best APYs
    const bestMorphoAPY = morphoVaults.length > 0
        ? Math.max(...morphoVaults.map(v => v.apy))
        : 0;
    const bestAerodromeAPY = aerodromePools.length > 0
        ? Math.max(...aerodromePools.map(p => p.apy))
        : 0;

    // Gas price in Gwei
    const gasPriceGwei = (Number(gasPrice) / 1e9).toFixed(2);

    // Health check
    const isHealthy = warnings.length === 0 && treasury !== null;

    // Add warnings for concerning states
    if (treasury && treasury.totalValueUSD < 10) {
        warnings.push('Treasury balance critically low');
    }

    if (Number(gasPrice) > AGENT_CONFIG.maxGasEth * 1e18) {
        warnings.push(`Gas price high: ${gasPriceGwei} Gwei`);
    }

    const perception: MarketPerception = {
        timestamp: new Date(),
        treasury: treasury || {
            usdcBalance: 0n,
            usdcFormatted: '0',
            ethBalance: 0n,
            ethFormatted: '0',
            totalValueUSD: 0,
        },
        morphoVaults,
        aerodromePools,
        currentMorphoPosition,
        currentAerodromePosition,
        bestMorphoAPY,
        bestAerodromeAPY,
        gasPrice,
        gasPriceGwei,
        isHealthy,
        warnings,
    };

    console.log(`[PERCEIVE] Treasury: $${perception.treasury.usdcFormatted} USDC`);
    console.log(`[PERCEIVE] Best Morpho APY: ${bestMorphoAPY.toFixed(2)}%`);
    console.log(`[PERCEIVE] Best Aerodrome APY: ${bestAerodromeAPY.toFixed(2)}%`);
    console.log(`[PERCEIVE] Gas: ${gasPriceGwei} Gwei`);

    if (warnings.length > 0) {
        console.log(`[PERCEIVE] Warnings: ${warnings.join(', ')}`);
    }

    return perception;
}

// ============================================================================
// Quick Checks
// ============================================================================

export async function quickHealthCheck(): Promise<boolean> {
    try {
        const client = getPublicClient();
        await client.getBlockNumber();
        return true;
    } catch {
        return false;
    }
}

export async function getGasPriceCheck(): Promise<{ ok: boolean; gwei: string }> {
    const client = getPublicClient();
    const gasPrice = await client.getGasPrice();
    const gwei = (Number(gasPrice) / 1e9).toFixed(2);
    const maxGwei = AGENT_CONFIG.maxGasEth * 1e9;

    return {
        ok: Number(gasPrice) <= maxGwei,
        gwei,
    };
}
