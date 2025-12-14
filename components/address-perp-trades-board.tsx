"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, Loader, TrendingUp, TrendingDown, BarChart3, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { AddressPerpTradeData, AddressPerpTradeResponse, AddressPerpTradeFilters, AddressPerpTradeSortField, fetchAddressPerpTrades, DateRange } from "@/lib/nansen-api";
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

export function AddressPerpTradesBoard() {
  const [data, setData] = useState<AddressPerpTradeData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [address, setAddress] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [sortBy, setSortBy] = useState<AddressPerpTradeSortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");

  // Filter values
  const [selectedSides, setSelectedSides] = useState<Record<"Long" | "Short", boolean>>({ Long: true, Short: true });
  const [selectedActions, setSelectedActions] = useState<Record<string, boolean>>({ Add: true, Open: true, Close: true, Reduce: true });
  const [sizeMin, setSizeMin] = useState<string>("");
  const [sizeMax, setSizeMax] = useState<string>("");
  const [valueMin, setValueMin] = useState<string>("");
  const [valueMax, setValueMax] = useState<string>("");
  const [closedPnlMin, setClosedPnlMin] = useState<string>("");
  const [closedPnlMax, setClosedPnlMax] = useState<string>("");

  const sortFields: Array<{ value: AddressPerpTradeSortField; label: string }> = [
    { value: "timestamp", label: "Timestamp" },
    { value: "value_usd", label: "Value USD" },
    { value: "price", label: "Price" },
    { value: "size", label: "Size" },
    { value: "closed_pnl", label: "Closed PnL" },
    { value: "fee_usd", label: "Fee USD" },
    { value: "token_symbol", label: "Token Symbol" },
    { value: "side", label: "Side" },
  ];

  async function load() {
    if (!address.trim()) {
      setError("Please enter an address");
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
      const filters: AddressPerpTradeFilters = {
        side: Object.entries(selectedSides)
          .filter(([_, selected]) => selected)
          .map(([side]) => side as "Long" | "Short"),
        action: Object.entries(selectedActions)
          .filter(([_, selected]) => selected)
          .map(([action]) => action),
        size: (sizeMin || sizeMax) ? {
          min: sizeMin ? Number(sizeMin) : undefined,
          max: sizeMax ? Number(sizeMax) : undefined,
        } : undefined,
        value_usd: (valueMin || valueMax) ? {
          min: valueMin ? Number(valueMin) : undefined,
          max: valueMax ? Number(valueMax) : undefined,
        } : undefined,
        closed_pnl: (closedPnlMin || closedPnlMax) ? {
          min: closedPnlMin ? Number(closedPnlMin) : undefined,
          max: closedPnlMax ? Number(closedPnlMax) : undefined,
        } : undefined,
      };

      const sortByArray = [
        {
          field: sortBy,
          direction: sortDirection,
        },
      ];

      const resp: AddressPerpTradeResponse = await fetchAddressPerpTrades({
        address: address.trim(),
        date: dateRange,
        page: page,
        perPage: perPage,
        filters: filters,
        sortBy: sortByArray,
      });

      setData(resp.data);
    } catch (e: any) {
      setError(e?.message || "Failed to load address perp trades data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (address.trim()) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, sortBy, sortDirection, from, to, selectedSides, selectedActions, sizeMin, sizeMax, valueMin, valueMax, closedPnlMin, closedPnlMax]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
            <span className="text-white font-normal text-sm">Address Perp Trades</span>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <MoreHorizontal className="w-3 h-3 text-gray-400" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {/* Top Row: Search & Primary Toggles */}
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Input
                type="text"
                placeholder="0x..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
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

              {/* Side Toggle Container - like Address/Entity */}
              <div className="hidden lg:flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5">
                {(["Long", "Short"] as const).map((side) => (
                  <Button
                    key={side}
                    variant="ghost"
                    size="sm"
                    className={`h-7 text-[10px] px-3 rounded-sm ${selectedSides[side] ? "bg-[#20222f] text-gray-200 shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
                    onClick={() => setSelectedSides((prev) => ({ ...prev, [side]: !prev[side] }))}
                  >
                    {side}
                  </Button>
                ))}
              </div>

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

            {/* Side Filter - Mobile only (desktop has toggle in header) */}
            <div className="lg:hidden space-y-1">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Side</label>
              <div className="flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5">
                {(["Long", "Short"] as const).map((side) => (
                  <Button
                    key={side}
                    variant="ghost"
                    size="sm"
                    className={`h-7 text-[10px] px-3 rounded-sm flex-1 ${selectedSides[side] ? "bg-[#20222f] text-gray-200 shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
                    onClick={() => setSelectedSides((prev) => ({ ...prev, [side]: !prev[side] }))}
                  >
                    {side}
                  </Button>
                ))}
              </div>
            </div>

            {/* Action Filter */}
            <div className="lg:col-span-3">
              <div className="flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5">
                {(["Add", "Open", "Close", "Reduce"] as const).map((action) => (
                  <Button
                    key={action}
                    variant="ghost"
                    size="sm"
                    className={`h-7 text-[10px] px-2 rounded-sm flex-1 ${selectedActions[action] ? "bg-[#20222f] text-gray-200 shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
                    onClick={() => setSelectedActions((prev) => ({ ...prev, [action]: !prev[action] }))}
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </div>

            {/* Size Range */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  step="0.001"
                  placeholder="Min"
                  value={sizeMin}
                  onChange={(e) => setSizeMin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && load()}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white flex-1"
                />
                <span className="text-xs text-gray-500">-</span>
                <Input
                  type="number"
                  step="0.001"
                  placeholder="Max"
                  value={sizeMax}
                  onChange={(e) => setSizeMax(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && load()}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white flex-1"
                />
              </div>
            </div>

            {/* Per Page Dropdown */}
            <div className="lg:col-span-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full h-8 justify-between bg-[#171a26] border-[#20222f] text-gray-300 text-xs font-normal">
                    {perPage}
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

            {/* Apply Button */}
            <div className="lg:col-span-2">
              <Button
                variant="outline"
                className="w-full h-8 bg-[#171a26] border-[#20222f] text-gray-200 text-xs font-normal hover:bg-[#20222f]"
                onClick={load}
                disabled={loading}
              >
                {loading ? <Loader className="w-3 h-3 animate-spin" /> : "Apply"}
              </Button>
            </div>

            {/* Value USD Range */}
            <div className="lg:col-span-6">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Value Min"
                  value={valueMin}
                  onChange={(e) => setValueMin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && load()}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
                />
                <span className="text-xs text-gray-500">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={valueMax}
                  onChange={(e) => setValueMax(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && load()}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
                />
              </div>
            </div>

            {/* Closed PnL Range */}
            <div className="lg:col-span-6">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="PnL Min"
                  value={closedPnlMin}
                  onChange={(e) => setClosedPnlMin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && load()}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1"
                />
                <span className="text-xs text-gray-500">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={closedPnlMax}
                  onChange={(e) => setClosedPnlMax(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && load()}
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

            {data.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="2xl:static 2xl:left-auto sticky left-0 z-10 bg-[#141723] pl-4 pr-3 py-2 rounded-l flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-blue-500/20">
                      <BarChart3 className="w-3 h-3 text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-white">Address Perp Trades</span>
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
                    <div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[120px] py-2 pl-7 pr-3 rounded-l border-y border-l border-transparent">
                      <div className="h-6 w-6" />
                      <div className="min-w-[60px]">Token</div>
                    </div>
                    <div className="flex-1 flex items-center justify-end min-w-0 gap-0 py-2 pr-3 border-y border-r border-transparent">
                      <div className="w-[70px] text-center">Side</div>
                      <div className="w-[100px] text-center">Action</div>
                      <div className="w-[80px] text-center">Size</div>
                      <div className="w-[80px] text-center">Price</div>
                      <div className="w-[90px] text-center">Value USD</div>
                      <div className="w-[100px] text-center">Closed PnL</div>
                      <div className="w-[90px] text-center">Fee</div>
                      <div className="w-[160px] text-center">Tx Hash</div>
                      <div className="w-[130px] text-center">Timestamp</div>
                    </div>
                  </div>
                  {data.map((trade, idx) => {
                    const isLong = trade.side === "Long";
                    const isPositive = trade.closed_pnl >= 0;

                    return (
                      <div
                        key={`${trade.oid}-${idx}`}
                        className="flex items-stretch group whitespace-nowrap"
                      >
                        {/* Sticky Column - Token */}
                        <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                          <div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-2 min-w-[120px] ml-0 pl-3 py-2.5 rounded-l transition-colors duration-150">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="w-4 h-4 text-gray-400" />
                            </Button>
                            <div className="text-xs text-white font-medium min-w-[60px]">
                              {trade.token_symbol}
                            </div>
                          </div>
                        </div>

                        {/* Main Content - Right aligned group */}
                        <div className="flex-1 flex items-center justify-end min-w-0 gap-0 pr-3 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors duration-150">
                          {/* Side */}
                          <div className="w-[70px] flex justify-center">
                            <Badge
                              variant="secondary"
                              className={`text-[10px] h-5 border-0 px-2 rounded-full ${isLong
                                ? "bg-green-500/20 text-green-300"
                                : "bg-red-500/20 text-red-300"
                                }`}
                            >
                              {trade.side}
                            </Badge>
                          </div>

                          {/* Action */}
                          <div className="w-[100px] flex justify-center">
                            <Badge
                              variant="secondary"
                              className={`text-[10px] h-5 border-0 px-2 rounded-full bg-purple-500/20 text-purple-300 ${trade.crossed ? "ring-1 ring-purple-400/40" : ""}`}
                            >
                              {trade.action}{trade.crossed && <span className="ml-1 text-purple-400">×</span>}
                            </Badge>
                          </div>

                          {/* Size */}
                          <div className="w-[80px] text-center">
                            <div className="text-xs font-medium text-gray-300 font-mono tabular-nums">{formatNumber(trade.size)}</div>
                          </div>

                          {/* Price */}
                          <div className="w-[80px] text-center">
                            <div className="text-xs font-medium text-gray-300 font-mono tabular-nums">{formatUSD(trade.price)}</div>
                          </div>

                          {/* Value USD */}
                          <div className="w-[90px] text-center">
                            <div className="text-xs font-semibold text-gray-300 font-mono tabular-nums">{formatUSD(trade.value_usd)}</div>
                          </div>

                          {/* Closed PnL */}
                          <div className="w-[100px] flex justify-center">
                            {trade.closed_pnl !== 0 ? (
                              <div className={`text-xs font-semibold font-mono tabular-nums ${isPositive ? "text-green-400" : "text-red-400"}`}>
                                {isPositive ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
                                {formatUSD(trade.closed_pnl)}
                              </div>
                            ) : (
                              <div className="text-gray-500 font-mono">-</div>
                            )}
                          </div>

                          {/* Fee */}
                          <div className="w-[90px] text-center">
                            <div className="text-xs text-gray-300 font-medium font-mono tabular-nums">
                              {formatUSD(trade.fee_usd)} <span className="text-[10px] text-gray-500">{trade.fee_token_symbol}</span>
                            </div>
                          </div>

                          {/* Transaction */}
                          <div className="w-[160px] text-center">
                            <div className="font-mono text-xs text-gray-500">
                              {trade.transaction_hash.slice(0, 10)}...{trade.transaction_hash.slice(-8)}
                            </div>
                          </div>

                          {/* Timestamp - Last Column */}
                          <div className="w-[130px] text-center">
                            <div className="text-xs text-gray-400 font-medium">
                              {new Date(trade.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
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
                  <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-400">Enter an address to view perp trades</div>
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

