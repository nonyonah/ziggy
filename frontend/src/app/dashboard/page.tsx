'use client';

import { usePrivy } from '@/hooks/useAuth';
import StatsCard from '@/components/StatsCard';
import TreasuryChart from '@/components/TreasuryChart';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAgentStatus } from '@/hooks/useAgentStatus';
import { useZiggyBalance } from '@/hooks/useOnchainData';

export default function Dashboard() {
    const { authenticated, ready } = usePrivy();
    const router = useRouter();
    const { status, isLoading, refresh } = useAgentStatus();
    const { formatted: onchainBalance } = useZiggyBalance();

    useEffect(() => {
        if (ready && !authenticated) {
            router.push('/');
        }
    }, [ready, authenticated, router]);

    if (!ready || !authenticated) return null;

    const treasury = status?.treasury_usdc
        ? `$${status.treasury_usdc.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        : onchainBalance;

    const dailyYield = status?.treasury_usdc && status?.current_apy
        ? `$${((status.treasury_usdc * status.current_apy / 100) / 365).toFixed(2)}`
        : '$--';

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Agent Dashboard</h1>
                <button
                    onClick={() => refresh()}
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm flex items-center gap-2"
                >
                    <span className={isLoading ? 'animate-spin' : ''}>↻</span>
                    Refresh
                </button>
            </div>

            {/* Status Banner */}
            {status && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${status.isActive ? 'bg-accent/10 border border-accent/20' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
                    <div className={`w-3 h-3 rounded-full ${status.isActive ? 'bg-accent animate-pulse' : 'bg-yellow-500'}`}></div>
                    <span className="text-sm">
                        {status.isActive
                            ? `Active • Last update ${Math.floor(status.secondsSinceUpdate / 60)} min ago`
                            : `Idle • Last seen ${Math.floor(status.secondsSinceUpdate / 3600)} hours ago`
                        }
                    </span>
                </div>
            )}

            {/* Portfolio Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatsCard label="Net Worth" value={treasury} color="primary" />
                <StatsCard
                    label="Daily Yield"
                    value={dailyYield}
                    subValue={status?.current_apy ? `${status.current_apy.toFixed(1)}% APY` : '--'}
                    color="secondary"
                />
                <StatsCard
                    label="Total Actions"
                    value={status?.totalActions?.toString() || '--'}
                    subValue={`${status?.milestones?.length || 0} milestones`}
                    color="accent"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart */}
                <div className="lg:col-span-2 glass-card rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-6">Treasury Growth</h2>
                    <TreasuryChart />
                </div>

                {/* Recent Actions Feed */}
                <div className="glass-card rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-6">Recent Actions</h2>
                    <div className="space-y-4">
                        {status?.recentHistory?.slice(0, 5).map((item, i) => (
                            <div key={i} className="flex justify-between items-start p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex-1">
                                    <div className="font-medium text-sm line-clamp-2">{item.narrative}</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {new Date(item.timestamp).toLocaleString()}
                                    </div>
                                </div>
                                {item.details?.tx_hash && (
                                    <a
                                        href={`https://basescan.org/tx/${item.details.tx_hash}`}
                                        target="_blank"
                                        className="text-xs text-primary-glow hover:underline ml-2 shrink-0"
                                    >
                                        Tx ↗
                                    </a>
                                )}
                            </div>
                        )) || (
                                <div className="text-center text-gray-500 py-8">
                                    {isLoading ? 'Loading...' : 'No recent actions'}
                                </div>
                            )}
                    </div>
                    <a
                        href="https://basescan.org"
                        target="_blank"
                        className="block w-full mt-6 py-2 text-sm text-center text-gray-400 hover:text-white border-t border-white/10"
                    >
                        View All On-Chain →
                    </a>
                </div>
            </div>

            {/* Active Positions Table */}
            <div className="mt-8 glass-card rounded-2xl p-6 overflow-hidden">
                <h2 className="text-xl font-bold mb-6">Active Positions</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs uppercase text-gray-400 border-b border-white/10">
                                <th className="pb-4 pl-4">Protocol</th>
                                <th className="pb-4">Asset/Pool</th>
                                <th className="pb-4">Deposited</th>
                                <th className="pb-4">APY</th>
                                <th className="pb-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {status?.current_protocol && status.current_protocol !== 'Idle' ? (
                                <tr>
                                    <td className="py-4 pl-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-sm font-bold">
                                                {status.current_protocol.charAt(0)}
                                            </div>
                                            <span className="font-medium">{status.current_protocol}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-gray-300">{status.current_position}</td>
                                    <td className="py-4 font-mono">{treasury}</td>
                                    <td className="py-4 text-green-400">{status.current_apy?.toFixed(1)}%</td>
                                    <td className="py-4">
                                        <span className="px-2 py-1 rounded bg-accent/20 text-accent text-xs">Active</span>
                                    </td>
                                </tr>
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-500">
                                        {isLoading ? 'Loading positions...' : 'No active positions'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
