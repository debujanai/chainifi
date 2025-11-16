"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, TrendingUp, TrendingDown, Loader, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { PerpScreenerData, PerpScreenerResponse, PerpScreenerFilters, PerpScreenerSortField, fetchPerpScreener, DateRange } from "@/lib/nansen-api";
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

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(4)}%`;
}

export function PerpScreenerBoard() {
  const [data, setData] = useState<PerpScreenerData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

  // Filters/controls
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [sortBy, setSortBy] = useState<PerpScreenerSortField>("buy_sell_pressure");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");

  // Filter values
  const [tokenSymbol, setTokenSymbol] = useState<string>("");
  const [onlySmartMoney, setOnlySmartMoney] = useState<boolean>(false);
  const [volumeMin, setVolumeMin] = useState<string>("");
  const [volumeMax, setVolumeMax] = useState<string>("");
  const [openInterestMin, setOpenInterestMin] = useState<string>("");
  const [openInterestMax, setOpenInterestMax] = useState<string>("");
  const [fundingMin, setFundingMin] = useState<string>("");
  const [fundingMax, setFundingMax] = useState<string>("");
  const [buySellPressureMin, setBuySellPressureMin] = useState<string>("");
  const [buySellPressureMax, setBuySellPressureMax] = useState<string>("");
  const [netPositionChangeMin, setNetPositionChangeMin] = useState<string>("");
  const [netPositionChangeMax, setNetPositionChangeMax] = useState<string>("");

  const sortFields: Array<{ value: PerpScreenerSortField; label: string }> = [
    { value: "buy_sell_pressure", label: "Buy/Sell Pressure" },
    { value: "net_position_change", label: "Net Position Change" },
    { value: "volume", label: "Volume" },
    { value: "open_interest", label: "Open Interest" },
    { value: "funding", label: "Funding" },
    { value: "mark_price", label: "Mark Price" },
    { value: "trader_count", label: "Trader Count" },
  ];

  async function load() {
    // Default date range to last 7 days if not set
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dateRange: DateRange = from && to
      ? { from, to }
      : {
          from: sevenDaysAgo.toISOString(),
          to: now.toISOString(),
        };

    setLoading(true);
    setError(null);
    try {
      const filters: PerpScreenerFilters = {
        token_symbol: tokenSymbol.trim() || undefined,
        only_smart_money: onlySmartMoney || undefined,
        volume: (volumeMin || volumeMax) ? {
          min: volumeMin ? Number(volumeMin) : undefined,
          max: volumeMax ? Number(volumeMax) : undefined,
        } : undefined,
        open_interest: (openInterestMin || openInterestMax) ? {
          min: openInterestMin ? Number(openInterestMin) : undefined,
          max: openInterestMax ? Number(openInterestMax) : undefined,
        } : undefined,
        funding: (fundingMin || fundingMax) ? {
          min: fundingMin ? Number(fundingMin) : undefined,
          max: fundingMax ? Number(fundingMax) : undefined,
        } : undefined,
        buy_sell_pressure: (buySellPressureMin || buySellPressureMax) ? {
          min: buySellPressureMin ? Number(buySellPressureMin) : undefined,
          max: buySellPressureMax ? Number(buySellPressureMax) : undefined,
        } : undefined,
        net_position_change: (netPositionChangeMin || netPositionChangeMax) ? {
          min: netPositionChangeMin ? Number(netPositionChangeMin) : undefined,
          max: netPositionChangeMax ? Number(netPositionChangeMax) : undefined,
        } : undefined,
      };

      const sortByArray = [
        {
          field: sortBy,
          direction: sortDirection,
        },
      ];

      const resp: PerpScreenerResponse = await fetchPerpScreener({
        date: dateRange,
        page: page,
        perPage: perPage,
        filters: filters,
        sortBy: sortByArray,
      });

      setData(resp.data);
    } catch (e: any) {
      setError(e?.message || "Failed to load perp screener data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, sortBy, sortDirection, from, to, onlySmartMoney]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
              <span className="text-white font-normal">Perp Screener</span>
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

        {/* Date Range Inputs */}
        <div className="flex items-center gap-2 mb-2">
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
            {/* Token Symbol */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Token Symbol</label>
              <Input
                type="text"
                placeholder="BTC, ETH, etc."
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value)}
                className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
              />
            </div>

            {/* Only Smart Money */}
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="onlySmartMoney"
                checked={onlySmartMoney}
                onChange={(e) => setOnlySmartMoney(e.target.checked)}
                className="w-4 h-4 rounded border-[#20222f] bg-[#171a26] text-blue-500"
              />
              <label htmlFor="onlySmartMoney" className="text-xs text-gray-300">
                Only Smart Money
              </label>
            </div>

            {/* Volume Range */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Volume</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={volumeMin}
                  onChange={(e) => setVolumeMin(e.target.value)}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
                />
                <span className="text-xs text-gray-500">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={volumeMax}
                  onChange={(e) => setVolumeMax(e.target.value)}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
                />
              </div>
            </div>

            {/* Open Interest Range */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Open Interest</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={openInterestMin}
                  onChange={(e) => setOpenInterestMin(e.target.value)}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
                />
                <span className="text-xs text-gray-500">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={openInterestMax}
                  onChange={(e) => setOpenInterestMax(e.target.value)}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
                />
              </div>
            </div>

            {/* Funding Range */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Funding</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.0001"
                  placeholder="Min"
                  value={fundingMin}
                  onChange={(e) => setFundingMin(e.target.value)}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
                />
                <span className="text-xs text-gray-500">-</span>
                <Input
                  type="number"
                  step="0.0001"
                  placeholder="Max"
                  value={fundingMax}
                  onChange={(e) => setFundingMax(e.target.value)}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
                />
              </div>
            </div>

            {/* Buy/Sell Pressure Range */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Buy/Sell Pressure</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={buySellPressureMin}
                  onChange={(e) => setBuySellPressureMin(e.target.value)}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
                />
                <span className="text-xs text-gray-500">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={buySellPressureMax}
                  onChange={(e) => setBuySellPressureMax(e.target.value)}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
                />
              </div>
            </div>

            {/* Net Position Change Range */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Net Position Change</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={netPositionChangeMin}
                  onChange={(e) => setNetPositionChangeMin(e.target.value)}
                  className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white"
                />
                <span className="text-xs text-gray-500">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={netPositionChangeMax}
                  onChange={(e) => setNetPositionChangeMax(e.target.value)}
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
                  <span className="text-sm font-medium text-white">Perpetual Contracts</span>
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
                  <div className="min-w-[60px]">Symbol</div>
                  <div className="flex-1">Token</div>
                  <div className="min-w-[100px]">Price</div>
                  <div className="flex items-center gap-4 min-w-0">
                    {onlySmartMoney ? (
                      <>
                        <div className="min-w-[100px] text-right">Net Pos Change</div>
                        <div className="min-w-[100px] text-right">SM Volume</div>
                        <div className="min-w-[80px] text-right">Longs</div>
                        <div className="min-w-[80px] text-right">Shorts</div>
                      </>
                    ) : (
                      <>
                        <div className="min-w-[100px] text-right">Volume</div>
                        <div className="min-w-[100px] text-right">Buy Vol</div>
                        <div className="min-w-[100px] text-right">Sell Vol</div>
                        <div className="min-w-[100px] text-right">Buy/Sell Press</div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-[100px] text-right">Open Interest</div>
                    <div className="min-w-[80px] text-right">Funding</div>
                    <div className="min-w-[60px] text-right">Traders</div>
                  </div>
                </div>
                {data.map((item, idx) => {
                  const priceChange = item.previous_price_usd ? ((item.mark_price - item.previous_price_usd) / item.previous_price_usd) * 100 : 0;
                  const isPositive = priceChange >= 0;
                  
                  return (
                    <div
                      key={`${item.token_symbol}-${idx}`}
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

                      {/* Token Symbol */}
                      <div className="font-mono text-xs text-gray-400 min-w-[60px]">
                        {item.token_symbol}
                      </div>

                      {/* Token Name */}
                      <div className="flex-1 text-sm text-white font-medium min-w-0">
                        {item.token_symbol}
                      </div>

                      {/* Price */}
                      <div className="min-w-[100px]">
                        <div className="text-xs text-gray-300 font-medium">
                          {formatUSD(item.mark_price)}
                        </div>
                        {item.previous_price_usd && (
                          <div className={`text-[10px] ${isPositive ? "text-green-400" : "text-red-400"}`}>
                            {isPositive ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
                            {Math.abs(priceChange).toFixed(2)}%
                          </div>
                        )}
                      </div>

                      {/* Metrics */}
                      <div className="flex items-center gap-4 min-w-0">
                        {onlySmartMoney ? (
                          <>
                            <div className="text-right min-w-[100px]">
                              {item.net_position_change !== undefined ? (
                                <div className={`text-xs font-medium ${item.net_position_change >= 0 ? "text-green-400" : "text-red-400"}`}>
                                  {formatUSD(item.net_position_change)}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500">-</div>
                              )}
                            </div>
                            <div className="text-right min-w-[100px]">
                              {item.smart_money_volume !== undefined ? (
                                <div className="text-xs font-medium text-gray-300">{formatUSD(item.smart_money_volume)}</div>
                              ) : (
                                <div className="text-xs text-gray-500">-</div>
                              )}
                            </div>
                            <div className="text-right min-w-[80px]">
                              {item.smart_money_longs_count !== undefined ? (
                                <div className="text-xs text-gray-300">{item.smart_money_longs_count}</div>
                              ) : (
                                <div className="text-xs text-gray-500">-</div>
                              )}
                            </div>
                            <div className="text-right min-w-[80px]">
                              {item.smart_money_shorts_count !== undefined ? (
                                <div className="text-xs text-gray-300">{item.smart_money_shorts_count}</div>
                              ) : (
                                <div className="text-xs text-gray-500">-</div>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-right min-w-[100px]">
                              {item.volume !== undefined ? (
                                <div className="text-xs font-medium text-gray-300">{formatUSD(item.volume)}</div>
                              ) : (
                                <div className="text-xs text-gray-500">-</div>
                              )}
                            </div>
                            <div className="text-right min-w-[100px]">
                              {item.buy_volume !== undefined ? (
                                <div className="text-xs font-medium text-green-400">{formatUSD(item.buy_volume)}</div>
                              ) : (
                                <div className="text-xs text-gray-500">-</div>
                              )}
                            </div>
                            <div className="text-right min-w-[100px]">
                              {item.sell_volume !== undefined ? (
                                <div className="text-xs font-medium text-red-400">{formatUSD(item.sell_volume)}</div>
                              ) : (
                                <div className="text-xs text-gray-500">-</div>
                              )}
                            </div>
                            <div className="text-right min-w-[100px]">
                              {item.buy_sell_pressure !== undefined ? (
                                <div className={`text-xs font-semibold ${item.buy_sell_pressure >= 0 ? "text-green-400" : "text-red-400"}`}>
                                  {formatUSD(item.buy_sell_pressure)}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500">-</div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      {/* Additional Info */}
                      <div className="flex items-center gap-3 text-xs text-gray-400 min-w-0">
                        <div className="min-w-[100px] text-right">
                          <div className="text-gray-300 font-medium">{formatUSD(item.open_interest)}</div>
                        </div>
                        <div className="min-w-[80px] text-right">
                          <div className={`text-gray-300 font-medium ${item.funding >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {formatPercent(item.funding)}
                          </div>
                        </div>
                        <div className="min-w-[60px] text-right">
                          <div className="text-gray-500">{item.trader_count}</div>
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
                <div className="text-sm text-gray-400">No perpetual contracts found</div>
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

