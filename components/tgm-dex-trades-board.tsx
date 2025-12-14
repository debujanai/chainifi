"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, TrendingUp, TrendingDown, Loader, Wallet, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { TGMDexTradesData, TGMDexTradesResponse, TGMDexTradesFilters, TGMDexTradesSortField, fetchTGMDexTrades, DateRange } from "@/lib/nansen-api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

function formatUSD(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
}

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K`;
  }
  return value.toFixed(2);
}

interface DexTradesSection {
  section: string;
  count: number;
  items: TGMDexTradesData[];
}

function groupDexTrades(data: TGMDexTradesData[], by: "action" | "label" | "none"): DexTradesSection[] {
  if (by === "action") {
    const buying = data.filter((trade) => trade.action === "BUY");
    const selling = data.filter((trade) => trade.action === "SELL");
    const sections: DexTradesSection[] = [];
    if (buying.length > 0) {
      sections.push({ section: "Buying", count: buying.length, items: buying });
    }
    if (selling.length > 0) {
      sections.push({ section: "Selling", count: selling.length, items: selling });
    }
    return sections;
  } else if (by === "label") {
    const map: Record<string, TGMDexTradesData[]> = {};
    for (const trade of data) {
      const label = trade.trader_address_label || "Unknown";
      map[label] = map[label] || [];
      map[label].push(trade);
    }
    return Object.entries(map).map(([key, items]) => ({
      section: key,
      count: items.length,
      items,
    }));
  } else {
    return [
      {
        section: "All Trades",
        count: data.length,
        items: data,
      },
    ];
  }
}

export function TGMDexTradesBoard() {
  const [sections, setSections] = useState<DexTradesSection[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [groupBy, setGroupBy] = useState<"action" | "label" | "none">("none");

  // Filters/controls
  const [chain, setChain] = useState<string>("ethereum");
  const [tokenAddress, setTokenAddress] = useState<string>("");
  const [onlySmartMoney, setOnlySmartMoney] = useState<boolean>(false);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [sortBy, setSortBy] = useState<TGMDexTradesSortField>("block_timestamp");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");

  // Filter values
  const [actionFilter, setActionFilter] = useState<"BUY" | "SELL" | "ALL">("ALL");
  const [includeSmartMoneyLabels, setIncludeSmartMoneyLabels] = useState<Record<string, boolean>>({});
  const [estimatedValueUsdMin, setEstimatedValueUsdMin] = useState<string>("");
  const [estimatedValueUsdMax, setEstimatedValueUsdMax] = useState<string>("");
  const [tokenAmountMin, setTokenAmountMin] = useState<string>("");
  const [tokenAmountMax, setTokenAmountMax] = useState<string>("");

  const availableChains = ["ethereum", "solana", "base", "arbitrum", "polygon", "optimism", "bitcoin", "avalanche"];
  const availableSmartMoneyLabels = ["Whale", "Smart Trader", "Fund", "30D Smart Trader", "90D Smart Trader", "180D Smart Trader"];

  const sortFields: Array<{ value: TGMDexTradesSortField; label: string }> = [
    { value: "block_timestamp", label: "Timestamp" },
    { value: "estimated_value_usd", label: "Value USD" },
    { value: "token_amount", label: "Token Amount" },
    { value: "traded_token_amount", label: "Traded Token Amount" },
    { value: "estimated_swap_price_usd", label: "Swap Price" },
    { value: "trader_address", label: "Trader Address" },
    { value: "transaction_hash", label: "Transaction Hash" },
  ];

  async function load() {
    if (!tokenAddress.trim()) {
      setError("Please enter a token address");
      return;
    }

    // Default date range to last 7 days if not set
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dateRange: DateRange = from && to
      ? { from, to }
      : {
          from: sevenDaysAgo.toISOString().split('T')[0],
          to: now.toISOString().split('T')[0],
        };

    setLoading(true);
    setError(null);
    try {
      const filters: TGMDexTradesFilters = {};

      if (actionFilter !== "ALL") {
        filters.action = actionFilter;
      }

      const activeLabels = Object.entries(includeSmartMoneyLabels)
        .filter(([_, selected]) => selected)
        .map(([label]) => label);

      if (activeLabels.length > 0) {
        filters.include_smart_money_labels = activeLabels;
      }

      if (estimatedValueUsdMin || estimatedValueUsdMax) {
        filters.estimated_value_usd = {
          min: estimatedValueUsdMin ? Number(estimatedValueUsdMin) : undefined,
          max: estimatedValueUsdMax ? Number(estimatedValueUsdMax) : undefined,
        };
      }

      if (tokenAmountMin || tokenAmountMax) {
        filters.token_amount = {
          min: tokenAmountMin ? Number(tokenAmountMin) : undefined,
          max: tokenAmountMax ? Number(tokenAmountMax) : undefined,
        };
      }

      const sortByArray = [
        {
          field: sortBy,
          direction: sortDirection,
        },
      ];

      const resp: TGMDexTradesResponse = await fetchTGMDexTrades({
        chain: chain,
        tokenAddress: tokenAddress.trim(),
        onlySmartMoney: onlySmartMoney,
        date: dateRange,
        page: page,
        perPage: perPage,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        sortBy: sortByArray,
      });

      setSections(groupDexTrades(resp.data, groupBy));
    } catch (e: any) {
      setError(e?.message || "Failed to load DEX trades data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tokenAddress.trim()) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain, onlySmartMoney, page, perPage, sortBy, sortDirection, groupBy, from, to]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
              <span className="text-white font-normal">DEX Trades</span>
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
                  Group: {groupBy === "action" ? "By Action" : groupBy === "label" ? "By Label" : "None"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem]">
                <DropdownMenuItem onClick={() => setGroupBy("none")}>None</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("action")}>By Action</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("label")}>By Label</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal">
                  Sort: {sortFields.find((f) => f.value === sortBy)?.label || sortBy} {sortDirection === "DESC" ? "↓" : "↑"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem]">
                {sortFields.map((field) => (
                  <DropdownMenuItem
                    key={field.value}
                    onClick={() => {
                      if (sortBy === field.value) {
                        setSortDirection(sortDirection === "DESC" ? "ASC" : "DESC");
                      } else {
                        setSortBy(field.value);
                        setSortDirection("DESC");
                      }
                    }}
                  >
                    {field.label} {sortBy === field.value ? (sortDirection === "DESC" ? "↓" : "↑") : ""}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Token Address Input */}
        <div className="flex items-center gap-2 mb-2">
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
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="onlySmartMoney"
              checked={onlySmartMoney}
              onChange={(e) => setOnlySmartMoney(e.target.checked)}
              className="w-4 h-4 rounded border-[#20222f] bg-[#171a26] text-blue-500"
            />
            <label htmlFor="onlySmartMoney" className="text-xs text-gray-300">
              Smart Money Only
            </label>
          </div>
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

        {/* Date Range Inputs */}
        <div className="flex items-center gap-2">
          <Input
            type="date"
            placeholder="From date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-8 text-xs bg-[#141723] border-[#20222f] text-white"
          />
          <span className="text-xs text-gray-500">to</span>
          <Input
            type="date"
            placeholder="To date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-8 text-xs bg-[#141723] border-[#20222f] text-white"
          />
        </div>
      </div>

      {filterOpen && (
        <div className="px-4 py-4 border-b border-[#20222f] bg-[#1a1c29]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Action Filter */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Action</label>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 text-[10px] px-2 ${
                    actionFilter === "ALL"
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/50"
                      : "bg-[#171a26] text-gray-400 border border-[#20222f]"
                  }`}
                  onClick={() => setActionFilter("ALL")}
                >
                  ALL
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 text-[10px] px-2 ${
                    actionFilter === "BUY"
                      ? "bg-green-500/20 text-green-300 border border-green-500/50"
                      : "bg-[#171a26] text-gray-400 border border-[#20222f]"
                  }`}
                  onClick={() => setActionFilter("BUY")}
                >
                  BUY
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 text-[10px] px-2 ${
                    actionFilter === "SELL"
                      ? "bg-red-500/20 text-red-300 border border-red-500/50"
                      : "bg-[#171a26] text-gray-400 border border-[#20222f]"
                  }`}
                  onClick={() => setActionFilter("SELL")}
                >
                  SELL
                </Button>
              </div>
            </div>

            {/* Smart Money Labels */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Smart Money Labels</label>
              <div className="flex flex-wrap gap-2">
                {availableSmartMoneyLabels.map((label) => (
                  <Button
                    key={label}
                    variant="ghost"
                    size="sm"
                    className={`h-6 text-[10px] px-2 ${
                      includeSmartMoneyLabels[label]
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/50"
                        : "bg-[#171a26] text-gray-400 border border-[#20222f]"
                    }`}
                    onClick={() => setIncludeSmartMoneyLabels((prev) => ({ ...prev, [label]: !prev[label] }))}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Estimated Value USD */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Estimated Value USD</label>
              <div className="flex items-center gap-2">
                <Input
                  value={estimatedValueUsdMin}
                  onChange={(e) => setEstimatedValueUsdMin(e.target.value)}
                  placeholder="Min"
                  className="h-8 bg-[#171a26] border-[#20222f] text-sm text-gray-200 placeholder:text-gray-500"
                  onBlur={() => load()}
                />
                <Input
                  value={estimatedValueUsdMax}
                  onChange={(e) => setEstimatedValueUsdMax(e.target.value)}
                  placeholder="Max"
                  className="h-8 bg-[#171a26] border-[#20222f] text-sm text-gray-200 placeholder:text-gray-500"
                  onBlur={() => load()}
                />
              </div>
            </div>

            {/* Token Amount */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Token Amount</label>
              <div className="flex items-center gap-2">
                <Input
                  value={tokenAmountMin}
                  onChange={(e) => setTokenAmountMin(e.target.value)}
                  placeholder="Min"
                  className="h-8 bg-[#171a26] border-[#20222f] text-sm text-gray-200 placeholder:text-gray-500"
                  onBlur={() => load()}
                />
                <Input
                  value={tokenAmountMax}
                  onChange={(e) => setTokenAmountMax(e.target.value)}
                  placeholder="Max"
                  className="h-8 bg-[#171a26] border-[#20222f] text-sm text-gray-200 placeholder:text-gray-500"
                  onBlur={() => load()}
                />
              </div>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-gray-400 uppercase tracking-wide">Per Page:</label>
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
              className="h-8 px-2 bg-[#171a26] border border-[#20222f] text-xs text-gray-300 rounded"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
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
                    backgroundColor: section.section.toLowerCase() === "buying" ? "#22c55e" : 
                                     section.section.toLowerCase() === "selling" ? "#ef4444" : 
                                     "#3b82f6"
                  }}>
                    {section.section.toLowerCase() === "buying" ? (
                      <TrendingUp className="w-3 h-3 text-white" />
                    ) : section.section.toLowerCase() === "selling" ? (
                      <TrendingDown className="w-3 h-3 text-white" />
                    ) : (
                      <ArrowLeftRight className="w-3 h-3 text-white" />
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
                <div className="relative flex items-center gap-3 pr-3 pl-0 py-2 text-[10px] uppercase tracking-wide text-gray-500">
                  <div className="2xl:static 2xl:left-auto sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[380px] ml-0 pl-3 py-2 rounded-l">
                    <div className="h-6 w-6" />
                    <div className="min-w-[140px]">Timestamp</div>
                    <div className="min-w-[200px]">Trader</div>
                  </div>
                  <div className="flex items-center gap-4 ml-auto min-w-0">
                    <div className="min-w-[100px]">Action</div>
                    <div className="flex items-center gap-4">
                      <div className="min-w-[100px]">Token</div>
                      <div className="min-w-[100px]">Traded Token</div>
                    </div>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-[80px] text-right">Amount</div>
                      <div className="min-w-[80px] text-right">Traded Amount</div>
                      <div className="min-w-[80px] text-right">Value USD</div>
                    </div>
                  </div>
                </div>
                {section.items.map((trade, idx) => {
                  const isBuy = trade.action === "BUY";
                  
                  return (
                    <div
                      key={`${trade.transaction_hash}-${idx}`}
                      className="relative flex items-center gap-3 pr-3 pl-0 py-2.5 bg-[#171a26] border border-[#20222f] rounded hover:bg-[#1c1e2b] hover:border-[#272936] transition-colors group"
                    >
                      <div className="2xl:static 2xl:left-auto sticky left-0 z-10 bg-[#171a26] group-hover:bg-[#1c1e2b] flex items-center gap-2 min-w-[380px] pr-3 ml-0 pl-3 py-2.5 rounded-l">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </Button>
                        <div className="text-xs text-gray-300 font-medium min-w-[140px]">
                          {new Date(trade.block_timestamp).toLocaleString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                        <div className="min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <div className="font-mono text-xs text-gray-400">
                              {trade.trader_address.slice(0, 6)}...{trade.trader_address.slice(-4)}
                            </div>
                            <Badge
                              variant="secondary"
                              className="text-[10px] h-4 bg-gray-700/50 text-gray-300 border-0 px-1.5 rounded-full"
                            >
                              {trade.trader_address_label || "Unknown"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {/* Three dots menu */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </Button>

                      {/* Timestamp */}
                      <div className="text-xs text-gray-300 font-medium min-w-[140px]">
                        {new Date(trade.block_timestamp).toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>

                      {/* Trader */}
                      <div className="min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <div className="font-mono text-xs text-gray-400">
                            {trade.trader_address.slice(0, 6)}...{trade.trader_address.slice(-4)}
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-4 bg-gray-700/50 text-gray-300 border-0 px-1.5 rounded-full"
                          >
                            {trade.trader_address_label || "Unknown"}
                          </Badge>
                        </div>
                      </div>

                      {/* Right-aligned details */}
                      <div className="flex items-center gap-4 ml-auto min-w-0">
                        <div className="min-w-[100px]">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] h-5 border-0 px-2 rounded-full ${
                              isBuy ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                            }`}
                          >
                            {trade.action}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="min-w-[100px]">
                            <div className="text-xs font-medium text-gray-300">{trade.token_name}</div>
                          </div>
                          <div className="min-w-[100px]">
                            <div className="text-xs font-medium text-gray-300">{trade.traded_token_name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 min-w-0">
                          <div className="min-w-[80px] text-right">
                            <div className="text-gray-300 font-medium">{formatNumber(trade.token_amount)}</div>
                          </div>
                          <div className="min-w-[80px] text-right">
                            <div className="text-gray-300 font-medium">{formatNumber(trade.traded_token_amount)}</div>
                          </div>
                          <div className="min-w-[80px] text-right">
                            <div className="text-gray-300 font-semibold">{formatUSD(trade.estimated_value_usd)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {!loading && sections.length === 0 && !error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <div className="text-sm text-gray-400">Enter a token address to view DEX trades</div>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {sections.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#20222f]">
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
                  disabled={loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

