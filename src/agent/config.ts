import { createPublicClient, http, type Address, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// ============================================================================
// Chain Configuration
// ============================================================================

export const CHAIN = base;

export const RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

// ============================================================================
// Contract Addresses (Base Mainnet)
// ============================================================================

export const ADDRESSES = {
    // Core tokens
    USDC: (process.env.USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e') as Address, // Fallback to Base Sepolia
    WETH: '0x4200000000000000000000000000000000000006' as Address,

    // Morpho (primary lending)
    MORPHO_BLUE: (process.env.MORPHO_VAULT_ADDRESS || '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb') as Address,
    MORPHO_USDC_VAULT: '0x0000000000000000000000000000000000000000' as Address, // Not used directly in Blue

    // Aerodrome (DEX)
    AERODROME_ROUTER: (process.env.AERODROME_ROUTER_ADDRESS || '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43') as Address,
    AERODROME_VOTER: '0x16613524e02ad97eDfeF371bC883F2F5d6C480A5' as Address, // Keep mainnet or find testnet

    // Ziggy contracts (deployed later)
    ZIGGY_TOKEN: null as Address | null,
    ZIGGY_VAULT: null as Address | null,
} as const;

// ============================================================================
// Agent Configuration
// ============================================================================

// Validate wallet address from env
const walletAddr = process.env.ZIGGY_WALLET_ADDRESS;
if (!walletAddr || walletAddr === '0xYourZiggyWalletAddress') {
    console.warn('[CONFIG] ⚠️ ZIGGY_WALLET_ADDRESS not set or is placeholder');
}

export const AGENT_CONFIG = {
    // Wallet
    walletAddress: (walletAddr || '0x0000000000000000000000000000000000000000') as Address,

    // Timing
    heartbeatIntervalMs: parseInt(process.env.HEARTBEAT_INTERVAL_MS || '14400000'), // 4 hours

    // Safety limits
    maxGasEth: parseFloat(process.env.GAS_LIMIT_ETH || '0.001'),
    maxSingleTxUSDC: 1000, // Conservative start

    // Decision thresholds
    apyDeltaThreshold: parseFloat(process.env.APY_DELTA_THRESHOLD || '0.03'), // 3%
    minTVLForPool: 5_000_000, // $5M minimum TVL

    // Evolution milestones
    milestones: {
        deployToken: 0.20, // +20% growth
        deployVault: 0.50, // +50% growth
    },

    // Risk allocation (initial conservative)
    maxLPAllocation: 0.20, // Max 20% in LP
    stableLendingMin: 0.80, // Min 80% in stable lending
} as const;

// ============================================================================
// ABIs (Minimal for reads)
// ============================================================================

export const ERC20_ABI = [
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'decimals',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }],
    },
    {
        name: 'approve',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
    },
] as const;

export const MORPHO_VAULT_ABI = [
    {
        name: 'totalAssets',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'deposit',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'assets', type: 'uint256' },
            { name: 'receiver', type: 'address' },
        ],
        outputs: [{ name: 'shares', type: 'uint256' }],
    },
    {
        name: 'withdraw',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'assets', type: 'uint256' },
            { name: 'receiver', type: 'address' },
            { name: 'owner', type: 'address' },
        ],
        outputs: [{ name: 'shares', type: 'uint256' }],
    },
    {
        name: 'maxDeposit',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'receiver', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
] as const;
