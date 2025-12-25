"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Loader, BarChart3, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { TGMPerpTradesData, TGMPerpTradesResponse, TGMPerpTradesFilters, TGMPerpTradesSortField, fetchTGMPerpTrades, DateRange } from "@/lib/nansen-api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

function formatUSD(value: number): string {
  if (value === 0) return "$0";
  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absValue >= 1_000_000) return `${sign}$${(absValue / 1_000_000).toFixed(1)}M`;
  if (absValue >= 1_000) return `${sign}$${(absValue / 1_000).toFixed(1)}K`;
  if (absValue >= 1) return `${sign}$${absValue.toFixed(2)}`;

  return `${sign}$${absValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })}`;
}

function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
  return value.toFixed(4);
}

export function TGMPerpTradesBoard() {
  const [data, setData] = useState<TGMPerpTradesData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<TGMPerpTradesSortField>("block_timestamp");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [selectedSides, setSelectedSides] = useState<Record<"Long" | "Short", boolean>>({ Long: true, Short: true });
  const [selectedActions, setSelectedActions] = useState<Record<"Add" | "Reduce" | "Open" | "Close", boolean>>({ Add: true, Reduce: true, Open: true, Close: true });
  const [valueMin, setValueMin] = useState("");
  const [valueMax, setValueMax] = useState("");

  const sortFields = [{ value: "block_timestamp" as const, label: "Timestamp" }, { value: "value_usd" as const, label: "Value USD" }, { value: "price_usd" as const, label: "Price USD" }];

  async function load() {
    if (!tokenSymbol.trim()) { setError("Please enter a token symbol"); return; }
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dateRange: DateRange = from && to ? { from, to } : { from: sevenDaysAgo.toISOString().split('T')[0], to: now.toISOString().split('T')[0] };
    setLoading(true); setError(null);
    try {
      const filters: TGMPerpTradesFilters = {
        side: Object.entries(selectedSides).filter(([_, selected]) => selected).map(([side]) => side as "Long" | "Short"),
        action: Object.entries(selectedActions).filter(([_, selected]) => selected).map(([action]) => action as "Add" | "Reduce" | "Open" | "Close"),
        value_usd: (valueMin || valueMax) ? { min: valueMin ? Number(valueMin) : undefined, max: valueMax ? Number(valueMax) : undefined } : undefined,
      };
      const resp: TGMPerpTradesResponse = await fetchTGMPerpTrades({ tokenSymbol: tokenSymbol.trim(), date: dateRange, page, perPage, filters, sortBy: [{ field: sortBy, direction: sortDirection }] });
      setData(resp.data);
    } catch (e: any) { setError(e?.message || "Failed to load perp trades"); } finally { setLoading(false); }
  }

  useEffect(() => { if (tokenSymbol.trim()) load(); }, [page, perPage, sortBy, sortDirection, from, to, selectedSides, selectedActions, valueMin, valueMax]);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
            <span className="text-white font-normal text-sm">Token Mode Perp Trades</span>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between mb-3">
          <Input type="text" placeholder="Enter token symbol (BTC, ETH...)" value={tokenSymbol} onChange={(e) => setTokenSymbol(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} className="flex-1 h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500" />
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-normal border border-blue-500/20" onClick={load} disabled={loading}>{loading ? <Loader className="w-3 h-3 animate-spin" /> : "Refresh"}</Button>
            <Button variant="outline" size="sm" className="lg:hidden h-8 px-3 text-xs border-[#20222f] bg-[#171a26] text-gray-300" onClick={() => setFilterOpen(!filterOpen)}><Filter className="w-3 h-3 mr-2" />Filters</Button>
            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 text-xs text-gray-400 hover:text-gray-200">Sort: {sortFields.find((f) => f.value === sortBy)?.label} {sortDirection === "DESC" ? "↓" : "↑"}</Button></DropdownMenuTrigger><DropdownMenuContent align="end">{sortFields.map((f) => (<DropdownMenuItem key={f.value} onClick={() => { if (sortBy === f.value) setSortDirection(sortDirection === "DESC" ? "ASC" : "DESC"); else { setSortBy(f.value); setSortDirection("DESC"); } }}>{f.label}</DropdownMenuItem>))}</DropdownMenuContent></DropdownMenu>
          </div>
        </div>
        <div className={`${filterOpen ? 'grid' : 'hidden'} lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3`}>
          <div className="lg:col-span-2"><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full h-8 justify-start text-left font-normal bg-[#171a26] border-[#20222f] text-gray-300 text-xs"><Calendar className="mr-2 h-3 w-3 text-gray-500" />{from ? format(new Date(from), "MMM dd") : <span className="text-gray-500">From</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0 bg-[#171a26] border-[#20222f]" align="start"><CalendarComponent mode="single" selected={from ? new Date(from) : undefined} onSelect={(d) => d && setFrom(d.toISOString().split("T")[0])} initialFocus /></PopoverContent></Popover></div>
          <div className="lg:col-span-2"><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full h-8 justify-start text-left font-normal bg-[#171a26] border-[#20222f] text-gray-300 text-xs"><Calendar className="mr-2 h-3 w-3 text-gray-500" />{to ? format(new Date(to), "MMM dd") : <span className="text-gray-500">To</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0 bg-[#171a26] border-[#20222f]" align="start"><CalendarComponent mode="single" selected={to ? new Date(to) : undefined} onSelect={(d) => d && setTo(d.toISOString().split("T")[0])} initialFocus /></PopoverContent></Popover></div>
          <div className="lg:col-span-2"><div className="flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5"><Button variant="ghost" size="sm" className={`h-7 text-[10px] px-2 rounded-sm flex-1 ${selectedSides.Long ? "bg-green-500/20 text-green-300" : "text-gray-400"}`} onClick={() => setSelectedSides((prev) => ({ ...prev, Long: !prev.Long }))}>Long</Button><Button variant="ghost" size="sm" className={`h-7 text-[10px] px-2 rounded-sm flex-1 ${selectedSides.Short ? "bg-red-500/20 text-red-300" : "text-gray-400"}`} onClick={() => setSelectedSides((prev) => ({ ...prev, Short: !prev.Short }))}>Short</Button></div></div>
          <div className="lg:col-span-4 flex items-center gap-1 flex-wrap">{(["Add", "Reduce", "Open", "Close"] as const).map((action) => (<Button key={action} variant="ghost" size="sm" className={`h-7 text-[10px] px-2 rounded-sm border ${selectedActions[action] ? "bg-purple-500/20 text-purple-300 border-purple-500/50" : "bg-[#171a26] text-gray-400 border-[#20222f]"}`} onClick={() => setSelectedActions((prev) => ({ ...prev, [action]: !prev[action] }))}>{action}</Button>))}</div>
          <div className="lg:col-span-2"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full h-8 justify-between bg-[#171a26] border-[#20222f] text-gray-300 text-xs font-normal">{perPage} per page<span className="text-gray-500 ml-1">▾</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end">{[10, 25, 50].map((val) => (<DropdownMenuItem key={val} onClick={() => { setPerPage(val); setPage(1); }}>{val}</DropdownMenuItem>))}</DropdownMenuContent></DropdownMenu></div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-4 pr-4 pl-0">
          {loading && <div className="flex items-center justify-center py-6 ml-4"><Loader className="w-4 h-4 text-blue-400 animate-spin" /></div>}
          {error && <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/40 mb-3 ml-4"><span className="text-[10px] text-red-300">{error}</span></div>}
          {data.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3"><div className="sticky left-0 z-10 bg-[#141723] pl-4 pr-3 py-2 rounded-l flex items-center gap-2"><BarChart3 className="w-3 h-3 text-blue-400" /><span className="text-sm font-medium text-blue-400">Perp Trades</span><span className="text-xs text-gray-500">{data.length}</span></div></div>
              <div className="space-y-1">
                <div className="flex items-stretch text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap"><div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[200px] py-2 pl-7 pr-3"><div className="h-6 w-6" /><div className="min-w-[80px]">Time</div><div className="min-w-[80px]">Trader</div></div><div className="flex-1 flex items-center justify-end gap-0 py-2 pr-3"><div className="w-[50px] text-center">Side</div><div className="w-[60px] text-center">Action</div><div className="w-[80px] text-center">Amount</div><div className="w-[80px] text-center">Price</div><div className="w-[90px] text-center">Value</div></div></div>
                {data.map((item, idx) => {
                  const isLong = item.side === "Long";
                  return (
                    <div key={`${item.transaction_hash}-${idx}`} className="flex items-stretch group whitespace-nowrap">
                      <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]"><div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-2 min-w-[200px] ml-0 pl-3 py-2.5 rounded-l transition-colors"><Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100"><MoreHorizontal className="w-4 h-4 text-blue-400" /></Button><span className="text-xs text-gray-300 min-w-[80px]">{new Date(item.block_timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span><div className="flex flex-col min-w-[80px]"><span className="font-mono text-xs text-blue-300 font-medium">{item.trader_address.slice(0, 6)}...{item.trader_address.slice(-4)}</span></div></div></div>
                      <div className="flex-1 flex items-center justify-end gap-0 pr-3 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors">
                        <div className="w-[50px] flex justify-center"><Badge variant="secondary" className={`text-[10px] h-5 border-0 px-2 rounded-full ${isLong ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>{item.side}</Badge></div>
                        <div className="w-[60px] flex justify-center"><Badge variant="secondary" className="text-[10px] h-5 border-0 px-2 rounded-full bg-purple-500/20 text-purple-300">{item.action}</Badge></div>
                        <div className="w-[80px] flex justify-center"><span className="text-xs text-gray-300 font-mono tabular-nums">{formatNumber(item.token_amount)}</span></div>
                        <div className="w-[80px] flex justify-center"><span className="text-xs text-gray-300 font-mono tabular-nums">{formatUSD(item.price_usd)}</span></div>
                        <div className="w-[90px] flex justify-center"><span className="text-xs text-white font-semibold font-mono tabular-nums">{formatUSD(item.value_usd)}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {!loading && data.length === 0 && !error && <div className="flex items-center justify-center py-12 ml-4"><div className="text-center"><BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-2" /><div className="text-sm text-gray-400">Enter a token symbol to view perp trades</div></div></div>}
        </div>
      </ScrollArea>
      {data.length > 0 && <div className="flex items-center justify-between px-4 py-3 border-t border-[#20222f] bg-[#141723]"><div className="text-xs text-gray-400">Page {page}</div><div className="flex items-center gap-2"><Button variant="ghost" size="sm" className="h-7 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading}>Previous</Button><Button variant="ghost" size="sm" className="h-7 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300" onClick={() => setPage((p) => p + 1)} disabled={loading}>Next</Button></div></div>}
    </div>
  );
}
