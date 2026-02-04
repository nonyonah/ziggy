export default function VaultsPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-12">
                <h1 className="text-3xl font-bold mb-4 text-white hover:text-morpho-blue-DEFAULT transition-colors cursor-default">Vaults</h1>
                <p className="text-morpho-text-secondary max-w-2xl">
                    Automated yield strategies managed by Ziggy. Co-farm alongside the agent treasury.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Core Vault Card */}
                <div className="bg-morpho-bg-surface border border-morpho-bg-surface2 rounded p-6 relative group hover:border-morpho-blue-DEFAULT/30 transition-all">
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-morpho-green animate-pulse"></span>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-morpho-green">Active</span>
                    </div>

                    <div className="mb-8">
                        <div className="w-10 h-10 rounded bg-morpho-blue-dark/20 flex items-center justify-center text-xl mb-4 text-morpho-blue-DEFAULT border border-morpho-blue-dark/20">
                            🛸
                        </div>
                        <h3 className="text-lg font-bold text-white">Ziggy Core</h3>
                        <p className="text-sm text-morpho-text-tertiary">USDC Auto-Compounder</p>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-baseline border-b border-morpho-bg-surface2 pb-3">
                            <span className="text-sm text-morpho-text-secondary">Net APY</span>
                            <span className="text-2xl font-medium text-white">14.2%</span>
                        </div>
                        <div className="flex justify-between items-end pb-1">
                            <span className="text-sm text-morpho-text-secondary">Total Value Locked</span>
                            <span className="font-mono text-white text-sm">$450,203</span>
                        </div>
                    </div>

                    <button disabled className="w-full py-3 rounded bg-morpho-bg-surface2 text-morpho-text-tertiary cursor-not-allowed font-medium text-sm border border-transparent hover:border-morpho-text-tertiary/20 transition-all">
                        Coming Soon
                    </button>
                    <p className="text-[10px] text-center text-morpho-text-tertiary mt-3 font-mono">
                        Unlocks at +50% treasury growth
                    </p>
                </div>

                {/* Coming Soon Card */}
                <div className="bg-morpho-bg-surface border border-morpho-bg-surface2 rounded p-6 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
                    <div className="absolute top-4 right-4">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-morpho-text-tertiary border border-morpho-bg-surface2 px-2 py-1 rounded">Dev</span>
                    </div>

                    <div className="mb-8">
                        <div className="w-10 h-10 rounded bg-morpho-bg-surface2 flex items-center justify-center text-xl mb-4 text-morpho-text-secondary">
                            ⚡
                        </div>
                        <h3 className="text-lg font-bold text-morpho-text-secondary">Ziggy Degen</h3>
                        <p className="text-sm text-morpho-text-tertiary">High Risk Strategy</p>
                    </div>

                    <div className="h-32 flex items-center justify-center text-morpho-text-tertiary bg-morpho-bg-main/50 rounded mb-6 border border-dashed border-morpho-bg-surface2 text-xs font-mono uppercase tracking-widest">
                        In Development
                    </div>

                    <button disabled className="w-full py-3 rounded bg-morpho-bg-surface2 text-morpho-text-tertiary cursor-not-allowed text-sm font-medium">
                        Locked
                    </button>
                </div>
            </div>
        </div>
    );
}
