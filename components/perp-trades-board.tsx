"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Filter, Clock, DollarSign, Copy, Loader, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface PerpTrade {
  trader_address_label: string;
  trader_address: string;
  token_symbol: string;
  side: "Long" | "Short";
  action: "Open" | "Add" | "Reduce" | "Close";
  token_amount: number;
  price_usd: number;
  value_usd: number;
  type: "Market" | "Limit";
  block_timestamp: string;
  transaction_hash: string;
}

interface PerpTradesResponse {
  data: PerpTrade[];
  pagination: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

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

export function PerpTradesBoard() {
  // Data State
  const [trades, setTrades] = useState<PerpTrade[]>([]); // Displayed trades (filtered/paginated)
  const [rawTrades, setRawTrades] = useState<PerpTrade[]>([]); // All fetched trades (cache)
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [isLastPage, setIsLastPage] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Filters
  const [side, setSide] = useState<string | undefined>("Long");
  const [type, setType] = useState<string | undefined>(undefined);
  const [action, setAction] = useState<string | undefined>(undefined);
  const [tokenSymbol, setTokenSymbol] = useState<string>("");
  const [onlyNewPositions, setOnlyNewPositions] = useState<boolean>(false);
  const [minValueUsd, setMinValueUsd] = useState<string>("");
  const [maxValueUsd, setMaxValueUsd] = useState<string>("");

  const [sortBy, setSortBy] = useState<"block_timestamp" | "value_usd" | "token_amount" | "price_usd">("block_timestamp");
  const [sortDirection, setSortDirection] = useState<"DESC" | "ASC">("DESC");

  // Initial Fetch (One-time)
  useEffect(() => {
    async function init() {
      setLoading(true);
      setError(null);
      try {
        const body = {
          pagination: { page: 1, per_page: 500 },
          order_by: [{ field: "block_timestamp", direction: "DESC" }]
        };
        const res = await fetch("/api/smartmoney?type=perp-trades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error("Failed to fetch perp trades");
        const json = await res.json();
        if (json.error) throw new Error(json.error);

        setRawTrades(json.data || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load perpetual trades");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Filter, Sort, & Paginate Logic
  useEffect(() => {
    let result = [...rawTrades];

    // 1. Filter
    if (side) result = result.filter(t => t.side === side);
    if (type) result = result.filter(t => t.type === type);
    if (action) result = result.filter(t => t.action === action);
    if (tokenSymbol.trim()) {
      const query = tokenSymbol.trim().toLowerCase();
      result = result.filter(t =>
        t.token_symbol.toLowerCase().includes(query) ||
        t.trader_address.toLowerCase().includes(query) ||
        (t.trader_address_label && t.trader_address_label.toLowerCase().includes(query))
      );
    }
    if (onlyNewPositions) {
      result = result.filter(t => t.action === "Open" || t.action === "Add");
    }
    const valMin = minValueUsd ? Number(minValueUsd) : undefined;
    const valMax = maxValueUsd ? Number(maxValueUsd) : undefined;
    if (valMin !== undefined) result = result.filter(t => t.value_usd >= valMin);
    if (valMax !== undefined) result = result.filter(t => t.value_usd <= valMax);

    // 2. Sort
    result.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === "block_timestamp") {
        valA = new Date(a.block_timestamp).getTime();
        valB = new Date(b.block_timestamp).getTime();
      }

      if (valA < valB) return sortDirection === "ASC" ? -1 : 1;
      if (valA > valB) return sortDirection === "ASC" ? 1 : -1;
      return 0;
    });

    // 3. Store total count before pagination
    setTotalCount(result.length);

    // 4. Paginate
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginated = result.slice(start, end);

    setTrades(paginated);
    setIsLastPage(end >= result.length);

  }, [rawTrades, side, type, action, tokenSymbol, onlyNewPositions, minValueUsd, maxValueUsd, sortBy, sortDirection, page, perPage]);

  // Remove old load and handleKeyDown handlers if unused or update them
  // Refresh button should re-trigger init?
  // We can expose init ref or just reload page?
  // Let's make "Refresh" function re-fetch
  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const body = {
        pagination: { page: 1, per_page: 500 },
        order_by: [{ field: "block_timestamp", direction: "DESC" }]
      };
      const res = await fetch("/api/smartmoney?type=perp-trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error("Failed to fetch perp trades");
      const json = await res.json();
      setRawTrades(json.data || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load perpetual trades");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex-1 bg-[#141723] flex flex-col">
      <div className="border-b border-[#20222f] p-4">
        {/* Title Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center text-[10px]">
              <DollarSign className="w-3 h-3 text-white" />
            </div>
            <span className="text-white font-normal text-sm">Smart Money Perp Trades</span>
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
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <Input
                  value={tokenSymbol}
                  onChange={(e) => { setTokenSymbol(e.target.value); setPage(1); }}
                  placeholder="Search token, trader address or label..."
                  className="pl-8 flex-1 h-8 text-xs bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500 min-w-[200px]"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs bg-[#171a26] border-[#20222f] text-gray-400 hover:text-gray-200 hover:bg-[#20222f]"
                onClick={() => setPage(1)}
              >
                <Search className="w-3.5 h-3.5 mr-1.5" />
                Search
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

              <Button
                variant="outline"
                size="sm"
                className={`h-8 px-3 text-xs border-[#20222f] bg-[#171a26] hover:text-gray-200 ${onlyNewPositions ? "text-green-400 border-green-500/50" : "text-gray-400"}`}
                onClick={() => setOnlyNewPositions(!onlyNewPositions)}
              >
                New Only
              </Button>
            </div>
          </div>

          {/* Filter Grid */}
          <div className={`${filterOpen ? 'block' : 'hidden'} lg:block`}>
            <div className="flex flex-wrap gap-2">
              {/* Side Segments (Matches Netflows Chain Selector) */}
              <div className="flex flex-wrap items-center w-full lg:w-auto p-0.5 gap-1.5 lg:gap-0 lg:rounded-md lg:border lg:border-[#20222f] lg:bg-[#171a26]">
                {(["Long", "Short"] as const).map((s) => (
                  <Button
                    key={s}
                    variant="ghost"
                    size="sm"
                    className={`
                          h-7 text-[10px] px-3 
                          /* Mobile Styles (Tags) */
                          rounded border border-[#20222f] bg-[#171a26] text-gray-400
                          
                          /* Desktop Styles (Segmented) */
                          lg:rounded-sm lg:border-0 lg:bg-transparent
                          
                          /* Selected State Handling */
                          ${side === s
                        ? "bg-[#20222f] border-[#303240] text-gray-200 shadow-sm lg:bg-[#20222f] lg:text-gray-200"
                        : "hover:text-gray-200 hover:bg-[#20222f] lg:hover:bg-transparent lg:hover:text-gray-200"}
                      `}
                    onClick={() => setSide(s)}
                  >
                    {s}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className={`
                          h-7 text-[10px] px-3 lg:rounded-sm
                          ${!side ? "bg-[#20222f] text-gray-200" : "text-gray-400 hover:text-gray-200"}
                      `}
                  onClick={() => setSide(undefined)}
                >
                  All
                </Button>
              </div>

              {/* Type Filter */}
              <div className="flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5">
                {(["Market", "Limit"] as const).map((t) => (
                  <Button
                    key={t}
                    variant="ghost"
                    size="sm"
                    className={`h-7 text-[10px] px-2 rounded-sm ${type === t ? "bg-[#20222f] text-gray-200 shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
                    onClick={() => setType(type === t ? undefined : t)}
                  >
                    {t}
                  </Button>
                ))}
              </div>

              {/* Action Filter */}
              <div className="flex items-center rounded-md border border-[#20222f] bg-[#171a26] p-0.5">
                {(["Open", "Add", "Reduce", "Close"] as const).map((a) => (
                  <Button
                    key={a}
                    variant="ghost"
                    size="sm"
                    className={`h-7 text-[10px] px-2 rounded-sm ${action === a ? "bg-[#20222f] text-gray-200 shadow-sm" : "text-gray-400 hover:text-gray-200"}`}
                    onClick={() => setAction(action === a ? undefined : a)}
                  >
                    {a}
                  </Button>
                ))}
              </div>

              {/* Value USD Range */}
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={minValueUsd}
                  onChange={(e) => setMinValueUsd(e.target.value)}
                  placeholder="Min $"
                  className="h-8 w-20 text-[10px] bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500"
                />
                <span className="text-xs text-gray-500">-</span>
                <Input
                  type="number"
                  value={maxValueUsd}
                  onChange={(e) => setMaxValueUsd(e.target.value)}
                  placeholder="Max"
                  className="h-8 w-20 text-[10px] bg-[#171a26] border-[#20222f] text-white placeholder:text-gray-500"
                />
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

            {!loading && trades.length > 0 && (
              <div className="mb-6">

                {/* Side Header - Sticky */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="sticky left-0 z-10 bg-[#141723] pl-4 pr-3 py-2 rounded-l flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${side === "Long" ? "bg-green-500" : side === "Short" ? "bg-red-500" : "bg-gray-500"}`} />
                    <span className="text-sm font-medium text-white">{side || "All Trades"}</span>
                    <span className="text-xs text-gray-500">{totalCount}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  {/* Header Row */}
                  <div className="flex items-stretch text-[10px] uppercase tracking-wide text-gray-500 whitespace-nowrap">
                    <div className="sticky left-0 z-10 bg-[#141723] flex items-center gap-3 min-w-[160px] py-2 pl-7 pr-3 rounded-l border-y border-l border-transparent">
                      <div className="h-7 w-7" />
                      <div className="min-w-[60px]">Trader</div>
                    </div>
                    <div className="flex-1 flex items-center justify-end min-w-0 gap-0 py-2 pr-3 border-y border-r border-transparent">
                      <div className="w-[160px] text-center shrink-0">Address</div>
                      <div className="w-[70px] text-center shrink-0">Coin</div>
                      <div className="w-[70px] text-center shrink-0">Side</div>
                      <div className="w-[70px] text-center shrink-0">Action</div>

                      <button
                        onClick={() => { if (sortBy === "token_amount") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("token_amount"); }}
                        className={`w-[80px] text-center cursor-pointer hover:text-gray-300 transition-colors shrink-0 ${sortBy === "token_amount" ? "text-blue-400" : ""}`}
                      >
                        Amount {sortBy === "token_amount" && (sortDirection === "DESC" ? "↓" : "↑")}
                      </button>

                      <button
                        onClick={() => { if (sortBy === "price_usd") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("price_usd"); }}
                        className={`w-[90px] text-center cursor-pointer hover:text-gray-300 transition-colors shrink-0 ${sortBy === "price_usd" ? "text-blue-400" : ""}`}
                      >
                        Price {sortBy === "price_usd" && (sortDirection === "DESC" ? "↓" : "↑")}
                      </button>

                      <button
                        onClick={() => { if (sortBy === "value_usd") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("value_usd"); }}
                        className={`w-[90px] text-center cursor-pointer hover:text-gray-300 transition-colors shrink-0 ${sortBy === "value_usd" ? "text-blue-400" : ""}`}
                      >
                        Value {sortBy === "value_usd" && (sortDirection === "DESC" ? "↓" : "↑")}
                      </button>

                      <div className="w-[70px] text-center shrink-0">Type</div>
                      <div className="w-[80px] text-center shrink-0">Tx</div>

                      <button
                        onClick={() => { if (sortBy === "block_timestamp") setSortDirection(d => d === "DESC" ? "ASC" : "DESC"); else setSortBy("block_timestamp"); }}
                        className={`w-[130px] text-center cursor-pointer hover:text-gray-300 transition-colors shrink-0 ${sortBy === "block_timestamp" ? "text-blue-400" : ""}`}
                      >
                        Time {sortBy === "block_timestamp" && (sortDirection === "DESC" ? "↓" : "↑")}
                      </button>
                    </div>
                  </div>

                  {trades.map((t, idx) => {
                    // Generate consistent gradient color based on trader address
                    const hash = t.trader_address.slice(2, 8);
                    const hue1 = parseInt(hash.slice(0, 2), 16) % 360;
                    const hue2 = (hue1 + 40) % 360;
                    const gradient = `linear-gradient(135deg, hsl(${hue1}, 70%, 50%), hsl(${hue2}, 70%, 40%))`;

                    return (
                      <div
                        key={`${t.transaction_hash}-${idx}`}
                        className="flex items-stretch group whitespace-nowrap"
                      >
                        {/* Sticky Column - Trader Label */}
                        <div className="sticky left-0 z-10 flex items-stretch pl-4 bg-[#141723]">
                          <div className="bg-[#171a26] group-hover:bg-[#1c1e2b] border-l border-y border-[#20222f] group-hover:border-[#272936] flex items-center gap-2 min-w-[160px] ml-0 pl-3 py-2.5 rounded-l transition-colors duration-150">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="w-4 h-4 text-gray-400" />
                            </Button>
                            {/* Gradient Circle Icon */}
                            <div
                              className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-[10px] text-white font-bold"
                              style={{ background: gradient }}
                            >
                              {((t.trader_address_label || "SM").replace(/[^a-zA-Z]/g, '').slice(0, 1) || "S").toUpperCase()}
                            </div>
                            <span className="text-xs text-blue-300 font-medium whitespace-nowrap truncate">
                              {t.trader_address_label ? t.trader_address_label.replace(/Trader \[[^\]]+\]/, '').trim() : "Smart Money"}
                            </span>
                          </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 flex items-center justify-end min-w-0 gap-0 pr-3 py-2.5 bg-[#171a26] border-y border-r border-[#20222f] rounded-r group-hover:bg-[#1c1e2b] group-hover:border-[#272936] transition-colors duration-150">
                          {/* Address + Copy */}
                          <div className="w-[160px] flex justify-center items-center relative group/addr shrink-0">
                            <span className="text-[10px] text-gray-500 font-mono">{t.trader_address.slice(0, 4)}...{t.trader_address.slice(-4)}</span>
                            <Button
                              onClick={() => navigator.clipboard.writeText(t.trader_address)}
                              variant="ghost"
                              size="icon"
                              className="absolute right-4 h-4 w-4 opacity-0 group-hover/addr:opacity-100 transition-opacity"
                              title="Copy Address"
                            >
                              <Copy className="h-3 w-3 text-gray-400" />
                            </Button>
                          </div>

                          {/* Coin */}
                          <div className="w-[70px] flex justify-center">
                            <span className="text-xs text-white font-medium">{t.token_symbol}</span>
                          </div>

                          {/* Side */}
                          <div className="w-[70px] flex justify-center">
                            <Badge
                              variant="secondary"
                              className={`text-[10px] h-5 px-2 rounded-full ${t.side === "Long" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}
                            >
                              {t.side}
                            </Badge>
                          </div>

                          {/* Action */}
                          <div className="w-[70px] flex justify-center">
                            <span className="text-xs text-gray-300">{t.action}</span>
                          </div>

                          {/* Amount */}
                          <div className="w-[80px] flex justify-center">
                            <span className="text-xs text-sky-400 font-medium tabular-nums">{t.token_amount.toLocaleString()}</span>
                          </div>

                          {/* Price */}
                          <div className="w-[90px] flex justify-center">
                            <span className="text-xs text-orange-300 tabular-nums">{formatUSD(t.price_usd)}</span>
                          </div>

                          {/* Value */}
                          <div className="w-[90px] flex justify-center">
                            <span className="text-xs text-emerald-400 font-medium tabular-nums">{formatUSD(t.value_usd)}</span>
                          </div>

                          {/* Type */}
                          <div className="w-[70px] flex justify-center">
                            <span className="text-xs text-gray-400">{t.type}</span>
                          </div>

                          {/* Tx Hash */}
                          <div className="w-[80px] flex justify-center">
                            <a href={`https://arbiscan.io/tx/${t.transaction_hash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 font-mono hover:underline" title={t.transaction_hash}>
                              {t.transaction_hash.slice(0, 4)}...
                            </a>
                          </div>

                          {/* Time */}
                          <div className="w-[130px] flex justify-center">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-500" />
                              <span className="text-xs text-gray-300">{formatTime(t.block_timestamp)}</span>
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
      {
        !loading && trades.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#20222f] bg-[#141723]">
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
                disabled={isLastPage || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )
      }
    </div >
  );
}