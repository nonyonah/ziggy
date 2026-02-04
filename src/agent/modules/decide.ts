/**
 * DECIDE Module
 * Analyzes market perception and determines optimal actions
 */

import { type MarketPerception } from './perceive';
import { AGENT_CONFIG } from '../config';
import { estimateImpermanentLoss } from '../protocols/aerodrome';

// ============================================================================
// Decision Types
// ============================================================================

export type ActionType =
    | 'HOLD'
    | 'DEPOSIT_MORPHO'
    | 'WITHDRAW_MORPHO'
    | 'MIGRATE_MORPHO'
    | 'DEPOSIT_AERODROME'
    | 'WITHDRAW_AERODROME'
    | 'COMPOUND_REWARDS'
    | 'DEPLOY_TOKEN'
    | 'DEPLOY_VAULT';

export interface Decision {
    action: ActionType;
    reasoning: string[];
    params?: {
        targetVault?: string;
        targetPool?: string;
        amount?: bigint;
        expectedAPY?: number;
        netBenefit?: number;
    };
    confidence: number; // 0-1
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

// ============================================================================
// Main Decision Function
// ============================================================================

export function decide(perception: MarketPerception): Decision {
    console.log('[DECIDE] Analyzing opportunities...');

    const reasoning: string[] = [];

    // Check for health issues first
    if (!perception.isHealthy) {
        reasoning.push('System unhealthy - holding position');
        return {
            action: 'HOLD',
            reasoning,
            confidence: 1,
            priority: 'LOW',
        };
    }

    // Check for evolution milestones
    const evolutionDecision = checkEvolutionMilestones(perception);
    if (evolutionDecision) return evolutionDecision;

    // Current position analysis
    const currentAPY = perception.currentMorphoPosition?.apy ||
        perception.currentAerodromePosition?.apy ||
        0;

    // Best available
    const bestMorphoVault = perception.morphoVaults
        .filter(v => parseFloat(v.tvlFormatted) >= AGENT_CONFIG.minTVLForPool)
        .sort((a, b) => b.apy - a.apy)[0];

    const bestAeroPool = perception.aerodromePools
        .filter(p => p.stable) // Prefer stable pools for low IL
        .sort((a, b) => b.apy - a.apy)[0];

    // Compare opportunities
    const apyThreshold = AGENT_CONFIG.apyDeltaThreshold * 100; // Convert to %

    // Strategy 1: Check if we should migrate within Morpho
    if (bestMorphoVault && perception.currentMorphoPosition) {
        const apyDelta = bestMorphoVault.apy - perception.currentMorphoPosition.apy;

        if (apyDelta > apyThreshold) {
            reasoning.push(
                `Current Morpho position: ${perception.currentMorphoPosition.apy.toFixed(2)}% APY`,
                `Better vault available: ${bestMorphoVault.apy.toFixed(2)}% APY`,
                `Delta: +${apyDelta.toFixed(2)}% exceeds ${apyThreshold}% threshold`
            );

            return {
                action: 'MIGRATE_MORPHO',
                reasoning,
                params: {
                    targetVault: bestMorphoVault.address,
                    expectedAPY: bestMorphoVault.apy,
                    netBenefit: apyDelta,
                },
                confidence: 0.85,
                priority: 'HIGH',
            };
        }
    }

    // Strategy 2: No position - deposit into best Morpho vault
    if (!perception.currentMorphoPosition && !perception.currentAerodromePosition) {
        if (bestMorphoVault && parseFloat(perception.treasury.usdcFormatted) > 10) {
            reasoning.push(
                `No current position`,
                `Treasury: $${perception.treasury.usdcFormatted} USDC available`,
                `Best Morpho vault: ${bestMorphoVault.apy.toFixed(2)}% APY`
            );

            return {
                action: 'DEPOSIT_MORPHO',
                reasoning,
                params: {
                    targetVault: bestMorphoVault.address,
                    amount: perception.treasury.usdcBalance * 8n / 10n, // 80% deposit
                    expectedAPY: bestMorphoVault.apy,
                },
                confidence: 0.9,
                priority: 'HIGH',
            };
        }
    }

    // Strategy 3: Check if Aerodrome LP is significantly better (with IL consideration)
    if (bestAeroPool && bestMorphoVault) {
        const ilEstimate = estimateImpermanentLoss(10); // Assume 10% price change
        const effectiveAeroAPY = bestAeroPool.apy - ilEstimate;

        if (effectiveAeroAPY > bestMorphoVault.apy + apyThreshold) {
            reasoning.push(
                `Aerodrome pool ${bestAeroPool.name}: ${bestAeroPool.apy.toFixed(2)}% APY`,
                `Estimated IL (10% move): ${ilEstimate.toFixed(2)}%`,
                `Effective APY: ${effectiveAeroAPY.toFixed(2)}%`,
                `Still ${(effectiveAeroAPY - bestMorphoVault.apy).toFixed(2)}% better than Morpho`
            );

            // Only if within LP allocation limits
            const currentLPRatio = perception.currentAerodromePosition
                ? parseFloat(perception.currentAerodromePosition.userLpFormatted) /
                perception.treasury.totalValueUSD
                : 0;

            if (currentLPRatio < AGENT_CONFIG.maxLPAllocation) {
                return {
                    action: 'DEPOSIT_AERODROME',
                    reasoning,
                    params: {
                        targetPool: bestAeroPool.address,
                        expectedAPY: bestAeroPool.apy,
                    },
                    confidence: 0.7, // Lower confidence for LP due to IL risk
                    priority: 'MEDIUM',
                };
            } else {
                reasoning.push(`LP allocation at max (${(currentLPRatio * 100).toFixed(0)}%)`);
            }
        }
    }

    // Strategy 4: Compound rewards
    const hasMorphoRewards = perception.currentMorphoPosition &&
        perception.currentMorphoPosition.pendingRewards > 1000000n; // > $1
    const hasAeroRewards = perception.currentAerodromePosition &&
        perception.currentAerodromePosition.pendingRewards > 1000000n;

    if (hasMorphoRewards || hasAeroRewards) {
        reasoning.push('Pending rewards available for compounding');
        return {
            action: 'COMPOUND_REWARDS',
            reasoning,
            confidence: 0.95,
            priority: 'MEDIUM',
        };
    }

    // Default: HOLD
    reasoning.push(
        `Current APY: ${currentAPY.toFixed(2)}%`,
        `Best available: ${Math.max(perception.bestMorphoAPY, perception.bestAerodromeAPY).toFixed(2)}%`,
        `No significant improvement found (threshold: ${apyThreshold}%)`
    );

    return {
        action: 'HOLD',
        reasoning,
        confidence: 1,
        priority: 'LOW',
    };
}

// ============================================================================
// Evolution Milestones
// ============================================================================

function checkEvolutionMilestones(perception: MarketPerception): Decision | null {
    // These would check against initial seed funding
    // Placeholder: read from MEMORY.md or config
    const seedAmount = 100; // $100 initial seed (placeholder)
    const currentValue = perception.treasury.totalValueUSD;
    const growthPercent = (currentValue - seedAmount) / seedAmount;

    if (growthPercent >= AGENT_CONFIG.milestones.deployVault) {
        return {
            action: 'DEPLOY_VAULT',
            reasoning: [
                `Growth: +${(growthPercent * 100).toFixed(0)}%`,
                `Vault deployment threshold (${AGENT_CONFIG.milestones.deployVault * 100}%) reached`,
            ],
            confidence: 0.8,
            priority: 'HIGH',
        };
    }

    if (growthPercent >= AGENT_CONFIG.milestones.deployToken) {
        return {
            action: 'DEPLOY_TOKEN',
            reasoning: [
                `Growth: +${(growthPercent * 100).toFixed(0)}%`,
                `Token deployment threshold (${AGENT_CONFIG.milestones.deployToken * 100}%) reached`,
            ],
            confidence: 0.8,
            priority: 'HIGH',
        };
    }

    return null;
}

// ============================================================================
// Decision Logging
// ============================================================================

export function formatDecisionLog(decision: Decision): string {
    return [
        `=== DECISION: ${decision.action} ===`,
        `Priority: ${decision.priority}`,
        `Confidence: ${(decision.confidence * 100).toFixed(0)}%`,
        `Reasoning:`,
        ...decision.reasoning.map(r => `  - ${r}`),
        decision.params ? `Params: ${JSON.stringify(decision.params, null, 2)}` : '',
    ].filter(Boolean).join('\n');
}
