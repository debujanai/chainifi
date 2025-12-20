"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Loader, Copy, ArrowRight, Filter, ExternalLink, Calendar, Zap, Users as UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

interface DcaOrder {
  dca_created_at: string;
  dca_updated_at: string;
  trader_address: string;
  transaction_hash: string;
  trader_address_label: string;
  dca_vault_address: string;
  input_token_address: string;
  output_token_address: string;
  deposit_token_amount: number;
  token_spent_amount: number;
  output_token_redeemed_amount: number;
  dca_status: string;
  input_token_symbol: string;
  output_token_symbol: string;
  deposit_value_usd: number;
}

interface TokenMetadata {
  logo: string | null;
  websites: { url: string }[];
  socials: { platform: string; type?: string; handle: string; url: string }[];
}

function formatUSD(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatAmount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(2);
}

function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    const day = d.getDate();
    const month = d.toLocaleDateString(undefined, { month: "short" });
    const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
    return `${day} ${month} · ${time}`;
  } catch {
    return ts;
  }
}

export function DcasBoard() {
  const [rawDcas, setRawDcas] = useState<DcaOrder[]>([]);
  const [dcas, setDcas] = useState<DcaOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

  // Token Metadata State
  const [tokenMetadata, setTokenMetadata] = useState<Record<string, TokenMetadata>>({});

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [perPage] = useState<number>(10);
  const [isLastPage, setIsLastPage] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Filters
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"dca_created_at" | "dca_updated_at" | "deposit_value_usd">("dca_created_at");
  const [sortDirection, setSortDirection] = useState<"DESC" | "ASC">("DESC");

  // Initial Fetch (One-time)
  useEffect(() => {
    async function init() {
      setLoading(true);
      setError(null);
      try {
        const body = {
          pagination: { page: 1, per_page: 100 },
          order_by: [{ field: "dca_created_at", direction: "DESC" }]
        };
        const res = await fetch("/api/smartmoney?type=dcas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error("Failed to fetch DCAs");
        const json = await res.json();
        if (json.error) throw new Error(json.error);

        setRawDcas(json.data || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load DCAs");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Filter, Sort, & Paginate Logic
  useEffect(() => {
    let result = [...rawDcas];

    // 1. Filter by status
    if (status) result = result.filter(d => d.dca_status === status);

    // 2. Search (trader address, label, token symbols)
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(d =>
        d.trader_address.toLowerCase().includes(query) ||
        (d.trader_address_label && d.trader_address_label.toLowerCase().includes(query)) ||
        d.input_token_symbol.toLowerCase().includes(query) ||
        d.output_token_symbol.toLowerCase().includes(query)
      );
    }

    // 3. Sort
    result.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === "dca_created_at" || sortBy === "dca_updated_at") {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return sortDirection === "ASC" ? -1 : 1;
      if (valA > valB) return sortDirection === "ASC" ? 1 : -1;
      return 0;
    });

    // 4. Store total count before pagination
    setTotalCount(result.length);

    // 5. Paginate
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginated = result.slice(start, end);

    setDcas(paginated);
    setIsLastPage(end >= result.length);

  }, [rawDcas, status, searchQuery, sortBy, sortDirection, page, perPage]);

  // Fetch Token Metadata for visible items (like dex-trades-board)
  useEffect(() => {
    if (dcas.length === 0) return;

    dcas.forEach(async (item) => {
      // Fetch for input token
      const keyInput = `solana-${item.input_token_address}`;
      if (!tokenMetadata[keyInput]) {
        try {
          const res = await fetch(`/api/token-metadata?chain=solana&address=${item.input_token_address}`);
          if (res.ok) {
            const meta = await res.json();
            setTokenMetadata(prev => ({ ...prev, [keyInput]: meta }));
          }
        } catch (e) { /* Silent */ }
      }

      // Fetch for output token
      const keyOutput = `solana-${item.output_token_address}`;
      if (!tokenMetadata[keyOutput]) {
        try {
          const res = await fetch(`/api/token-metadata?chain=solana&address=${item.output_token_address}`);
          if (res.ok) {
            const meta = await res.json();
            setTokenMetadata(prev => ({ ...prev, [keyOutput]: meta }));
          }
        } catch (e) { /* Silent */ }
      }
    });
  }, [dcas]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const body = {
        pagination: { page: 1, per_page: 100 },
        order_by: [{ field: "dca_created_at", direction: "DESC" }]
      };
      const res = await fetch("/api/smartmoney?type=dcas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error("Failed to fetch DCAs");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setRawDcas(json.data || []);
      setPage(1);
    } catch (e: any) {
      setError(e?.message || "Failed to load DCAs");
    } finally {
      setLoading(false);
    }
  };

  // Get unique statuses for filter
  const availableStatuses = Array.from(new Set(rawDcas.map(d => d.dca_status))).filter(Boolean);

  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        {/* Title Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-[10px]">⚡</div>
            <span className="text-white font-normal text-sm">Smart Money DCAs</span>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <MoreHorizontal className="w-3 h-3 text-gray-400" />
            </Button>
          </div>
        </div>

        {/* Controls Container */}
        <div className="flex flex-col gap-3">
          {/* Top Row: Search & Primary Actions */}
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
            {/* Search Input (Left) */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                placeholder="Search trader, address or token..."
                className="flex-1 h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 min-w-[200px]"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs bg-[#171a26] border-[#20222f] text-gray-400 hover:text-gray-200"
                onClick={refresh}
                disabled={loading}
              >
                {loading ? <Loader className="w-3 h-3 animate-spin" /> : "Refresh"}
              </Button>
            </div>

            {/* Secondary Controls (Right) */}
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
            </div>
          </div>

          {/* Filter Grid */}
          <div className={`${filterOpen ? 'block' : 'hidden'} lg:block`}>
            <div className="flex flex-wrap gap-2">
              {/* Status Filter */}
              <div className="flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 text-[10px] px-3 rounded-sm ${!status ? "bg-[#20222f] text-gray-200 shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
                  onClick={() => { setStatus(undefined); setPage(1); }}
                >
                  All
                </Button>
                {availableStatuses.map(s => (
                  <Button
                    key={s}
                    variant="ghost"
                    size="sm"
                    className={`h-7 text-[10px] px-3 rounded-sm ${status === s ? "bg-[#20222f] text-gray-200 shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
                    onClick={() => { setStatus(s); setPage(1); }}
                  >
                    {s}
                  </Button>
                ))}
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

            {!loading && dcas.length > 0 && (
              <div className="mb-6">

                {/* Status Header - Sticky */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="sticky left-0 z-10 bg-[#141723] pl-4 pr-3 py-2 rounded-l flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${status === "Active" ? "bg-green-500" : status === "Closed" ? "bg-red-500" : "bg-blue-500"}`} />
                    <span className="text-sm font-medium text-white">{status || "All DCAs"}</span>
                    <span className="text-xs text-gray-500">{totalCount}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  {/* Header Row */}
                  <div className="flex items-stretch text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap">
                    <div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[200px] py-2 pl-7 pr-3 rounded-l border-y border-l border-transparent">
                      <div className="h-7 w-7" />
                      <div className="min-w-[100px]">Pair</div>
                    </div>
                    <div className="flex-1 flex items-center justify-end min-w-0 gap-0 py-2 pr-3 border-y border-r border-transparent">
                      <div className="w-[140px] text-center shrink-0">Trader</div>
                      <div className="w-[120px] text-center shrink-0">Label</div>
                      <div className="w-[90px] text-center shrink-0">Deposit</div>
                      <div className="w-[90px] text-center shrink-0">Spent</div>
                      <div className="w-[90px] text-center shrink-0">Redeemed</div>

                      <button
                        onClick={() => { if (sortBy === "deposit_value_usd") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("deposit_value_usd"); }}
                        className={`w-[80px] text-center cursor-pointer hover:text-gray-300 transition-colors shrink-0 ${sortBy === "deposit_value_usd" ? "text-blue-400" : ""}`}
                      >
                        Value {sortBy === "deposit_value_usd" && (sortDirection === "DESC" ? "↓" : "↑")}
                      </button>

                      <div className="w-[80px] text-center shrink-0">Status</div>
                      <div className="w-[120px] text-center shrink-0">Tx</div>

                      <button
                        onClick={() => { if (sortBy === "dca_created_at") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("dca_created_at"); }}
                        className={`w-[110px] text-center cursor-pointer hover:text-gray-300 transition-colors shrink-0 ${sortBy === "dca_created_at" ? "text-blue-400" : ""}`}
                      >
                        Created {sortBy === "dca_created_at" && (sortDirection === "DESC" ? "↓" : "↑")}
                      </button>
                    </div>
                  </div>

                  {dcas.map((o, idx) => {
                    const metaInput = tokenMetadata[`solana-${o.input_token_address}`];
                    const metaOutput = tokenMetadata[`solana-${o.output_token_address}`];

                    return (
                      <div
                        key={`${o.transaction_hash}-${idx}`}
                        className="flex items-stretch group whitespace-nowrap"
                      >
                        {/* Sticky Column - Pair with logos (like dex-trades) */}
                        <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                          <div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-3 min-w-[200px] ml-0 pl-3 py-2.5 rounded-l transition-colors duration-150">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="w-4 h-4 text-gray-400" />
                            </Button>

                            {/* Input Token with Logo */}
                            <div className="relative w-7 h-7 flex-shrink-0">
                              {metaInput?.logo ? (
                                <img src={metaInput.logo} alt={o.input_token_symbol} className="w-7 h-7 rounded-full object-cover bg-[#20222f]" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-bold border border-sky-500/30">
                                  {o.input_token_symbol.slice(0, 1)}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-white font-medium">{o.input_token_symbol}</span>

                            <ArrowRight className="w-3 h-3 text-gray-500" />

                            {/* Output Token with Logo */}
                            <div className="relative w-7 h-7 flex-shrink-0">
                              {metaOutput?.logo ? (
                                <img src={metaOutput.logo} alt={o.output_token_symbol} className="w-7 h-7 rounded-full object-cover bg-[#20222f]" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold border border-emerald-500/30">
                                  {o.output_token_symbol.slice(0, 1)}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-emerald-400 font-medium">{o.output_token_symbol}</span>
                          </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 flex items-center justify-end min-w-0 gap-0 pr-3 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors duration-150">
                          {/* Trader Address (like dex-trades) */}
                          <div className="w-[140px] relative flex items-center justify-center">
                            <span className="text-xs text-gray-400 font-mono text-center w-full">
                              {o.trader_address.slice(0, 4)}...{o.trader_address.slice(-4)}
                            </span>
                            <div className="absolute right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1c1e2b] pl-1">
                              <button
                                onClick={() => navigator.clipboard.writeText(o.trader_address)}
                                className="p-0.5 hover:bg-[#20222f] rounded"
                              >
                                <Copy className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                              </button>
                              <a
                                href={`https://solscan.io/address/${o.trader_address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-0.5 hover:bg-[#20222f] rounded"
                              >
                                <ExternalLink className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                              </a>
                            </div>
                          </div>

                          {/* Trader Label (like dex-trades) */}
                          <div className="w-[120px] flex justify-center">
                            {o.trader_address_label ? (
                              <Badge variant="secondary" className="text-[9px] h-4 bg-gray-700/50 text-gray-300 border-0 px-1.5 rounded-full flex items-center gap-0.5">
                                {o.trader_address_label.toLowerCase().includes("fund") ? <UsersIcon className="w-2.5 h-2.5" /> : <Zap className="w-2.5 h-2.5" />}
                                <span className="truncate max-w-[70px]">{o.trader_address_label.replace(/\[[^\]]+\]/, '').trim()}</span>
                              </Badge>
                            ) : (
                              <span className="text-xs text-gray-500">-</span>
                            )}
                          </div>

                          {/* Deposit */}
                          <div className="w-[90px] flex justify-center shrink-0">
                            <span className="text-xs text-sky-400 tabular-nums">{formatAmount(o.deposit_token_amount)}</span>
                          </div>

                          {/* Spent */}
                          <div className="w-[90px] flex justify-center shrink-0">
                            <span className="text-xs text-orange-300 tabular-nums">{formatAmount(o.token_spent_amount)}</span>
                          </div>

                          {/* Redeemed */}
                          <div className="w-[90px] flex justify-center shrink-0">
                            <span className="text-xs text-emerald-400 tabular-nums">{formatAmount(o.output_token_redeemed_amount)}</span>
                          </div>

                          {/* Value USD */}
                          <div className="w-[80px] flex justify-center shrink-0">
                            <span className="text-xs text-white font-semibold tabular-nums">{formatUSD(o.deposit_value_usd)}</span>
                          </div>

                          {/* Status */}
                          <div className="w-[80px] flex justify-center shrink-0">
                            <Badge
                              variant="secondary"
                              className={`text-[10px] h-5 border-0 px-2 rounded-full ${o.dca_status === "Active" ? "bg-green-500/20 text-green-300" :
                                o.dca_status === "Closed" ? "bg-red-500/20 text-red-300" :
                                  o.dca_status === "Completed" ? "bg-blue-500/20 text-blue-300" :
                                    "bg-gray-700/50 text-gray-300"
                                }`}
                            >
                              {o.dca_status}
                            </Badge>
                          </div>

                          {/* TX Hash (like dex-trades) */}
                          <div className="w-[120px] relative flex items-center justify-center">
                            <span className="text-xs text-gray-400 font-mono text-center w-full">
                              {o.transaction_hash.slice(0, 4)}...{o.transaction_hash.slice(-4)}
                            </span>
                            <div className="absolute right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1c1e2b] pl-1">
                              <button
                                onClick={() => navigator.clipboard.writeText(o.transaction_hash)}
                                className="p-0.5 hover:bg-[#20222f] rounded"
                              >
                                <Copy className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                              </button>
                              <a
                                href={`https://solscan.io/tx/${o.transaction_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-0.5 hover:bg-[#20222f] rounded"
                              >
                                <ExternalLink className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                              </a>
                            </div>
                          </div>

                          {/* Created Time (like dex-trades) */}
                          <div className="w-[110px] flex justify-center shrink-0">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-orange-500" />
                              <span className="text-xs text-gray-300">{formatTime(o.dca_created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Pagination Controls */}
      {!loading && dcas.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#20222f] bg-[#141723]">
          <div className="text-xs text-gray-400">
            Page {page}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs bg-[#20222f] hover:bg-[#272936] text-gray-300 font-normal"
              onClick={() => setPage(p => p + 1)}
              disabled={isLastPage || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}