"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Loader, TrendingUp, TrendingDown, User, Building2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { AddressPnlData, AddressPnlResponse, AddressPnlSummaryResponse, fetchAddressPnl, fetchAddressPnlSummary } from "@/lib/nansen-api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

function formatUSD(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function PnlBoard() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<AddressPnlData[]>([]);
  const [summary, setSummary] = useState<AddressPnlSummaryResponse | null>(null);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [isLastPage, setIsLastPage] = useState<boolean>(true);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

  // Filters/controls
  const [useEntity, setUseEntity] = useState<boolean>(false);
  const [address, setAddress] = useState<string>("0x39d52da6beec991f075eebe577474fd105c5caec");
  const [entityName, setEntityName] = useState<string>("Coinbase");
  const [chain, setChain] = useState<string>("ethereum");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [sortBy, setSortBy] = useState<"realized" | "unrealized" | "roi">("realized");
  const [sortDirection, setSortDirection] = useState<"DESC" | "ASC">("DESC");
  const [showRealized, setShowRealized] = useState<boolean>(true);

  const availableChains = ["ethereum", "solana", "arbitrum", "polygon", "base", "optimism", "all"];

  async function load() {
    if (!address.trim() && !useEntity) {
      setError("Please enter an address or entity name");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const date = from && to ? { from, to } : undefined;

      // Load summary
      const summaryResp: AddressPnlSummaryResponse = await fetchAddressPnlSummary({
        address: useEntity ? undefined : address.trim() || undefined,
        entityName: useEntity ? (entityName.trim() || undefined) : undefined,
        chain: chain,
        date,
      });
      setSummary(summaryResp);

      // Load detailed PnL
      const sortField = 
        sortBy === "realized" ? "pnl_usd_realised" :
        sortBy === "unrealized" ? "pnl_usd_unrealised" :
        "roi_percent_realised";

      const resp: AddressPnlResponse = await fetchAddressPnl({
        address: useEntity ? undefined : address.trim() || undefined,
        entityName: useEntity ? (entityName.trim() || undefined) : undefined,
        chain: chain,
        date,
        showRealized: showRealized,
        page,
        perPage,
        sortBy: [{ field: sortField, direction: sortDirection }],
      });
      setRows(resp.data);
      setIsLastPage(resp.pagination?.is_last_page ?? true);
    } catch (e: any) {
      setError(e?.message || "Failed to load PnL data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if ((address.trim() || useEntity) && !loading) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain, page, perPage, sortBy, sortDirection, showRealized]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
              <span className="text-white font-normal">Address PnL & Trade Performance</span>
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
                  Sort: {sortBy === "realized" ? "Realized" : sortBy === "unrealized" ? "Unrealized" : "ROI"} {sortDirection === "DESC" ? "↓" : "↑"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[12rem]">
                <DropdownMenuItem onClick={() => setSortBy("realized")}>Sort by Realized PnL</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("unrealized")}>Sort by Unrealized PnL</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("roi")}>Sort by ROI</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortDirection(sortDirection === "DESC" ? "ASC" : "DESC")}>
                  Direction: {sortDirection === "DESC" ? "Descending" : "Ascending"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Address/Entity Input */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-2">
            <Button
              variant={useEntity ? "outline" : "secondary"}
              size="sm"
              className={`h-8 text-xs ${useEntity ? "border-[#20222f] text-gray-400 hover:bg-[#20222f]" : "bg-blue-500/20 border-blue-500/50 text-blue-300"}`}
              onClick={() => setUseEntity(false)}
            >
              <User className="w-3 h-3 mr-1" /> Address
            </Button>
            <Button
              variant={useEntity ? "secondary" : "outline"}
              size="sm"
              className={`h-8 text-xs ${useEntity ? "bg-purple-500/20 border-purple-500/50 text-purple-300" : "border-[#20222f] text-gray-400 hover:bg-[#20222f]"}`}
              onClick={() => setUseEntity(true)}
            >
              <Building2 className="w-3 h-3 mr-1" /> Entity
            </Button>
          </div>
          {!useEntity ? (
            <Input
              type="text"
              placeholder="Enter address (0x...)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              className="flex-1 h-8 text-xs bg-[#141723] border-[#20222f] text-white placeholder:text-gray-500"
            />
          ) : (
            <Input
              type="text"
              placeholder="Enter entity name"
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              className="flex-1 h-8 text-xs bg-[#141723] border-[#20222f] text-white placeholder:text-gray-500"
            />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal min-w-[100px]">
                {chain.charAt(0).toUpperCase() + chain.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
              {availableChains.map((c) => (
                <DropdownMenuItem key={c} onClick={() => { setChain(c); setPage(1); }}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Date Range</label>
              <div className="flex gap-2">
                <Input
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="From (YYYY-MM-DD)"
                  className="h-8 bg-[#171a26] border-[#20222f] text-sm text-gray-200 placeholder:text-gray-500"
                />
                <Input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="To (YYYY-MM-DD)"
                  className="h-8 bg-[#171a26] border-[#20222f] text-sm text-gray-200 placeholder:text-gray-500"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal"
                onClick={() => { setPage(1); load(); }}
              >
                <Calendar className="w-3 h-3 mr-1" /> Apply Range
              </Button>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Options</label>
              <Button
                variant={showRealized ? "secondary" : "outline"}
                size="sm"
                className={`h-8 text-xs justify-start ${showRealized ? "bg-green-500/20 border-green-500/50 text-green-300" : "border-[#20222f] text-gray-400 hover:bg-[#20222f]"}`}
                onClick={() => setShowRealized(!showRealized)}
              >
                {showRealized ? "✓" : ""} Show Realized PnL
              </Button>
            </div>
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

          {/* Summary Stats */}
          {summary && (
            <div className="mb-6 p-4 bg-[#171a26] border border-[#20222f] rounded">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Realized PnL</div>
                  <div className={`text-lg font-semibold ${summary.realized_pnl_usd >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {formatUSD(summary.realized_pnl_usd)}
                  </div>
                  <div className={`text-xs ${summary.realized_pnl_percent >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {formatPercent(summary.realized_pnl_percent)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Win Rate</div>
                  <div className="text-lg font-semibold text-blue-300">{summary.win_rate.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Traded Tokens</div>
                  <div className="text-lg font-semibold text-gray-300">{summary.traded_token_count}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Traded Times</div>
                  <div className="text-lg font-semibold text-gray-300">{summary.traded_times}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Top 5 Tokens</div>
                  <div className="text-lg font-semibold text-gray-300">{summary.top5_tokens.length}</div>
                </div>
              </div>

              {/* Top 5 Tokens */}
              {summary.top5_tokens.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Top 5 Profitable Tokens</div>
                  <div className="flex flex-wrap gap-2">
                    {summary.top5_tokens.map((token, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className={`text-[10px] h-6 px-3 rounded-full ${
                          token.realized_pnl >= 0
                            ? "bg-green-500/20 text-green-300 border-green-500/50"
                            : "bg-red-500/20 text-red-300 border-red-500/50"
                        }`}
                      >
                        {token.token_symbol}: {formatUSD(token.realized_pnl)} ({formatPercent(token.realized_roi)})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Detailed PnL Table */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 text-[10px] uppercase tracking-wide text-gray-500 w-full">
              <div className="h-6 w-6 flex-shrink-0" />
              <div className="w-[120px] flex-shrink-0">Symbol</div>
              <div className="w-[100px] flex-shrink-0">Price</div>
              <div className="flex items-center gap-4 flex-1 justify-end">
                <div className="w-[100px] text-right">Realized PnL</div>
                <div className="w-[100px] text-right">Unrealized PnL</div>
                <div className="w-[80px] text-right">ROI %</div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="w-[90px] text-right">Bought</div>
                <div className="w-[90px] text-right">Sold</div>
                <div className="w-[90px] text-right">Holding</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-[50px] text-right">Buys</div>
                <div className="w-[50px] text-right">Sells</div>
              </div>
            </div>

            <div className="space-y-1">
              {rows.map((r, idx) => {
                const totalPnl = r.pnl_usd_realised + r.pnl_usd_unrealised;
                const isPositive = totalPnl >= 0;
                
                return (
                  <div
                    key={`${r.token_address}-${idx}`}
                    className="flex items-center gap-2 px-3 py-2.5 bg-[#171a26] border border-[#20222f] rounded hover:bg-[#1c1e2b] hover:border-[#272936] transition-colors group w-full"
                  >
                    {/* Three dots menu */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </Button>

                    {/* Symbol */}
                    <div className="w-[120px] flex-shrink-0">
                      <div className="text-sm text-white font-medium">{r.token_symbol}</div>
                      <div className="text-xs text-gray-400 font-mono truncate">{r.token_address.slice(0, 8)}...</div>
                    </div>

                    {/* Price */}
                    <div className="w-[100px] flex-shrink-0 text-xs text-gray-300">
                      ${r.token_price.toFixed(2)}
                    </div>

                    {/* PnL Values */}
                    <div className="flex items-center gap-4 flex-1 justify-end">
                      <div className="w-[100px] text-right">
                        <div className="text-[10px] text-gray-500">Realized</div>
                        <div className={`text-xs font-semibold ${r.pnl_usd_realised >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {formatUSD(r.pnl_usd_realised)}
                        </div>
                        <div className={`text-[10px] ${r.roi_percent_realised >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {formatPercent(r.roi_percent_realised)}
                        </div>
                      </div>
                      <div className="w-[100px] text-right">
                        <div className="text-[10px] text-gray-500">Unrealized</div>
                        <div className={`text-xs font-semibold ${r.pnl_usd_unrealised >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {formatUSD(r.pnl_usd_unrealised)}
                        </div>
                        <div className={`text-[10px] ${r.roi_percent_unrealised >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {formatPercent(r.roi_percent_unrealised)}
                        </div>
                      </div>
                      <div className="w-[80px] text-right">
                        <div className="text-[10px] text-gray-500">Total ROI</div>
                        <div className={`text-xs font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                          {formatPercent(r.roi_percent_realised + r.roi_percent_unrealised)}
                        </div>
                      </div>
                    </div>

                    {/* Trading Stats */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-[90px] text-right text-xs text-gray-300">
                        <div className="text-[10px] text-gray-500">Bought</div>
                        <div>{formatUSD(r.bought_usd)}</div>
                      </div>
                      <div className="w-[90px] text-right text-xs text-gray-300">
                        <div className="text-[10px] text-gray-500">Sold</div>
                        <div>{formatUSD(r.sold_usd)}</div>
                      </div>
                      <div className="w-[90px] text-right text-xs text-gray-300">
                        <div className="text-[10px] text-gray-500">Holding</div>
                        <div>{formatUSD(r.holding_usd)}</div>
                      </div>
                    </div>

                    {/* Trade Counts */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-[50px] text-right text-xs text-gray-400">
                        {r.nof_buys}
                      </div>
                      <div className="w-[50px] text-right text-xs text-gray-400">
                        {r.nof_sells}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-xs text-gray-400">
              Page {page} {isLastPage ? "(last page)" : ""}
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal">
                    Per page: {perPage}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {[10, 20, 50].map((n) => (
                    <DropdownMenuItem key={n} onClick={() => { setPerPage(n); setPage(1); }}>
                      {n}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal"
                disabled={isLastPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

