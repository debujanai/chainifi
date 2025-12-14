"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, Loader, TrendingUp, TrendingDown, Trophy, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { HyperliquidLeaderboardData, HyperliquidLeaderboardResponse, HyperliquidLeaderboardFilters, HyperliquidLeaderboardSortField, fetchHyperliquidLeaderboard, DateRange } from "@/lib/nansen-api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

function formatUSD(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
}

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function HyperliquidLeaderboardBoard() {
  const [data, setData] = useState<HyperliquidLeaderboardData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [sortBy, setSortBy] = useState<HyperliquidLeaderboardSortField>("total_pnl");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");

  // Filter values
  const [accountValueMin, setAccountValueMin] = useState<string>("");
  const [accountValueMax, setAccountValueMax] = useState<string>("");
  const [totalPnlMin, setTotalPnlMin] = useState<string>("");
  const [totalPnlMax, setTotalPnlMax] = useState<string>("");

  const sortFields: Array<{ value: HyperliquidLeaderboardSortField; label: string }> = [
    { value: "total_pnl", label: "Total PnL" },
    { value: "roi", label: "ROI" },
    { value: "account_value", label: "Account Value" },
    { value: "trader_address", label: "Address" },
  ];

  async function load() {
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
      const filters: HyperliquidLeaderboardFilters = {
        account_value: (accountValueMin || accountValueMax) ? {
          min: accountValueMin ? Number(accountValueMin) : undefined,
          max: accountValueMax ? Number(accountValueMax) : undefined,
        } : undefined,
        total_pnl: (totalPnlMin || totalPnlMax) ? {
          min: totalPnlMin ? Number(totalPnlMin) : undefined,
          max: totalPnlMax ? Number(totalPnlMax) : undefined,
        } : undefined,
      };

      const sortByArray = [
        {
          field: sortBy,
          direction: sortDirection,
        },
      ];

      const resp: HyperliquidLeaderboardResponse = await fetchHyperliquidLeaderboard({
        date: dateRange,
        page: page,
        perPage: perPage,
        filters: filters,
        sortBy: sortByArray,
      });

      setData(resp.data);
    } catch (e: any) {
      setError(e?.message || "Failed to load hyperliquid leaderboard data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, sortBy, sortDirection, from, to, accountValueMin, accountValueMax, totalPnlMin, totalPnlMax]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
            <span className="text-white font-normal text-sm">Hyperliquid Leaderboard</span>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <MoreHorizontal className="w-3 h-3 text-gray-400" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {/* Top Row: Primary Actions */}
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Placeholder for symmetry */}
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

              {/* Mobile filter toggle */}
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
            </div>
          </div>

          {/* Filter Grid - Collapsible on Mobile, Always visible on Desktop */}
          <div className={`${filterOpen ? 'grid' : 'hidden'} lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3`}>
            {/* Date Range - From */}
            <div className="lg:col-span-2">
              <Input
                type="date"
                placeholder="From"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white w-full"
              />
            </div>

            {/* Date Range - To */}
            <div className="lg:col-span-2">
              <Input
                type="date"
                placeholder="To"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white w-full"
              />
            </div>

            {/* Account Value Range */}
            <div className="lg:col-span-3">
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  placeholder="Acc. Value Min"
                  value={accountValueMin}
                  onChange={(e) => setAccountValueMin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && load()}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
                />
                <span className="text-xs text-gray-500">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={accountValueMax}
                  onChange={(e) => setAccountValueMax(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && load()}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
                />
              </div>
            </div>

            {/* Total PnL Range */}
            <div className="lg:col-span-3">
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  placeholder="PnL Min"
                  value={totalPnlMin}
                  onChange={(e) => setTotalPnlMin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && load()}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
                />
                <span className="text-xs text-gray-500">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={totalPnlMax}
                  onChange={(e) => setTotalPnlMax(e.target.value)}
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

            {data.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="2xl:static 2xl:left-auto sticky left-0 z-10 bg-[#141723] pl-4 pr-3 py-2 rounded-l flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-blue-500/20">
                      <Trophy className="w-3 h-3 text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-white">Hyperliquid Leaderboard</span>
                    <span className="text-xs text-gray-500">{data.length}</span>
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
                    <div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[200px] py-2 pl-7 pr-3 rounded-l border-y border-l border-transparent">
                      <div className="h-6 w-6" />
                      <div className="min-w-[120px]">Address</div>
                    </div>
                    <div className="flex-1 flex items-center justify-end min-w-0 gap-0 py-2 pr-3 border-y border-r border-transparent">
                      <div className="w-[60px] text-center">Rank</div>
                      <div className="w-[120px] text-center">Label</div>
                      <div className="w-[120px] text-center">Total PnL</div>
                      <div className="w-[100px] text-center">ROI</div>
                      <div className="w-[120px] text-center">Account Value</div>
                    </div>
                  </div>

                  {data.map((item, idx) => {
                    const rank = (page - 1) * perPage + idx + 1;
                    const isPositive = item.total_pnl >= 0;

                    return (
                      <div
                        key={`${item.trader_address}-${idx}`}
                        className="flex items-stretch group whitespace-nowrap"
                      >
                        {/* Sticky Column - Address */}
                        <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                          <div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-2 min-w-[200px] ml-0 pl-3 py-2.5 rounded-l transition-colors duration-150">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="w-4 h-4 text-gray-400" />
                            </Button>
                            <div className="font-mono text-xs text-gray-300 min-w-[120px]">
                              {item.trader_address.slice(0, 6)}...{item.trader_address.slice(-4)}
                            </div>
                          </div>
                        </div>

                        {/* Main Content - Right aligned group */}
                        <div className="flex-1 flex items-center justify-end min-w-0 gap-0 pr-3 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors duration-150">
                          {/* Rank */}
                          <div className="w-[60px] flex justify-center">
                            <span className="font-mono text-xs text-gray-400">#{rank}</span>
                          </div>

                          {/* Label */}
                          <div className="w-[120px] flex justify-center">
                            <Badge
                              variant="secondary"
                              className="text-[10px] h-5 bg-gray-700/50 text-gray-300 border-0 px-2 rounded-full"
                            >
                              {item.trader_address_label || "Unknown"}
                            </Badge>
                          </div>

                          {/* Total PnL */}
                          <div className="w-[120px] flex justify-center">
                            <div className={`text-xs font-semibold font-mono tabular-nums ${isPositive ? "text-green-400" : "text-red-400"}`}>
                              {isPositive ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
                              {formatUSD(item.total_pnl)}
                            </div>
                          </div>

                          {/* ROI */}
                          <div className="w-[100px] flex justify-center">
                            <div className={`text-xs font-semibold font-mono tabular-nums ${item.roi >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {formatPercent(item.roi)}
                            </div>
                          </div>

                          {/* Account Value */}
                          <div className="w-[120px] flex justify-center">
                            <div className="text-xs font-medium text-gray-300 font-mono tabular-nums">
                              {formatUSD(item.account_value)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!loading && data.length === 0 && !error && (
              <div className="flex items-center justify-center py-12 ml-4">
                <div className="text-center">
                  <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-400">No leaderboard data found</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Pagination Controls - Fixed at bottom, outside scroll area */}
      {data.length > 0 && (
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


