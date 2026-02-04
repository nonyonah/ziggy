'use client';

import { usePrivy } from '@/hooks/useAuth';
import { useAgentStatus } from '@/hooks/useAgentStatus';
import { useZiggyBalance } from '@/hooks/useOnchainData';
import Link from 'next/link';

export default function Home() {
  const { login } = usePrivy();
  const { status, isLoading } = useAgentStatus();
  const { balance: usdcBalance, isLoading: isBalanceLoading } = useZiggyBalance();

  // Combine on-chain and agent data
  const treasuryValue = usdcBalance || status?.treasury_usdc;
  const growth = status?.growth_percent || 0;
  const apy = status?.current_apy || 0;
  const position = status?.current_position || 'Idle';
  const narrative = status?.recentHistory?.[0]?.narrative;
  const lastAction = status?.recentHistory?.[0]?.action;

  // Explicitly check if data is from a live agent or initial state
  const isAgentActive = ((status?.treasury_usdc || 0) > 0 || usdcBalance > 0) && !isLoading;

  return (
    <div className="min-h-screen bg-morpho-bg-main selection:bg-morpho-blue/30 text-morpho-text-primary font-sans pt-24 pb-12">

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-morpho-bg-surface border border-morpho-bg-surface2 text-xs font-mono text-morpho-text-secondary mb-6">
            <span className={`w-2 h-2 rounded-full ${isAgentActive ? 'bg-morpho-green animate-pulse' : 'bg-morpho-bg-surface2'}`}></span>
            {isAgentActive ? 'AGENT ACTIVE' : 'AWAITING FUNDING'}
          </div>

          <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-6 text-white leading-[1.1]">
            Autonomous yield.<br />
            <span className="text-morpho-blue-DEFAULT">Optimized.</span>
          </h1>

          <p className="text-xl text-morpho-text-secondary max-w-2xl mb-10 leading-relaxed font-light">
            Ziggy is an on-chain agent that autonomously navigates Base DeFi protocols to maximize USDC yields. No manual intervention required.
          </p>

          {/* Buttons removed as requested */}
        </div>
      </section>

      {/* Stats Grid - "The Blue Data" */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 fill-mode-backwards">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            label="Treasury Value"
            value={isBalanceLoading ? '...' : `$${(treasuryValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            sub="USDC"
          />
          <StatCard
            label="Current APY"
            value={`${apy.toFixed(2)}%`}
            sub="Variable"
            trend={apy > 0 ? 'positive' : 'neutral'}
          />
          <StatCard
            label="Active Strategy"
            value={position}
            sub="Protocol"
          />
          <StatCard
            label="Total Growth"
            value={`${growth > 0 ? '+' : ''}${growth.toFixed(2)}%`}
            sub="Lifetime"
            trend={growth > 0 ? 'positive' : 'neutral'}
          />
        </div>
      </section>

      {/* "What We Are Building" - Technical Roadmap */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-morpho-bg-surface2 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 fill-mode-backwards">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-2xl font-bold mb-6 text-white">Current Architecture</h2>
            <p className="text-morpho-text-secondary mb-8 leading-relaxed">
              Ziggy operates on a 4-hour "Heartbeat" cycle. It continuously monitors lending rates on Morpho and liquidity pool yields on Aerodrome. When a significant opportunity detected (&gt;3% APY delta), it autonomously rebalances capital.
            </p>

            <div className="space-y-4">
              <ArchitectureItem label="Perception" value="Market Data Oracle" status="active" />
              <ArchitectureItem label="Decision Engine" value="Yield Optimization" status="active" />
              <ArchitectureItem label="Execution" value="Viem / Base Mainnet" status="active" />
              <ArchitectureItem label="Treasury" value="ERC-4626 Vault" status="planned" />
            </div>
          </div>

          <div className="bg-morpho-bg-surface border border-morpho-bg-surface2 rounded p-8 flex flex-col h-full">
            <h3 className="text-sm font-mono text-morpho-text-tertiary mb-6 uppercase tracking-wider">Live Agent Telemetry</h3>

            <div className="space-y-6 flex-1">
              {lastAction ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-morpho-blue-DEFAULT animate-pulse"></span>
                    <span className="text-sm font-medium text-white">{lastAction.toUpperCase()}</span>
                    <span className="text-xs text-morpho-text-tertiary ml-auto">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-morpho-text-secondary font-mono bg-morpho-bg-main p-3 rounded border border-morpho-bg-surface2">
                    &gt; {narrative || "System initialized."}
                  </p>
                </div>
              ) : (
                <div className="text-center py-12 flex flex-col items-center justify-center h-full border border-dashed border-morpho-bg-surface2 rounded bg-morpho-bg-main/50">
                  <p className="text-morpho-text-tertiary font-mono text-sm mb-2">&lt; Waiting for heartbeat signal /&gt;</p>
                  {usdcBalance === 0 && (
                    <p className="text-xs text-morpho-red bg-morpho-red/10 px-2 py-1 rounded">Treasury Empty</p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-morpho-bg-surface2 flex justify-between items-center text-xs font-mono text-morpho-text-tertiary">
              <span>Agent ID: 0x29...771d</span>
              <span className="text-morpho-green">● Online</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

function StatCard({ label, value, sub, trend = 'neutral' }: { label: string, value: string, sub: string, trend?: 'positive' | 'negative' | 'neutral' }) {
  return (
    <div className="bg-morpho-bg-surface hover:bg-morpho-bg-surface2 transition-colors border border-morpho-bg-surface2 p-6 rounded group">
      <p className="text-sm text-morpho-text-tertiary font-medium mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <h3 className={`text-3xl font-semibold tracking-tight ${trend === 'positive' ? 'text-morpho-green' :
          trend === 'negative' ? 'text-morpho-red' : 'text-white'
          }`}>
          {value}
        </h3>
      </div>
      <p className="text-xs text-morpho-text-tertiary mt-2 group-hover:text-morpho-blue-light transition-colors">{sub}</p>
    </div>
  );
}

function ArchitectureItem({ label, value, status }: { label: string, value: string, status: 'active' | 'planned' }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-morpho-bg-surface2 last:border-0">
      <span className="text-morpho-text-secondary">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-white font-medium">{value}</span>
        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${status === 'active'
          ? 'bg-morpho-blue-dark/20 text-morpho-blue-DEFAULT border border-morpho-blue-dark/30'
          : 'bg-morpho-bg-surface2 text-morpho-text-tertiary'
          }`}>
          {status}
        </span>
      </div>
    </div>
  );
}
