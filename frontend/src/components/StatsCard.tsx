import { ReactNode } from 'react';

interface StatsCardProps {
    label: string;
    value: string;
    subValue?: string;
    color?: 'primary' | 'secondary' | 'accent';
    icon?: ReactNode;
    delay?: number;
}

export default function StatsCard({ label, value, subValue, color = 'primary', icon, delay = 0 }: StatsCardProps) {
    const colorStyles = {
        primary: 'text-primary-glow border-primary/20 bg-primary/5',
        secondary: 'text-secondary-glow border-secondary/20 bg-secondary/5',
        accent: 'text-accent-glow border-accent/20 bg-accent/5',
    };

    return (
        <div
            className={`glass-card p-6 rounded-2xl border ${colorStyles[color]} hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden group`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">{label}</h3>
                {icon && <div className={`p-2 rounded-lg bg-white/5 text-${color}-glow`}>{icon}</div>}
            </div>

            <div className="relative z-10">
                <div className="text-3xl font-bold text-white mb-1 group-hover:animate-pulse-slow">
                    {value}
                </div>
                {subValue && (
                    <div className={`text-sm ${color === 'accent' ? 'text-green-400' : 'text-gray-400'}`}>
                        {subValue}
                    </div>
                )}
            </div>

            {/* Decorative Glow */}
            <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 bg-${color}-500 pointer-events-none group-hover:opacity-30 transition-opacity`}></div>
        </div>
    );
}
