import { formatUnits, type Address } from 'viem';
import { getPublicClient } from '../wallet';
import { ADDRESSES, MORPHO_VAULT_ABI, ERC20_ABI } from '../config';

// ============================================================================
// Morpho Vault Types
// ============================================================================

export interface MorphoVaultData {
    address: Address;
    name: string;
    apy: number;
    tvl: bigint;
    tvlFormatted: string;
    userDeposit: bigint;
    userDepositFormatted: string;
    pendingRewards: bigint;
}

// ============================================================================
// Vault Discovery & Data
// ============================================================================

// Known Morpho USDC vaults on Base Mainnet
const MORPHO_USDC_VAULTS: { address: Address; name: string }[] = [
    {
        // Gauntlet USDC Core vault on Base Mainnet
        address: (process.env.MORPHO_VAULT_ADDRESS || '0x4501125508079A99ebBebCE205DeC9593C2b5857') as Address,
        name: 'Morpho USDC Vault'
    },
];

export async function getMorphoVaults(): Promise<MorphoVaultData[]> {
    const client = getPublicClient();
    const vaults: MorphoVaultData[] = [];

    for (const vault of MORPHO_USDC_VAULTS) {
        try {
            // Get total assets (TVL)
            const tvl = await client.readContract({
                address: vault.address,
                abi: MORPHO_VAULT_ABI,
                functionName: 'totalAssets',
            });

            // Get user balance if wallet is configured
            let userDeposit = 0n;
            const walletAddress = process.env.ZIGGY_WALLET_ADDRESS as Address;
            if (walletAddress) {
                userDeposit = await client.readContract({
                    address: vault.address,
                    abi: ERC20_ABI,
                    functionName: 'balanceOf',
                    args: [walletAddress],
                });
            }

            // APY would typically come from subgraph or API
            // Using placeholder - integrate with DeFiLlama or Morpho API
            const apy = await fetchMorphoAPY(vault.address);

            vaults.push({
                address: vault.address,
                name: vault.name,
                apy,
                tvl,
                tvlFormatted: formatUnits(tvl, 6),
                userDeposit,
                userDepositFormatted: formatUnits(userDeposit, 6),
                pendingRewards: 0n, // Would need rewards contract
            });
        } catch (error) {
            console.error(`[MORPHO] Error fetching vault ${vault.name}:`, error);
        }
    }

    return vaults;
}

// ============================================================================
// APY Fetching (DeFiLlama Integration)
// ============================================================================

async function fetchMorphoAPY(vaultAddress: Address): Promise<number> {
    try {
        // DeFiLlama yields API
        const response = await fetch('https://yields.llama.fi/pools');
        const data = (await response.json()) as { data: Array<{ pool: string; chain: string; apy: number }> };

        // Find matching pool
        const pool = data.data?.find(p =>
            p.pool.toLowerCase().includes(vaultAddress.toLowerCase()) &&
            p.chain.toLowerCase() === 'base'
        );

        if (pool) {
            return pool.apy || 0;
        }

        // Fallback: estimate from on-chain data or return placeholder
        return 5.0; // Placeholder 5% APY
    } catch (error) {
        console.error('[MORPHO] Error fetching APY:', error);
        return 5.0;
    }
}

// ============================================================================
// Vault Actions
// ============================================================================

export async function getBestMorphoVault(): Promise<MorphoVaultData | null> {
    const vaults = await getMorphoVaults();

    if (vaults.length === 0) return null;

    // Sort by APY descending
    vaults.sort((a, b) => b.apy - a.apy);

    // Return best vault with sufficient TVL
    const minTVL = 5_000_000; // $5M minimum
    return vaults.find(v => parseFloat(v.tvlFormatted) >= minTVL) || vaults[0];
}

export async function getCurrentMorphoPosition(): Promise<MorphoVaultData | null> {
    const vaults = await getMorphoVaults();

    // Find vault with user deposit
    return vaults.find(v => v.userDeposit > 0n) || null;
}

// ============================================================================
// Deposit/Withdraw (Actual tx execution)
// ============================================================================

export function encodeMorphoDeposit(
    vaultAddress: Address,
    amount: bigint,
    receiver: Address
): { to: Address; data: `0x${string}` } {
    // This would use viem's encodeFunctionData
    // Simplified - actual implementation needs proper encoding
    return {
        to: vaultAddress,
        data: '0x' as `0x${string}`, // Placeholder
    };
}

export function encodeMorphoWithdraw(
    vaultAddress: Address,
    amount: bigint,
    receiver: Address,
    owner: Address
): { to: Address; data: `0x${string}` } {
    return {
        to: vaultAddress,
        data: '0x' as `0x${string}`, // Placeholder
    };
}
