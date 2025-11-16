"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, Loader, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
              <span className="text-white font-normal">Address Perp Trades</span>
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

        {/* Address Input */}
        <div className="flex items-center gap-2 mb-2">
          <Input
            type="text"
            placeholder="Enter Hyperliquid address (0x...)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
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
            {/* Side Filter */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Side</label>
              <div className="flex flex-wrap gap-1.5">
                {(["Long", "Short"] as const).map((side) => (
                  <Button
                    key={side}
                    variant={selectedSides[side] ? "secondary" : "outline"}
                    size="sm"
                    className={`h-7 text-xs ${selectedSides[side] ? "bg-blue-500/20 border-blue-500/50 text-blue-300" : "border-[#20222f] text-gray-400 hover:bg-[#20222f]"}`}
                    onClick={() => setSelectedSides((prev) => ({ ...prev, [side]: !prev[side] }))}
                  >
                    {side}
                  </Button>
                ))}
              </div>
            </div>

            {/* Action Filter */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Action</label>
              <div className="flex flex-wrap gap-1.5">
                {(["Add", "Open", "Close", "Reduce"] as const).map((action) => (
                  <Button
                    key={action}
                    variant={selectedActions[action] ? "secondary" : "outline"}
                    size="sm"
                    className={`h-7 text-xs ${selectedActions[action] ? "bg-purple-500/20 border-purple-500/50 text-purple-300" : "border-[#20222f] text-gray-400 hover:bg-[#20222f]"}`}
                    onClick={() => setSelectedActions((prev) => ({ ...prev, [action]: !prev[action] }))}
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </div>

            {/* Size Range */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Size</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.001"
                  placeholder="Min"
                  value={sizeMin}
                  onChange={(e) => setSizeMin(e.target.value)}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
                />
                <span className="text-xs text-gray-500">-</span>
                <Input
                  type="number"
                  step="0.001"
                  placeholder="Max"
                  value={sizeMax}
                  onChange={(e) => setSizeMax(e.target.value)}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
                />
              </div>
            </div>

            {/* Value USD Range */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Value USD</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={valueMin}
                  onChange={(e) => setValueMin(e.target.value)}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
                />
                <span className="text-xs text-gray-500">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={valueMax}
                  onChange={(e) => setValueMax(e.target.value)}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
                />
              </div>
            </div>

            {/* Closed PnL Range */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Closed PnL USD</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={closedPnlMin}
                  onChange={(e) => setClosedPnlMin(e.target.value)}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
                />
                <span className="text-xs text-gray-500">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={closedPnlMax}
                  onChange={(e) => setClosedPnlMax(e.target.value)}
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
                {/* Header row to explain columns */}
                <div className="flex items-center gap-3 px-3 py-2 text-[10px] uppercase tracking-wide text-gray-500">
                  <div className="h-6 w-6" />
                  <div className="min-w-[140px]">Timestamp</div>
                  <div className="min-w-[60px]">Symbol</div>
                  <div className="flex-1">Token</div>
                  <div className="min-w-[80px]">Side</div>
                  <div className="min-w-[80px]">Action</div>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-[100px] text-right">Size</div>
                    <div className="min-w-[100px] text-right">Price</div>
                    <div className="min-w-[100px] text-right">Value USD</div>
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-[100px] text-right">Closed PnL</div>
                    <div className="min-w-[80px] text-right">Fee</div>
                    <div className="min-w-[200px]">Transaction</div>
                  </div>
                </div>
                {data.map((trade, idx) => {
                  const isLong = trade.side === "Long";
                  const isPositive = trade.closed_pnl >= 0;
                  
                  return (
                    <div
                      key={`${trade.oid}-${idx}`}
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

                      {/* Timestamp */}
                      <div className="text-xs text-gray-300 font-medium min-w-[140px]">
                        {new Date(trade.timestamp).toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>

                      {/* Token Symbol (like Task ID) */}
                      <div className="font-mono text-xs text-gray-400 min-w-[60px]">
                        {trade.token_symbol}
                      </div>

                      {/* Token Name (like Task Title) */}
                      <div className="flex-1 text-sm text-white font-medium min-w-0">
                        {trade.token_symbol}
                      </div>

                      {/* Side */}
                      <div className="min-w-[80px]">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] h-5 border-0 px-2 rounded-full ${
                            isLong
                              ? "bg-green-500/20 text-green-300"
                              : "bg-red-500/20 text-red-300"
                          }`}
                        >
                          {trade.side}
                        </Badge>
                      </div>

                      {/* Action */}
                      <div className="min-w-[80px]">
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-5 border-0 px-2 rounded-full bg-purple-500/20 text-purple-300"
                        >
                          {trade.action}
                        </Badge>
                        {trade.crossed && (
                          <div className="text-[10px] text-gray-500 mt-0.5">Crossed</div>
                        )}
                      </div>

                      {/* Size, Price, Value */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="text-right min-w-[100px]">
                          <div className="text-xs font-medium text-gray-300">{formatNumber(trade.size)}</div>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <div className="text-xs font-medium text-gray-300">{formatUSD(trade.price)}</div>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <div className="text-xs font-semibold text-gray-300">{formatUSD(trade.value_usd)}</div>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="flex items-center gap-3 text-xs text-gray-400 min-w-0">
                        <div className="min-w-[100px] text-right">
                          {trade.closed_pnl !== 0 ? (
                            <div className={`text-xs font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                              {isPositive ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
                              {formatUSD(trade.closed_pnl)}
                            </div>
                          ) : (
                            <div className="text-gray-500">-</div>
                          )}
                        </div>
                        <div className="min-w-[80px] text-right">
                          <div className="text-gray-300 font-medium">{formatUSD(trade.fee_usd)}</div>
                          <div className="text-[10px] text-gray-500">{trade.fee_token_symbol}</div>
                        </div>
                        <div className="min-w-[200px]">
                          <div className="font-mono text-xs text-gray-500">
                            {trade.transaction_hash.slice(0, 10)}...{trade.transaction_hash.slice(-8)}
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
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <div className="text-sm text-gray-400">Enter an address to view perp trades</div>
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

