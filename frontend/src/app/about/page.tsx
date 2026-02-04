import Link from 'next/link';

export default function AboutPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="mb-20">
                <h1 className="text-4xl md:text-5xl font-bold mb-8 text-white tracking-tight">
                    Optimizing Yield <span className="text-morpho-text-tertiary">Autonomously</span>
                </h1>

                <div className="space-y-6 text-lg text-morpho-text-secondary leading-relaxed font-light max-w-2xl">
                    <p>
                        Ziggy is an autonomous agent living on the Base blockchain. Unlike traditional yield aggregators controlled by humans or static smart contracts, Ziggy is an active participant in the economy.
                    </p>
                    <p>
                        Powered by the <span className="text-white font-medium">OpenClaw</span> framework, Ziggy constantly perceives market conditions, reasons about risk-adjusted returns, and executes transactions to maximize sustainable USDC growth.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-morpho-bg-surface2 pt-12">
                <div>
                    <h3 className="text-sm font-mono uppercase tracking-wider text-morpho-text-tertiary mb-6">Core Directive</h3>
                    <p className="text-xl text-white font-medium italic">
                        "Maximize sustainable USDC treasury growth through intelligent farming, compounding, migration, and primitive creation."
                    </p>
                </div>

                <div>
                    <h3 className="text-sm font-mono uppercase tracking-wider text-morpho-text-tertiary mb-6">Transparency</h3>
                    <ul className="space-y-4">
                        <ListItem text="All logic open source on GitHub" />
                        <ListItem text="Real-time on-chain logs" />
                        <ListItem text="Verifiable execution history" />
                    </ul>
                </div>
            </div>

            <div className="mt-16 bg-morpho-bg-surface border border-morpho-bg-surface2 rounded p-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h2 className="text-lg font-bold text-white mb-2">Verified Contracts</h2>
                        <p className="text-sm text-morpho-text-secondary">Explore the on-chain components powering Ziggy.</p>
                    </div>
                    <div className="flex gap-4">
                        <LinkButton href="https://basescan.org" text="BaseScan" />
                        <LinkButton href="https://github.com/nonyonah/ziggy" text="GitHub" />
                        <LinkButton href="https://twitter.com/ZiggyOnBase" text="Twitter" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ListItem({ text }: { text: string }) {
    return (
        <li className="flex items-center gap-3 text-morpho-text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-morpho-blue-DEFAULT"></span>
            {text}
        </li>
    );
}

function LinkButton({ href, text }: { href: string, text: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded border border-morpho-bg-surface2 text-morpho-text-secondary hover:text-white hover:bg-morpho-bg-surface2 transition-all text-sm font-medium"
        >
            {text}
        </a>
    );
}
