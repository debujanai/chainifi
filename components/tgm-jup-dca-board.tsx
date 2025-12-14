"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TGMJupDcaData, TGMJupDcaFilters, TGMJupDcaResponse, TGMJupDcaSortField, fetchTGMJupDca } from "@/lib/nansen-api";
import { Loader, MoreHorizontal, Zap, Filter } from "lucide-react";

function formatUSD(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toFixed(2);
}

const statusStyles: Record<string, string> = { Active: "bg-blue-500/20 text-blue-300", Closed: "bg-emerald-500/20 text-emerald-300", Cancelled: "bg-red-500/20 text-red-300" };

export function TGMJupDcaBoard() {
  const [tokenAddress, setTokenAddress] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<TGMJupDcaSortField>("last_timestamp");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TGMJupDcaResponse | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [depositAmountMin, setDepositAmountMin] = useState("");
  const [depositAmountMax, setDepositAmountMax] = useState("");
  const [status, setStatus] = useState("All");

  const sortFields = [{ value: "last_timestamp" as const, label: "Last Timestamp" }, { value: "deposit_amount" as const, label: "Deposit Amount" }, { value: "deposit_usd_value" as const, label: "Deposit USD" }];

  const filters: TGMJupDcaFilters | undefined = useMemo(() => {
    const result: TGMJupDcaFilters = {};
    if (depositAmountMin || depositAmountMax) result.deposit_amount = { min: depositAmountMin ? Number(depositAmountMin) : undefined, max: depositAmountMax ? Number(depositAmountMax) : undefined };
    if (status !== "All") result.status = status;
    return Object.keys(result).length > 0 ? result : undefined;
  }, [depositAmountMin, depositAmountMax, status]);

  async function load() {
    if (!tokenAddress.trim()) { setError("Please enter a Solana token address"); return; }
    setLoading(true); setError(null);
    try {
      const resp = await fetchTGMJupDca({ tokenAddress: tokenAddress.trim(), page, perPage, filters, sortBy: [{ field: sortBy, direction: sortDirection }] });
      setData(resp);
    } catch (err: any) { setError(err?.message || "Failed to load Jupiter DCA data"); } finally { setLoading(false); }
  }

  useEffect(() => { if (tokenAddress.trim()) load(); }, [page, perPage, sortBy, sortDirection, filters]);

  const rows: TGMJupDcaData[] = data?.data || [];

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
            <span className="text-white font-normal text-sm">Jupiter DCAs</span>
            <Badge className="bg-purple-500/20 text-purple-300 border-0 h-5 text-[10px] px-2 rounded-full">Solana Only</Badge>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between mb-3">
          <Input type="text" placeholder="Enter Solana token address" value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); load(); } }} className="flex-1 h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500" />
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-normal border border-blue-500/20" onClick={() => { setPage(1); load(); }} disabled={loading}>{loading ? <Loader className="w-3 h-3 animate-spin" /> : "Refresh"}</Button>
            <Button variant="outline" size="sm" className="lg:hidden h-8 px-3 text-xs border-[#20222f] bg-[#171a26] text-gray-300" onClick={() => setFilterOpen(!filterOpen)}><Filter className="w-3 h-3 mr-2" />Filters</Button>
            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 text-xs text-gray-400 hover:text-gray-200">Sort: {sortFields.find((f) => f.value === sortBy)?.label ?? sortBy} {sortDirection === "DESC" ? "↓" : "↑"}</Button></DropdownMenuTrigger><DropdownMenuContent align="end">{sortFields.map((field) => (<DropdownMenuItem key={field.value} onClick={() => { if (sortBy === field.value) setSortDirection((dir) => (dir === "DESC" ? "ASC" : "DESC")); else { setSortBy(field.value); setSortDirection("DESC"); } }}>{field.label}</DropdownMenuItem>))}</DropdownMenuContent></DropdownMenu>
          </div>
        </div>
        <div className={`${filterOpen ? 'grid' : 'hidden'} lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3`}>
          <div className="lg:col-span-3"><div className="flex items-center gap-1"><Input type="number" placeholder="Deposit Min" value={depositAmountMin} onChange={(e) => setDepositAmountMin(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1" /><span className="text-xs text-gray-500">-</span><Input type="number" placeholder="Max" value={depositAmountMax} onChange={(e) => setDepositAmountMax(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} className="h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 flex-1" /></div></div>
          <div className="lg:col-span-2"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full h-8 justify-between bg-[#171a26] border-[#20222f] text-gray-300 text-xs font-normal">{status}<span className="text-gray-500 ml-1">▾</span></Button></DropdownMenuTrigger><DropdownMenuContent>{["All", "Active", "Closed", "Cancelled"].map((opt) => (<DropdownMenuItem key={opt} onClick={() => setStatus(opt)}>{opt}</DropdownMenuItem>))}</DropdownMenuContent></DropdownMenu></div>
          <div className="lg:col-span-2"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full h-8 justify-between bg-[#171a26] border-[#20222f] text-gray-300 text-xs font-normal">{perPage} per page<span className="text-gray-500 ml-1">▾</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end">{[10, 25, 50].map((val) => (<DropdownMenuItem key={val} onClick={() => { setPerPage(val); setPage(1); }}>{val}</DropdownMenuItem>))}</DropdownMenuContent></DropdownMenu></div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-4 pr-4 pl-0">
          {loading && <div className="flex items-center justify-center py-6 ml-4"><Loader className="w-4 h-4 text-blue-400 animate-spin" /></div>}
          {error && <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/40 mb-3 ml-4"><span className="text-[10px] text-red-300">{error}</span></div>}
          {rows.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3"><div className="sticky left-0 z-10 bg-[#141723] pl-4 pr-3 py-2 rounded-l flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500/20" /><span className="text-sm font-medium text-blue-400">DCA Positions</span><span className="text-xs text-gray-500">{rows.length}</span></div></div>
              <div className="space-y-1">
                <div className="flex items-stretch text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap"><div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[160px] py-2 pl-7 pr-3"><div className="h-6 w-6" /><div className="min-w-[100px]">Trader</div></div><div className="flex-1 flex items-center justify-end gap-0 py-2 pr-3"><div className="w-[120px] text-center">Vault</div><div className="w-[70px] text-center">Status</div><div className="w-[80px] text-center">Deposit</div><div className="w-[80px] text-center">Spent</div><div className="w-[90px] text-center">USD Value</div></div></div>
                {rows.map((item, index) => (
                  <div key={`${item.creation_hash}-${index}`} className="flex items-stretch group whitespace-nowrap">
                    <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]"><div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-2 min-w-[160px] ml-0 pl-3 py-2.5 rounded-l transition-colors"><Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100"><MoreHorizontal className="w-4 h-4 text-blue-400" /></Button><div className="flex flex-col min-w-[100px]"><span className="font-mono text-xs text-blue-300 font-medium">{item.trader_address.slice(0, 6)}...{item.trader_address.slice(-4)}</span><span className="text-[10px] text-gray-500">{item.trader_label || "Unlabeled"}</span></div></div></div>
                    <div className="flex-1 flex items-center justify-end gap-0 pr-3 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors">
                      <div className="w-[120px] flex flex-col items-center"><span className="font-mono text-xs text-gray-400">{item.dca_vault_address.slice(0, 6)}...{item.dca_vault_address.slice(-4)}</span><span className="text-[10px] text-gray-500">{item.token_input}→{item.token_output}</span></div>
                      <div className="w-[70px] flex justify-center"><Badge variant="secondary" className={`text-[10px] h-5 border-0 px-2 rounded-full ${statusStyles[item.status] ?? "bg-gray-500/20 text-gray-300"}`}>{item.status}</Badge></div>
                      <div className="w-[80px] flex justify-center"><span className="text-xs text-gray-300 font-mono tabular-nums">{formatNumber(item.deposit_amount)}</span></div>
                      <div className="w-[80px] flex justify-center"><span className="text-xs text-gray-300 font-mono tabular-nums">{formatNumber(item.deposit_spent)}</span></div>
                      <div className="w-[90px] flex justify-center"><span className="text-xs text-blue-300 font-semibold font-mono tabular-nums">{formatUSD(item.deposit_usd_value)}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!loading && rows.length === 0 && !error && <div className="flex items-center justify-center py-12 ml-4"><div className="text-center"><Zap className="w-12 h-12 text-gray-600 mx-auto mb-2" /><div className="text-sm text-gray-400">Enter a Solana token address to explore Jupiter DCAs.</div></div></div>}
        </div>
      </ScrollArea>
      {rows.length > 0 && <div className="flex items-center justify-between px-4 py-3 border-t border-[#20222f] bg-[#141723]"><div className="text-xs text-gray-400">Page {page}</div><div className="flex items-center gap-2"><Button variant="ghost" size="sm" className="h-7 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1 || loading}>Previous</Button><Button variant="ghost" size="sm" className="h-7 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300" onClick={() => setPage((prev) => prev + 1)} disabled={loading || data?.pagination?.is_last_page}>Next</Button></div></div>}
    </div>
  );
}
