"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Loader, Filter, Calendar, Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { TGMPnlLeaderboardData, TGMPnlLeaderboardFilters, TGMPnlLeaderboardResponse, fetchTGMPnlLeaderboard } from "@/lib/nansen-api";
import { format } from "date-fns";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<TGMPnlLeaderboardData[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [isLastPage, setIsLastPage] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [chain, setChain] = useState("ethereum");
  const [tokenAddress, setTokenAddress] = useState("0x6982508145454ce325ddbe47a25d4ec3d2311933");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [holdingUsdMin, setHoldingUsdMin] = useState("");
  const [pnlRealisedMin, setPnlRealisedMin] = useState("");
  const [sortField, setSortField] = useState("pnl_usd_realised");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");

  const availableChains = ["ethereum", "solana", "arbitrum", "polygon", "base", "optimism", "avalanche", "bnb"];
  const sortFields = [{ value: "pnl_usd_realised", label: "Realized PnL" }, { value: "pnl_usd_unrealised", label: "Unrealized PnL" }, { value: "roi_percent_total", label: "Total ROI" }, { value: "holding_usd", label: "Holding USD" }, { value: "nof_trades", label: "Trades" }];

  async function load() {
    if (!tokenAddress.trim()) { setError("Please enter a token address"); return; }
    setLoading(true); setError(null);
    try {
      const date = from && to ? { from, to } : undefined;
      const filters: TGMPnlLeaderboardFilters = {};
      if (holdingUsdMin) filters.holding_usd = { min: Number(holdingUsdMin) };
      if (pnlRealisedMin) filters.pnl_usd_realised = { min: Number(pnlRealisedMin) };
      const resp: TGMPnlLeaderboardResponse = await fetchTGMPnlLeaderboard({ chain, tokenAddress: tokenAddress.trim(), date, page, perPage, filters, sortBy: [{ field: sortField, direction: sortDirection }] });
      setRows(resp.data);
      setIsLastPage(resp.pagination?.is_last_page ?? true);
    } catch (e: any) { setError(e?.message || "Failed to load leaderboard data"); } finally { setLoading(false); }
  }

  useEffect(() => { if (tokenAddress.trim() && !loading) load(); }, [chain, page, perPage, sortField, sortDirection]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
            <span className="text-white font-normal text-sm">TGM PnL Leaderboard</span>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between mb-3">
          <Input type="text" placeholder="Enter token address (0x...)" value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} className="flex-1 h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500" />
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-normal border border-blue-500/20" onClick={load} disabled={loading}>{loading ? <Loader className="w-3 h-3 animate-spin" /> : "Refresh"}</Button>
            <Button variant="outline" size="sm" className="lg:hidden h-8 px-3 text-xs border-[#20222f] bg-[#171a26] text-gray-300" onClick={() => setFilterOpen(!filterOpen)}><Filter className="w-3 h-3 mr-2" />Filters</Button>
            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 text-xs text-gray-400 hover:text-gray-200">Sort: {sortFields.find((f) => f.value === sortField)?.label} {sortDirection === "DESC" ? "↓" : "↑"}</Button></DropdownMenuTrigger><DropdownMenuContent align="end">{sortFields.map((f) => (<DropdownMenuItem key={f.value} onClick={() => setSortField(f.value)}>{f.label}</DropdownMenuItem>))}<DropdownMenuItem onClick={() => setSortDirection(sortDirection === "DESC" ? "ASC" : "DESC")}>Direction: {sortDirection === "DESC" ? "Descending" : "Ascending"}</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
          </div>
        </div>
        <div className={`${filterOpen ? 'grid' : 'hidden'} lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3`}>
          <div className="lg:col-span-2"><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full h-8 justify-start text-left font-normal bg-[#171a26] border-[#20222f] text-gray-300 text-xs"><Calendar className="mr-2 h-3 w-3 text-gray-500" />{from ? format(new Date(from), "MMM dd") : <span className="text-gray-500">From</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0 bg-[#171a26] border-[#20222f]" align="start"><CalendarComponent mode="single" selected={from ? new Date(from) : undefined} onSelect={(d) => d && setFrom(d.toISOString().split("T")[0])} initialFocus /></PopoverContent></Popover></div>
          <div className="lg:col-span-2"><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full h-8 justify-start text-left font-normal bg-[#171a26] border-[#20222f] text-gray-300 text-xs"><Calendar className="mr-2 h-3 w-3 text-gray-500" />{to ? format(new Date(to), "MMM dd") : <span className="text-gray-500">To</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0 bg-[#171a26] border-[#20222f]" align="start"><CalendarComponent mode="single" selected={to ? new Date(to) : undefined} onSelect={(d) => d && setTo(d.toISOString().split("T")[0])} initialFocus /></PopoverContent></Popover></div>
          <div className="lg:col-span-2"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full h-8 justify-between bg-[#171a26] border-[#20222f] text-gray-300 text-xs font-normal">{chain.charAt(0).toUpperCase() + chain.slice(1)}<span className="text-gray-500 ml-1">▾</span></Button></DropdownMenuTrigger><DropdownMenuContent align="start">{availableChains.map((c) => (<DropdownMenuItem key={c} onClick={() => { setChain(c); setPage(1); }}>{c.charAt(0).toUpperCase() + c.slice(1)}</DropdownMenuItem>))}</DropdownMenuContent></DropdownMenu></div>
          <div className="lg:col-span-2"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full h-8 justify-between bg-[#171a26] border-[#20222f] text-gray-300 text-xs font-normal">{perPage} per page<span className="text-gray-500 ml-1">▾</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end">{[10, 20, 50].map((n) => (<DropdownMenuItem key={n} onClick={() => { setPerPage(n); setPage(1); }}>{n}</DropdownMenuItem>))}</DropdownMenuContent></DropdownMenu></div>
          <div className="lg:col-span-2"><Input value={holdingUsdMin} onChange={(e) => setHoldingUsdMin(e.target.value)} placeholder="Min Holding USD" onKeyDown={(e) => e.key === "Enter" && load()} className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500" /></div>
          <div className="lg:col-span-2"><Input value={pnlRealisedMin} onChange={(e) => setPnlRealisedMin(e.target.value)} placeholder="Min Realized PnL" onKeyDown={(e) => e.key === "Enter" && load()} className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500" /></div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-4 pr-4 pl-0">
          {loading && <div className="flex items-center justify-center py-6 ml-4"><Loader className="w-4 h-4 text-blue-400 animate-spin" /></div>}
          {error && <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/40 mb-3 ml-4"><span className="text-[10px] text-red-300">{error}</span></div>}
          {rows.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3"><div className="sticky left-0 z-10 bg-[#141723] pl-4 pr-3 py-2 rounded-l flex items-center gap-2"><Trophy className="w-3 h-3 text-yellow-400" /><span className="text-sm font-medium text-blue-400">Leaderboard</span><span className="text-xs text-gray-500">{rows.length}</span></div></div>
              <div className="space-y-1">
                <div className="flex items-stretch text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap"><div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[180px] py-2 pl-7 pr-3"><div className="h-6 w-6" /><div className="min-w-[120px]">Trader</div></div><div className="flex-1 flex items-center justify-end gap-0 py-2 pr-3"><div className="w-[90px] text-center">Realized</div><div className="w-[90px] text-center">Unrealized</div><div className="w-[70px] text-center">ROI</div><div className="w-[80px] text-center">Holding</div><div className="w-[60px] text-center">Trades</div></div></div>
                {rows.map((r, idx) => {
                  const isPositive = (r.pnl_usd_realised + r.pnl_usd_unrealised) >= 0;
                  return (
                    <div key={`${r.trader_address}-${idx}`} className="flex items-stretch group whitespace-nowrap">
                      <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]"><div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-2 min-w-[180px] ml-0 pl-3 py-2.5 rounded-l transition-colors"><Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100"><MoreHorizontal className="w-4 h-4 text-blue-400" /></Button><div className="flex flex-col min-w-[120px]"><span className="font-mono text-xs text-blue-300 font-medium">{r.trader_address.slice(0, 6)}...{r.trader_address.slice(-4)}</span><span className="text-[10px] text-gray-500">{r.trader_address_label || "Unknown"}</span></div></div></div>
                      <div className="flex-1 flex items-center justify-end gap-0 pr-3 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors">
                        <div className="w-[90px] flex flex-col items-center"><span className={`text-xs font-semibold ${r.pnl_usd_realised >= 0 ? "text-green-400" : "text-red-400"}`}>{formatUSD(r.pnl_usd_realised)}</span><span className={`text-[10px] ${r.roi_percent_realised >= 0 ? "text-green-400" : "text-red-400"}`}>{formatPercent(r.roi_percent_realised)}</span></div>
                        <div className="w-[90px] flex flex-col items-center"><span className={`text-xs font-semibold ${r.pnl_usd_unrealised >= 0 ? "text-green-400" : "text-red-400"}`}>{formatUSD(r.pnl_usd_unrealised)}</span><span className={`text-[10px] ${r.roi_percent_unrealised >= 0 ? "text-green-400" : "text-red-400"}`}>{formatPercent(r.roi_percent_unrealised)}</span></div>
                        <div className="w-[70px] flex items-center justify-center">{isPositive ? <TrendingUp className="w-3 h-3 text-green-400 mr-1" /> : <TrendingDown className="w-3 h-3 text-red-400 mr-1" />}<span className={`text-xs font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>{formatPercent(r.roi_percent_total)}</span></div>
                        <div className="w-[80px] flex justify-center"><span className="text-xs text-gray-300 font-mono tabular-nums">{formatUSD(r.holding_usd)}</span></div>
                        <div className="w-[60px] flex justify-center"><span className="text-xs text-gray-400">{r.nof_trades}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {!loading && rows.length === 0 && !error && <div className="flex items-center justify-center py-12 ml-4"><div className="text-center"><Trophy className="w-12 h-12 text-gray-600 mx-auto mb-2" /><div className="text-sm text-gray-400">Enter a token address to view PnL leaderboard</div></div></div>}
        </div>
      </ScrollArea>
      {rows.length > 0 && <div className="flex items-center justify-between px-4 py-3 border-t border-[#20222f] bg-[#141723]"><div className="text-xs text-gray-400">Page {page} {isLastPage ? "(last)" : ""}</div><div className="flex items-center gap-2"><Button variant="ghost" size="sm" className="h-7 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button><Button variant="ghost" size="sm" className="h-7 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300" onClick={() => setPage((p) => p + 1)} disabled={isLastPage}>Next</Button></div></div>}
    </div>
  );
}