/**
 * ACT Module
 * Executes on-chain transactions based on decisions
 */

import { type Address, type Hash, encodeFunctionData, parseUnits } from 'viem';
import {
    getWalletClient,
    getPublicClient,
    approveToken,
    revokeApproval,
    waitForTransaction,
} from '../wallet';
import { type Decision, type ActionType } from './decide';
import { ADDRESSES, ERC20_ABI, MORPHO_VAULT_ABI, AGENT_CONFIG, CHAIN } from '../config';

// ============================================================================
// Action Result Types
// ============================================================================

export interface ActionResult {
    success: boolean;
    action: ActionType;
    txHash?: Hash;
    error?: string;
    gasUsed?: bigint;
    timestamp: Date;
}

// ============================================================================
// Main Action Executor
// ============================================================================

export async function act(decision: Decision): Promise<ActionResult> {
    console.log(`[ACT] Executing: ${decision.action}`);

    const timestamp = new Date();

    try {
        switch (decision.action) {
            case 'HOLD':
                return { success: true, action: 'HOLD', timestamp };

            case 'DEPOSIT_MORPHO':
                return await executeDepositMorpho(decision);

            case 'WITHDRAW_MORPHO':
                return await executeWithdrawMorpho(decision);

            case 'MIGRATE_MORPHO':
                return await executeMigrateMorpho(decision);

            case 'COMPOUND_REWARDS':
                return await executeCompoundRewards(decision);

            case 'DEPLOY_TOKEN':
                return await executeDeployToken(decision);

            case 'DEPLOY_VAULT':
                return await executeDeployVault(decision);

            default:
                console.log(`[ACT] Action ${decision.action} not implemented yet`);
                return {
                    success: false,
                    action: decision.action,
                    error: 'Action not implemented',
                    timestamp,
                };
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[ACT] Error executing ${decision.action}:`, errorMessage);

        return {
            success: false,
            action: decision.action,
            error: errorMessage,
            timestamp,
        };
    }
}

// ============================================================================
// Morpho Actions
// ============================================================================

async function executeDepositMorpho(decision: Decision): Promise<ActionResult> {
    const walletClient = getWalletClient();
    const publicClient = getPublicClient();
    const account = walletClient.account;

    if (!account) throw new Error('No wallet account');
    if (!decision.params?.targetVault) throw new Error('No target vault specified');
    if (!decision.params?.amount) throw new Error('No amount specified');

    const vaultAddress = decision.params.targetVault as Address;
    const amount = decision.params.amount;

    console.log(`[ACT] Depositing ${amount} to Morpho vault ${vaultAddress}`);

    // Step 1: Approve USDC
    console.log('[ACT] Approving USDC...');
    const approveHash = await approveToken(ADDRESSES.USDC, vaultAddress, amount);
    await waitForTransaction(approveHash);

    // Step 2: Deposit
    console.log('[ACT] Depositing...');
    const depositData = encodeFunctionData({
        abi: MORPHO_VAULT_ABI,
        functionName: 'deposit',
        args: [amount, account.address],
    });

    const txHash = await walletClient.sendTransaction({
        account,
        to: vaultAddress,
        data: depositData,
        chain: CHAIN,
    });

    const success = await waitForTransaction(txHash);

    // Step 3: Revoke approval (safety)
    console.log('[ACT] Revoking approval...');
    await revokeApproval(ADDRESSES.USDC, vaultAddress);

    console.log(`[ACT] Deposit ${success ? 'successful' : 'failed'}: ${txHash}`);

    return {
        success,
        action: 'DEPOSIT_MORPHO',
        txHash,
        timestamp: new Date(),
    };
}

async function executeWithdrawMorpho(decision: Decision): Promise<ActionResult> {
    const walletClient = getWalletClient();
    const account = walletClient.account;

    if (!account) throw new Error('No wallet account');
    if (!decision.params?.targetVault) throw new Error('No target vault specified');
    if (!decision.params?.amount) throw new Error('No amount specified');

    const vaultAddress = decision.params.targetVault as Address;
    const amount = decision.params.amount;

    console.log(`[ACT] Withdrawing ${amount} from Morpho vault ${vaultAddress}`);

    const withdrawData = encodeFunctionData({
        abi: MORPHO_VAULT_ABI,
        functionName: 'withdraw',
        args: [amount, account.address, account.address],
    });

    const txHash = await walletClient.sendTransaction({
        account,
        to: vaultAddress,
        data: withdrawData,
        chain: CHAIN,
    });

    const success = await waitForTransaction(txHash);

    console.log(`[ACT] Withdraw ${success ? 'successful' : 'failed'}: ${txHash}`);

    return {
        success,
        action: 'WITHDRAW_MORPHO',
        txHash,
        timestamp: new Date(),
    };
}

async function executeMigrateMorpho(decision: Decision): Promise<ActionResult> {
    console.log('[ACT] Migration: Withdraw from current → Deposit to new');

    // This would be a multi-step transaction:
    // 1. Withdraw all from current vault
    // 2. Deposit to new vault
    // For now, return placeholder

    return {
        success: false,
        action: 'MIGRATE_MORPHO',
        error: 'Migration requires current vault info - implement with full state',
        timestamp: new Date(),
    };
}

// ============================================================================
// Rewards Actions
// ============================================================================

async function executeCompoundRewards(decision: Decision): Promise<ActionResult> {
    console.log('[ACT] Compounding rewards...');

    // This would:
    // 1. Claim rewards from Morpho/Aerodrome
    // 2. Swap reward tokens to USDC if needed
    // 3. Re-deposit USDC

    return {
        success: false,
        action: 'COMPOUND_REWARDS',
        error: 'Compound rewards not fully implemented',
        timestamp: new Date(),
    };
}

// ============================================================================
// Evolution Actions (Contract Deployment)
// ============================================================================

async function executeDeployToken(decision: Decision): Promise<ActionResult> {
    console.log('[ACT] Deploying $ZIGGY token...');

    // This would deploy the ERC20 contract
    // Requires compiled bytecode

    return {
        success: false,
        action: 'DEPLOY_TOKEN',
        error: 'Token deployment requires compiled contract',
        timestamp: new Date(),
    };
}

async function executeDeployVault(decision: Decision): Promise<ActionResult> {
    console.log('[ACT] Deploying ERC4626 Vault...');

    // This would deploy the vault contract

    return {
        success: false,
        action: 'DEPLOY_VAULT',
        error: 'Vault deployment requires compiled contract',
        timestamp: new Date(),
    };
}

// ============================================================================
// Batch Actions (Gas Optimization)
// ============================================================================

export async function batchActions(decisions: Decision[]): Promise<ActionResult[]> {
    const results: ActionResult[] = [];

    for (const decision of decisions) {
        const result = await act(decision);
        results.push(result);

        if (!result.success) {
            console.log(`[ACT] Batch stopped due to failure in ${decision.action}`);
            break;
        }
    }

    return results;
}

// ============================================================================
// Action Logging
// ============================================================================

export function formatActionLog(result: ActionResult): string {
    const status = result.success ? '✅' : '❌';
    const txLink = result.txHash
        ? `https://basescan.org/tx/${result.txHash}`
        : 'N/A';

    return [
        `${status} ${result.action}`,
        `Time: ${result.timestamp.toISOString()}`,
        `Tx: ${txLink}`,
        result.error ? `Error: ${result.error}` : '',
    ].filter(Boolean).join('\n');
}
