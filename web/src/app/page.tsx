'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Box, Terminal, ExternalLink, RefreshCw } from "lucide-react";

interface FeedItem {
  timestamp: string;
  action: 'BUILD' | 'USE' | 'REPORT';
  details: string;
  txHash?: string;
}

export default function Home() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchFeed = async () => {
    try {
      // Add cache buster to prevent caching
      const res = await fetch('/feed.json?' + new Date().getTime());
      if (res.ok) {
        const data = await res.json();
        setFeed(data);
      }
    } catch (e) {
      console.error("Failed to fetch feed", e);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const stats = {
    totalActions: feed.length,
    contractsBuilt: feed.filter(i => i.action === 'BUILD').length,
    interactions: feed.filter(i => i.action === 'USE').length,
    reports: feed.filter(i => i.action === 'REPORT').length,
  };

  return (
    <main className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex justify-between items-center border-b border-zinc-800 pb-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              ZIGGY
            </h1>
            <p className="text-zinc-400">Autonomous OpenClaw Agent on Base</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-sm font-medium text-green-400">ONLINE</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Last scan: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            <Button variant="outline" size="icon" onClick={fetchFeed}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-200">Total Cycles</CardTitle>
              <Activity className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalActions}</div>
              <p className="text-xs text-zinc-500">Lifetime actions recorded</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-200">Built</CardTitle>
              <Box className="h-4 w-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.contractsBuilt}</div>
              <p className="text-xs text-zinc-500">Micro-apps deployed</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-200">Used</CardTitle>
              <Terminal className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.interactions}</div>
              <p className="text-xs text-zinc-500">Contract interactions</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-200">Reports</CardTitle>
              <Activity className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.reports}</div>
              <p className="text-xs text-zinc-500">Market observations</p>
            </CardContent>
          </Card>
        </div>

        {/* Live Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="bg-zinc-900 border-zinc-800 col-span-2 h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Terminal className="h-5 w-5" />
                Live Feed
              </CardTitle>
              <CardDescription className="text-zinc-500">Real-time decisions and onchain executions.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full px-6 pb-6">
                {loading ? (
                  <div className="space-y-4 pt-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full bg-zinc-800" />)}
                  </div>
                ) : feed.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-zinc-500">
                    Waiting for first cycle... (Check if agent is running)
                  </div>
                ) : (
                  <div className="space-y-6 pt-4">
                    {feed.map((item, idx) => (
                      <div key={idx} className="relative pl-8 pb-6 border-l border-zinc-800 last:pb-0">
                        <span className={`absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full ring-4 ring-zinc-900 ${item.action === 'BUILD' ? 'bg-indigo-500' :
                          item.action === 'USE' ? 'bg-green-500' : 'bg-blue-500'
                          }`} />
                        <div className="flex flex-col gap-1 -mt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-zinc-500 font-mono">
                              {new Date(item.timestamp).toLocaleString()}
                            </span>
                            <Badge variant="outline" className={`
                                border-0 bg-opacity-10
                                ${item.action === 'BUILD' ? 'bg-indigo-500 text-indigo-400' : ''}
                                ${item.action === 'USE' ? 'bg-green-500 text-green-400' : ''}
                                ${item.action === 'REPORT' ? 'bg-blue-500 text-blue-400' : ''}
                              `}>
                              {item.action}
                            </Badge>
                          </div>
                          <p className="text-zinc-300 mt-1 text-sm font-medium leading-relaxed">
                            {item.details}
                          </p>
                          {item.txHash && (
                            <a
                              href={`https://sepolia.basescan.org/tx/${item.txHash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mt-2 transition-colors w-fit"
                            >
                              View Onchain <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Sidebar / Identity */}
          <div className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Active Directives</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-1 bg-zinc-800 text-zinc-400">1</Badge>
                  <p className="text-sm text-zinc-300">Scan Base network for activity spikes.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-1 bg-zinc-800 text-zinc-400">2</Badge>
                  <p className="text-sm text-zinc-300">If New Contracts &gt; 10 → <span className="text-indigo-400 font-bold">BUILD</span> infra.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-1 bg-zinc-800 text-zinc-400">3</Badge>
                  <p className="text-sm text-zinc-300">If Volume Delta &gt; 5% → <span className="text-green-400 font-bold">USE</span> dapps.</p>
                </div>
                <Separator className="bg-zinc-800 my-4" />
                <div className="text-xs text-zinc-500">
                  Target: Base Sepolia<br />
                  Budget: 0.01 ETH / cycle
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </main>
  );
}
