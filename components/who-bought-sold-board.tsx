"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, TrendingUp, TrendingDown, Loader, Wallet, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { WhoBoughtSoldData, WhoBoughtSoldResponse, TGMWhoBoughtSoldFilters, TGMWhoBoughtSoldSortField, fetchWhoBoughtSold, DateRange } from "@/lib/nansen-api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

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
    { value: "bought_token_volume", label: "Bought Token" },
    { value: "sold_token_volume", label: "Sold Token" },
    { value: "token_trade_volume", label: "Token Trade" },
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
        {/* Title Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">🛒</div>
            <span className="text-white font-normal text-sm">Who Bought/Sold</span>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <MoreHorizontal className="w-3 h-3 text-gray-400" />
            </Button>
          </div>
        </div>

        {/* Search Input Row */}
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Input
              type="text"
              placeholder="Enter token address (0x...)"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              className="flex-1 h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 min-w-[200px]"
            />
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-400 hover:text-gray-200">
                  Group: {groupBy === "label" ? "By Label" : "None"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[8rem]">
                <DropdownMenuItem onClick={() => setGroupBy("none")}>None</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("label")}>By Label</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filter Grid - Collapsible on Mobile, Always visible on Desktop */}
        <div className={`${filterOpen ? 'grid' : 'hidden'} lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3`}>
          {/* Date Range - From */}
          <div className="sm:col-span-1 lg:col-span-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-8 justify-start text-left font-normal bg-[#171a26] border-[#20222f] text-gray-300 text-xs"
                >
                  <Calendar className="mr-2 h-3 w-3 text-gray-500" />
                  {from ? format(new Date(from), "MMM dd, yyyy") : <span className="text-gray-500">From date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#171a26] border-[#20222f]" align="start">
                <CalendarComponent
                  mode="single"
                  selected={from ? new Date(from) : undefined}
                  onSelect={(d) => d && setFrom(d.toISOString())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date Range - To */}
          <div className="sm:col-span-1 lg:col-span-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-8 justify-start text-left font-normal bg-[#171a26] border-[#20222f] text-gray-300 text-xs"
                >
                  <Calendar className="mr-2 h-3 w-3 text-gray-500" />
                  {to ? format(new Date(to), "MMM dd, yyyy") : <span className="text-gray-500">To date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#171a26] border-[#20222f]" align="start">
                <CalendarComponent
                  mode="single"
                  selected={to ? new Date(to) : undefined}
                  onSelect={(d) => d && setTo(d.toISOString())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Chain Dropdown */}
          <div className="lg:col-span-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full h-8 justify-between bg-[#171a26] border-[#20222f] text-gray-300 text-xs font-normal">
                  {chain.charAt(0).toUpperCase() + chain.slice(1)}
                  <span className="text-gray-500 ml-1">▾</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[10rem]">
                {availableChains.map((c) => (
                  <DropdownMenuItem key={c} onClick={() => setChain(c)}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Buy/Sell Toggle */}
          <div className="lg:col-span-2">
            <div className="flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5">
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 text-[10px] px-3 rounded-sm flex-1 ${buyOrSell === "BUY" ? "bg-green-500/20 text-green-300 shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
                onClick={() => setBuyOrSell("BUY")}
              >
                BUY
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 text-[10px] px-3 rounded-sm flex-1 ${buyOrSell === "SELL" ? "bg-red-500/20 text-red-300 shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
                onClick={() => setBuyOrSell("SELL")}
              >
                SELL
              </Button>
            </div>
          </div>

          {/* Trade Volume USD Range */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-1">
              <Input
                type="number"
                placeholder="Vol Min"
                value={tradeVolumeUsdMin}
                onChange={(e) => setTradeVolumeUsdMin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load()}
                className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
              />
              <span className="text-xs text-gray-500">-</span>
              <Input
                type="number"
                placeholder="Max"
                value={tradeVolumeUsdMax}
                onChange={(e) => setTradeVolumeUsdMax(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load()}
                className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
              />
            </div>
          </div>

          {/* Per Page Dropdown */}
          <div className="lg:col-span-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full h-8 justify-between bg-[#171a26] border-[#20222f] text-gray-300 text-xs font-normal">
                  {perPage} per page
                  <span className="text-gray-500 ml-1">▾</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[6rem]">
                {[10, 25, 50, 100].map((val) => (
                  <DropdownMenuItem key={val} onClick={() => { setPerPage(val); setPage(1); }}>
                    {val}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Smart Money Labels */}
          <div className="lg:col-span-12 flex items-center gap-1 flex-wrap">
            {availableSmartMoneyLabels.map((label) => (
              <Button
                key={label}
                variant="ghost"
                size="sm"
                className={`h-8 text-[10px] px-2 rounded-sm border ${includeSmartMoneyLabels[label]
                  ? "bg-blue-500/20 text-blue-300 border-blue-500/50"
                  : "bg-[#171a26] text-gray-400 border-[#20222f] hover:bg-[#20222f]"
                  }`}
                onClick={() => setIncludeSmartMoneyLabels((prev) => ({ ...prev, [label]: !prev[label] }))}
              >
                {label}
              </Button>
            ))}
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
                {/* Section Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="sticky left-0 z-10 bg-[#141723] pl-4 pr-3 py-2 rounded-l flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500/20" />
                    <span className="text-sm font-medium text-blue-400">{section.section}</span>
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
                  {/* Header Row */}
                  <div className="flex items-stretch text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap">
                    <div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[160px] py-2 pl-7 pr-3 rounded-l border-y border-l border-transparent">
                      <div className="h-6 w-6" />
                      <div className="min-w-[100px]">Address</div>
                    </div>
                    <div className="flex-1 flex items-center justify-end min-w-0 gap-0 py-2 pr-3 border-y border-r border-transparent">
                      <div className="w-[100px] text-center">Label</div>
                      <div className="w-[90px] text-center">Bought</div>
                      <div className="w-[90px] text-center">Sold</div>
                      <div className="w-[100px] text-center">Volume</div>
                      <div className="w-[80px] text-center">Tokens</div>
                      <div className="w-[80px] text-center">Net</div>
                    </div>
                  </div>

                  {section.items.map((trader, idx) => {
                    const netVolume = trader.bought_volume_usd - trader.sold_volume_usd;
                    const isNetBuyer = netVolume >= 0;

                    return (
                      <div
                        key={`${trader.address}-${idx}`}
                        className="flex items-stretch group whitespace-nowrap"
                      >
                        {/* Sticky Column - Address */}
                        <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                          <div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-2 min-w-[160px] ml-0 pl-3 py-2.5 rounded-l transition-colors duration-150">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="w-4 h-4 text-blue-400" />
                            </Button>
                            <div className="font-mono text-xs text-blue-300 font-medium min-w-[100px]">
                              {trader.address.slice(0, 6)}...{trader.address.slice(-4)}
                            </div>
                          </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 flex items-center justify-end min-w-0 gap-0 pr-3 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors duration-150">
                          {/* Label */}
                          <div className="w-[100px] flex justify-center">
                            <Badge
                              variant="secondary"
                              className="text-[10px] h-5 bg-gray-700/50 text-gray-300 border-0 px-2 rounded-full"
                            >
                              {trader.address_label || "Unknown"}
                            </Badge>
                          </div>

                          {/* Bought USD */}
                          <div className="w-[90px] flex justify-center">
                            <span className="text-xs text-green-400 font-semibold font-mono tabular-nums">
                              {formatUSD(trader.bought_volume_usd)}
                            </span>
                          </div>

                          {/* Sold USD */}
                          <div className="w-[90px] flex justify-center">
                            <span className="text-xs text-red-400 font-semibold font-mono tabular-nums">
                              {formatUSD(trader.sold_volume_usd)}
                            </span>
                          </div>

                          {/* Trade Volume */}
                          <div className="w-[100px] flex justify-center">
                            <span className="text-xs text-white font-semibold font-mono tabular-nums">
                              {formatUSD(trader.trade_volume_usd)}
                            </span>
                          </div>

                          {/* Token Trade Volume */}
                          <div className="w-[80px] flex justify-center">
                            <span className="text-xs text-gray-300 font-mono tabular-nums">
                              {formatNumber(trader.token_trade_volume)}
                            </span>
                          </div>

                          {/* Net */}
                          <div className="w-[80px] flex flex-col items-center justify-center">
                            <span className={`text-xs font-semibold font-mono tabular-nums ${isNetBuyer ? "text-green-400" : "text-red-400"}`}>
                              {formatUSD(Math.abs(netVolume))}
                            </span>
                            <div className="flex items-center gap-0.5">
                              {isNetBuyer ? (
                                <TrendingUp className="w-2.5 h-2.5 text-green-400" />
                              ) : (
                                <TrendingDown className="w-2.5 h-2.5 text-red-400" />
                              )}
                              <span className={`text-[9px] ${isNetBuyer ? "text-green-400" : "text-red-400"}`}>
                                {isNetBuyer ? "Buy" : "Sell"}
                              </span>
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
              <div className="flex items-center justify-center py-12 ml-4">
                <div className="text-center">
                  <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-400">Enter a token address to view who bought/sold</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Pagination Controls - Fixed at bottom, outside scroll area */}
      {sections.length > 0 && (
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
              disabled={loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
