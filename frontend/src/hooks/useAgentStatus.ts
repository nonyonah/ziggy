'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface AgentStatus {
    lastUpdate: string;
    treasury_usdc: number;
    current_apy: number;
    current_protocol: string;
    current_position: string;
    growth_percent: number;
    total_compounded: number;
    status: string;
    history: Array<{
        timestamp: string;
        action: string;
        details: {
            protocol?: string;
            amount_usdc?: number;
            new_treasury_usdc?: number;
            apy_current?: number;
            tx_hash?: string;
        };
        narrative: string;
        milestone?: string;
    }>;
    milestones: string[];
    secondsSinceUpdate: number;
    isActive: boolean;
    recentHistory: AgentStatus['history'];
    totalActions: number;
}

export function useAgentStatus() {
    const { data, error, isLoading, mutate } = useSWR<AgentStatus>(
        '/api/status',
        fetcher,
        {
            refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
            revalidateOnFocus: true,
        }
    );

    return {
        status: data,
        isLoading,
        isError: error,
        refresh: mutate,
    };
}
