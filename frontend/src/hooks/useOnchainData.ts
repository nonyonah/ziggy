'use client';

import { useReadContract } from 'wagmi';
import { formatUnits, type Address } from 'viem';
import { base } from 'viem/chains';

// USDC on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address;

// Ziggy wallet (replace with actual)
const ZIGGY_WALLET = (process.env.NEXT_PUBLIC_ZIGGY_WALLET || '0x0000000000000000000000000000000000000000') as Address;

const ERC20_ABI = [
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
] as const;

export function useZiggyBalance() {
    // Only call if we have a valid wagmi context
    let data: bigint | undefined;
    let isLoading = false;
    let error: Error | null = null;

    try {
        const result = useReadContract({
            address: USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [ZIGGY_WALLET],
            chainId: base.id,
        });
        data = result.data;
        isLoading = result.isLoading;
        error = result.error;
    } catch (e) {
        // WagmiProvider not available (SSR or no Privy)
        error = e as Error;
    }

    const balance = data ? parseFloat(formatUnits(data, 6)) : 0;
    const formatted = balance.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return {
        balance,
        formatted: `$${formatted}`,
        isLoading,
        error,
    };
}

export { ZIGGY_WALLET, USDC_ADDRESS };
