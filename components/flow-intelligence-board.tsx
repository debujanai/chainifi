"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, TrendingUp, TrendingDown, Loader, Wallet, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { FlowIntelligenceData, FlowIntelligenceResponse, fetchFlowIntelligence } from "@/lib/nansen-api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

function formatUSD(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

interface SegmentItem {
  name: string;
  netFlow: number;
  avgFlow: number;
  walletCount: number;
  icon: string;
  color: string;
}

export function FlowIntelligenceBoard() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FlowIntelligenceData | null>(null);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

  // Filters/controls
  const [chain, setChain] = useState<string>("ethereum");
  const [tokenAddress, setTokenAddress] = useState<string>("0x6982508145454ce325ddbe47a25d4ec3d2311933");
  const [timeframe, setTimeframe] = useState<"5m" | "1h" | "6h" | "12h" | "1d" | "7d">("1d");
  const [whaleWalletCountMin, setWhaleWalletCountMin] = useState<string>("");

  const availableChains = ["ethereum", "solana", "base", "arbitrum", "polygon", "optimism"];
  const timeframes: Array<{ value: "5m" | "1h" | "6h" | "12h" | "1d" | "7d"; label: string }> = [
    { value: "5m", label: "5 Minutes" },
    { value: "1h", label: "1 Hour" },
    { value: "6h", label: "6 Hours" },
    { value: "12h", label: "12 Hours" },
    { value: "1d", label: "1 Day" },
    { value: "7d", label: "7 Days" },
  ];

  async function load() {
    if (!tokenAddress.trim()) {
      setError("Please enter a token address");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const filters: any = {};
      if (whaleWalletCountMin) {
        filters.whale_wallet_count = {
          min: Number(whaleWalletCountMin),
        };
      }

      const resp: FlowIntelligenceResponse = await fetchFlowIntelligence({
        chain: chain,
        tokenAddress: tokenAddress.trim(),
        timeframe: timeframe,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      });

      if (resp.data && resp.data.length > 0) {
        setData(resp.data[0]);
      } else {
        setError("No data returned");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load flow intelligence data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tokenAddress.trim()) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain, timeframe]);

  const segments: SegmentItem[] = data
    ? [
        {
          name: "Whales",
          netFlow: data.whale_net_flow_usd,
          avgFlow: data.whale_avg_flow_usd,
          walletCount: data.whale_wallet_count,
          icon: "🐋",
          color: "purple",
        },
        {
          name: "Smart Traders",
          netFlow: data.smart_trader_net_flow_usd,
          avgFlow: data.smart_trader_avg_flow_usd,
          walletCount: data.smart_trader_wallet_count,
          icon: "🧠",
          color: "blue",
        },
        {
          name: "Exchanges",
          netFlow: data.exchange_net_flow_usd,
          avgFlow: data.exchange_avg_flow_usd,
          walletCount: data.exchange_wallet_count,
          icon: "🏦",
          color: "yellow",
        },
        {
          name: "Public Figures",
          netFlow: data.public_figure_net_flow_usd,
          avgFlow: data.public_figure_avg_flow_usd,
          walletCount: data.public_figure_wallet_count,
          icon: "⭐",
          color: "pink",
        },
        {
          name: "Top PnL",
          netFlow: data.top_pnl_net_flow_usd,
          avgFlow: data.top_pnl_avg_flow_usd,
          walletCount: data.top_pnl_wallet_count,
          icon: "📈",
          color: "green",
        },
        {
          name: "Fresh Wallets",
          netFlow: data.fresh_wallets_net_flow_usd,
          avgFlow: data.fresh_wallets_avg_flow_usd,
          walletCount: data.fresh_wallets_wallet_count,
          icon: "🆕",
          color: "cyan",
        },
      ]
    : [];

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
              <span className="text-white font-normal">Flow Intelligence</span>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <MoreHorizontal className="w-3 h-3 text-gray-400" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 text-xs font-normal ${filterOpen ? "bg-[#272936] text-white" : "bg-[#20222f] hover:bg-[#272936] text-gray-300"}`}
              onClick={() => setFilterOpen((v) => !v)}
            >
              Filters
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal">
                  Timeframe: {timeframes.find((t) => t.value === timeframe)?.label || timeframe}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem]">
                {timeframes.map((tf) => (
                  <DropdownMenuItem key={tf.value} onClick={() => setTimeframe(tf.value)}>
                    {tf.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Token Address Input */}
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Enter token address (0x...)"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            className="flex-1 h-8 text-xs bg-[#141723] border-[#20222f] text-white placeholder:text-gray-500"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal min-w-[100px]">
                {chain.charAt(0).toUpperCase() + chain.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
              {availableChains.map((c) => (
                <DropdownMenuItem key={c} onClick={() => { setChain(c); }}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-normal"
            onClick={load}
            disabled={loading}
          >
            {loading ? <Loader className="w-3 h-3 animate-spin" /> : "Load"}
          </Button>
        </div>
      </div>

      {filterOpen && (
        <div className="px-4 py-4 border-b border-[#20222f] bg-[#1a1c29]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Whale Wallet Count Filter */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Whale Wallet Count (Min)</label>
              <Input
                value={whaleWalletCountMin}
                onChange={(e) => setWhaleWalletCountMin(e.target.value)}
                placeholder="Min wallet count"
                className="h-8 bg-[#171a26] border-[#20222f] text-sm text-gray-200 placeholder:text-gray-500"
                onBlur={() => load()}
              />
            </div>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4">
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader className="w-4 h-4 text-blue-400 animate-spin" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-2 rounded bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 mb-3">
              <span className="text-[10px] text-red-300 font-normal">{error}</span>
            </div>
          )}

          {data && segments.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center bg-blue-500/20">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium text-white">Holder Segments</span>
                  <span className="text-xs text-gray-500">{segments.length}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-auto hover:bg-[#20222f]"
                  aria-label="Add"
                >
                  <Plus className="w-3 h-3 text-gray-400" />
                </Button>
              </div>

              <div className="space-y-1">
                {/* Header row to explain columns */}
                <div className="flex items-center gap-3 px-3 py-2 text-[10px] uppercase tracking-wide text-gray-500">
                  <div className="h-6 w-6" />
                  <div className="min-w-[150px]">Segment</div>
                  <div className="flex-1"></div>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-[100px] text-right">Net Flow</div>
                    <div className="min-w-[100px] text-right">Avg Flow</div>
                  </div>
                  <div className="min-w-[80px] text-right">Wallets</div>
                </div>
                {segments.map((segment, idx) => {
                  const isPositive = segment.netFlow >= 0;
                  
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 px-3 py-2.5 bg-[#171a26] border border-[#20222f] rounded hover:bg-[#1c1e2b] hover:border-[#272936] transition-colors group"
                    >
                      {/* Three dots menu */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </Button>

                      {/* Segment Icon and Name */}
                      <div className="flex items-center gap-2 min-w-[150px]">
                        <div className="text-lg">{segment.icon}</div>
                        <div className="text-sm text-white font-medium">{segment.name}</div>
                      </div>

                      {/* Spacer */}
                      <div className="flex-1"></div>

                      {/* Flow Values */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="text-right min-w-[100px]">
                          <div className="text-[10px] text-gray-500">Net Flow</div>
                          <div className={`text-xs font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                            {formatUSD(segment.netFlow)}
                          </div>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            {isPositive ? (
                              <TrendingUp className="w-3 h-3 text-green-400" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-red-400" />
                            )}
                            <span className={`text-[10px] ${isPositive ? "text-green-400" : "text-red-400"}`}>
                              {isPositive ? "Inflow" : "Outflow"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <div className="text-[10px] text-gray-500">Avg Flow</div>
                          <div className="text-xs font-medium text-gray-300">
                            {formatUSD(segment.avgFlow)}
                          </div>
                        </div>
                      </div>

                      {/* Wallet Count */}
                      <div className="flex items-center gap-2 min-w-[80px] justify-end">
                        <Users className="w-4 h-4 text-gray-400" />
                        <div className="text-right">
                          <div className="text-xs font-semibold text-gray-300">{segment.walletCount}</div>
                          <div className="text-[10px] text-gray-500">wallets</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && !data && !error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <div className="text-sm text-gray-400">Enter a token address to view flow intelligence</div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
