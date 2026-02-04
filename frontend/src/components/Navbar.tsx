'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePrivy } from '@/hooks/useAuth';
import { useState } from 'react';

export default function Navbar() {
    const pathname = usePathname();
    const { login, logout, authenticated, user } = usePrivy();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navLinks = [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Vaults', path: '/vaults' },
        { name: 'About', path: '/about' },
    ];

    const address = user?.wallet?.address;
    const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-morpho-bg-main/90 backdrop-blur-md border-b border-morpho-bg-surface2">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                        <Link href="/" className="text-xl font-bold text-white tracking-tight flex items-center gap-2 group">
                            <span className="w-8 h-8 bg-morpho-blue-DEFAULT rounded-sm flex items-center justify-center text-white text-lg font-mono group-hover:bg-morpho-blue-dark transition-colors">Z</span>
                            Ziggy
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.path}
                                    className={`text-sm font-medium transition-colors ${pathname === link.path
                                        ? 'text-white'
                                        : 'text-morpho-text-secondary hover:text-white'
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Wallet Button */}
                    <div className="hidden md:block">
                        {authenticated ? (
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-mono text-morpho-text-secondary bg-morpho-bg-surface px-3 py-1.5 rounded">{shortAddress}</span>
                                <button
                                    onClick={logout}
                                    className="text-sm text-morpho-text-tertiary hover:text-white transition-colors"
                                >
                                    Disconnect
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={login}
                                className="px-5 py-2.5 rounded bg-morpho-blue-DEFAULT hover:bg-morpho-blue-dark text-white text-sm font-medium transition-all"
                            >
                                Connect Wallet
                            </button>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-morpho-text-secondary hover:text-white p-2"
                        >
                            <span className="sr-only">Open menu</span>
                            {isMobileMenuOpen ? (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-morpho-bg-main border-t border-morpho-bg-surface2">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.path}
                                className={`block px-3 py-4 text-base font-medium border-b border-morpho-bg-surface2 last:border-0 ${pathname === link.path
                                    ? 'text-white'
                                    : 'text-morpho-text-secondary hover:text-white'
                                    }`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="pt-4 pb-4 px-3">
                            {authenticated ? (
                                <div className="space-y-4">
                                    <div className="text-sm font-mono text-morpho-text-secondary">{shortAddress}</div>
                                    <button
                                        onClick={logout}
                                        className="w-full text-left font-medium text-morpho-text-tertiary hover:text-white"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={login}
                                    className="w-full text-center px-4 py-3 rounded bg-morpho-blue-DEFAULT hover:bg-morpho-blue-dark text-white font-medium"
                                >
                                    Connect Wallet
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
