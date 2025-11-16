"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, Calendar, Users as UsersIcon, ArrowRight, Loader, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DexTrade, DexTradesResponse, fetchDexTrades } from "@/lib/nansen-api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface TradeSection {
  section: string; // chain name or label
  count: number;
  items: DexTrade[];
}

function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    const day = d.getDate();
    const month = d.toLocaleDateString(undefined, { month: "short" });
    const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
    return `${day} ${month} · ${time}`;
  } catch {
    return ts;
  }
}

function formatUSD(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function formatMarketCap(value: number): string {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(2)}B`;
  } else if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  return `$${value.toFixed(0)}`;
}

function groupTrades(trades: DexTrade[], by: "chain" | "label"): TradeSection[] {
  const map: Record<string, DexTrade[]> = {};
  for (const t of trades) {
    const key = by === "chain" ? t.chain : (t.trader_address_label || "Smart Money");
    map[key] = map[key] || [];
    map[key].push(t);
  }

  return Object.entries(map).map(([key, items]) => ({
    section: key.charAt(0).toUpperCase() + key.slice(1),
    count: items.length,
    items,
  }));
}

export function DexTradesBoard() {
  const [sections, setSections] = useState<TradeSection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [allTrades, setAllTrades] = useState<DexTrade[]>([]);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [groupBy, setGroupBy] = useState<"chain" | "label">("chain");
  const [selectedChains, setSelectedChains] = useState<Record<string, boolean>>({ ethereum: true, solana: true });
  const [includeLabels, setIncludeLabels] = useState<Record<string, boolean>>({ Fund: true, "Smart Trader": true });
  const [minValue, setMinValue] = useState<string>("");
  const [maxValue, setMaxValue] = useState<string>("");
  const [minTokenAge, setMinTokenAge] = useState<string>("");
  const [maxTokenAge, setMaxTokenAge] = useState<string>("");
  const [sortBy, setSortBy] = useState<"timestamp" | "value">("timestamp");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    
    (async () => {
      try {
        const activeChains = Object.entries(selectedChains)
          .filter(([_, selected]) => selected)
          .map(([chain]) => chain);
        
        const activeLabels = Object.entries(includeLabels)
          .filter(([_, included]) => included)
          .map(([label]) => label);

        const tradeValueFilter = (minValue || maxValue) 
          ? { min: minValue ? Number(minValue) : undefined, max: maxValue ? Number(maxValue) : undefined }
          : undefined;
        
        const tokenAgeFilter = (minTokenAge || maxTokenAge)
          ? { min: minTokenAge ? Number(minTokenAge) : undefined, max: maxTokenAge ? Number(maxTokenAge) : undefined }
          : undefined;

        const orderBy = sortBy === "timestamp" 
          ? [{ field: "block_timestamp", direction: "DESC" as const }]
          : [{ field: "trade_value_usd", direction: "DESC" as const }];

        const res: DexTradesResponse = await fetchDexTrades(
          activeChains.length > 0 ? activeChains : ["ethereum", "solana"],
          {
            includeSmartMoneyLabels: activeLabels.length > 0 ? activeLabels : ["Fund", "Smart Trader"],
            tradeValueUsd: tradeValueFilter,
            tokenBoughtAgeDays: tokenAgeFilter,
            perPage: 100,
            sortBy: orderBy,
          }
        );
        
        if (!mounted) return;
        setAllTrades(res.data);
        setSections(groupTrades(res.data, groupBy));
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load trades");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    
    return () => {
      mounted = false;
    };
  }, [selectedChains, includeLabels, minValue, maxValue, minTokenAge, maxTokenAge, sortBy, groupBy]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
              <span className="text-white font-normal">Smart Money DEX Trades</span>
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
                  Sort: {sortBy === "timestamp" ? "Time" : "Value"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem]">
                <DropdownMenuItem onClick={() => setSortBy("timestamp")}>Sort by Time</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("value")}>Sort by Value</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal">
                  Group: {groupBy === "chain" ? "Chain" : "Label"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem]">
                <DropdownMenuItem onClick={() => setGroupBy("chain")}>Group by Chain</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("label")}>Group by Label</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {filterOpen && (
        <div className="px-4 py-4 border-b border-[#20222f] bg-[#1a1c29]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Chains */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Chains</label>
              <div className="flex flex-wrap gap-1.5">
                {["ethereum", "solana"].map((chain) => (
                  <Button
                    key={chain}
                    variant={selectedChains[chain] ? "secondary" : "outline"}
                    size="sm"
                    className={`h-7 text-xs ${selectedChains[chain] ? "bg-blue-500/20 border-blue-500/50 text-blue-300" : "border-[#20222f] text-gray-400 hover:bg-[#20222f]"}`}
                    onClick={() => setSelectedChains((prev) => ({ ...prev, [chain]: !prev[chain] }))}
                  >
                    {chain.charAt(0).toUpperCase() + chain.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Labels */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Labels</label>
              <div className="flex flex-wrap gap-1.5">
                {["Fund", "Smart Trader"].map((label) => (
                  <Button
                    key={label}
                    variant={includeLabels[label] ? "secondary" : "outline"}
                    size="sm"
                    className={`h-7 text-xs ${includeLabels[label] ? "bg-purple-500/20 border-purple-500/50 text-purple-300" : "border-[#20222f] text-gray-400 hover:bg-[#20222f]"}`}
                    onClick={() => setIncludeLabels((prev) => ({ ...prev, [label]: !prev[label] }))}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Trade Value */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Trade Value (USD)</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
                />
              </div>
            </div>

            {/* Token Age */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Token Age (days)</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minTokenAge}
                  onChange={(e) => setMinTokenAge(e.target.value)}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxTokenAge}
                  onChange={(e) => setMaxTokenAge(e.target.value)}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
                />
              </div>
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

          {sections.map((section) => (
            <div key={section.section} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{
                    backgroundColor: section.section.toLowerCase() === "solana" ? "#14b8a6" : 
                                     section.section.toLowerCase() === "ethereum" ? "#627EEA" :
                                     "#eab308"
                  }}>
                    {section.section.toLowerCase() === "solana" ? (
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                    ) : section.section.toLowerCase() === "ethereum" ? (
                      <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                    ) : (
                      <TrendingUp className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-white">{section.section}</span>
                  <span className="text-xs text-gray-500">{section.count}</span>
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
                  <div className="min-w-[100px]">Tx Hash</div>
                  <div className="flex-1">Pair</div>
                  <div className="min-w-[120px]">Label</div>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-[100px] text-right">Value USD</div>
                    <div className="min-w-[120px] text-right">Bought</div>
                    <div className="min-w-[120px] text-right">Sold</div>
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-[80px]">Age (b/s)</div>
                    <div className="min-w-[100px]">Mcaps (b/s)</div>
                    <div className="min-w-[100px]">Time</div>
                  </div>
                </div>
                {section.items.map((item, idx) => {
                  const isHighValue = item.trade_value_usd >= 5000;
                  
                  return (
                    <div
                      key={`${item.transaction_hash}-${idx}`}
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

                      {/* Transaction Hash (like Symbol) */}
                      <div className="font-mono text-xs text-gray-400 min-w-[100px]">
                        {item.transaction_hash.slice(0, 6)}...{item.transaction_hash.slice(-4)}
                      </div>

                      {/* Pair and Addresses (stack B above S next to pair) */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <div className="text-sm text-white font-medium flex items-center gap-1.5">
                            <span>{item.token_bought_symbol}</span>
                            <ArrowRight className="w-3 h-3 text-gray-500" />
                            <span>{item.token_sold_symbol}</span>
                            {groupBy !== "chain" && (
                              <span className="ml-2 text-xs text-gray-500">
                                {item.chain.charAt(0).toUpperCase() + item.chain.slice(1)}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col leading-tight">
                            <div className="font-mono text-[10px] text-gray-500">
                              B: {item.token_bought_address.slice(0, 4)}...{item.token_bought_address.slice(-3)}
                            </div>
                            <div className="font-mono text-[10px] text-gray-500">
                              S: {item.token_sold_address.slice(0, 4)}...{item.token_sold_address.slice(-3)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Label (like Tags) */}
                      <div className="flex items-center gap-1.5 flex-wrap min-w-[120px]">
                        {item.trader_address_label && (
                          <Badge 
                            variant="secondary" 
                            className="text-[10px] h-5 bg-gray-700/50 text-gray-300 border-0 px-2 rounded-full flex items-center gap-1"
                          >
                            {item.trader_address_label.toLowerCase().includes("fund") ? (
                              <UsersIcon className="w-3 h-3" />
                            ) : (
                              <Zap className="w-3 h-3" />
                            )}
                            <span className="truncate max-w-[80px]">{item.trader_address_label}</span>
                          </Badge>
                        )}
                      </div>

                      {/* Value and Amounts */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="text-right min-w-[100px]">
                          <div className={`text-xs font-semibold ${isHighValue ? "text-yellow-400" : "text-gray-300"}`}>
                            {formatUSD(item.trade_value_usd)}
                          </div>
                        </div>
                        <div className="text-right min-w-[120px]">
                          <div className="text-xs font-medium text-gray-300">
                            {item.token_bought_amount.toFixed(4)} {item.token_bought_symbol}
                          </div>
                        </div>
                        <div className="text-right min-w-[120px]">
                          <div className="text-xs font-medium text-gray-300">
                            {item.token_sold_amount.toFixed(4)} {item.token_sold_symbol}
                          </div>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="flex items-center gap-3 text-xs text-gray-400 min-w-0">
                        <div className="min-w-[80px]">
                          <div className="text-gray-300">
                            {item.token_bought_age_days}d / {item.token_sold_age_days}d
                          </div>
                        </div>
                        <div className="min-w-[100px]">
                          <div className="text-gray-300 leading-tight">
                            {formatMarketCap(item.token_bought_market_cap)} / {formatMarketCap(item.token_sold_market_cap)}
                          </div>
                        </div>
                        <div className="min-w-[100px]">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-orange-500" />
                            <span className="text-gray-300">{formatTime(item.block_timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
