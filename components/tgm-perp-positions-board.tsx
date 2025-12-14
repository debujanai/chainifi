"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, TrendingUp, TrendingDown, Loader, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { TGMPerpPositionsData, TGMPerpPositionsResponse, TGMPerpPositionsFilters, TGMPerpPositionsSortField, fetchTGMPerpPositions } from "@/lib/nansen-api";
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

export function TGMPerpPositionsBoard() {
  const [data, setData] = useState<TGMPerpPositionsData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

  // Filters/controls
  const [tokenSymbol, setTokenSymbol] = useState<string>("");
  const [labelType, setLabelType] = useState<"smart_money" | "all_traders" | "whale" | "public_figure" | "exchange">("all_traders");
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [sortBy, setSortBy] = useState<TGMPerpPositionsSortField>("position_value_usd");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");

  // Filter values
  const [includeSmartMoneyLabels, setIncludeSmartMoneyLabels] = useState<string[]>([]);
  const [positionValueMin, setPositionValueMin] = useState<string>("");
  const [positionValueMax, setPositionValueMax] = useState<string>("");
  const [upnlMin, setUpnlMin] = useState<string>("");
  const [upnlMax, setUpnlMax] = useState<string>("");
  const [selectedSides, setSelectedSides] = useState<Record<"Long" | "Short", boolean>>({ Long: true, Short: true });

  const sortFields: Array<{ value: TGMPerpPositionsSortField; label: string }> = [
    { value: "position_value_usd", label: "Position Value" },
    { value: "upnl_usd", label: "Unrealized PnL" },
    { value: "leverage", label: "Leverage" },
    { value: "entry_price", label: "Entry Price" },
    { value: "mark_price", label: "Mark Price" },
    { value: "liquidation_price", label: "Liquidation Price" },
    { value: "position_size", label: "Position Size" },
    { value: "funding_usd", label: "Funding USD" },
    { value: "address", label: "Address" },
  ];

  const labelTypeOptions = [
    { value: "all_traders" as const, label: "All Traders" },
    { value: "smart_money" as const, label: "Smart Money" },
    { value: "whale" as const, label: "Whale" },
    { value: "public_figure" as const, label: "Public Figure" },
    { value: "exchange" as const, label: "Exchange" },
  ];

  async function load() {
    if (!tokenSymbol.trim()) {
      setError("Please enter a token symbol");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const filters: TGMPerpPositionsFilters = {
        include_smart_money_labels: includeSmartMoneyLabels.length > 0 ? includeSmartMoneyLabels : undefined,
        position_value_usd: (positionValueMin || positionValueMax) ? {
          min: positionValueMin ? Number(positionValueMin) : undefined,
          max: positionValueMax ? Number(positionValueMax) : undefined,
        } : undefined,
        upnl_usd: (upnlMin || upnlMax) ? {
          min: upnlMin ? Number(upnlMin) : undefined,
          max: upnlMax ? Number(upnlMax) : undefined,
        } : undefined,
        side: Object.entries(selectedSides)
          .filter(([_, selected]) => selected)
          .map(([side]) => side as "Long" | "Short"),
      };

      const sortByArray = [
        {
          field: sortBy,
          direction: sortDirection,
        },
      ];

      const resp: TGMPerpPositionsResponse = await fetchTGMPerpPositions({
        tokenSymbol: tokenSymbol.trim(),
        labelType: labelType,
        page: page,
        perPage: perPage,
        filters: filters,
        sortBy: sortByArray,
      });

      setData(resp.data);
    } catch (e: any) {
      setError(e?.message || "Failed to load perp positions data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tokenSymbol.trim()) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, sortBy, sortDirection, labelType, positionValueMin, positionValueMax, upnlMin, upnlMax, selectedSides]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
              <span className="text-white font-normal">Token Mode Perp Positions</span>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal min-w-[120px]">
                {labelTypeOptions.find((o) => o.value === labelType)?.label || labelType}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
              {labelTypeOptions.map((option) => (
                <DropdownMenuItem key={option.value} onClick={() => { setLabelType(option.value); }}>
                  {option.label}
                </DropdownMenuItem>
              ))}
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

            {/* Unrealized PnL Range */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Unrealized PnL USD</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={upnlMin}
                  onChange={(e) => setUpnlMin(e.target.value)}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
                />
                <span className="text-xs text-gray-500">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={upnlMax}
                  onChange={(e) => setUpnlMax(e.target.value)}
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
                  <span className="text-sm font-medium text-white">Perp Positions</span>
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
                {/* Header row */}
                <div className="flex items-center gap-3 px-3 py-2 text-[10px] uppercase tracking-wide text-gray-500">
                  <div className="h-6 w-6" />
                  <div className="w-[200px] flex-shrink-0">Address</div>
                  <div className="w-[160px] flex-shrink-0">Label</div>
                  <div className="min-w-[80px]">Side</div>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-[100px] text-right">Position Value</div>
                    <div className="min-w-[80px] text-right">Size</div>
                    <div className="min-w-[70px] text-right">Leverage</div>
                    <div className="min-w-[100px] text-right">Entry Price</div>
                    <div className="min-w-[100px] text-right">Mark Price</div>
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-[100px] text-right">Unrealized PnL</div>
                    <div className="min-w-[80px] text-right">Funding</div>
                    <div className="min-w-[100px] text-right">Liquidation</div>
                  </div>
                </div>
                {data.map((item, idx) => {
                  const isLong = item.side === "Long";
                  const isPositive = item.upnl_usd >= 0;
                  
                  return (
                    <div
                      key={`${item.address}-${idx}`}
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

                      {/* Address */}
                      <div className="font-mono text-xs text-gray-400 w-[200px] flex-shrink-0">
                        {item.address.slice(0, 6)}...{item.address.slice(-4)}
                      </div>

                      {/* Label */}
                      <div className="w-[160px] flex-shrink-0 text-sm text-white font-medium">
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-4 bg-gray-700/50 text-gray-300 border-0 px-1.5 rounded-full"
                        >
                          {item.address_label || "Unknown"}
                        </Badge>
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
                          {item.side}
                        </Badge>
                      </div>

                      {/* Metrics */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="text-right min-w-[100px]">
                          <div className="text-xs font-medium text-gray-300">{formatUSD(item.position_value_usd)}</div>
                        </div>
                        <div className="text-right min-w-[80px]">
                          <div className="text-xs text-gray-300">{formatNumber(item.position_size)}</div>
                        </div>
                        <div className="text-right min-w-[70px]">
                          <div className="text-xs text-gray-300">{item.leverage}</div>
                          <div className="text-[10px] text-gray-500">{item.leverage_type}</div>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <div className="text-xs font-medium text-gray-300">{formatUSD(item.entry_price)}</div>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <div className="text-xs font-medium text-gray-300">{formatUSD(item.mark_price)}</div>
                        </div>
                      </div>
                      {/* Additional Info */}
                      <div className="flex items-center gap-3 text-xs text-gray-400 min-w-0 ml-auto">
                        <div className="min-w-[100px] text-right">
                          <div className={`text-xs font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                            {isPositive ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
                            {formatUSD(item.upnl_usd)}
                          </div>
                        </div>
                        <div className="min-w-[80px] text-right">
                          <div className={`text-xs font-medium ${item.funding_usd >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {formatUSD(item.funding_usd)}
                          </div>
                        </div>
                        <div className="min-w-[100px] text-right">
                          <div className="text-xs text-gray-300">{formatUSD(item.liquidation_price)}</div>
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
                <div className="text-sm text-gray-400">Enter a token symbol to view perp positions</div>
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

