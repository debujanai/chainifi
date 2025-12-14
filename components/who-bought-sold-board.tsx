"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, TrendingUp, TrendingDown, Loader, Wallet, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { WhoBoughtSoldData, WhoBoughtSoldResponse, TGMWhoBoughtSoldFilters, TGMWhoBoughtSoldSortField, fetchWhoBoughtSold, DateRange } from "@/lib/nansen-api";
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

interface WhoBoughtSoldSection {
  section: string;
  count: number;
  items: WhoBoughtSoldData[];
}

function groupWhoBoughtSold(data: WhoBoughtSoldData[], by: "label" | "none"): WhoBoughtSoldSection[] {
  if (by === "label") {
    const map: Record<string, WhoBoughtSoldData[]> = {};
    for (const item of data) {
      const label = item.address_label || "Unknown";
      map[label] = map[label] || [];
      map[label].push(item);
    }
    return Object.entries(map).map(([key, items]) => ({
      section: key,
      count: items.length,
      items,
    }));
  } else {
    return [
      {
        section: "All Traders",
        count: data.length,
        items: data,
      },
    ];
  }
}

export function WhoBoughtSoldBoard() {
  const [sections, setSections] = useState<WhoBoughtSoldSection[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [groupBy, setGroupBy] = useState<"label" | "none">("none");

  // Filters/controls
  const [chain, setChain] = useState<string>("ethereum");
  const [tokenAddress, setTokenAddress] = useState<string>("");
  const [buyOrSell, setBuyOrSell] = useState<"BUY" | "SELL">("BUY");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [sortBy, setSortBy] = useState<TGMWhoBoughtSoldSortField>("trade_volume_usd");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");

  // Filter values
  const [includeSmartMoneyLabels, setIncludeSmartMoneyLabels] = useState<Record<string, boolean>>({});
  const [tradeVolumeUsdMin, setTradeVolumeUsdMin] = useState<string>("");
  const [tradeVolumeUsdMax, setTradeVolumeUsdMax] = useState<string>("");

  const availableChains = ["ethereum", "solana", "base", "arbitrum", "polygon", "optimism", "bitcoin", "avalanche"];
  const availableSmartMoneyLabels = ["Whale", "Smart Trader", "Fund", "30D Smart Trader", "90D Smart Trader", "180D Smart Trader"];

  const sortFields: Array<{ value: TGMWhoBoughtSoldSortField; label: string }> = [
    { value: "trade_volume_usd", label: "Trade Volume USD" },
    { value: "bought_volume_usd", label: "Bought Volume USD" },
    { value: "sold_volume_usd", label: "Sold Volume USD" },
    { value: "bought_token_volume", label: "Bought Token Volume" },
    { value: "sold_token_volume", label: "Sold Token Volume" },
    { value: "token_trade_volume", label: "Token Trade Volume" },
    { value: "address", label: "Address" },
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
      const filters: TGMWhoBoughtSoldFilters = {};

      const activeLabels = Object.entries(includeSmartMoneyLabels)
        .filter(([_, selected]) => selected)
        .map(([label]) => label);

      if (activeLabels.length > 0) {
        filters.include_smart_money_labels = activeLabels;
      }

      if (tradeVolumeUsdMin || tradeVolumeUsdMax) {
        filters.trade_volume_usd = {
          min: tradeVolumeUsdMin ? Number(tradeVolumeUsdMin) : undefined,
          max: tradeVolumeUsdMax ? Number(tradeVolumeUsdMax) : undefined,
        };
      }

      const sortByArray = [
        {
          field: sortBy,
          direction: sortDirection,
        },
      ];

      const resp: WhoBoughtSoldResponse = await fetchWhoBoughtSold({
        chain: chain,
        tokenAddress: tokenAddress.trim(),
        buyOrSell: buyOrSell,
        date: dateRange,
        page: page,
        perPage: perPage,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        sortBy: sortByArray,
      });

      setSections(groupWhoBoughtSold(resp.data, groupBy));
    } catch (e: any) {
      setError(e?.message || "Failed to load who bought/sold data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tokenAddress.trim()) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain, buyOrSell, page, perPage, sortBy, sortDirection, groupBy, from, to]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
              <span className="text-white font-normal">Who Bought/Sold</span>
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
                  Group: {groupBy === "label" ? "By Label" : "None"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem]">
                <DropdownMenuItem onClick={() => setGroupBy("none")}>None</DropdownMenuItem>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className={`h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal min-w-[80px] ${buyOrSell === "BUY" ? "text-green-400" : "text-red-400"}`}>
                {buyOrSell}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
              <DropdownMenuItem onClick={() => setBuyOrSell("BUY")}>BUY</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBuyOrSell("SELL")}>SELL</DropdownMenuItem>
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

            {/* Trade Volume USD */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Trade Volume USD</label>
              <div className="flex items-center gap-2">
                <Input
                  value={tradeVolumeUsdMin}
                  onChange={(e) => setTradeVolumeUsdMin(e.target.value)}
                  placeholder="Min"
                  className="h-8 bg-[#171a26] border-[#20222f] text-sm text-gray-200 placeholder:text-gray-500"
                  onBlur={() => load()}
                />
                <Input
                  value={tradeVolumeUsdMax}
                  onChange={(e) => setTradeVolumeUsdMax(e.target.value)}
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
                <div className="2xl:static 2xl:left-auto sticky left-0 z-10 bg-[#141723] ml-[-16px] pl-4 pr-3 py-2 rounded-l flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center bg-blue-500/20">
                    <ShoppingCart className="w-3 h-3 text-blue-400" />
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
                <div className="relative flex items-center gap-3 pr-3 pl-0 py-2 text-[10px] uppercase tracking-wide text-gray-500">
                  <div className="2xl:static 2xl:left-auto sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[240px] ml-0 pl-3 py-2 rounded-l">
                    <div className="h-6 w-6" />
                    <div className="min-w-[200px]">Address</div>
                  </div>
                  <div className="flex items-center gap-4 ml-auto min-w-0">
                    <div className="min-w-[120px] text-right">Label</div>
                    <div className="flex items-center gap-4">
                      <div className="min-w-[100px] text-right">Bought USD</div>
                      <div className="min-w-[100px] text-right">Sold USD</div>
                      <div className="min-w-[100px] text-right">Trade Volume USD</div>
                    </div>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-[80px] text-right">Bought Tokens</div>
                      <div className="min-w-[80px] text-right">Sold Tokens</div>
                      <div className="min-w-[80px] text-right">Net</div>
                    </div>
                  </div>
                </div>
                {section.items.map((trader, idx) => {
                  const netVolume = trader.bought_volume_usd - trader.sold_volume_usd;
                  const isNetBuyer = netVolume >= 0;
                  
                  return (
                    <div
                      key={`${trader.address}-${idx}`}
                      className="relative flex items-center gap-3 pr-3 pl-0 py-2.5 bg-[#171a26] border border-[#20222f] rounded hover:bg-[#1c1e2b] hover:border-[#272936] group"
                    >
                      <div className="2xl:static 2xl:left-auto sticky left-0 z-10 bg-[#171a26] group-hover:bg-[#1c1e2b] flex items-center gap-2 min-w-[240px] pr-3 ml-0 pl-3 py-2.5 rounded-l">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </Button>
                        <div className="font-mono text-xs text-gray-400 min-w-[200px]">
                          {trader.address.slice(0, 6)}...{trader.address.slice(-4)}
                        </div>
                      </div>

                      {/* Right-aligned details */}
                      <div className="flex items-center gap-4 ml-auto min-w-0">
                        <div className="min-w-[120px] flex justify-end">
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-5 bg-gray-700/50 text-gray-300 border-0 px-2 rounded-full"
                          >
                            {trader.address_label || "Unknown"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right min-w-[100px]">
                            <div className="text-xs font-semibold text-green-400">{formatUSD(trader.bought_volume_usd)}</div>
                          </div>
                          <div className="text-right min-w-[100px]">
                            <div className="text-xs font-semibold text-red-400">{formatUSD(trader.sold_volume_usd)}</div>
                          </div>
                          <div className="text-right min-w-[100px]">
                            <div className="text-xs font-semibold text-gray-300">{formatUSD(trader.trade_volume_usd)}</div>
                          </div>
                        </div>
                      
                      {/* Token Volumes and Net */}
                        <div className="flex items-center gap-3 text-xs text-gray-400 min-w-0">
                          <div className="min-w-[80px] text-right">
                            <div className="text-gray-300 font-medium">{formatNumber(trader.bought_token_volume)}</div>
                          </div>
                          <div className="min-w-[80px] text-right">
                            <div className="text-gray-300 font-medium">{formatNumber(trader.sold_token_volume)}</div>
                          </div>
                          <div className="min-w-[80px] text-right">
                            <div className={`font-semibold ${isNetBuyer ? "text-green-400" : "text-red-400"}`}>{formatUSD(Math.abs(netVolume))}</div>
                            <div className="flex items-center justify-end gap-1 mt-0.5">
                              {isNetBuyer ? (
                                <TrendingUp className="w-3 h-3 text-green-400" />
                              ) : (
                                <TrendingDown className="w-3 h-3 text-red-400" />
                              )}
                              <span className={`text-[10px] ${isNetBuyer ? "text-green-400" : "text-red-400"}`}>{isNetBuyer ? "Buyer" : "Seller"}</span>
                            </div>
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
                <div className="text-sm text-gray-400">Enter a token address to view who bought/sold</div>
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

