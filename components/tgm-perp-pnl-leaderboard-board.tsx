"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, Loader, TrendingUp, TrendingDown, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { TGMPerpPnlLeaderboardData, TGMPerpPnlLeaderboardResponse, TGMPerpPnlLeaderboardFilters, TGMPerpPnlLeaderboardSortField, fetchTGMPerpPnlLeaderboard, DateRange } from "@/lib/nansen-api";
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
  return Math.abs(value).toFixed(4);
}

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function TGMPerpPnlLeaderboardBoard() {
  const [data, setData] = useState<TGMPerpPnlLeaderboardData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [tokenSymbol, setTokenSymbol] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [sortBy, setSortBy] = useState<TGMPerpPnlLeaderboardSortField>("pnl_usd_total");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");

  // Filter values
  const [pnlRealisedMin, setPnlRealisedMin] = useState<string>("");
  const [pnlRealisedMax, setPnlRealisedMax] = useState<string>("");
  const [pnlUnrealisedMin, setPnlUnrealisedMin] = useState<string>("");
  const [pnlUnrealisedMax, setPnlUnrealisedMax] = useState<string>("");
  const [pnlTotalMin, setPnlTotalMin] = useState<string>("");
  const [pnlTotalMax, setPnlTotalMax] = useState<string>("");
  const [positionValueMin, setPositionValueMin] = useState<string>("");
  const [positionValueMax, setPositionValueMax] = useState<string>("");

  const sortFields: Array<{ value: TGMPerpPnlLeaderboardSortField; label: string }> = [
    { value: "pnl_usd_total", label: "Total PnL" },
    { value: "pnl_usd_realised", label: "Realised PnL" },
    { value: "pnl_usd_unrealised", label: "Unrealised PnL" },
    { value: "roi_percent_total", label: "Total ROI" },
    { value: "roi_percent_realised", label: "Realised ROI" },
    { value: "roi_percent_unrealised", label: "Unrealised ROI" },
    { value: "position_value_usd", label: "Position Value" },
    { value: "nof_trades", label: "Number of Trades" },
    { value: "trader_address", label: "Address" },
  ];

  async function load() {
    if (!tokenSymbol.trim()) {
      setError("Please enter a token symbol");
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
      const filters: TGMPerpPnlLeaderboardFilters = {
        pnl_usd_realised: (pnlRealisedMin || pnlRealisedMax) ? {
          min: pnlRealisedMin ? Number(pnlRealisedMin) : undefined,
          max: pnlRealisedMax ? Number(pnlRealisedMax) : undefined,
        } : undefined,
        pnl_usd_unrealised: (pnlUnrealisedMin || pnlUnrealisedMax) ? {
          min: pnlUnrealisedMin ? Number(pnlUnrealisedMin) : undefined,
          max: pnlUnrealisedMax ? Number(pnlUnrealisedMax) : undefined,
        } : undefined,
        pnl_usd_total: (pnlTotalMin || pnlTotalMax) ? {
          min: pnlTotalMin ? Number(pnlTotalMin) : undefined,
          max: pnlTotalMax ? Number(pnlTotalMax) : undefined,
        } : undefined,
        position_value_usd: (positionValueMin || positionValueMax) ? {
          min: positionValueMin ? Number(positionValueMin) : undefined,
          max: positionValueMax ? Number(positionValueMax) : undefined,
        } : undefined,
      };

      const sortByArray = [
        {
          field: sortBy,
          direction: sortDirection,
        },
      ];

      const resp: TGMPerpPnlLeaderboardResponse = await fetchTGMPerpPnlLeaderboard({
        tokenSymbol: tokenSymbol.trim(),
        date: dateRange,
        page: page,
        perPage: perPage,
        filters: filters,
        sortBy: sortByArray,
      });

      setData(resp.data);
    } catch (e: any) {
      setError(e?.message || "Failed to load token mode perp PnL leaderboard data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tokenSymbol.trim()) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, sortBy, sortDirection, from, to, pnlRealisedMin, pnlRealisedMax, pnlUnrealisedMin, pnlUnrealisedMax, pnlTotalMin, pnlTotalMax, positionValueMin, positionValueMax]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
              <span className="text-white font-normal">Token Mode Perp PnL Leaderboard</span>
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

        {/* Token Symbol Input */}
        <div className="flex items-center gap-2 mb-2">
          <Input
            type="text"
            placeholder="Enter token symbol (BTC, ETH, etc.)"
            value={tokenSymbol}
            onChange={(e) => setTokenSymbol(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            className="flex-1 h-8 text-xs bg-[#141723] border-[#20222f] text-white placeholder:text-gray-500"
          />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Realised PnL Range */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Realised PnL USD</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={pnlRealisedMin}
                  onChange={(e) => setPnlRealisedMin(e.target.value)}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
                />
                <span className="text-xs text-gray-500">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={pnlRealisedMax}
                  onChange={(e) => setPnlRealisedMax(e.target.value)}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
                />
              </div>
            </div>

            {/* Unrealised PnL Range */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Unrealised PnL USD</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={pnlUnrealisedMin}
                  onChange={(e) => setPnlUnrealisedMin(e.target.value)}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
                />
                <span className="text-xs text-gray-500">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={pnlUnrealisedMax}
                  onChange={(e) => setPnlUnrealisedMax(e.target.value)}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
                />
              </div>
            </div>

            {/* Total PnL Range */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Total PnL USD</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={pnlTotalMin}
                  onChange={(e) => setPnlTotalMin(e.target.value)}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
                />
                <span className="text-xs text-gray-500">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={pnlTotalMax}
                  onChange={(e) => setPnlTotalMax(e.target.value)}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
                />
              </div>
            </div>

            {/* Position Value Range */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Position Value USD</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={positionValueMin}
                  onChange={(e) => setPositionValueMin(e.target.value)}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
                />
                <span className="text-xs text-gray-500">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={positionValueMax}
                  onChange={(e) => setPositionValueMax(e.target.value)}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
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

          {data.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center bg-blue-500/20">
                    <Trophy className="w-3 h-3 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-white">Token Mode Perp PnL Leaderboard</span>
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
                {/* Header row to explain columns */}
                <div className="flex items-center gap-3 px-3 py-2 text-[10px] uppercase tracking-wide text-gray-500">
                  <div className="h-6 w-6" />
                  <div className="min-w-[60px]">Rank</div>
                  <div className="min-w-[200px]">Address</div>
                  <div className="flex-1">Label</div>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-[100px] text-right">Total PnL</div>
                    <div className="min-w-[100px] text-right">Realised</div>
                    <div className="min-w-[100px] text-right">Unrealised</div>
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-[100px] text-right">Total ROI</div>
                    <div className="min-w-[100px] text-right">Position Value</div>
                    <div className="min-w-[80px] text-right">Trades</div>
                  </div>
                </div>
                {data.map((item, idx) => {
                  const rank = (page - 1) * perPage + idx + 1;
                  const isPositive = item.pnl_usd_total >= 0;
                  
                  return (
                    <div
                      key={`${item.trader_address}-${idx}`}
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

                      {/* Rank */}
                      <div className="font-mono text-xs text-gray-400 min-w-[60px]">
                        #{rank}
                      </div>

                      {/* Address */}
                      <div className="min-w-[200px]">
                        <div className="font-mono text-xs text-gray-400">
                          {item.trader_address.slice(0, 6)}...{item.trader_address.slice(-4)}
                        </div>
                      </div>

                      {/* Label */}
                      <div className="flex-1 text-sm text-white font-medium min-w-0">
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-4 bg-gray-700/50 text-gray-300 border-0 px-1.5 rounded-full"
                        >
                          {item.trader_address_label || "Unknown"}
                        </Badge>
                      </div>

                      {/* PnL Metrics */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="text-right min-w-[100px]">
                          <div className={`text-xs font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                            {isPositive ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
                            {formatUSD(item.pnl_usd_total)}
                          </div>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <div className={`text-xs font-medium ${item.pnl_usd_realised >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {formatUSD(item.pnl_usd_realised)}
                          </div>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <div className={`text-xs font-medium ${item.pnl_usd_unrealised >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {formatUSD(item.pnl_usd_unrealised)}
                          </div>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="flex items-center gap-3 text-xs text-gray-400 min-w-0">
                        <div className="min-w-[100px] text-right">
                          <div className={`text-xs font-semibold ${item.roi_percent_total >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {formatPercent(item.roi_percent_total)}
                          </div>
                        </div>
                        <div className="min-w-[100px] text-right">
                          <div className="text-gray-300 font-medium">{formatUSD(item.position_value_usd)}</div>
                        </div>
                        <div className="min-w-[80px] text-right">
                          <div className="text-gray-500">{item.nof_trades}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && data.length === 0 && !error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <div className="text-sm text-gray-400">Enter a token symbol to view PnL leaderboard</div>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {data.length > 0 && (
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

