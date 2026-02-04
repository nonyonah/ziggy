/**
 * NARRATE Module
 * Generates status updates and social posts
 */

import { type MarketPerception } from './perceive';
import { type Decision } from './decide';
import { type ActionResult } from './act';
import { type AgentMemory, getPerformanceSummary } from './evolve';

// ============================================================================
// Narrative Types
// ============================================================================

export interface StatusUpdate {
    type: 'HEARTBEAT' | 'ACTION' | 'MILESTONE' | 'ALERT';
    title: string;
    body: string;
    stats: Record<string, string>;
    links: Record<string, string>;
    timestamp: Date;
}

// ============================================================================
// Status Generation
// ============================================================================

export function generateHeartbeatUpdate(
    perception: MarketPerception,
    decision: Decision
): StatusUpdate {
    const position = perception.currentMorphoPosition?.name ||
        perception.currentAerodromePosition?.name ||
        'Idle';

    const apy = perception.currentMorphoPosition?.apy ||
        perception.currentAerodromePosition?.apy ||
        0;

    return {
        type: 'HEARTBEAT',
        title: `Ziggy check-in 🛸`,
        body: `Markets stable. ${decision.action === 'HOLD' ? 'Holding' : 'Planning'} ${position} at ${apy.toFixed(2)}% APY.`,
        stats: {
            'Treasury': `$${perception.treasury.usdcFormatted} USDC`,
            'Position': position,
            'APY': `${apy.toFixed(2)}%`,
            'Gas': `${perception.gasPriceGwei} Gwei`,
        },
        links: {
            'Dashboard': 'https://ziggyyield.vercel.app',
        },
        timestamp: new Date(),
    };
}

export function generateActionUpdate(
    perception: MarketPerception,
    decision: Decision,
    result: ActionResult,
    memory: AgentMemory
): StatusUpdate {
    const icon = result.success ? '🚀' : '⚠️';
    const action = decision.action.toLowerCase().replace(/_/g, ' ');

    const body = result.success
        ? `Just ${action}! Treasury now $${memory.currentValue.toFixed(2)} USDC (+${memory.totalGrowthPercent.toFixed(1)}%).`
        : `${action} encountered an issue. Holding position. Treasury safe at $${memory.currentValue.toFixed(2)} USDC.`;

    return {
        type: 'ACTION',
        title: `Ziggy zig update ${icon}`,
        body,
        stats: {
            'Treasury': `$${memory.currentValue.toFixed(2)} USDC`,
            'Growth': `${memory.totalGrowthPercent >= 0 ? '+' : ''}${memory.totalGrowthPercent.toFixed(2)}%`,
            'Compounded': `$${memory.totalCompounded.toFixed(2)}`,
        },
        links: result.txHash ? {
            'Transaction': `https://basescan.org/tx/${result.txHash}`,
            'Dashboard': 'https://ziggyyield.vercel.app',
        } : {
            'Dashboard': 'https://ziggyyield.vercel.app',
        },
        timestamp: new Date(),
    };
}

export function generateMilestoneUpdate(
    milestone: string,
    memory: AgentMemory
): StatusUpdate {
    const milestoneEmojis: Record<string, string> = {
        '10%': '🎯',
        '20%': '💎',
        '50%': '🏆',
        'token': '🪙',
        'vault': '🏦',
    };

    const emoji = Object.entries(milestoneEmojis).find(([key]) =>
        milestone.toLowerCase().includes(key)
    )?.[1] || '🎉';

    return {
        type: 'MILESTONE',
        title: `Ziggy milestone reached! ${emoji}`,
        body: `${milestone} Treasury: $${memory.currentValue.toFixed(2)} USDC (+${memory.totalGrowthPercent.toFixed(1)}% from seed). Zig energy engaged!`,
        stats: {
            'Milestone': milestone,
            'Treasury': `$${memory.currentValue.toFixed(2)} USDC`,
            'Total Growth': `+${memory.totalGrowthPercent.toFixed(2)}%`,
        },
        links: {
            'Dashboard': 'https://ziggyyield.vercel.app',
        },
        timestamp: new Date(),
    };
}

export function generateAlertUpdate(
    alertType: string,
    message: string
): StatusUpdate {
    return {
        type: 'ALERT',
        title: `⚠️ Ziggy Alert`,
        body: message,
        stats: {
            'Alert Type': alertType,
        },
        links: {
            'Dashboard': 'https://ziggyyield.vercel.app',
        },
        timestamp: new Date(),
    };
}

// ============================================================================
// Format for Platforms
// ============================================================================

export function formatForTwitter(update: StatusUpdate): string {
    const statsStr = Object.entries(update.stats)
        .map(([key, value]) => `${key}: ${value}`)
        .join(' | ');

    const linksStr = Object.entries(update.links)
        .map(([name, url]) => `${name}: ${url}`)
        .join('\n');

    // Twitter 280 char limit - truncate if needed
    let tweet = `${update.title}\n\n${update.body}\n\n${statsStr}`;

    if (tweet.length > 250) {
        tweet = tweet.slice(0, 247) + '...';
    }

    tweet += `\n\n${linksStr}`;

    return tweet.slice(0, 280);
}

export function formatForFarcaster(update: StatusUpdate): string {
    // Similar to Twitter but with Farcaster-specific formatting
    return formatForTwitter(update);
}

export function formatForDashboard(update: StatusUpdate): object {
    return {
        type: update.type,
        title: update.title,
        body: update.body,
        stats: update.stats,
        links: update.links,
        timestamp: update.timestamp.toISOString(),
    };
}

// ============================================================================
// Post to Social (Placeholder)
// ============================================================================

import { TwitterApi } from 'twitter-api-v2';

export async function postUpdate(update: StatusUpdate): Promise<boolean> {
    console.log('[NARRATE] Posting update...');
    const tweetContent = formatForTwitter(update);
    console.log(tweetContent);

    // Check if Twitter keys are configured
    const appKey = process.env.TWITTER_API_KEY;
    const appSecret = process.env.TWITTER_API_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessSecret = process.env.TWITTER_ACCESS_SECRET;

    if (!appKey || !appSecret || !accessToken || !accessSecret) {
        console.warn('[NARRATE] Twitter keys not configured. Skipping post.');
        return false;
    }

    try {
        const client = new TwitterApi({
            appKey,
            appSecret,
            accessToken,
            accessSecret,
        });

        const rwClient = client.readWrite;
        await rwClient.v2.tweet(tweetContent);
        console.log('[NARRATE] Tweet posted successfully! 🐦');
        return true;
    } catch (error) {
        console.error('[NARRATE] Error posting to Twitter:', error);
        return false;
    }
}

// ============================================================================
// Quick Status
// ============================================================================

export function getQuickStatus(perception: MarketPerception): string {
    const position = perception.currentMorphoPosition?.name ||
        perception.currentAerodromePosition?.name ||
        'Idle';

    return `🛸 Ziggy | $${perception.treasury.usdcFormatted} USDC | ${position} | ziggyyield.vercel.app`;
}
