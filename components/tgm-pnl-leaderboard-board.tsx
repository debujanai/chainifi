"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Loader, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TGMPnlLeaderboardData, TGMPnlLeaderboardFilters, TGMPnlLeaderboardResponse, fetchTGMPnlLeaderboard } from "@/lib/nansen-api";

function formatUSD(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function TGMPnlLeaderboardBoard() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<TGMPnlLeaderboardData[]>([]);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [isLastPage, setIsLastPage] = useState<boolean>(true);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

  const [chain, setChain] = useState<string>("ethereum");
  const [tokenAddress, setTokenAddress] = useState<string>("0x6982508145454ce325ddbe47a25d4ec3d2311933");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const [holdingUsdMin, setHoldingUsdMin] = useState<string>("");
  const [pnlRealisedMin, setPnlRealisedMin] = useState<string>("");

  const [sortField, setSortField] = useState<string>("pnl_usd_realised");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");

  const availableChains = [
    "ethereum",
    "solana",
    "arbitrum",
    "polygon",
    "base",
    "optimism",
    "avalanche",
    "bnb",
    "zksync",
    "tron",
  ];

  async function load() {
    if (!tokenAddress.trim()) {
      setError("Please enter a token address");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const date = from && to ? { from, to } : undefined;
      const filters: TGMPnlLeaderboardFilters = {};
      if (holdingUsdMin) filters.holding_usd = { min: Number(holdingUsdMin) };
      if (pnlRealisedMin) filters.pnl_usd_realised = { min: Number(pnlRealisedMin) };

      const resp: TGMPnlLeaderboardResponse = await fetchTGMPnlLeaderboard({
        chain,
        tokenAddress: tokenAddress.trim(),
        date,
        page,
        perPage,
        filters,
        sortBy: [{ field: sortField, direction: sortDirection }],
      });
      setRows(resp.data);
      setIsLastPage(resp.pagination?.is_last_page ?? true);
    } catch (e: any) {
      setError(e?.message || "Failed to load leaderboard data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tokenAddress.trim() && !loading) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain, page, perPage, sortField, sortDirection]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
              <span className="text-white font-normal">TGM PnL Leaderboard</span>
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
                  Sort: {sortField} {sortDirection === "DESC" ? "↓" : "↑"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[12rem]">
                {["pnl_usd_realised","pnl_usd_unrealised","roi_percent_total","holding_usd","nof_trades"].map((f) => (
                  <DropdownMenuItem key={f} onClick={() => setSortField(f)}>{f}</DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => setSortDirection(sortDirection === "DESC" ? "ASC" : "DESC")}>
                  Direction: {sortDirection === "DESC" ? "Descending" : "Ascending"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Token & Chain Inputs */}
        <div className="flex items-center gap-2 mb-3">
          <Input
            type="text"
            placeholder="Enter token address (0x...)"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            className="flex-1 h-8 text-xs bg-[#141723] border-[#20222f] text-white placeholder:text-gray-500"
          />

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

            {/* Filters */}
            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Filters</label>
              <div className="flex gap-2">
                <Input
                  value={holdingUsdMin}
                  onChange={(e) => setHoldingUsdMin(e.target.value)}
                  placeholder="Min Holding USD"
                  className="h-8 bg-[#171a26] border-[#20222f] text-sm text-gray-200 placeholder:text-gray-500"
                />
                <Input
                  value={pnlRealisedMin}
                  onChange={(e) => setPnlRealisedMin(e.target.value)}
                  placeholder="Min Realized PnL USD"
                  className="h-8 bg-[#171a26] border-[#20222f] text-sm text-gray-200 placeholder:text-gray-500"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal"
                onClick={() => { setPage(1); load(); }}
              >
                Apply Filters
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

          {/* Table Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 text-[10px] uppercase tracking-wide text-gray-500 w-full">
              <div className="h-6 w-6 flex-shrink-0" />
              <div className="w-[220px] flex-shrink-0">Trader</div>
              <div className="w-[80px] flex-shrink-0">Price</div>
              <div className="flex items-center gap-4 flex-1 justify-end">
                <div className="w-[110px] text-right">Realized PnL</div>
                <div className="w-[110px] text-right">Unrealized PnL</div>
                <div className="w-[90px] text-right">ROI %</div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="w-[110px] text-right">Holding USD</div>
                <div className="w-[110px] text-right">Max Held USD</div>
                <div className="w-[90px] text-right">Still Holding</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-[110px] text-right">Netflow USD</div>
                <div className="w-[70px] text-right">Trades</div>
              </div>
            </div>

            {/* Table Rows */}
            <div className="space-y-1">
              {rows.map((r, idx) => {
                const isPositive = (r.pnl_usd_realised + r.pnl_usd_unrealised) >= 0;
                return (
                  <div
                    key={`${r.trader_address}-${idx}`}
                    className="flex items-center gap-2 px-3 py-2.5 bg-[#171a26] border border-[#20222f] rounded hover:bg-[#1c1e2b] hover:border-[#272936] transition-colors group w-full"
                  >
                    {/* Row menu */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </Button>

                    {/* Trader */}
                    <div className="w-[220px] flex-shrink-0">
                      <div className="text-sm text-white font-medium truncate">{r.trader_address_label || r.trader_address}</div>
                      <div className="text-xs text-gray-400 font-mono truncate">{r.trader_address.slice(0, 10)}...</div>
                    </div>

                    {/* Price */}
                    <div className="w-[80px] flex-shrink-0 text-xs text-gray-300">
                      ${r.price_usd.toFixed(2)}
                    </div>

                    {/* PnL and ROI */}
                    <div className="flex items-center gap-4 flex-1 justify-end">
                      <div className="w-[110px] text-right">
                        <div className="text-[10px] text-gray-500">Realized</div>
                        <div className={`text-xs font-semibold ${r.pnl_usd_realised >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {formatUSD(r.pnl_usd_realised)}
                        </div>
                        <div className={`text-[10px] ${r.roi_percent_realised >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {formatPercent(r.roi_percent_realised)}
                        </div>
                      </div>
                      <div className="w-[110px] text-right">
                        <div className="text-[10px] text-gray-500">Unrealized</div>
                        <div className={`text-xs font-semibold ${r.pnl_usd_unrealised >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {formatUSD(r.pnl_usd_unrealised)}
                        </div>
                        <div className={`text-[10px] ${r.roi_percent_unrealised >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {formatPercent(r.roi_percent_unrealised)}
                        </div>
                      </div>
                      <div className="w-[90px] text-right">
                        <div className="text-[10px] text-gray-500">Total ROI</div>
                        <div className={`text-xs font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                          {formatPercent(r.roi_percent_total)}
                        </div>
                      </div>
                    </div>

                    {/* Holdings */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-[110px] text-right text-xs text-gray-300">
                        <div className="text-[10px] text-gray-500">Holding</div>
                        <div>{formatUSD(r.holding_usd)}</div>
                      </div>
                      <div className="w-[110px] text-right text-xs text-gray-300">
                        <div className="text-[10px] text-gray-500">Max Held</div>
                        <div>{formatUSD(r.max_balance_held_usd)}</div>
                      </div>
                      <div className="w-[90px] text-right text-xs text-gray-300">
                        <div className="text-[10px] text-gray-500">Still Holding</div>
                        <div>{(r.still_holding_balance_ratio * 100).toFixed(0)}%</div>
                      </div>
                    </div>

                    {/* Netflow and Trades */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-[110px] text-right text-xs text-gray-300">
                        <div className="text-[10px] text-gray-500">Netflow USD</div>
                        <div>{formatUSD(r.netflow_amount_usd)}</div>
                      </div>
                      <div className="w-[70px] text-right text-xs text-gray-400">
                        {r.nof_trades}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination */}
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