"use client";

import { useState } from "react";
import { MoreHorizontal, Plus, Loader, TrendingUp, TrendingDown, BarChart3, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { PerpPositionsResponse, PerpPositionsFilters, PerpPositionsSortField, fetchPerpPositions } from "@/lib/nansen-api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

function formatUSD(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0";
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(1)}K`;
  }
  return `$${num.toFixed(2)}`;
}

function formatNumber(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}K`;
  }
  return Math.abs(num).toFixed(2);
}

function formatPercent(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0%";
  return `${(num * 100).toFixed(2)}%`;
}

export function AddressPerpPositionsBoard() {
  const [data, setData] = useState<PerpPositionsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [address, setAddress] = useState<string>("");
  const [sortBy, setSortBy] = useState<PerpPositionsSortField>("position_value_usd");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [positionValueMin, setPositionValueMin] = useState<string>("");
  const [positionValueMax, setPositionValueMax] = useState<string>("");
  const [upnlMin, setUpnlMin] = useState<string>("");
  const [upnlMax, setUpnlMax] = useState<string>("");

  const sortFields: Array<{ value: PerpPositionsSortField; label: string }> = [
    { value: "position_value_usd", label: "Position Value" },
    { value: "unrealized_pnl_usd", label: "Unrealized PnL" },
    { value: "entry_price_usd", label: "Entry Price" },
    { value: "liquidation_price_usd", label: "Liquidation Price" },
    { value: "leverage_value", label: "Leverage" },
    { value: "margin_used_usd", label: "Margin Used" },
    { value: "return_on_equity", label: "Return on Equity" },
    { value: "token_symbol", label: "Token Symbol" },
  ];

  async function load() {
    if (!address.trim()) {
      setError("Please enter an address");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const filters: PerpPositionsFilters = {
        position_value_usd: (positionValueMin || positionValueMax) ? {
          min: positionValueMin ? Number(positionValueMin) : undefined,
          max: positionValueMax ? Number(positionValueMax) : undefined,
        } : undefined,
        unrealized_pnl_usd: (upnlMin || upnlMax) ? {
          min: upnlMin ? Number(upnlMin) : undefined,
          max: upnlMax ? Number(upnlMax) : undefined,
        } : undefined,
      };

      const sortByArray = [
        {
          field: sortBy,
          direction: sortDirection,
        },
      ];

      const resp: PerpPositionsResponse = await fetchPerpPositions({
        address: address.trim(),
        filters: filters,
        sortBy: sortByArray,
      });

      setData(resp);
    } catch (e: any) {
      setError(e?.message || "Failed to load perp positions data");
    } finally {
      setLoading(false);
    }
  }

  const positions = data?.data?.asset_positions || [];

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
              <span className="text-white font-normal text-sm">Address Perp Positions</span>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <MoreHorizontal className="w-3 h-3 text-gray-400" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {/* Top Row: Search & Primary Actions */}
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Input
                type="text"
                placeholder="Enter Hyperliquid address (0x...)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load()}
                className="flex-1 h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 min-w-[200px]"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-normal border border-blue-500/20"
                onClick={load}
                disabled={loading}
              >
                {loading ? <Loader className="w-3 h-3 animate-spin" /> : "Load"}
              </Button>
            </div>

            {/* Secondary Row: Toggles & Filter Trigger */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden h-8 px-3 text-xs border-[#20222f] bg-[#171a26] text-gray-300"
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <Filter className="w-3 h-3 mr-2" />
                Filters
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={`h-8 text-xs font-normal hidden lg:flex ${filterOpen ? "bg-[#272936] text-white" : "bg-[#20222f] hover:bg-[#272936] text-gray-300"}`}
                onClick={() => setFilterOpen((v) => !v)}
              >
                Filters
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs border-[#20222f] bg-[#171a26] text-gray-300 hover:bg-[#20222f] hover:text-gray-200">
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
        </div>
      </div>

      {filterOpen && (
        <div className="px-4 py-4 border-b border-[#20222f] bg-[#1a1c29]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Position Value Range */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Position Value USD</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={positionValueMin}
                  onChange={(e) => setPositionValueMin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && load()}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500"
                />
                <span className="text-xs text-gray-500">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={positionValueMax}
                  onChange={(e) => setPositionValueMax(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && load()}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500"
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
                  onKeyDown={(e) => e.key === "Enter" && load()}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500"
                />
                <span className="text-xs text-gray-500">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={upnlMax}
                  onChange={(e) => setUpnlMax(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && load()}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

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

            {data && positions.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="2xl:static 2xl:left-auto sticky left-0 z-10 bg-[#141723] pl-4 pr-3 py-2 rounded-l flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-blue-500/20">
                      <BarChart3 className="w-3 h-3 text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-white">Perp Positions</span>
                    <span className="text-xs text-gray-500">{positions.length}</span>
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
                    <div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[80px] py-2 pl-7 pr-3 rounded-l border-y border-l border-transparent">
                      <div className="h-6 w-6" />
                      <div className="min-w-[60px]">Symbol</div>
                    </div>
                    <div className="flex-1 flex items-center justify-between min-w-0 gap-4 py-2 pr-3 border-y border-r border-transparent">
                      <div className="flex-1 min-w-[100px]">Token</div>
                      <div className="min-w-[100px]">Side</div>
                      <div className="min-w-[100px] text-right">Position Value</div>
                      <div className="min-w-[100px] text-right">Entry Price</div>
                      <div className="min-w-[80px] text-right">Leverage</div>
                      <div className="min-w-[100px] text-right">Unrealized PnL</div>
                      <div className="min-w-[100px] text-right">Margin Used</div>
                      <div className="min-w-[100px] text-right">Liquidation</div>
                    </div>
                  </div>

                  {/* Data Rows */}
                  {positions.map((asset, idx) => {
                    const pos = asset.position;
                    const size = parseFloat(pos.size);
                    const isLong = size > 0;
                    const upnl = parseFloat(pos.unrealized_pnl_usd);
                    const isPositive = upnl >= 0;

                    return (
                      <div
                        key={`${pos.token_symbol}-${idx}`}
                        className="flex items-stretch group whitespace-nowrap"
                      >
                        {/* Sticky Column */}
                        <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                          <div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-2 min-w-[80px] ml-0 pl-3 py-2.5 rounded-l transition-colors duration-150">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="w-4 h-4 text-gray-400" />
                            </Button>
                            <div className="font-mono text-xs text-gray-400 min-w-[60px]">
                              {pos.token_symbol}
                            </div>
                          </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 flex items-center justify-between min-w-0 gap-4 pr-3 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors duration-150">
                          <div className="flex-1 text-xs text-white font-medium min-w-[100px]">
                            {pos.token_symbol}
                          </div>

                          <div className="min-w-[100px] flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className={`text-[10px] h-5 border-0 px-2 rounded-full ${isLong
                                ? "bg-green-500/20 text-green-300"
                                : "bg-red-500/20 text-red-300"
                                }`}
                            >
                              {isLong ? "Long" : "Short"}
                            </Badge>
                            <span className="text-[10px] text-gray-500 font-mono">{formatNumber(size)}</span>
                          </div>

                          <div className="text-right min-w-[100px]">
                            <div className="text-xs font-semibold text-gray-300 font-mono tabular-nums">{formatUSD(pos.position_value_usd)}</div>
                          </div>
                          <div className="text-right min-w-[100px]">
                            <div className="text-xs font-medium text-gray-300 font-mono tabular-nums">{formatUSD(pos.entry_price_usd)}</div>
                          </div>
                          <div className="text-right min-w-[80px]">
                            <div className="text-xs font-medium text-gray-300 font-mono tabular-nums">
                              {pos.leverage_value}X <span className="text-[10px] text-gray-500 ml-1">{pos.leverage_type}</span>
                            </div>
                          </div>
                          <div className="min-w-[100px] text-right">
                            <div className={`text-xs font-semibold font-mono tabular-nums ${isPositive ? "text-green-400" : "text-red-400"}`}>
                              {isPositive ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
                              {formatUSD(pos.unrealized_pnl_usd)}
                              <span className="text-[10px] ml-1 opacity-70">({formatPercent(pos.return_on_equity)})</span>
                            </div>
                          </div>
                          <div className="min-w-[100px] text-right">
                            <div className="text-gray-300 font-medium font-mono tabular-nums">{formatUSD(pos.margin_used_usd)}</div>
                          </div>
                          <div className="min-w-[100px] text-right">
                            <div className="text-gray-300 font-medium font-mono tabular-nums">{formatUSD(pos.liquidation_price_usd)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {data && positions.length === 0 && (
              <div className="flex items-center justify-center py-12 ml-4">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-400">No perp positions found for this address</div>
                </div>
              </div>
            )}

            {!loading && !data && !error && (
              <div className="flex items-center justify-center py-12 ml-4">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-400">Enter an address to view perp positions</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

