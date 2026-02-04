import {
    createPublicClient,
    createWalletClient,
    http,
    formatUnits,
    parseUnits,
    type Address,
    type Hash,
    type PublicClient,
    type WalletClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CHAIN, RPC_URL, ADDRESSES, ERC20_ABI, AGENT_CONFIG } from './config';

// ============================================================================
// Clients
// ============================================================================

let publicClient: PublicClient | null = null;
let walletClient: WalletClient | null = null;

export function getPublicClient(): PublicClient {
    if (!publicClient) {
        publicClient = createPublicClient({
            chain: CHAIN,
            transport: http(RPC_URL),
        });
    }
    return publicClient;
}

export function getWalletClient(): WalletClient {
    if (!walletClient) {
        const privateKey = process.env.ZIGGY_PRIVATE_KEY;
        if (!privateKey) {
            throw new Error('ZIGGY_PRIVATE_KEY not set in environment');
        }
        const account = privateKeyToAccount(privateKey as `0x${string}`);
        walletClient = createWalletClient({
            account,
            chain: CHAIN,
            transport: http(RPC_URL),
        });
    }
    return walletClient;
}

// ============================================================================
// Balance Functions
// ============================================================================

export async function getUSDCBalance(address?: Address): Promise<bigint> {
    const client = getPublicClient();
    const targetAddress = address || AGENT_CONFIG.walletAddress;

    return client.readContract({
        address: ADDRESSES.USDC,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [targetAddress],
    });
}

export async function getETHBalance(address?: Address): Promise<bigint> {
    const client = getPublicClient();
    const targetAddress = address || AGENT_CONFIG.walletAddress;

    return client.getBalance({ address: targetAddress });
}

export async function formatUSDCBalance(balance: bigint): Promise<string> {
    return formatUnits(balance, 6); // USDC has 6 decimals
}

// ============================================================================
// Treasury Stats
// ============================================================================

export interface TreasuryStats {
    usdcBalance: bigint;
    usdcFormatted: string;
    ethBalance: bigint;
    ethFormatted: string;
    totalValueUSD: number;
}

export async function getTreasuryStats(): Promise<TreasuryStats> {
    const [usdcBalance, ethBalance] = await Promise.all([
        getUSDCBalance(),
        getETHBalance(),
    ]);

    const usdcFormatted = formatUnits(usdcBalance, 6);
    const ethFormatted = formatUnits(ethBalance, 18);

    // Simple USD calculation (USDC = 1:1, ETH price would need oracle)
    const totalValueUSD = parseFloat(usdcFormatted);

    return {
        usdcBalance,
        usdcFormatted,
        ethBalance,
        ethFormatted,
        totalValueUSD,
    };
}

// ============================================================================
// Transaction Helpers
// ============================================================================

export async function sendTransaction(params: {
    to: Address;
    data: `0x${string}`;
    value?: bigint;
}): Promise<Hash> {
    const client = getWalletClient();
    const account = client.account;

    if (!account) {
        throw new Error('No account configured');
    }

    // Check gas price
    const publicClient = getPublicClient();
    const gasPrice = await publicClient.getGasPrice();

    const hash = await client.sendTransaction({
        account,
        to: params.to,
        data: params.data,
        value: params.value || 0n,
        chain: CHAIN,
    });

    console.log(`[WALLET] Transaction sent: ${hash}`);
    return hash;
}

export async function waitForTransaction(hash: Hash): Promise<boolean> {
    const client = getPublicClient();
    const receipt = await client.waitForTransactionReceipt({ hash });
    return receipt.status === 'success';
}

// ============================================================================
// Approval Management
// ============================================================================

export async function approveToken(
    tokenAddress: Address,
    spenderAddress: Address,
    amount: bigint
): Promise<Hash> {
    const client = getWalletClient();
    const account = client.account;

    if (!account) {
        throw new Error('No account configured');
    }

    const hash = await client.writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spenderAddress, amount],
        account,
        chain: CHAIN,
    });

    console.log(`[WALLET] Approved ${spenderAddress} for ${formatUnits(amount, 6)} tokens: ${hash}`);
    return hash;
}

export async function revokeApproval(
    tokenAddress: Address,
    spenderAddress: Address
): Promise<Hash> {
    return approveToken(tokenAddress, spenderAddress, 0n);
}
