"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Filter, Clock, DollarSign, Copy, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { PerpTrade, PerpTradesResponse, fetchPerpTrades } from "@/lib/nansen-api";

function formatUSD(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
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

export function PerpTradesBoard() {
  const [trades, setTrades] = useState<PerpTrade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(50);
  const [isLastPage, setIsLastPage] = useState<boolean>(true);

  // Filters
  const [side, setSide] = useState<string | undefined>(undefined);
  const [type, setType] = useState<string | undefined>(undefined);
  const [action, setAction] = useState<string | undefined>(undefined);
  const [tokenSymbol, setTokenSymbol] = useState<string>("");
  const [onlyNewPositions, setOnlyNewPositions] = useState<boolean>(false);
  const [minValueUsd, setMinValueUsd] = useState<string>("");
  const [maxValueUsd, setMaxValueUsd] = useState<string>("");

  const [sortBy, setSortBy] = useState<"block_timestamp" | "value_usd" | "token_amount">("block_timestamp");
  const [sortDirection, setSortDirection] = useState<"DESC" | "ASC">("DESC");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res: PerpTradesResponse = await fetchPerpTrades({
        side,
        type,
        action,
        tokenSymbol: tokenSymbol || undefined,
        onlyNewPositions,
        valueUsd: {
          min: minValueUsd ? Number(minValueUsd) : undefined,
          max: maxValueUsd ? Number(maxValueUsd) : undefined,
        },
        sortBy: [{ field: sortBy, direction: sortDirection }],
        page,
        perPage,
      });
      setTrades(res.data);
      setIsLastPage(res.pagination?.is_last_page ?? true);
    } catch (e: any) {
      setError(e?.message || "Failed to load perpetual trades");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side, type, action, tokenSymbol, onlyNewPositions, minValueUsd, maxValueUsd, sortBy, sortDirection, page, perPage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") load();
  };

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        {/* Title Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center text-[10px]">
              <DollarSign className="w-3 h-3 text-white" />
            </div>
            <span className="text-white font-normal text-sm">Smart Money Perp Trades</span>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <MoreHorizontal className="w-3 h-3 text-gray-400" />
            </Button>
          </div>
        </div>

        {/* Controls Container */}
        <div className="flex flex-col gap-3">
          {/* Top Row: Side Toggles & Actions */}
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
            {/* Side Toggle Container */}
            <div className="flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5">
              {(["Long", "Short"] as const).map((s) => (
                <Button
                  key={s}
                  variant="ghost"
                  size="sm"
                  className={`h-7 text-[10px] px-3 rounded-sm ${side === s ? (s === "Long" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300") : "text-gray-400 hover:text-gray-200"}`}
                  onClick={() => setSide(side === s ? undefined : s)}
                >
                  {s}
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
                    Sort: {sortBy.replace(/_/g, " ")} {sortDirection === "DESC" ? "↓" : "↑"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[14rem]">
                  <DropdownMenuItem onClick={() => setSortBy("block_timestamp")}>Sort by Time</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("value_usd")}>Sort by Value</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("token_amount")}>Sort by Amount</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortDirection(sortDirection === "DESC" ? "ASC" : "DESC")}>
                    Direction: {sortDirection === "DESC" ? "Descending" : "Ascending"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Filter Grid - 12 column layout */}
          <div className={`${filterOpen ? 'grid' : 'hidden'} lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3`}>
            {/* Type Toggle */}
            <div className="lg:col-span-2">
              <div className="flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5">
                {(["Market", "Limit"] as const).map((t) => (
                  <Button
                    key={t}
                    variant="ghost"
                    size="sm"
                    className={`h-7 text-[10px] px-2 rounded-sm flex-1 ${type === t ? "bg-[#20222f] text-gray-200 shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
                    onClick={() => setType(type === t ? undefined : t)}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>

            {/* Action Toggle */}
            <div className="lg:col-span-4">
              <div className="flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5">
                {(["Open", "Add", "Reduce", "Close"] as const).map((a) => (
                  <Button
                    key={a}
                    variant="ghost"
                    size="sm"
                    className={`h-7 text-[10px] px-2 rounded-sm flex-1 ${action === a ? "bg-[#20222f] text-gray-200 shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
                    onClick={() => setAction(action === a ? undefined : a)}
                  >
                    {a}
                  </Button>
                ))}
              </div>
            </div>

            {/* Token Symbol */}
            <div className="lg:col-span-2">
              <Input
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Token (BTC)"
                className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500"
              />
            </div>

            {/* New Positions Only */}
            <div className="lg:col-span-2">
              <Button
                variant={onlyNewPositions ? "secondary" : "outline"}
                size="sm"
                className={`w-full h-8 text-xs ${onlyNewPositions ? "bg-green-500/20 border-green-500/50 text-green-300" : "border-[#20222f] bg-[#171a26] text-gray-400 hover:bg-[#20222f]"}`}
                onClick={() => setOnlyNewPositions(!onlyNewPositions)}
              >
                New Only
              </Button>
            </div>

            {/* Value USD Range */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={minValueUsd}
                  onChange={(e) => setMinValueUsd(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Min $"
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
                />
                <span className="text-xs text-gray-500">-</span>
                <Input
                  type="number"
                  value={maxValueUsd}
                  onChange={(e) => setMaxValueUsd(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Max"
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

            {!loading && trades.length > 0 && (
              <div className="mb-6">
                <div className="space-y-1">
                  {/* Header Row */}
                  <div className="flex items-stretch text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap">
                    <div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[150px] py-2 pl-7 pr-3 rounded-l border-y border-l border-transparent">
                      <div className="h-6 w-6" />
                      <div className="min-w-[100px]">Trader</div>
                    </div>
                    <div className="flex-1 flex items-center justify-end min-w-0 gap-0 py-2 pr-3 border-y border-r border-transparent">
                      <div className="w-[70px] text-center">Coin</div>
                      <div className="w-[70px] text-center">Side</div>
                      <div className="w-[70px] text-center">Action</div>
                      <div className="w-[80px] text-center">Amount</div>
                      <div className="w-[90px] text-center">Price</div>
                      <div className="w-[90px] text-center">Value</div>
                      <div className="w-[70px] text-center">Type</div>
                      <div className="w-[130px] text-center">Time</div>
                    </div>
                  </div>

                  {trades.map((t, idx) => (
                    <div
                      key={`${t.transaction_hash}-${idx}`}
                      className="flex items-stretch group whitespace-nowrap"
                    >
                      {/* Sticky Column - Trader */}
                      <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                        <div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-2 min-w-[150px] ml-0 pl-3 py-2.5 rounded-l transition-colors duration-150">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                          </Button>
                          <div className="text-xs min-w-0">
                            <div className="font-medium text-blue-300 truncate">{t.trader_address_label || "Smart Money"}</div>
                            <div className="text-[10px] text-gray-500 font-mono truncate">{t.trader_address.slice(0, 6)}...{t.trader_address.slice(-4)}</div>
                          </div>
                        </div>
                      </div>

                      {/* Main Content */}
                      <div className="flex-1 flex items-center justify-end min-w-0 gap-0 pr-3 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors duration-150">
                        {/* Coin */}
                        <div className="w-[70px] flex justify-center">
                          <span className="text-xs text-white font-medium">{t.token_symbol}</span>
                        </div>

                        {/* Side */}
                        <div className="w-[70px] flex justify-center">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] h-5 px-2 rounded-full ${t.side === "Long" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}
                          >
                            {t.side}
                          </Badge>
                        </div>

                        {/* Action */}
                        <div className="w-[70px] flex justify-center">
                          <span className="text-xs text-gray-300">{t.action}</span>
                        </div>

                        {/* Amount */}
                        <div className="w-[80px] flex justify-center">
                          <span className="text-xs text-white">{t.token_amount}</span>
                        </div>

                        {/* Price */}
                        <div className="w-[90px] flex justify-center">
                          <span className="text-xs text-gray-300">{formatUSD(t.price_usd)}</span>
                        </div>

                        {/* Value */}
                        <div className="w-[90px] flex justify-center">
                          <span className="text-xs text-white font-medium">{formatUSD(t.value_usd)}</span>
                        </div>

                        {/* Type */}
                        <div className="w-[70px] flex justify-center">
                          <span className="text-xs text-gray-400">{t.type}</span>
                        </div>

                        {/* Time */}
                        <div className="w-[130px] flex justify-center">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-300">{formatTime(t.block_timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Pagination Controls */}
      {!loading && trades.length > 0 && (
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