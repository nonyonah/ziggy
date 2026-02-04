'use client';

import { usePrivy as usePrivyOriginal } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';

// Default values for when Privy is not available
const DEFAULT_PRIVY_STATE = {
    login: () => {
        console.log('Privy not configured. Set NEXT_PUBLIC_PRIVY_APP_ID.');
    },
    logout: () => { },
    authenticated: false,
    ready: false,
    user: null as any, // Cast to any to avoid 'never' inference issue
};

// Safe wrapper for usePrivy that handles SSR and missing provider
export function usePrivy() {
    const [mounted, setMounted] = useState(false);

    // Always call hooks unconditionally
    let privyState = DEFAULT_PRIVY_STATE;
    let hasError = false;

    try {
        // Always call the hook - React requires consistent hook order
        const result = usePrivyOriginal();
        // @ts-ignore - complex type mismatch between safe wrapper and real hook
        privyState = result;
    } catch {
        hasError = true;
    }

    useEffect(() => {
        setMounted(true);
    }, []);

    // During SSR or before mount, return safe defaults
    if (!mounted || hasError) {
        return {
            ...DEFAULT_PRIVY_STATE,
            ready: hasError ? true : false, // If error, we're "ready" but not authenticated
        };
    }

    return privyState;
}
