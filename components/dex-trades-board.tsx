"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, Filter, Loader, ArrowRight, Calendar, TrendingUp, Zap, Users as UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DexTrade, DexTradesResponse, fetchDexTrades } from "@/lib/nansen-api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface TradeSection {
  section: string;
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
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatMarketCap(value: number): string {
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(2)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
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
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(50);
  const [isLastPage, setIsLastPage] = useState<boolean>(true);

  // Filters
  const [groupBy, setGroupBy] = useState<"chain" | "label">("chain");
  const [selectedChains, setSelectedChains] = useState<Record<string, boolean>>({ ethereum: true, solana: true });
  const [includeLabels, setIncludeLabels] = useState<Record<string, boolean>>({ Fund: true, "Smart Trader": true });
  const [minValue, setMinValue] = useState<string>("");
  const [maxValue, setMaxValue] = useState<string>("");
  const [minTokenAge, setMinTokenAge] = useState<string>("");
  const [maxTokenAge, setMaxTokenAge] = useState<string>("");
  const [sortBy, setSortBy] = useState<"timestamp" | "value">("timestamp");

  async function load() {
    setLoading(true);
    setError(null);
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
          page,
          perPage,
          sortBy: orderBy,
        }
      );

      setSections(groupTrades(res.data, groupBy));
      setIsLastPage(res.pagination?.is_last_page ?? true);
    } catch (e: any) {
      setError(e?.message || "Failed to load trades");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChains, includeLabels, minValue, maxValue, minTokenAge, maxTokenAge, sortBy, groupBy, page, perPage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") load();
  };

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        {/* Title Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
            <span className="text-white font-normal text-sm">Smart Money DEX Trades</span>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <MoreHorizontal className="w-3 h-3 text-gray-400" />
            </Button>
          </div>
        </div>

        {/* Controls Container */}
        <div className="flex flex-col gap-3">
          {/* Top Row: Chain Toggles & Actions */}
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
            {/* Chain Toggle Container */}
            <div className="flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5">
              {["ethereum", "solana"].map((chain) => (
                <Button
                  key={chain}
                  variant="ghost"
                  size="sm"
                  className={`h-7 text-[10px] px-3 rounded-sm ${selectedChains[chain] ? "bg-[#20222f] text-gray-200 shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
                  onClick={() => setSelectedChains((prev) => ({ ...prev, [chain]: !prev[chain] }))}
                >
                  {chain.charAt(0).toUpperCase() + chain.slice(1)}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-normal border border-blue-500/20"
                onClick={load}
                disabled={loading}
              >
                {loading ? <Loader className="w-3 h-3 animate-spin" /> : "Refresh"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="lg:hidden h-8 px-3 text-xs border-[#20222f] bg-[#171a26] text-gray-300"
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <Filter className="w-3 h-3 mr-2" />
                Filters
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-400 hover:text-gray-200">
                    Sort: {sortBy === "timestamp" ? "Time" : "Value"} ↓
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[10rem]">
                  <DropdownMenuItem onClick={() => setSortBy("timestamp")}>Sort by Time</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("value")}>Sort by Value</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-400 hover:text-gray-200">
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

          {/* Filter Grid - 12 column layout */}
          <div className={`${filterOpen ? 'grid' : 'hidden'} lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3`}>
            {/* Include Labels */}
            <div className="lg:col-span-3">
              <div className="flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5">
                {["Fund", "Smart Trader"].map((label) => (
                  <Button
                    key={label}
                    variant="ghost"
                    size="sm"
                    className={`h-7 text-[10px] px-3 rounded-sm flex-1 ${includeLabels[label] ? "bg-[#20222f] text-gray-200 shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
                    onClick={() => setIncludeLabels((prev) => ({ ...prev, [label]: !prev[label] }))}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Value Range */}
            <div className="lg:col-span-3">
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  placeholder="Min USD"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
                />
                <span className="text-xs text-gray-500">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
                />
              </div>
            </div>

            {/* Token Age Range */}
            <div className="lg:col-span-3">
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  placeholder="Min Age"
                  value={minTokenAge}
                  onChange={(e) => setMinTokenAge(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
                />
                <span className="text-xs text-gray-500">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxTokenAge}
                  onChange={(e) => setMaxTokenAge(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-4 pr-4 pl-0">
          <div className="min-w-full">
            {loading && (
              <div className="flex items-center justify-center py-6 ml-4">
                <Loader className="w-4 h-4 text-blue-400 animate-spin" />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-2 rounded bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 mb-3 ml-4">
                <span className="text-[10px] text-red-300 font-normal">{error}</span>
              </div>
            )}

            {!loading && sections.map((section) => (
              <div key={section.section} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="sticky left-0 z-10 bg-[#141723] pl-4 pr-3 py-2 rounded-l flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${section.section.toLowerCase() === "solana" ? "bg-[#14b8a6]" :
                      section.section.toLowerCase() === "ethereum" ? "bg-[#627EEA]" :
                        "bg-[#eab308]"
                      }`} />
                    <span className="text-sm font-medium text-white">{section.section}</span>
                    <span className="text-xs text-gray-500">{section.count}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto hover:bg-[#20222f]">
                    <Plus className="w-3 h-3 text-gray-400" />
                  </Button>
                </div>

                <div className="space-y-1">
                  {/* Header Row */}
                  <div className="flex items-stretch text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap">
                    <div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[160px] py-2 pl-7 pr-3 rounded-l border-y border-l border-transparent">
                      <div className="h-6 w-6" />
                      <div className="min-w-[100px]">Pair</div>
                    </div>
                    <div className="flex-1 flex items-center justify-end min-w-0 gap-0 py-2 pr-3 border-y border-r border-transparent">
                      <div className="w-[100px] text-center">Label</div>
                      <div className="w-[100px] text-center">Value USD</div>
                      <div className="w-[120px] text-center">Bought</div>
                      <div className="w-[120px] text-center">Sold</div>
                      <div className="w-[80px] text-center">Age</div>
                      <div className="w-[100px] text-center">MCaps</div>
                      <div className="w-[120px] text-center">Time</div>
                    </div>
                  </div>

                  {section.items.map((item, idx) => {
                    const isHighValue = item.trade_value_usd >= 5000;

                    return (
                      <div
                        key={`${item.transaction_hash}-${idx}`}
                        className="flex items-stretch group whitespace-nowrap"
                      >
                        {/* Sticky Column - Pair */}
                        <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                          <div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-2 min-w-[160px] ml-0 pl-3 py-2.5 rounded-l transition-colors duration-150">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="w-4 h-4 text-gray-400" />
                            </Button>
                            <div className="text-xs text-blue-300 font-medium flex items-center gap-1.5">
                              <span>{item.token_bought_symbol}</span>
                              <ArrowRight className="w-3 h-3 text-gray-500" />
                              <span>{item.token_sold_symbol}</span>
                            </div>
                          </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 flex items-center justify-end min-w-0 gap-0 pr-3 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors duration-150">
                          {/* Label */}
                          <div className="w-[100px] flex justify-center">
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
                                <span className="truncate max-w-[60px]">{item.trader_address_label}</span>
                              </Badge>
                            )}
                          </div>

                          {/* Value USD */}
                          <div className="w-[100px] flex justify-center">
                            <span className={`text-xs font-semibold ${isHighValue ? "text-yellow-400" : "text-white"}`}>
                              {formatUSD(item.trade_value_usd)}
                            </span>
                          </div>

                          {/* Bought */}
                          <div className="w-[120px] flex justify-center">
                            <span className="text-xs text-green-400">
                              {item.token_bought_amount.toFixed(4)} {item.token_bought_symbol}
                            </span>
                          </div>

                          {/* Sold */}
                          <div className="w-[120px] flex justify-center">
                            <span className="text-xs text-red-400">
                              {item.token_sold_amount.toFixed(4)} {item.token_sold_symbol}
                            </span>
                          </div>

                          {/* Age */}
                          <div className="w-[80px] flex justify-center">
                            <span className="text-xs text-gray-400">
                              {item.token_bought_age_days}d / {item.token_sold_age_days}d
                            </span>
                          </div>

                          {/* MCaps */}
                          <div className="w-[100px] flex justify-center">
                            <span className="text-xs text-blue-300/80">
                              {formatMarketCap(item.token_bought_market_cap)}
                            </span>
                          </div>

                          {/* Time */}
                          <div className="w-[120px] flex justify-center">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-orange-500" />
                              <span className="text-xs text-gray-300">{formatTime(item.block_timestamp)}</span>
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
        </div>
      </ScrollArea>

      {/* Pagination Controls */}
      {!loading && sections.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#20222f] bg-[#141723]">
          <div className="text-xs text-gray-400">
            Page {page}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal"
              onClick={() => setPage((p) => p + 1)}
              disabled={isLastPage || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
